import { Client, Room } from '@colyseus/core';
import {
  MmoProtocolValidationError,
  parseMmoInstanceCommandEnvelope,
  parseMmoInstanceEntryRequest,
} from '@odd-tower/network-protocol';
import type { AuthVerifier } from '../../auth/AuthVerifier.js';
import { PrivateInstanceRegistry } from './PrivateInstanceRegistry.js';
import { MmoInstanceState } from './MmoInstanceState.js';
import type { MmoInstanceRepository } from '../persistence/MmoInstanceRepository.js';
import { createInstanceSimulation, tickInstanceSimulation, type InstanceSimulationState } from './InstanceSimulation.js';

export type MmoInstanceRoomOptions = {
  authVerifier: AuthVerifier;
  instances: PrivateInstanceRegistry;
  repository?: MmoInstanceRepository;
};

type Session = { accountId: string; instanceId: string };

export class MmoInstanceRoom extends Room<{ state: MmoInstanceState }> {
  private options!: MmoInstanceRoomOptions;
  private readonly sessions = new Map<string, Session>();
  private readonly sequences = new Map<string, number>();
  private simulation!: InstanceSimulationState;

  onCreate(options: MmoInstanceRoomOptions) {
    this.options = options;
    this.maxClients = 4;
    this.patchRate = 20;
    this.state = new MmoInstanceState();
    this.setSimulationInterval(() => this.tickInstance(), 50);
    this.onMessage('command', (client, value) => { void this.handleCommand(client, value); });
  }

  async onAuth(_client: Client, value: unknown) {
    const request = parseMmoInstanceEntryRequest(value);
    const identity = await this.options.authVerifier.verifyAccessToken(request.accessToken);
    let instance = this.options.instances.get(request.instanceId);
    if (!instance && this.options.repository) {
      const durable = await this.options.repository.load(request.instanceId);
      if (durable) instance = this.options.instances.hydrate(durable);
    }
    if (!instance || !instance.memberAccountIds.includes(identity.userId)) throw new Error('INSTANCE_MEMBER_REQUIRED');
    return { accountId: identity.userId, instanceId: request.instanceId } satisfies Session;
  }

  onJoin(client: Client, _options: unknown, session?: Session) {
    if (!session) throw new Error('AUTH_REQUIRED');
    this.sessions.set(client.sessionId, session);
    this.sequences.set(client.sessionId, -1);
    const instance = this.options.instances.get(session.instanceId);
    if (instance?.status === 'recovering') this.options.instances.reconnect(session.instanceId);
    if (!this.simulation && instance) this.simulation = createInstanceSimulation(instance.kind, instance.seed);
    this.syncState(session.instanceId);
  }

  onLeave(client: Client) {
    const session = this.sessions.get(client.sessionId);
    this.sessions.delete(client.sessionId);
    this.sequences.delete(client.sessionId);
    if (session && this.sessions.size === 0) this.options.instances.disconnect(session.instanceId);
    if (session) this.syncState(session.instanceId);
  }

  onDispose() {
    this.sessions.clear();
    this.sequences.clear();
  }

  private async handleCommand(client: Client, value: unknown) {
    try {
      const envelope = parseMmoInstanceCommandEnvelope(value);
      if (envelope.sessionId !== client.sessionId) throw new Error('session_mismatch');
      const previous = this.sequences.get(client.sessionId) ?? -1;
      if (envelope.sequence <= previous) throw new Error('stale_sequence');
      this.sequences.set(client.sessionId, envelope.sequence);
      const session = this.sessions.get(client.sessionId);
      if (!session) throw new Error('session_not_found');
      const instance = this.options.instances.get(session.instanceId);
      if (!instance) throw new Error('instance_not_found');
      const command = envelope.command;
      if (command.type === 'ready') this.options.instances.setReady(session.instanceId, session.accountId, command.ready);
      if (command.type === 'checkpoint') this.options.instances.checkpoint(session.instanceId, command.revision, command.payload);
      if (command.type === 'revive') this.options.instances.consumeReviveToken(session.instanceId, session.accountId);
      if (command.type === 'complete' && instance.leaderAccountId === session.accountId) this.options.instances.complete(session.instanceId);
      const updated = this.options.instances.get(session.instanceId);
      if (updated && this.options.repository) await this.options.repository.save(updated);
      this.syncState(session.instanceId);
      client.send('command-accepted', { sequence: envelope.sequence });
    } catch (error) {
      const code = error instanceof MmoProtocolValidationError ? error.code : String(error);
      client.send('error', { code });
    }
  }

  private syncState(instanceId: string) {
    const instance = this.options.instances.get(instanceId);
    if (!instance) return;
    this.state.instanceId = instance.instanceId;
    this.state.kind = instance.kind;
    this.state.status = instance.status;
    this.state.memberCount = instance.memberAccountIds.length;
    this.state.readyCount = instance.readyAccountIds.length;
    this.state.checkpointRevision = instance.checkpointRevision;
    this.state.worldRevision += 1;
    this.state.encounterIndex = this.simulation?.encounterIndex ?? 0;
    this.state.encounterCount = this.simulation?.encounterCount ?? 0;
    this.state.encounterProgress = this.simulation?.progress ?? 0;
    this.state.objective = this.simulation?.objective ?? 'prepare';
    this.state.bossActive = this.simulation?.bossActive ?? false;
    this.state.reviveTokens = Object.values(instance.reviveTokens).reduce((sum, tokens) => sum + tokens, 0);
  }

  private tickInstance() {
    if (this.sessions.size === 0 || !this.simulation) return;
    const instanceId = [...this.sessions.values()][0]?.instanceId;
    if (!instanceId) return;
    const instance = this.options.instances.get(instanceId);
    if (!instance || instance.status !== 'active') return;
    const ready = instance.readyAccountIds.length === instance.memberAccountIds.length;
    if (!tickInstanceSimulation(this.simulation, ready)) return;
    if (this.simulation.objective === 'complete') {
      this.options.instances.complete(instanceId);
    } else if (this.simulation.progress % 20 === 0) {
      this.options.instances.checkpoint(instanceId, instance.checkpointRevision + 1, {
        encounterIndex: this.simulation.encounterIndex,
        progress: this.simulation.progress,
        objective: this.simulation.objective,
      });
    }
    const updated = this.options.instances.get(instanceId);
    if (updated && this.options.repository) void this.options.repository.save(updated);
    this.syncState(instanceId);
  }
}
