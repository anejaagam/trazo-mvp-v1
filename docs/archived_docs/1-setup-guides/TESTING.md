# Testing Guide for Trazo OS# Testing Guide for Trazo OS



*Last Updated: October 19, 2025*This project uses Jest and React Testing Library for comprehensive testing of the authentication system, multi-region support, and application features.



This project uses Jest and React Testing Library for unit/integration testing, plus Playwright for end-to-end testing.## Test Structure



---```

app/

## 📊 Current Test Status├── auth/

│   ├── login/__tests__/

### Overall Metrics│   │   └── login-page.test.tsx          # Login page tests

- **Total Tests**: 173 tests│   ├── sign-up/

- **Passing**: 164 tests ✅ (94.8% success rate)│   │   ├── step-2/__tests__/

- **Failing**: 9 tests ⚠️ (User query tests - MockQueryBuilder error handling, deferred)│   │   │   └── signup-step-2.test.tsx   # Company details tests

- **Test Suites**: 10/11 passing (90.9%)│   │   ├── step-3/__tests__/

│   │   │   └── signup-step-3.test.tsx   # Emergency contact tests

### Test Coverage by Area│   │   └── step-4/__tests__/

│   │       └── signup-step-4.test.tsx   # Farm details tests

| Area | Tests | Status | Coverage |│   ├── forgot-password/__tests__/

|------|-------|--------|----------|│   │   └── forgot-password.test.tsx     # Password reset tests

| **Authentication** | 14/14 | ✅ 100% | Region-based auth, fallback logic |│   ├── update-password/__tests__/

| **Jurisdiction Hooks** | 25/25 | ✅ 100% | Waste, batch stages, compliance |│   │   └── update-password.test.tsx     # Password update tests

| **RBAC Permissions** | 33/33 | ✅ 100% | Role checks, feature flags |│   └── verify-email/__tests__/

| **RBAC Roles** | 14/14 | ✅ 100% | Role definitions, inheritance |│       └── verify-email.test.tsx        # Email verification tests

| **RBAC Guards** | 18/18 | ✅ 100% | Permission guards, isolation |lib/

| **User Queries** | 15/24 | ⚠️ 62.5% | CRUD operations (9 failing tests) |├── supabase/

| **Supabase Client** | 8/8 | ✅ 100% | Client creation, region routing |│   ├── __tests__/

| **Supabase Region** | 8/8 | ✅ 100% | Multi-region config |│   │   ├── region.test.ts               # Region configuration tests

| **Signup Flow** | 9/9 | ✅ 100% | Registration, validation |│   │   └── client.test.ts               # Client storage utilities tests

| **Jurisdiction Config** | 10/10 | ✅ 100% | Config loading, validation |│   └── queries/

| **Region Types** | 1/1 | ✅ 100% | Type definitions |│       └── __tests__/

│           └── users.test.ts            # User query tests

### Known Issues└── types/

- ⚠️ **9 user query tests failing**: MockQueryBuilder returns error objects but functions expect rejected promises    └── __tests__/

  - **Impact**: Functional code works, tests need error handling refinement        └── region.test.ts               # Region type definitions tests

  - **Priority**: Low-Medium (can be deferred)```



---## Running Tests



## 🧪 Running Tests### Run all tests once

```bash

### Quick Commandsnpm test

```

```bash

# Run all unit tests once### Run tests in watch mode (auto-rerun on file changes)

npm test```bash

npm run test:watch

# Run tests in watch mode (auto-rerun on file changes)```

npm run test:watch

### Run tests with coverage report

# Run tests with coverage report```bash

npm run test:coveragenpm run test:coverage

```

# Run integration tests (Playwright E2E)

npm run test:e2e## Test Coverage



# Run integration tests in UI mode (interactive)The test suite provides comprehensive coverage across authentication flows, multi-region support, and user management:

npm run test:e2e:ui

```### 1. **Authentication Flow Tests** (174 tests total)



---#### **Login Page Tests** (`app/auth/login/__tests__/login-page.test.tsx`) - 18 tests

- ✅ Form rendering and field validation

## 📁 Test Structure- ✅ US region authentication flow

- ✅ Canada region authentication flow

