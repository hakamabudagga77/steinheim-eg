/**
 * Vitest stand-in for Next.js's `server-only` marker package, which Next
 * resolves internally but isn't a real installed dependency. A no-op module
 * lets lib/server modules (rate-limit, admin-session, ...) be unit-tested in
 * node without weakening the `import "server-only"` guard in the app itself.
 */
export {};
