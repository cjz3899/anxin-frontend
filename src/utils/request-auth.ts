export function createAuthorizationHeader(token: unknown): Record<string, string> {
  return typeof token === 'string' && token.length > 0 ? { authorization: token } : {}
}
