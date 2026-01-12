# Milestone 01: Foundation & Infrastructure

**Duration**: 2 weeks
**Status**: Not Started
**Dependencies**: None

## Overview

Establish the technical foundation for the CookBook-TanStack application including database setup, authentication system, and API layer. This milestone is critical as all subsequent phases depend on this infrastructure.

---

## 1.1 Project Setup & Configuration

### Tasks

1. [ ] Install Drizzle ORM packages
   ```bash
   npm install drizzle-orm postgres
   npm install -D drizzle-kit
   ```
2. [ ] Create `.env.example` file with all required database variables documented
3. [ ] Configure environment variables for local environment (`.env.local`)
4. [ ] Set up Drizzle config file (`drizzle.config.ts`)
5. [ ] Create local database instance
6. [ ] Set up database connection and test connectivity
7. [ ] Configure environment variables for staging environment
8. [ ] Create staging database instance
9. [ ] Configure environment variables for production environment
10. [ ] Create production database instance
11. [ ] Verify `drizzle-kit` commands work correctly

### Acceptance Criteria

- [ ] Drizzle ORM installed and configured
- [ ] Database connection established and tested
- [ ] Environment variables properly configured
- [ ] `.env.example` file created with all required variables documented
- [ ] Drizzle config file properly configured with correct database connection
- [ ] Can successfully run `drizzle-kit` commands
- [ ] Local, staging, and production databases created
- [ ] Database credentials secured and not committed to version control

### Deliverables

- Working database connection
- Environment configuration files
- Drizzle config files
- Database instances (local, staging, production)

---

## 1.2 Database Schema Design

### Schema Tables

**Core Tables:**
```typescript
- users (id, email, username, password_hash, name, avatar_url, created_at, updated_at)
- recipes (id, user_id, name, ingredients, instructions, notes, servings, 
           source_id, classification_id, date_added, calories, fat, cholesterol, 
           sodium, protein, marked, image_url, is_public, created_at, updated_at)
- classifications (id, name, description, slug, created_at, updated_at)
- sources (id, name, url, created_at, updated_at)
- cookbooks (id, user_id, name, description, is_public, image_url, created_at, updated_at)
```

**Taxonomy Tables:**
```typescript
- meals (id, name, description, slug, created_at, updated_at)
- courses (id, name, description, slug, created_at, updated_at)
- preparations (id, name, description, slug, created_at, updated_at)
```

**Junction Tables:**
```typescript
- recipe_meals (recipe_id, meal_id)
- recipe_courses (recipe_id, course_id)
- recipe_preparations (recipe_id, preparation_id)
- cookbook_recipes (cookbook_id, recipe_id, order_index)
```

**Additional Tables:**
```typescript
- recipe_images (id, recipe_id, url, alt_text, order_index, is_primary)
- recipe_likes (user_id, recipe_id, created_at)
- cookbook_followers (user_id, cookbook_id, created_at)
```

### Tasks

12. [ ] Create directory structure `src/db/schema/`
13. [ ] Define `users` table schema with all fields and types
14. [ ] Define `recipes` table schema with all fields and types
15. [ ] Define `classifications` table schema with all fields and types
16. [ ] Define `sources` table schema with all fields and types
17. [ ] Define `cookbooks` table schema with all fields and types
18. [ ] Define `meals` taxonomy table schema
19. [ ] Define `courses` taxonomy table schema
20. [ ] Define `preparations` taxonomy table schema
21. [ ] Define `recipe_meals` junction table schema
22. [ ] Define `recipe_courses` junction table schema
23. [ ] Define `recipe_preparations` junction table schema
24. [ ] Define `cookbook_recipes` junction table schema
25. [ ] Define `recipe_images` table schema
26. [ ] Define `recipe_likes` table schema
27. [ ] Define `cookbook_followers` table schema
28. [ ] Set up all primary key constraints
29. [ ] Set up foreign key relationships with proper ON DELETE/UPDATE cascades
30. [ ] Create indexes on all foreign key columns
31. [ ] Create indexes on recipe name and ingredients for search
32. [ ] Create indexes on user email and username for auth
33. [ ] Create indexes on classification, source, meal, course, preparation slugs
34. [ ] Generate initial migration file using `drizzle-kit generate`
35. [ ] Run migration on local database
36. [ ] Verify all tables created with correct structure
37. [ ] Create seeder script for meals taxonomy data
38. [ ] Create seeder script for courses taxonomy data
39. [ ] Create seeder script for preparations taxonomy data
40. [ ] Test foreign key constraints with sample data
41. [ ] Create database documentation file

