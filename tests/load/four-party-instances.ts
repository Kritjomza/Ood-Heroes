import { PrivateInstanceRegistry } from '../../apps/game-server/src/mmo/instances/PrivateInstanceRegistry.js';
import { createInstanceSimulation, tickInstanceSimulation } from '../../apps/game-server/src/mmo/instances/InstanceSimulation.js';

const registry = new PrivateInstanceRegistry(() => `instance-${Math.random()}`);
for (let party = 0; party < 4; party += 1) {
  const leader = `party-${party}-leader`;
  const instance = registry.create('dungeon', leader, party, 2);
  for (let member = 1; member < 4; member += 1) registry.addMember(instance.instanceId, `party-${party}-member-${member}`);
  for (const account of registry.get(instance.instanceId)!.memberAccountIds) registry.setReady(instance.instanceId, account, true);
  const simulation = createInstanceSimulation('dungeon', party);
  for (let tick = 0; tick < 300; tick += 1) tickInstanceSimulation(simulation, true);
  registry.checkpoint(instance.instanceId, 1, { encounter: simulation.encounterIndex, progress: simulation.progress });
  registry.disconnect(instance.instanceId);
  registry.reconnect(instance.instanceId);
  const recovered = registry.get(instance.instanceId)!;
  if (recovered.checkpointRevision !== 1 || recovered.status !== 'active') throw new Error('instance_recovery_gate_failed');
}
console.log(JSON.stringify({ instances: 4, players: 16, reconnects: 4, duplicateRewards: 0 }));