```- ✅ Multi-region fallback handling

trazo-mvp-v1/- ✅ Error handling and display

├── app/- ✅ Loading states

│   └── auth/- ✅ Cookie persistence

│       └── sign-up/- ✅ Security (password masking)

│           └── __tests__/

│               └── signup-flow.test.ts         # 9 tests (100%)#### **Signup Step 2 Tests** (`app/auth/sign-up/step-2/__tests__/signup-step-2.test.tsx`) - 32 tests

├── components/- ✅ Form rendering with all fields

│   └── auth/- ✅ Access control (requires step 1)

│       └── __tests__/- ✅ Plant type conditional logic (cannabis vs produce)

│           └── login-auth.test.ts              # 14 tests (100%)- ✅ Jurisdiction filtering based on plant type

├── hooks/  - Cannabis: Oregon, Maryland, California

│   └── __tests__/  - Produce: PrimusGFS

│       └── use-jurisdiction.test.ts            # 25 tests (100%)- ✅ Data region selection (US/Canada)

├── lib/- ✅ Form validation (company name, location, plant type)

│   ├── jurisdiction/- ✅ Navigation between steps

│   │   └── __tests__/- ✅ Data persistence in localStorage

│   │       └── config.test.ts                  # 10 tests (100%)- ✅ Security and data integrity

│   ├── rbac/

│   │   └── __tests__/#### **Signup Step 3 Tests** (`app/auth/sign-up/step-3/__tests__/signup-step-3.test.tsx`) - 28 tests

│   │       ├── guards.test.ts                  # 18 tests (100%)- ✅ Emergency contact form rendering

│   │       ├── permissions.test.ts             # 33 tests (100%)- ✅ Access control (requires steps 1-2)

│   │       └── roles.test.ts                   # 14 tests (100%)- ✅ Required field validation (person, email, phone)

│   ├── supabase/- ✅ Field type validation (text, email, tel)

│   │   ├── __tests__/- ✅ Form input handling

│   │   │   ├── client.test.ts                  # 8 tests (100%)- ✅ Navigation (back and next)

│   │   │   └── region.test.ts                  # 8 tests (100%)- ✅ Data persistence

│   │   └── queries/- ✅ Security validation

│   │       └── __tests__/- ✅ UI elements (icons, progress indicator)

│   │           ├── test-helpers.ts             # MockQueryBuilder class

│   │           └── users.test.ts               # 24 tests (62.5%)#### **Signup Step 4 Tests** (`app/auth/sign-up/step-4/__tests__/signup-step-4.test.tsx`) - 35 tests

│   └── types/- ✅ Farm details form rendering

│       └── __tests__/- ✅ Access control (requires all previous steps)

│           └── region.test.ts                  # 1 test (100%)- ✅ Required field validation (numberOfContainers)

└── e2e/- ✅ Radix UI checkbox testing (cropType, growingEnvironment)

    ├── auth-flow.spec.ts                       # Authentication flows- ✅ Default values (produce, indoor)

    ├── admin-user-management.spec.ts           # Admin features- ✅ Checkbox state management (data-state attributes)

    ├── permission-checks.spec.ts               # RBAC enforcement- ✅ Final data combination from all 4 steps

    ├── multi-region.spec.ts                    # Multi-region support- ✅ Completion flow and redirect

    └── dashboard-navigation.spec.ts            # Dashboard UI- ✅ Data structure validation

```

#### **Forgot Password Tests** (`app/auth/forgot-password/__tests__/forgot-password.test.tsx`) - 23 tests

---- ✅ Form rendering and validation

- ✅ Email input and validation

## 🚧 Development Mode- ✅ Password reset email request

- ✅ Success message display

### Quick Start- ✅ Error handling (API failures, network errors)

- ✅ Loading states

**Enable authentication bypass for UI development:**- ✅ Redirect URL security

- ✅ Form state management

1. Open `lib/dev-mode.ts`

2. Set the master switch to `true`:#### **Update Password Tests** (`app/auth/update-password/__tests__/update-password.test.tsx`) - 21 tests

- ✅ Password update form rendering

```typescript- ✅ Password field validation

// 🚨 MASTER DEV MODE SWITCH - Set to true to bypass authentication globally- ✅ Password masking

export const DEV_MODE_ENABLED = true- ✅ Strong password acceptance

```- ✅ Update user API call

- ✅ Success redirection to /protected

3. Start dev server:- ✅ Error handling

```bash- ✅ Loading states

npm run dev- ✅ Security (prevent double submission)

```

#### **Verify Email Tests** (`app/auth/verify-email/__tests__/verify-email.test.tsx`) - 17 tests

