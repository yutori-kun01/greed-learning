// vitest resolves `server-only` to its client build (there is no react-server
// condition in the test environment), and that build throws on import. The
// package is a build-time guard, so stubbing it here changes nothing about
// what it enforces in the app.
export {};
