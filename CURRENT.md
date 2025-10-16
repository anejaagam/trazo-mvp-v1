# TRAZO MVP v1 - Current State Documentation

*Last Updated: October 16, 2025*

## 📖 Project Overview

**TRAZO** is an edge-native container farm operating system with multi-regional data residency capabilities. The application enables farmers and agricultural companies to manage their container infrastructure while ensuring data stays within their preferred region (US or Canada).

## 🏗️ Architecture & Tech Stack

### **Frontend Framework**
- **Next.js 15** - Full-stack React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework with custom design tokens
- **React 19** - Latest React features and optimizations

### **UI Component Library**
- **Radix UI Primitives** - Accessible component foundations
- **shadcn/ui Pattern** - Component design system architecture
- **CVA (Class Variance Authority)** - Component variant management
- **Lucide Icons** - Consistent iconography

### **Styling & Design**
- **Custom Design System** - Extracted from Figma designs
- **Brand Color Palette** - Multi-shade green palette with semantic mapping
- **Typography System** - Lato font family with defined scales
- **Responsive Design** - Mobile-first approach

### **Backend Integration**
- **Supabase** - Backend-as-a-Service for authentication and database
- **Multi-Regional Setup** - US and Canada data residency
- **PostgreSQL** - Relational database through Supabase

## 🎨 Design System

### **Color Palette**
```typescript
// Primary Brand Colors
brand: {
  cream: '#f5f5e7',
  'dark-green': { 50-800 shades },
  'lighter-green': { 50-800 shades },
  'lightest-green': { 50-800 shades },
  blue: { 50-800 shades }
}

// Semantic Colors
primary: '#7eb081' (lighter-green-500)
secondary: '#52665d' (dark-green-500)
success: '#8eba63' (lightest-green-700)
error: '#a31b1b'
information: '#99c2f1' (blue-500)
```

### **Typography Scale**
```typescript
// Display Sizes (Headings)
display-1: 44px/44px
display-2: 40px/40px
display-3: 33px/27px
display-4: 27px/27px
display-5: 23px/23px
display-6: 19px/19px

// Body Text
body-xs: 11px/16px
body-sm: 14px/20px
body-base: 16px/12.8px
body-lg: 18px/28px
```

### **Spacing System**
- **Base Unit**: 4px (1 = 4px)
- **Scale**: 0, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 20, 24
- **Usage**: Consistent spacing throughout components and layouts

## 🧩 Component Library

### **Core UI Components**

#### **Button Component** (`/components/ui/button.tsx`)
- **7 Variants**: default, outline, info, ghost, link, destructive, secondary
- **3 Sizes**: sm, default, lg
- **Features**: Loading states, left/right icons, disabled states
- **Integration**: Full Figma design compliance, `asChild` prop for Link compatibility

#### **Field Component** (`/components/ui/field.tsx`)
- **Input Types**: text, email, password, tel
- **Features**: Left/right icon support, error states, placeholder styling
- **Styling**: Custom focus states, consistent padding

#### **Checkbox Component** (`/components/ui/checkbox.tsx`)
- **Size**: 18x18px to match Figma specifications
- **States**: Default, checked (success green), disabled
- **Integration**: Radix UI primitive with custom styling

#### **Form Label Component** (`/components/ui/form-label.tsx`)
- **Features**: Required indicator (*), icon support, proper typography
- **Integration**: Works with form libraries and validation

### **Layout Components**

#### **Header Component** (`/components/header.tsx`)
- **Variants**: landing, auth
- **Features**: TRAZO logo, navigation links, auth buttons
- **Responsive**: Mobile-optimized navigation

#### **Progress Indicator** (`/components/ui/progress-indicator.tsx`)
- **Usage**: Multi-step form navigation
- **Features**: Step completion tracking, visual progress display

## 📱 Application Pages

### **Landing & Authentication Flow**

#### **Landing Page** (`/app/landing/page.tsx`)
- **Hero Section**: Welcome message and brand positioning
- **CTAs**: Sign up and Login buttons
- **Features**: Multi-regional, security, edge-native highlights
- **Design**: Matches Figma specifications exactly

#### **Authentication Pages**

**Sign In** (`/app/auth/login/page.tsx`)
- Email/username and password fields
- Forgot password link
- Redirect to protected area after login

**Multi-Step Sign Up Flow**:
1. **Step 1** (`/app/auth/sign-up/page.tsx`): Personal details (name, email, phone, role)
2. **Step 2** (`/app/auth/sign-up/step-2/page.tsx`): Company information
3. **Step 3** (`/app/auth/sign-up/step-3/page.tsx`): Emergency contact details
4. **Step 4** (`/app/auth/sign-up/step-4/page.tsx`): Farm details and completion

**Success Page** (`/app/auth/sign-up/success/page.tsx`)
- Registration completion confirmation
- Next steps guidance

### **Protected Area** (`/app/protected/`)
- Dashboard for authenticated users
- Regional data display
- Container farm management interface

## 🔧 Technical Implementation