4. Access any protected route directly (no login required):- ✅ Page rendering with email display

```- ✅ Email parameter from URL

http://localhost:3000/dashboard- ✅ Verification instructions

http://localhost:3000/dashboard/admin/users- ✅ Expiration notice (24 hours)

```- ✅ Help content (spam folder, wait time)

- ✅ Navigation to login

### Features- ✅ UI/UX elements (icon, card structure)



✅ **Single Source of Truth**: One file controls dev mode for entire app  ### 2. **Region Configuration Tests** (`lib/supabase/__tests__/region.test.ts`) - 5 tests

✅ **Automatic Safety**: Only works in `NODE_ENV === 'development'`  - ✅ US region configuration retrieval

✅ **Global Bypass**: Affects all protected routes  - ✅ Canada region configuration retrieval

✅ **Visual Indicators**: Yellow banner at top of dashboard  - ✅ Missing service role key handling

✅ **Console Logs**: Shows which routes bypass auth  - ✅ Environment variable validation

- ✅ Error messages for missing configuration

### Mock User Data

### 3. **Client Storage Tests** (`lib/supabase/__tests__/client.test.ts`) - 7 tests

When dev mode is active:- ✅ Getting stored region from localStorage

- ✅ Setting region in localStorage

```typescript- ✅ Clearing stored region

{- ✅ Default region fallback (US)

  id: 'dev-user-123',- ✅ Invalid value handling

  email: 'dev@trazo.ag',- ✅ SSR environment handling (when window is undefined)

  full_name: 'Dev User',- ✅ Integration tests for store/retrieve/clear flow

  role: 'org_admin',           // Highest privileges

  organization: {### 4. **Region Type Tests** (`lib/types/__tests__/region.test.ts`) - 4 tests

    name: 'Development Farm',- ✅ REGION_INFO constant validation

    jurisdiction: 'maryland_cannabis',- ✅ Region type definitions (US, CA)

    plant_type: 'cannabis',- ✅ UserMetadata type structure

    data_region: 'us'- ✅ Region information structure consistency

  }

}### 5. **User Query Tests** (`lib/supabase/queries/__tests__/users.test.ts`) - 24 tests

```- ✅ Fetch all users query

- ✅ Fetch user by ID

### Customize Mock User- ✅ Create user invitation

- ✅ Update user status (active, suspended, inactive)

To test different roles or jurisdictions, edit `lib/dev-mode.ts`:- ✅ Resend invitation

- ✅ Fetch users by role

```typescript- ✅ Fetch users by status

export const DEV_MOCK_USER = {- ✅ Count users query

  // Change role to test different permissions- ⚠️ Note: 9 tests currently failing due to MockQueryBuilder error handling (marked for fix)

  role: 'site_manager',  // Try: org_admin, site_manager, compliance_qa, etc.

  ### 6. **Admin API Route Tests** (`app/api/admin/users/**/__tests__/`) - 47 tests

  organization: {- ✅ User invitation endpoint (POST /api/admin/users/invite) - 18 tests

    // Change jurisdiction to test different compliance rules  - Authentication verification (missing auth header)

    jurisdiction: 'oregon_cannabis',  // Try: maryland_cannabis, canada_cannabis, primus_gfs  - Admin permission checks

    plant_type: 'cannabis',           // Try: cannabis, produce  - Input validation (email, role)

    data_region: 'us'                 // Try: us, ca  - Duplicate invitation handling

  }  - Database error handling

}  - Email sending verification

```  - Successful invitation creation

- ✅ User status endpoint (PATCH /api/admin/users/[id]/status) - 17 tests

---  - Authentication and permission checks

  - Status validation (active, suspended, inactive)

## 🌱 Seed Data  - User existence verification

  - Same status prevention

### Quick Setup  - Self-update prevention

  - Database error handling

**Step 1: Create `.env.local`**  - Successful status updates

- ✅ Resend invitation endpoint (POST /api/admin/users/[id]/resend-invitation) - 12 tests

```bash  - Authentication and permission checks

touch .env.local  - User existence verification

```  - Active user prevention

  - Invitation token validation

**Step 2: Add Supabase credentials**  - Expired token handling

  - Email sending verification

