import { describe, expect, it } from 'vitest';
import { childProcessInvocation, localSupabaseEnvironment } from './local-supabase-runtime';

describe('local Supabase runtime environment', () => {
  it('replaces placeholder connection values with the running local stack values', () => {
    const result = localSupabaseEnvironment(
      {
        KEEP_ME: 'unchanged',
        SUPABASE_SECRET_KEY: 'placeholder',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'placeholder',
      },
      {
        API_URL: 'http://127.0.0.1:54321',
        PUBLISHABLE_KEY: 'local-publishable',
        SECRET_KEY: 'local-secret',
      },
    );

    expect(result).toMatchObject({
      KEEP_ME: 'unchanged',
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'local-publishable',
      SUPABASE_URL: 'http://127.0.0.1:54321',
      SUPABASE_PUBLISHABLE_KEY: 'local-publishable',
      SUPABASE_SECRET_KEY: 'local-secret',
    });
  });

  it('runs npm through Node on Windows without enabling a shell', () => {
    expect(childProcessInvocation('npm', ['run', 'dev'], 'win32', 'npm-cli.js')).toEqual({
      executable: process.execPath,
      args: ['npm-cli.js', 'run', 'dev'],
    });
  });
});
