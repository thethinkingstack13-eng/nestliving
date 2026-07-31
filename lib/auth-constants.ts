// Kept in its own file (no other imports) so that Edge Runtime code
// like middleware.ts can use the cookie name without pulling in
// Node-only dependencies (e.g. bcryptjs, used elsewhere in lib/auth.ts).
export const SESSION_COOKIE_NAME = 'nestliving_session';
