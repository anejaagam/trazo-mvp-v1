import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  redirect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Setup environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-us.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-us-anon-key';
process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY = 'https://test-ca.supabase.co';
process.env.CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY = 'test-ca-anon-key';
