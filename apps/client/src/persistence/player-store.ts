import type { PlayerBootstrap } from '@odd-tower/network-protocol';

export type PlayerStoreState = {
  bootstrap: PlayerBootstrap | null;
  loading: boolean;
  error: string | null;
  pendingMutation: string | null;
};

export class PlayerStore {
  #state: PlayerStoreState = {
    bootstrap: null,
    loading: false,
    error: null,
    pendingMutation: null,
  };
  readonly #listeners = new Set<(state: PlayerStoreState) => void>();

  getSnapshot = () => this.#state;

  subscribe = (listener: (state: PlayerStoreState) => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  setLoading(loading: boolean) {
    this.#set({ ...this.#state, loading, error: loading ? null : this.#state.error });
  }

  setBootstrap(bootstrap: PlayerBootstrap) {
    this.#set({ bootstrap, loading: false, error: null, pendingMutation: null });
  }

  setError(error: string) {
    this.#set({ ...this.#state, loading: false, error, pendingMutation: null });
  }

  beginMutation(name: string) {
    if (this.#state.pendingMutation) return false;
    this.#set({ ...this.#state, pendingMutation: name, error: null });
    return true;
  }

  endMutation() {
    this.#set({ ...this.#state, pendingMutation: null });
  }

  clear() {
    this.#set({ bootstrap: null, loading: false, error: null, pendingMutation: null });
  }

  #set(state: PlayerStoreState) {
    this.#state = state;
    for (const listener of this.#listeners) listener(state);
  }
}
