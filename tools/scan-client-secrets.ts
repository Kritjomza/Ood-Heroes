import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('dist');
const forbidden = [
  process.env.SUPABASE_SECRET_KEY,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET,
].filter((value): value is string => Boolean(value && value.length > 8));
const suspicious = [
  /SUPABASE_SECRET_KEY/u,
  /GOOGLE_CLIENT_SECRET/u,
  /provider_refresh_token/u,
  /provider_token/u,
  /service_role/u,
  /sb_secret_/u,
];
let scanned = 0;
for (const path of await files(root)) {
  const content = await readFile(path, 'utf8').catch(() => '');
  scanned += 1;
  if (
    forbidden.some((secret) => content.includes(secret)) ||
    suspicious.some((pattern) => pattern.test(content))
  )
    throw new Error(`Potential server secret in client output: ${path}`);
}
console.log(`Scanned ${scanned} client build files; no server secret markers found.`);

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory);
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry);
      return (await stat(path)).isDirectory() ? files(path) : [path];
    }),
  );
  return nested.flat();
}