```bash  - Successful resend

# US REGION (REQUIRED)

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co### 7. **Dashboard Component Tests** (`components/dashboard/__tests__/`) - 34+ tests

NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here#### **Breadcrumbs Component** (`breadcrumbs.test.tsx`) - 34 tests ✅

- ✅ Rendering (4 tests): Basic render, className support, home icon, null on dashboard home

# CANADA REGION (OPTIONAL)- ✅ Path Mapping (5 tests): Segment to label conversion (batches→Batch Management, inventory→Inventory, etc.)

# NEXT_PUBLIC_CAN_SUPABASE_URL=https://your-canada-project-id.supabase.co- ✅ Nested Paths (4 tests): Two-level, three-level, single-level nesting

# NEXT_PUBLIC_CAN_SUPABASE_ANON_KEY=your-canada-anon-key- ✅ Links (3 tests): Non-final crumbs clickable, final crumb not clickable, correct href paths

# CAN_SUPABASE_SERVICE_ROLE_KEY=your-canada-service-role-key- ✅ Chevron Separators (3 tests): Show between items, not before first, correct count

```- ✅ Styling (3 tests): Hover styles on links, final crumb highlight, muted non-final

- ✅ Complex Paths (4 tests): Compliance, tasks, waste, environmental paths

**Step 3: Run seeding script**- ✅ Edge Cases (3 tests): Trailing slashes, empty segments, root dashboard

- **Status**: All tests passing - breadcrumbs are pure path-based rendering, ideal for unit testing

```bash

npm run seed:dev#### **Header & Sidebar Components** - Integration Testing Recommended ⚠️

```The header and sidebar components have basic unit tests created but are **better suited for integration testing** due to:



### What Gets Created**Technical Challenges:**

- **Radix UI Dropdown Components**: Complex dropdown menus don't open in standard unit test environment

- ✅ **2 organizations** (GreenLeaf Farms US, Maple Leaf Canada)  - User menu dropdown (Profile Settings, Preferences, Help & Support, Logout)

- ✅ **2 sites** (Portland Facility, Vancouver Facility)  - Notifications dropdown with dynamic badge counts

- ✅ **12 user profiles** (all 8 roles represented)  - Requires special test setup or visual regression testing

- ✅ **15 audit events** (sample activity log)  

- ✅ **User-site assignments** (access control)- **Complex Permission Hook**: `usePermissions` returns 5 methods (can, cannot, hasAny, hasAll, requirePermission)

  - Navigation visibility based on user role and permissions

### Sample Users  - Nested navigation items with hierarchical permission checks

  - Difficult to comprehensively mock all permission combinations

| Email | Role | Organization | Jurisdiction |  

|-------|------|--------------|--------------|- **Active State Management**: Pathname-based highlighting across nested navigation

| admin@greenleaf.example | org_admin | GreenLeaf US | maryland_cannabis |  - Multiple navigation levels with parent/child relationships

| manager@greenleaf.example | site_manager | GreenLeaf US | maryland_cannabis |  - Dynamic badge counts and alerts

| grower@greenleaf.example | head_grower | GreenLeaf US | maryland_cannabis |  - Best tested with actual routing

| operator1@greenleaf.example | operator | GreenLeaf US | maryland_cannabis |

| compliance@greenleaf.example | compliance_qa | GreenLeaf US | maryland_cannabis |**Unit Test Coverage Created:**

| admin.ca@mapleleaf.example | org_admin | Maple Leaf CA | canada_cannabis |- ✅ Basic component rendering

- ✅ User information display (name, role, organization)

**See `/lib/supabase/seed-data.ts` for complete list**- ✅ Navigation structure validation

- ✅ Icon presence verification

---- ✅ Responsive behavior (mobile/desktop classes)



## ✅ Testing Best Practices**Recommended Integration Test Approach:**

```typescript

### 1. Supabase Query Tests// Example integration test structure (to be implemented)

describe('Dashboard Navigation Integration', () => {

Use `MockQueryBuilder` for chainable queries:  it('should display navigation items based on admin role', async () => {

    // Login as admin user

```typescript    // Navigate to dashboard

import { MockQueryBuilder } from './test-helpers';    // Verify all admin sections visible (Users & Roles, Organization, Settings)

  });

const mockSupabase = {  

  from: jest.fn().mockReturnValue(  it('should highlight active navigation item', async () => {

    new MockQueryBuilder(mockData, error, count)    // Navigate to /dashboard/batches/active

  )    // Verify "Batch Management" and "Active" are highlighted

};  });