### **State Management**
- **localStorage**: Multi-step form persistence
- **React State**: Component-level state management
- **Form Validation**: Client-side validation with error handling

### **Routing & Navigation**
- **App Router**: Next.js 15 file-based routing
- **Middleware**: Authentication checks and regional routing
- **Redirects**: Automatic routing based on auth state

### **Authentication Flow**
```typescript
// Current Flow
1. Unauthenticated user visits '/' → Redirects to '/landing'
2. User clicks "Get Started" → Multi-step signup flow
3. User clicks "Log In" → Sign in page
4. Authenticated user visits '/' → Redirects to '/protected'
```

### **Multi-Regional Setup**
- **US Region**: Default Supabase instance
- **Canada Region**: Separate Supabase instance for data residency
- **Cookie-based**: Region preference storage
- **Middleware**: Region-aware routing and data access

## 📁 Project Structure

```
trazo-mvp-v1/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles and CSS variables
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Homepage with auth redirects
│   ├── auth/                    # Authentication pages
│   │   ├── login/page.tsx       # Sign in page
│   │   ├── sign-up/             # Multi-step signup flow
│   │   │   ├── page.tsx         # Step 1: Personal info
│   │   │   ├── step-2/page.tsx  # Step 2: Company info
│   │   │   ├── step-3/page.tsx  # Step 3: Emergency contact
│   │   │   └── step-4/page.tsx  # Step 4: Farm details
│   │   └── sign-up-success/     # Registration success
│   ├── landing/page.tsx         # Landing page
│   └── protected/               # Authenticated user area
├── components/                   # Reusable components
│   ├── header.tsx               # Navigation header
│   ├── ui/                      # UI component library
│   │   ├── button.tsx           # Button component with variants
│   │   ├── field.tsx            # Input field component
│   │   ├── checkbox.tsx         # Checkbox component
│   │   ├── form-label.tsx       # Form label component
│   │   └── progress-indicator.tsx # Step progress component
│   └── providers/               # Context providers
├── lib/                         # Utility libraries
│   ├── utils.ts                 # Utility functions (cn, etc.)
│   ├── supabase/                # Supabase configuration
│   │   ├── client.ts            # Client-side Supabase
│   │   ├── server.ts            # Server-side Supabase
│   │   ├── middleware.ts        # Auth middleware
│   │   └── region.ts            # Multi-regional config
│   └── types/                   # TypeScript type definitions
├── middleware.ts                # Next.js middleware
├── tailwind.config.ts           # Tailwind configuration
└── package.json                 # Dependencies and scripts
```

## 🔌 Integrations

### **Supabase Integration**
- **Authentication**: User registration and login
- **Database**: PostgreSQL for user data
- **Multi-Regional**: Separate instances for US/Canada
- **Row Level Security**: Data access controls

### **Figma Integration**
- **Design Token Extraction**: Automated color and typography extraction
- **Component Matching**: UI components match Figma designs exactly
- **Design System**: Consistent implementation of brand guidelines

## 🎯 Current Development Status

### ✅ **Completed Features**
- [x] Complete design system implementation
- [x] Landing page with hero section and CTAs
- [x] Sign in page with form validation
- [x] 4-step sign up flow with progress tracking
- [x] Header component with navigation
- [x] Button component with 7 variants
- [x] Form components (Field, Checkbox, Label)
- [x] Authentication routing and middleware
- [x] Multi-regional Supabase setup
- [x] Responsive design implementation
- [x] TypeScript type safety

### 🚧 **In Progress**
- [ ] Backend API integration
- [ ] Form submission handling
- [ ] Database schema implementation
- [ ] User session management

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)

### **Installation**
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### **Environment Setup**
```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SUPABASE_URL_CA=your-canada-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY_CA=your-canada-supabase-anon-key
```

## 📊 Testing

### **Current Test Coverage**
- Jest configuration setup
- Component unit tests in progress
- Integration tests planned

### **Testing Strategy**
- Unit tests for components
- Integration tests for authentication flow
- E2E tests for complete user journeys

## 📝 Documentation

### **Available Documentation**
- `README.md` - Project overview and setup
- `AUTH_FLOW_EXPLAINED.md` - Authentication flow details
- `MULTI_REGION_SETUP.md` - Regional configuration
- `ENV_SETUP.md` - Environment setup guide
- `TESTING.md` - Testing guidelines
- `figmaTokens.md` - Design token documentation

## 🔮 Future Roadmap

### **Phase 1: Core Authentication** (Current)
- Complete backend API implementation
- User registration and login
- Session management

### **Phase 2: Dashboard & Farm Management**
- Container monitoring interface
- Farm data visualization
- User profile management

### **Phase 3: Advanced Features**
- Real-time monitoring
- Analytics and reporting
- Multi-tenant support

### **Phase 4: Scale & Optimize**
- Performance optimization
- Advanced security features
- Enterprise features

---

## 📞 Support & Contact

For questions about this implementation or to contribute to the project, please refer to the project documentation or contact the development team.

**Project**: TRAZO MVP v1  
**Version**: 1.0.0  
**Status**: Active Development  
**Last Updated**: October 16, 2025