import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

type LocalSupabaseStatus = {
  API_URL: string;
  PUBLISHABLE_KEY: string;
  SECRET_KEY: string;
};

export function localSupabaseEnvironment(
  base: NodeJS.ProcessEnv,
  status: LocalSupabaseStatus,
): NodeJS.ProcessEnv {
  return {
    ...base,
    VITE_SUPABASE_URL: status.API_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    SUPABASE_URL: status.API_URL,
    SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: status.SECRET_KEY,
  };
}

export function childProcessInvocation(
  command: string,
  args: string[],
  platform = process.platform,
  npmExecPath = process.env.npm_execpath,
) {
  if (platform === 'win32' && command === 'npm') {
    if (!npmExecPath) throw new Error('npm executable path is unavailable.');
    return { executable: process.execPath, args: [npmExecPath, ...args] };
  }
  return { executable: command, args };
}

function readLocalStatus(): LocalSupabaseStatus {
  const cli = resolve('node_modules/supabase/dist/supabase.js');
  const result = spawnSync(process.execPath, [cli, 'status', '-o', 'json'], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error('Local Supabase is not running.');
  const parsed = JSON.parse(result.stdout) as Partial<LocalSupabaseStatus>;
  if (!parsed.API_URL || !parsed.PUBLISHABLE_KEY || !parsed.SECRET_KEY)
    throw new Error('Local Supabase runtime values are unavailable.');
  return parsed as LocalSupabaseStatus;
}

function run() {
  const [command, ...args] = process.argv.slice(2);
  if (!command) throw new Error('A child command is required.');
  const invocation = childProcessInvocation(command, args);
  const result = spawnSync(invocation.executable, invocation.args, {
    cwd: process.cwd(),
    env: localSupabaseEnvironment(process.env, readLocalStatus()),
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
  });
  process.exitCode = result.status ?? 1;
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/tools/local-supabase-runtime.ts')) run();
