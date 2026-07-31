import type { Session } from '@supabase/supabase-js';
import { getAuthClient } from './auth-client';

export type AuthState = { loading: boolean; session: Session | null };

export function subscribeToAuth(listener: (state: AuthState) => void) {
  const auth = getAuthClient();
  let active = true;
  void auth.auth.getSession().then(({ data }) => {
    if (active) listener({ loading: false, session: data.session });
  });
  const { data } = auth.auth.onAuthStateChange((_event, session) => {
    if (active) listener({ loading: false, session });
  });
  return () => {
    active = false;
    data.subscription.unsubscribe();
  };
}
