import { vi } from 'vitest'

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map([['cookie', 'session=dummy']]))
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

// Mock D1 DB globally for our tests
const createMockQueryBuilder = (resolvedValue: any = []) => {
  const builder: any = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === 'then') {
          return undefined; // Not a promise itself until we resolve it
        }
        return vi.fn().mockImplementation(() => {
          if (['limit', 'orderBy', 'where', 'values', 'set', 'from'].includes(prop as string)) {
             // Return the proxy itself to allow chaining
             return builder;
          }
          return Promise.resolve(resolvedValue); // Terminating call resolves
        });
      },
    }
  );
  // Special case: make it act as a promise for await
  builder.then = (resolve: any) => resolve(resolvedValue);
  return builder;
};

vi.mock('@/db', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => createMockQueryBuilder([])),
    insert: vi.fn(() => createMockQueryBuilder({ success: true })),
    update: vi.fn(() => createMockQueryBuilder({ success: true })),
    delete: vi.fn(() => createMockQueryBuilder({ success: true })),
  }))
}))

// Mock Better Auth
const mockSession = {
  user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'ADMIN' },
  session: { id: 'session-1' }
}

vi.mock('@/lib/auth', () => ({
  getAuth: vi.fn(() => ({
    api: {
      getSession: vi.fn().mockResolvedValue(mockSession)
    }
  }))
}))