```  

  it('should open user menu and navigate to profile', async () => {

### 2. React Hook Tests    // Click user menu dropdown

    // Verify menu items appear

Use `renderHook` from `@testing-library/react`:    // Click "Profile Settings"

    // Verify navigation to profile page

```typescript  });

import { renderHook } from '@testing-library/react';  

import { useJurisdiction } from '../use-jurisdiction';  it('should filter notifications by count', async () => {

    // Click notifications dropdown

const { result } = renderHook(() =>     // Verify badge count matches notification list length

  useJurisdiction('maryland_cannabis' as JurisdictionId)    // Mark notification as read

);    // Verify badge count decreases

  });

expect(result.current.jurisdiction).not.toBeNull();});

``````



### 3. Authentication Tests**Why Integration Testing is Better:**

1. **Real User Interactions**: Test actual clicks, dropdowns opening, navigation

Mock Supabase client for auth flows:2. **Full Context**: Test with real auth, permissions, routing, and state management

3. **End-to-End Flows**: Verify complete user journeys through dashboard

```typescript4. **Visual Validation**: Can use tools like Playwright or Cypress for visual testing

import { createClient } from '@/lib/supabase/client';5. **Maintainability**: Less brittle than complex unit test mocks

6. **Real Value**: Tests what users actually experience, not just isolated components

jest.mock('@/lib/supabase/client');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;## Test Results



mockCreateClient.mockResolvedValue({Current test status: **385 passing out of 394 total tests (97.7% pass rate)**

  auth: {

    signInWithPassword: jest.fn().mockResolvedValue({```

      data: { user: mockUser },Test Suites: 1 failed, 20 passed, 21 total

      error: nullTests:       9 failed, 385 passed, 394 total

    })```

  }

});**Breakdown by Category:**

```- ✅ Authentication Tests: 174/174 passing (100%)

- ✅ Region Tests: 16/16 passing (100%)

### 4. Type Safety- ✅ Admin API Route Tests: 47/47 passing (100%)

- ✅ Dashboard Breadcrumbs Tests: 34/34 passing (100%)

Always use explicit type assertions:- ⚠️ User Query Tests: 15/24 passing (62.5%)

- ⚠️ Dashboard Header/Sidebar: Basic tests created, integration testing recommended

```typescript

const jurisdictionId = 'maryland_cannabis' as JurisdictionId;**Known Issues:**

const role = 'org_admin' as RoleKey;- 9 user query tests failing due to MockQueryBuilder error handling

const status = 'active' as UserStatus;- Dashboard interactive components (header, sidebar) require integration testing for full coverage

```

## Writing New Tests

---

### Example: Testing an auth component

## 🎯 Integration Testing (E2E)

```typescript

### Overviewimport { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { YourAuthComponent } from '../YourAuthComponent';

Comprehensive end-to-end tests using **Playwright** for complete user flows with real browser interactions.import { createClient } from '@/lib/supabase/client';



### Running Integration Tests// Mock Supabase client

jest.mock('@/lib/supabase/client', () => ({

```bash  createClient: jest.fn(),

# Run all integration tests}));

npm run test:e2e

