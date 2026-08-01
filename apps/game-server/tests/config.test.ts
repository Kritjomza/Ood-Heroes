// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readServerConfig } from '../src/config';

describe('server network configuration', () => {
  it('honors the Render PORT environment variable', () => {
    expect(readServerConfig({ PORT: '10000' })).toMatchObject({ port: 10_000 });
  });

  it('defaults the local port to 2567', () => {
    expect(readServerConfig({})).toMatchObject({ port: 2567 });
  });

  it('binds on all network interfaces', () => {
    expect(readServerConfig({})).toMatchObject({ host: '0.0.0.0' });
  });

  it.each(['not-a-number', '0', '65536', '12.5'])('rejects invalid PORT value %s', (port) => {
    expect(() => readServerConfig({ PORT: port })).toThrow(
      'PORT must be an integer from 1 to 65535',
    );
  });
});
