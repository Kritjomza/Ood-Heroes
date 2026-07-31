export type ServerConfig = { port: number; host: string; clientOrigin: string };
export type PersistenceConfig = {
  url: string;
  publishableKey: string;
  secretKey: string;
  issuer: string;
};

function parsePort(value: string | undefined) {
  const port = value === undefined ? 2567 : Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535)
    throw new Error('GAME_SERVER_PORT must be an integer from 1 to 65535');
  return port;
}

export function readServerConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  const clientOrigin = environment.CLIENT_ORIGIN ?? 'http://127.0.0.1:4173';
  try {
    const parsed = new URL(clientOrigin);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    throw new Error('CLIENT_ORIGIN must be an absolute HTTP(S) URL');
  }
  return {
    port: parsePort(environment.GAME_SERVER_PORT),
    host: environment.GAME_SERVER_HOST ?? '127.0.0.1',
    clientOrigin,
  };
}

export function readPersistenceConfig(
  environment: NodeJS.ProcessEnv = process.env,
): PersistenceConfig {
  const url = required(environment, 'SUPABASE_URL');
  const publishableKey = required(environment, 'SUPABASE_PUBLISHABLE_KEY');
  const secretKey = required(environment, 'SUPABASE_SECRET_KEY');
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    throw new Error('SUPABASE_URL must be an absolute HTTP(S) URL');
  }
  return {
    url: parsed.toString().replace(/\/$/u, ''),
    publishableKey,
    secretKey,
    issuer: `${parsed.toString().replace(/\/$/u, '')}/auth/v1`,
  };
}

function required(environment: NodeJS.ProcessEnv, name: string) {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}
