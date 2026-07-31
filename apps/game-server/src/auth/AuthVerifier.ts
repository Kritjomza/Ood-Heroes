import type { AccountKind, DomainErrorCode } from '@odd-tower/network-protocol';

export type AuthenticatedIdentity = {
  userId: string;
  accountKind: AccountKind;
  email: string | null;
};

export interface AuthVerifier {
  verifyAccessToken(token: string): Promise<AuthenticatedIdentity>;
}

export class AuthenticationError extends Error {
  readonly code: Extract<DomainErrorCode, 'AUTH_REQUIRED' | 'AUTH_INVALID' | 'AUTH_EXPIRED'>;

  constructor(code: AuthenticationError['code']) {
    super(code);
    this.name = 'AuthenticationError';
    this.code = code;
  }
}