describe('Your Auth Component', () => {

# Run in UI mode (interactive)  const mockSupabaseMethod = jest.fn();

npm run test:e2e:ui  const mockSupabaseClient = {

    auth: {

# Run in headed mode (see browser)      yourMethod: mockSupabaseMethod,

npm run test:e2e:headed    },

  };

# Run specific test file

npx playwright test e2e/auth-flow.spec.ts  beforeEach(() => {

    jest.clearAllMocks();

# Debug a test    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

npx playwright test --debug e2e/admin-user-management.spec.ts    mockSupabaseMethod.mockResolvedValue({ error: null });

  });

# View test report

npm run test:e2e:report  it('should handle form submission', async () => {

```    render(<YourAuthComponent />);

    

### Test Coverage    const input = screen.getByLabelText(/your field/i);

    fireEvent.change(input, { target: { value: 'test value' } });

1. **Authentication Flows** (`e2e/auth-flow.spec.ts`) - Login, signup, password reset    

2. **Admin User Management** (`e2e/admin-user-management.spec.ts`) - User table, invite, status changes    const submitButton = screen.getByRole('button', { name: /submit/i });

3. **Permission Checks** (`e2e/permission-checks.spec.ts`) - RBAC enforcement across roles    fireEvent.click(submitButton);

4. **Multi-Region Support** (`e2e/multi-region.spec.ts`) - US/Canada routing, data isolation    

5. **Dashboard Navigation** (`e2e/dashboard-navigation.spec.ts`) - Sidebar, header, breadcrumbs    await waitFor(() => {

      expect(mockSupabaseMethod).toHaveBeenCalledWith(

### Why Integration Tests?        expect.objectContaining({ field: 'test value' })

      );

- Test real user interactions with actual browser    });

- Validate full stack (Frontend + API + Database + Auth)  });

- Test complex UI (Radix UI dropdowns, dialogs)});

- Verify permissions across all layers```

- Catch integration bugs

### Testing localStorage with Multi-Step Forms

See `e2e/README.md` for detailed setup instructions.

```typescript

---// Mock localStorage with actual storage

const storageMock = (() => {

## 🛠️ Test Infrastructure  let store: Record<string, string> = {};

  

### Mocked Dependencies  return {

    getItem: jest.fn((key: string) => store[key] || null),

The test environment automatically mocks:    setItem: jest.fn((key: string, value: string) => {

- **Next.js Router** (`next/navigation`)      store[key] = value;

- **localStorage** (jest.fn() implementations)    }),

- **window.matchMedia** (for responsive design)    clear: jest.fn(() => {

- **Environment variables** (Supabase URLs and keys)      store = {};

    }),

### Jest Configuration  };

})();

Key settings in `jest.config.ts`:

```typescriptObject.defineProperty(window, 'localStorage', {

{  value: storageMock,

  testEnvironment: 'jsdom',  writable: true

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],});

  testPathIgnorePatterns: [

    '/node_modules/',describe('Multi-Step Form', () => {

    '/.next/',  beforeEach(() => {

    '/Prototypes/',    storageMock.clear();

    '/__tests__/.*\\.helpers\\.ts$',    // Set previous step data

    '/__tests__/test-helpers\\.ts$'    storageMock.setItem('signupStep1', JSON.stringify({ name: 'Test' }));

  ],  });

  moduleNameMapper: {  

    '^@/(.*)$': '<rootDir>/$1'  it('should persist form data', () => {

  }    // Your test logic

}  });

```});

```

---

### Testing Radix UI Components (Checkboxes)

## 📚 Additional Resources

```typescript

### Documentation Filesit('should handle checkbox state', () => {

- `DATABASE_SETUP.md` - Supabase schema and RLS policies  render(<YourComponent />);

- `ENV_SETUP.md` - Environment configuration guide  

- `SEED_SETUP.md` - Seed data for development  // Radix UI checkboxes use data-state attribute, not checked property

- `DEV_MODE.md` - Development mode detailed guide  const checkbox = screen.getByRole('checkbox', { name: 'Your Checkbox' });

- `CURRENT.md` - Current project status  expect(checkbox.getAttribute('data-state')).toBe('checked');

- `NextSteps.md` - Integration roadmap  

  // Click the label to toggle

### Test Files to Reference  const label = screen.getByLabelText('Your Checkbox');

- `hooks/__tests__/use-jurisdiction.test.ts` - Comprehensive hook testing  fireEvent.click(label);

- `components/auth/__tests__/login-auth.test.ts` - Auth flow testing  

- `lib/supabase/queries/__tests__/test-helpers.ts` - MockQueryBuilder pattern  expect(checkbox.getAttribute('data-state')).not.toBe('checked');

- `app/auth/sign-up/__tests__/signup-flow.test.ts` - Multi-step form testing});

```

---

### Handling JSDOM Navigation Errors

## 🐛 Troubleshooting

```typescript

### Tests fail with "Cannot find module"it('should navigate on success', () => {

- Run `npm install` to install all dependencies  // JSDOM throws "Not implemented: navigation" errors

- Check that the import path is correct  // Mock console.error to catch the navigation attempt

  const consoleError = jest.spyOn(console, 'error').mockImplementation();

### Tests fail with environment variable errors  

- Check that `jest.setup.ts` is properly configured  render(<YourComponent />);

- Verify mock environment variables are set correctly  

  // Trigger navigation

### Tests timeout  const button = screen.getByRole('button');

- Increase timeout in `jest.config.ts` if needed  fireEvent.click(button);

- Check for async operations that aren't being awaited  

- Use `waitFor` for async state changes  // Verify navigation was attempted

  expect(consoleError).toHaveBeenCalled();

### localStorage tests fail  const navError = consoleError.mock.calls.find(call => 

- Use the storage mock pattern with actual store object    call.some(arg => arg?.message?.includes('Not implemented: navigation'))

- Clear storage in `beforeEach`  );

  expect(navError).toBeDefined();

### Radix UI component tests fail  

- Use `data-state` attribute instead of `checked` property  consoleError.mockRestore();

- Query by role with accessible name});

```

---

## Mocked Dependencies

## 📝 Next Steps

The test environment automatically mocks:

### Planned Test Additions:- **Next.js Router** (`next/navigation`) - useRouter, useSearchParams

- [ ] Fix remaining 9 user query tests (error handling)- **Supabase Client** (`@/lib/supabase/client`) - Full auth methods

- [ ] Add admin feature component tests- **localStorage** - With actual storage simulation for multi-step forms

- [ ] Expand E2E test coverage- **window.matchMedia** - For responsive design tests

- [ ] Add middleware tests- **window.location** - For navigation and redirect testing

- [ ] Add error boundary tests- **console.error** - For catching JSDOM navigation errors

- **Environment variables** - Supabase URLs and keys for US/Canada regions

### Areas for Future Coverage:

- [ ] Session management tests## Environment Variables for Testing

- [ ] Responsive design tests

- [ ] Loading state testsTests use the following mock environment variables:

- [ ] Email verification flow tests```bash

# US Region

---NEXT_PUBLIC_SUPABASE_URL=https://test-us.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=test-us-anon-key

**For detailed E2E setup and advanced testing patterns, see `e2e/README.md`**

# Canada Region
CAN_NEXT_PUBLIC_SUPABASE_URL=https://test-ca.supabase.co
CAN_NEXT_PUBLIC_SUPABASE_ANON_KEY=test-ca-anon-key
```

These are configured in `jest.setup.ts` and automatically available to all tests.

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
6. **Test user flows** - Cover complete user journeys (e.g., full signup process)
7. **Test security** - Verify password masking, access control, validation
8. **Use waitFor for async** - Always await async operations properly
9. **Clean up mocks** - Use beforeEach to reset mocks between tests
10. **Test accessibility** - Use role-based queries (getByRole, getByLabelText)

## Troubleshooting

### Tests fail with "Cannot find module"
- Make sure you've run `npm install` to install all dependencies
- Check that the import path is correct and the module exists

### Tests fail with environment variable errors
- Check that `jest.setup.ts` is properly configured
- Verify the mock environment variables are set correctly

### Tests timeout
- Increase the timeout in `jest.config.ts` if needed
- Check for async operations that aren't being properly awaited
- Make sure to use `waitFor` for async state changes

### JSDOM "Not implemented: navigation" errors
- This is expected when testing navigation
- Mock `console.error` to catch navigation attempts
- See "Handling JSDOM Navigation Errors" in Writing New Tests section

### localStorage tests fail
- Use the storage mock pattern with actual store object
- See "Testing localStorage with Multi-Step Forms" section
- Make sure to clear storage in beforeEach

### Radix UI component tests fail
- Use `data-state` attribute instead of `checked` property
- Query by role with accessible name
- See "Testing Radix UI Components" section

### Mock not being called
- Verify you're calling `jest.clearAllMocks()` in beforeEach
- Check that the mock is defined before the component renders
- Make sure you're awaiting async operations with `waitFor`

## Integration Testing Recommendations

For comprehensive dashboard and admin feature testing, integration tests are recommended over unit tests for the following components:

### Dashboard Navigation (Header & Sidebar)
**Why integration testing:**
- Complex Radix UI dropdown interactions
- Multi-level permission checks across user roles
- Dynamic navigation state based on pathname
- Real-time notification badge updates
- Responsive behavior across breakpoints

**Suggested test framework:** Playwright or Cypress for full E2E testing

**Key scenarios to test:**
1. Role-based navigation visibility (admin, manager, viewer)
2. Active state highlighting across nested routes
3. User menu dropdown interactions (Profile, Settings, Logout)
4. Notifications dropdown with badge count updates
5. Mobile responsive menu behavior
6. Search functionality integration

### Admin Features (UserTable, Dialogs, RBAC)
**Why integration testing:**
- Complex data table interactions (sorting, filtering, pagination)
- Modal dialogs with form validation and API calls
- Permission matrix with real-time updates
- Audit log with timestamp and user tracking
- Multi-step workflows (invite user → send email → verify status)

**Key scenarios to test:**
1. Complete user invitation flow with email delivery
2. Status changes with permission validation
3. Role assignment and permission inheritance
4. Audit trail accuracy across user actions
5. Real-time updates after database changes

### Integration Test Setup (Planned)
```bash
# Install Playwright or Cypress
npm install -D @playwright/test  # or cypress

# Create integration test directory
mkdir -p tests/integration
```

Example Playwright test structure:
```typescript
// tests/integration/dashboard-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login with admin credentials
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display admin navigation items', async ({ page }) => {
    // Verify admin-only sections visible
    await expect(page.getByText('Users & Roles')).toBeVisible();
    await expect(page.getByText('Organization')).toBeVisible();
  });

  test('should open user menu and logout', async ({ page }) => {
    // Click user menu
    await page.click('[data-testid="user-menu-trigger"]');
    
    // Verify menu items
    await expect(page.getByText('Profile Settings')).toBeVisible();
    await expect(page.getByText('Preferences')).toBeVisible();
    
    // Click logout
    await page.click('text=Logout');
    await page.waitForURL('/auth/login');
  });
});
```

## Next Steps

### Planned Test Additions:
- [x] **Admin API route tests** - ✅ 47 tests completed (100% passing)
- [x] **Dashboard breadcrumbs tests** - ✅ 34 tests completed (100% passing)
- [ ] **Admin feature tests** - Test UserTable, UserInviteDialog, RolePermissionMatrix, AuditLogTable
- [ ] **Integration tests** - Implement Playwright/Cypress tests for dashboard navigation and admin features
- [ ] **Fix user query tests** - Update MockQueryBuilder to properly handle errors (9 failing tests)

### Areas for Future Coverage:
- [ ] Middleware region detection tests
- [ ] Email verification flow integration tests
- [ ] Role-based access control integration tests
- [ ] Logout functionality tests
- [ ] Session management tests
- [ ] Error boundary tests
- [ ] Loading state tests
- [ ] Responsive design tests

---

## Integration Tests (E2E with Playwright)

### Overview

The project now includes comprehensive end-to-end integration tests using **Playwright**. These tests verify complete user flows with real browser interactions, authentication, and database operations.

**Total Integration Tests: ~127 tests**

### Setup

1. **Install Playwright** (already done):
   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. **Set up test database** with seed data:
   ```bash
   npm run seed:dev
   ```

3. **Create test users** (see `SEED_SETUP.md`):
   - Required test users with passwords:
     - `admin@greenleaf.example` (org_admin role)
     - `manager@greenleaf.example` (site_manager role)  
     - `grower@greenleaf.example` (head_grower role)
     - `operator1@greenleaf.example` (operator role)

### Running Integration Tests

```bash
# Run all integration tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/auth-flow.spec.ts

# Debug a test
npx playwright test --debug e2e/admin-user-management.spec.ts

# View test report
npm run test:e2e:report
```

### Test Files

```
e2e/
├── README.md                           # Setup guide
├── auth-flow.spec.ts                   # Authentication flows (~17 tests)
├── admin-user-management.spec.ts       # Admin features (~35 tests)
├── permission-checks.spec.ts           # RBAC enforcement (~25 tests)
├── multi-region.spec.ts                # Multi-region support (~20 tests)
└── dashboard-navigation.spec.ts        # Dashboard UI (~30 tests)
```

### What Integration Tests Cover

1. **Authentication Flows**: Login, signup (4 steps), password reset, email verification, region selection
2. **Admin User Management**: User table, search, invite, status changes, role matrix, audit log
3. **Permission Checks**: Role-based access control across all user roles, API enforcement
4. **Multi-Region Support**: US/Canada routing, data isolation, region persistence
5. **Dashboard Navigation**: Sidebar, header, user menu, breadcrumbs, responsive behavior

### Why Integration Tests?

- **Test real user interactions**: Clicks, typing, navigation with actual browser
- **Validate full stack**: Frontend + API + Database + Auth in one flow
- **Test complex UI**: Radix UI dropdowns, dialogs, tabs (hard to unit test)
- **Verify permissions**: Real RBAC enforcement across all layers
- **Multi-region validation**: Region routing and data isolation
- **Catch integration bugs**: Issues that only appear when components work together

See `e2e/README.md` for detailed setup instructions and best practices.

