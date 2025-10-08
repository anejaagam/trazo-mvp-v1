# Testing Guide for Trazo OS

This project uses Jest and React Testing Library for testing the multi-regional authentication system.

## Test Structure

```
lib/
├── supabase/
│   ├── __tests__/
│   │   ├── region.test.ts      # Tests for region configuration
│   │   └── client.test.ts      # Tests for client storage utilities
└── types/
    └── __tests__/
        └── region.test.ts       # Tests for region type definitions
```

## Running Tests

### Run all tests once
```bash
npm test
```

### Run tests in watch mode (auto-rerun on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Coverage

The test suite covers:

### 1. **Region Configuration Tests** (`lib/supabase/__tests__/region.test.ts`)
- ✅ US region configuration retrieval
- ✅ Canada region configuration retrieval
- ✅ Missing service role key handling
- ✅ Environment variable validation
- ✅ Error messages for missing configuration

### 2. **Client Storage Tests** (`lib/supabase/__tests__/client.test.ts`)
- ✅ Getting stored region from localStorage
- ✅ Setting region in localStorage
- ✅ Clearing stored region
- ✅ Default region fallback (US)
- ✅ Invalid value handling
- ✅ SSR environment handling (when window is undefined)
- ✅ Integration tests for store/retrieve/clear flow

### 3. **Region Type Tests** (`lib/types/__tests__/region.test.ts`)
- ✅ REGION_INFO constant validation
- ✅ Region type definitions (US, CA)
- ✅ UserMetadata type structure
- ✅ Region information structure consistency

## Test Results

All **34 tests** pass successfully:

```
Test Suites: 3 passed, 3 total
Tests:       34 passed, 34 total
```

## Writing New Tests

### Example: Testing a new utility function

```typescript
import { yourFunction } from '../yourModule';

describe('Your Module', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  it('should do something specific', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });
});
```

## Mocked Dependencies

The test environment automatically mocks:
- **Next.js Router** (`next/navigation`)
- **localStorage** (with jest.fn() implementations)
- **window.matchMedia** (for responsive design tests)
- **Environment variables** (Supabase URLs and keys)

## Environment Variables for Testing

Tests use the following mock environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://test-us.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-us-anon-key
CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY=https://test-ca.supabase.co
CAN_NEXT_PUBLIC_CASUPABASE_ANON_KEY=test-ca-anon-key
```

## Continuous Integration

To add tests to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

## Best Practices

1. **Run tests before committing** - Use `npm test` or set up a pre-commit hook
2. **Keep tests focused** - Each test should verify one specific behavior
3. **Use descriptive test names** - Test names should explain what they're testing
4. **Mock external dependencies** - Don't make real API calls in tests
5. **Test edge cases** - Include tests for error conditions and boundary cases

## Troubleshooting

### Tests fail with "Cannot find module"
- Make sure you've run `npm install` to install all dependencies

### Tests fail with environment variable errors
- Check that `jest.setup.ts` is properly configured
- Verify the mock environment variables are set correctly

### Tests timeout
- Increase the timeout in `jest.config.ts` if needed
- Check for async operations that aren't being properly awaited

## Next Steps

Consider adding tests for:
- Authentication components (LoginForm, SignUpForm)
- Protected page rendering
- Middleware region detection
- Email verification flow
- Logout functionality