### Acceptance Criteria

- [ ] All schema files created in proper directory structure
- [ ] All tables defined with correct field types
- [ ] Primary keys defined on all tables
- [ ] Foreign keys properly configured with correct references
- [ ] ON DELETE and ON UPDATE cascades configured appropriately
- [ ] Indexes created on:
  - All foreign key columns
  - recipe name and ingredients (for search)
  - user email and username (for auth)
  - classification, source, meal, course, preparation slugs
- [ ] Initial migration file generated
- [ ] Migration successfully runs on clean database
- [ ] All tables created with correct structure
- [ ] Can insert test data into all tables
- [ ] Foreign key constraints work correctly
- [ ] Seeder scripts created for taxonomy tables (meals, courses, preparations)

### Key Features

- `user_id` on recipes and cookbooks for ownership
- `is_public` flags for privacy control
- `marked` field for user favorites
- Image support built-in
- Proper indexes on foreign keys and search fields

### Deliverables

- Complete Drizzle schema files
- Database migration scripts
- Seeder scripts for taxonomy data
- Database documentation

---

## 1.3 Authentication System

### Implementation: Better-Auth

**Auth Routes:**
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/logout` - Logout handler
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset form

### Tasks

42. [ ] Install Better-Auth package
    ```bash
    npm install better-auth
    ```
43. [ ] Create auth configuration file with database and session settings
44. [ ] Set up environment variables for auth secrets
45. [ ] Run migration to create auth-related database tables (sessions, verification_tokens)
46. [ ] Create auth API route handlers (login, register, logout)
47. [ ] Create auth context provider component
48. [ ] Create `useAuth()` hook for auth state and methods
49. [ ] Create `useUser()` hook for current user data
50. [ ] Set up session storage configuration (httpOnly cookies)
51. [ ] Implement session expiration and refresh logic
52. [ ] Create registration page UI (`/auth/register`)
53. [ ] Create registration form with validation (email, username, password)
54. [ ] Implement username uniqueness check
55. [ ] Implement email validation
56. [ ] Implement password strength requirements
57. [ ] Add auto-login after successful registration
58. [ ] Add error handling and display for registration flow
59. [ ] Create login page UI (`/auth/login`)
60. [ ] Create login form with email/username and password fields
61. [ ] Implement "Remember me" checkbox functionality
62. [ ] Add session persistence for "Remember me" feature
63. [ ] Add error handling for invalid credentials
64. [ ] Implement successful login redirect logic
65. [ ] Create logout handler route
66. [ ] Implement session destruction on logout
67. [ ] Create forgot password page UI (`/auth/forgot-password`)
68. [ ] Implement password reset token generation
69. [ ] Implement reset email sending functionality
70. [ ] Set up token expiration (1 hour)
71. [ ] Create reset password page UI (`/auth/reset-password`)
72. [ ] Implement password reset with valid token
73. [ ] Implement token invalidation after successful reset
74. [ ] Create `ProtectedRoute` wrapper component
75. [ ] Implement redirect to login for unauthenticated users
76. [ ] Implement return URL preservation for post-login redirect
77. [ ] Add loading state while checking auth status
78. [ ] Create user profile page (`/profile` or `/user/[username]`)
79. [ ] Display user information on profile page
80. [ ] Protect profile page from unauthenticated access
81. [ ] Test complete registration flow manually
82. [ ] Test login flow with email and password
83. [ ] Test login flow with username and password
84. [ ] Test "Remember me" functionality
85. [ ] Test logout functionality
86. [ ] Test password reset complete flow
87. [ ] Test protected route access when authenticated
88. [ ] Test protected route redirect when not authenticated

### Acceptance Criteria

**Installation & Configuration:**
- [ ] Better-Auth package installed
- [ ] Auth configuration file created with all required settings
- [ ] Database tables for auth created (sessions, verification_tokens, etc.)
- [ ] OAuth providers configured (if implementing)
- [ ] Environment variables set for auth secrets

**Registration Flow:**
- [ ] Registration page accessible at `/auth/register`
- [ ] Registration form validates all fields
- [ ] Email validation works correctly
- [ ] Password meets security requirements (min length, complexity)
- [ ] Username uniqueness enforced
- [ ] User created in database upon successful registration
- [ ] User automatically logged in after registration
- [ ] Email verification sent (if implementing)
- [ ] Error messages displayed for validation failures

**Login Flow:**
- [ ] Login page accessible at `/auth/login`
- [ ] Can login with email and password
- [ ] Can login with username and password
- [ ] "Remember me" checkbox persists session correctly
- [ ] Invalid credentials show appropriate error
- [ ] Account locked after N failed attempts (optional)
- [ ] Successful login redirects to appropriate page
- [ ] Session created and stored securely

**Password Reset:**
- [ ] Forgot password page accessible at `/auth/forgot-password`
- [ ] Reset email sent to valid email addresses
- [ ] Reset token generated and stored securely
- [ ] Reset token expires after set time (e.g., 1 hour)
- [ ] Reset password page accessible at `/auth/reset-password`
- [ ] Can set new password with valid token
- [ ] Old password no longer works after reset
- [ ] Token invalidated after successful reset

**Session Management:**
- [ ] Sessions stored securely (httpOnly cookies)
- [ ] Sessions expire after inactivity period
- [ ] Logout properly destroys session
- [ ] Session data accessible server-side
- [ ] Session persists across page reloads
- [ ] "Remember me" extends session duration

**Protected Routes:**
- [ ] `ProtectedRoute` component created
- [ ] Unauthenticated users redirected to login
- [ ] Return URL preserved for redirect after login
- [ ] Loading state shown while checking auth
- [ ] Auth context accessible in all components

**Auth Hooks:**
- [ ] `useAuth()` hook returns auth state and methods
- [ ] `useUser()` hook returns current user data
- [ ] Auth state updates reactively
- [ ] Can call login, logout, register from hooks
- [ ] Loading and error states properly managed

**User Profile:**
- [ ] Profile page accessible for logged-in users
- [ ] Displays user information correctly
- [ ] Can view own profile
- [ ] Profile protected from unauthenticated access

### Protected Features

- Create/edit/delete own recipes
- Create/edit/delete own cookbooks
- Mark recipes as favorites
- Follow cookbooks

### Public Features

- View public recipes
- View public cookbooks
- Search all public content
- Browse categories

### Deliverables

- Working authentication system
- Protected routes implementation
- User session management
- Auth UI components (login, register forms)
- Auth context and hooks
- Session storage configuration
- Password reset functionality

---

## 1.4 API Layer with tRPC

### Router Structure

```
src/server/trpc/
  ├── trpc.ts (base setup)
  ├── context.ts (session + db)
  ├── routers/
  │   ├── recipes.ts
  │   ├── cookbooks.ts
  │   ├── classifications.ts
  │   ├── sources.ts
  │   ├── meals.ts
  │   ├── courses.ts
  │   ├── preparations.ts
  │   └── users.ts
  └── root.ts (app router)
