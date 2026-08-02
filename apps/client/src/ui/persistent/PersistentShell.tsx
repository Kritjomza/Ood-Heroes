import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { GameApiClient } from '../../persistence/game-api-client';
import { createIdempotencyKey } from '../../persistence/idempotency';
import { PlayerStore } from '../../persistence/player-store';
import { subscribeToAuth } from '../../persistence/auth-state';
import { AuthScreen } from './AuthScreen';
import { HomeScreen } from './HomeScreen';
import { CollectionScreen } from './CollectionScreen';
import { HeroDetailScreen } from './HeroDetailScreen';
import { SummonScreen } from './SummonScreen';
import { TeamBuilderScreen } from './TeamBuilderScreen';
import { AccountScreen } from './AccountScreen';
import { AfkRewardModal } from './AfkRewardModal';
import { OAuthCallbackScreen } from './OAuthCallbackScreen';
import { TowerLoader } from './TowerLoader';
import { AdventureNav, type PrimaryScreen } from './AdventureNav';
import { PlayerStrip } from './PlayerStrip';

export type PersistentScreen = PrimaryScreen | 'hero';

export function PersistentShell({
  onPlayLocal,
  onPlayOnline,
}: {
  onPlayLocal: () => void;
  onPlayOnline: () => void;
}) {
  const store = useRef(new PlayerStore()).current;
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [auth, setAuth] = useState<{ loading: boolean; session: Session | null }>({
    loading: true,
    session: null,
  });
  const [screen, setScreen] = useState<PersistentScreen>('home');
  const [heroId, setHeroId] = useState<string | null>(null);
  const [summonResult, setSummonResult] = useState<string | null>(null);
  const [, setCallbackVersion] = useState(0);
  const afkPreparedFor = useRef<string | null>(null);
  const api = useMemo(
    () =>
      new GameApiClient(
        import.meta.env.VITE_GAME_SERVER_HTTP_URL ?? 'http://127.0.0.1:2567',
        async () => auth.session?.access_token ?? null,
      ),
    [auth.session],
  );

  useEffect(
    () =>
      subscribeToAuth((next) => {
        setAuth(next);
        if (!next.session) store.clear();
      }),
    [store],
  );

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      try {
        store.setLoading(true);
        store.setBootstrap(await api.bootstrap(signal));
      } catch {
        const displayName =
          typeof auth.session?.user.user_metadata.display_name === 'string'
            ? auth.session.user.user_metadata.display_name
            : 'Odd Hero';
        try {
          store.setBootstrap(await api.initialize(displayName, signal));
        } catch (initializeError) {
          if (!signal?.aborted)
            store.setError(
              initializeError instanceof Error
                ? initializeError.message
                : 'Unable to load progress.',
            );
        }
      }
    },
    [api, auth.session, store],
  );

  useEffect(() => {
    if (!auth.session) return;
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [auth.session, refresh]);

  useEffect(() => {
    const userId = state.bootstrap?.profile.userId;
    if (!userId || afkPreparedFor.current === userId) return;
    afkPreparedFor.current = userId;
    void api
      .mutate<unknown>('/api/player/afk/prepare', {
        idempotencyKey: createIdempotencyKey(),
        payload: {},
      })
      .then((claim) => {
        if (claim) void refresh();
      })
      .catch(() => undefined);
  }, [api, refresh, state.bootstrap?.profile.userId]);

  const mutation = async (
    name: string,
    path: string,
    payload: Record<string, unknown>,
    method: 'POST' | 'PUT' | 'PATCH' = 'POST',
  ) => {
    if (!store.beginMutation(name)) return null;
    try {
      const result = await api.mutate<unknown>(
        path,
        { idempotencyKey: createIdempotencyKey(), payload },
        method,
      );
      await refresh();
      return result;
    } catch (caught) {
      store.setError(caught instanceof Error ? caught.message : 'Request failed.');
      return null;
    } finally {
      store.endMutation();
    }
  };

  const callbackPath = window.location.pathname;
  if (callbackPath === '/auth/callback' || callbackPath === '/auth/link-callback')
    return (
      <OAuthCallbackScreen
        linking={callbackPath === '/auth/link-callback'}
        onComplete={() => setCallbackVersion((value) => value + 1)}
        onLinked={async () => {
          const displayName = state.bootstrap?.profile.displayName ?? 'Odd Hero';
          const result = await mutation(
            'protect-account-google',
            '/api/player/profile',
            { displayName },
            'PATCH',
          );
          if (!result) throw new Error('PROFILE_BOOTSTRAP_FAILED');
          await refresh();
        }}
      />
    );

  if (auth.loading) return <TowerLoader phase="auth" />;
  if (!auth.session) return <AuthScreen />;
  if (!state.bootstrap)
    return <TowerLoader phase="bootstrap" error={state.error} onRetry={() => void refresh()} />;
  const player = state.bootstrap;
  return (
    <main
      className={`persistent-shell adventure-shell system-${screen === 'hero' ? 'collection' : screen}`}
    >
      <PlayerStrip player={player} />
      {state.error && (
        <div className="persistent-toast" role="alert">
          {state.error}
        </div>
      )}
      {screen === 'home' && (
        <HomeScreen
          player={player}
          navigate={(next) => setScreen(next as PersistentScreen)}
          onPlayLocal={onPlayLocal}
          onPlayOnline={onPlayOnline}
        />
      )}
      {screen === 'collection' && (
        <CollectionScreen
          player={player}
          back={() => setScreen('home')}
          selectHero={(id) => {
            setHeroId(id);
            setScreen('hero');
          }}
        />
      )}
      {screen === 'hero' && heroId && (
        <HeroDetailScreen
          player={player}
          heroId={heroId}
          back={() => setScreen('collection')}
          busy={Boolean(state.pendingMutation)}
          upgrade={(id) => void mutation('upgrade-star', `/api/player/heroes/${id}/star`, {})}
        />
      )}
      {screen === 'summon' && (
        <SummonScreen
          player={player}
          back={() => setScreen('home')}
          busy={Boolean(state.pendingMutation)}
          result={summonResult}
          summon={async () => {
            const result = await mutation('summon', '/api/player/summon', {
              bannerId: player.banner.id,
            });
            if (!result || typeof result !== 'object' || !('outcomeType' in result)) return null;
            const outcomeType = result.outcomeType === 'duplicate' ? 'duplicate' : 'new';
            const message =
              outcomeType === 'duplicate' ? 'Duplicate! Shards added.' : 'A new Hero joined!';
            setSummonResult(message);
            return { outcomeType, message };
          }}
        />
      )}
      {screen === 'team' && (
        <TeamBuilderScreen
          player={player}
          back={() => setScreen('home')}
          busy={Boolean(state.pendingMutation)}
          save={(ids) => void mutation('team', '/api/player/team', { heroIds: ids }, 'PUT')}
          unlock={() => void mutation('unlock', '/api/player/team/slots/unlock', {})}
        />
      )}
      {screen === 'account' && (
        <AccountScreen
          player={player}
          back={() => setScreen('home')}
          onProtected={async () => {
            await mutation(
              'protect-account',
              '/api/player/profile',
              { displayName: player.profile.displayName },
              'PATCH',
            );
          }}
        />
      )}
      {player.pendingAfkClaim && (
        <AfkRewardModal
          claim={player.pendingAfkClaim}
          busy={Boolean(state.pendingMutation)}
          close={() => setScreen('home')}
          collect={() =>
            void mutation('afk-claim', `/api/player/afk/${player.pendingAfkClaim!.id}/claim`, {})
          }
        />
      )}
      <AdventureNav
        active={screen === 'hero' ? 'collection' : screen}
        onSelect={(next) => setScreen(next)}
      />
    </main>
  );
}