```

### Tasks

89. [ ] Install tRPC packages
    ```bash
    npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query
    ```
90. [ ] Create directory structure `src/server/trpc/`
91. [ ] Create base tRPC setup file (`trpc.ts`)
92. [ ] Create tRPC context file (`context.ts`) with database connection
93. [ ] Add user session to tRPC context
94. [ ] Add proper TypeScript types to context
95. [ ] Create public procedure (no auth required)
96. [ ] Create protected procedure (requires authentication)
97. [ ] Create authentication middleware
98. [ ] Create authorization middleware (ownership checks)
99. [ ] Integrate Zod validation into procedures
100. [ ] Create error handling middleware
101. [ ] Create router directory structure `src/server/trpc/routers/`
102. [ ] Create empty `recipes.ts` router file
103. [ ] Create empty `cookbooks.ts` router file
104. [ ] Create empty `classifications.ts` router file
105. [ ] Create empty `sources.ts` router file
106. [ ] Create empty `meals.ts` router file
107. [ ] Create empty `courses.ts` router file
108. [ ] Create empty `preparations.ts` router file
109. [ ] Create empty `users.ts` router file
110. [ ] Create root router (`root.ts`) combining all routers
111. [ ] Export app router for client use
112. [ ] Set up React Query provider in app root
113. [ ] Create tRPC client configuration
114. [ ] Create tRPC client hooks for React components
115. [ ] Add type safety configuration (end-to-end types)
116. [ ] Test calling public procedure from client
117. [ ] Test calling protected procedure when authenticated
118. [ ] Test protected procedure rejection when not authenticated
119. [ ] Test Zod validation errors return correctly
120. [ ] Test React Query caching with tRPC
121. [ ] Test loading and error states in components
122. [ ] Test optimistic updates functionality
123. [ ] Verify type inference works on client side
124. [ ] Create documentation for adding new procedures

### Core Procedures

- Authentication-aware procedures
- Authorization checks (ownership)
- Input validation with Zod
- Error handling
- Rate limiting for public endpoints

### Acceptance Criteria

**Installation & Setup:**
- [ ] All tRPC packages installed
- [ ] tRPC server configured correctly
- [ ] tRPC client configured correctly
- [ ] React Query provider set up in app

**Context Setup:**
- [ ] tRPC context includes database connection
- [ ] tRPC context includes user session
- [ ] Context properly typed
- [ ] Context accessible in all procedures
- [ ] User authentication status available in context

**Router Structure:**
- [ ] Base tRPC setup file created (`trpc.ts`)
- [ ] Context file created (`context.ts`)
- [ ] Router directory structure created
- [ ] Empty router files created for all domains
- [ ] Root router created combining all routers
- [ ] Router properly exported for client use

**Procedures:**
- [ ] Public procedure created (no auth required)
- [ ] Protected procedure created (requires auth)
- [ ] Middleware for authentication works correctly
- [ ] Middleware for authorization works correctly
- [ ] Zod validation integrated into procedures
- [ ] Error handling middleware implemented
- [ ] Rate limiting middleware implemented (optional)

**Client Integration:**
- [ ] tRPC client hooks created
- [ ] Can call tRPC procedures from React components
- [ ] Loading states work correctly
- [ ] Error states work correctly
- [ ] React Query caching works
- [ ] Optimistic updates possible
- [ ] Type safety end-to-end (client to server)

**Testing:**
- [ ] Can successfully call public procedures
- [ ] Can successfully call protected procedures when authenticated
- [ ] Protected procedures reject unauthenticated requests
- [ ] Validation errors return correctly
- [ ] Server errors handled gracefully
- [ ] Types are correctly inferred on client

### Deliverables

- Complete tRPC setup
- Router structure with all domain routers
- Type-safe API client
- React hooks for queries/mutations
- Authentication and authorization middleware
- Error handling system
- Documentation for adding new procedures

---

## Testing Checklist

### Integration Tests

- [ ] Database connection successful
- [ ] Can create tables via migration
- [ ] Can seed taxonomy data
- [ ] User registration creates user in database
- [ ] User login creates session
- [ ] Session persists across requests
- [ ] Logout destroys session
- [ ] Password reset flow complete
- [ ] Protected routes block unauthenticated users
- [ ] tRPC procedures accessible from client
- [ ] Type safety works end-to-end

### Manual Testing

- [ ] Register new user account
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Logout successfully
- [ ] Reset password flow
- [ ] Access protected page when logged in
- [ ] Redirected to login when not authenticated
- [ ] Session persists after page reload
- [ ] "Remember me" works correctly

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No critical bugs
- [ ] Ready for next milestone

---

## Dependencies

**None** - This is the foundation milestone

---

## Blockers & Risks

**Potential Blockers:**
- Database hosting setup delays
- Authentication library learning curve
- tRPC configuration complexity

**Mitigation:**
- Have alternative database hosts ready
- Review Better-Auth documentation thoroughly
- Follow tRPC setup guides closely

---

## Notes

- Consider using Neon or Supabase for PostgreSQL hosting (both have generous free tiers)
- Better-Auth is recommended but Lucia is a good alternative
- Keep auth simple initially - OAuth can be added later
- Document all environment variables clearly
- Test auth flows thoroughly before proceeding
