# Milestone 01: Foundation & Infrastructure

**Duration**: 2 weeks
**Status**: Complete (Merged 2026-03-15)
**Dependencies**: None

## Overview

Establish the technical foundation for the CookBook-TanStack application including database setup, authentication system, and API layer. This milestone is critical as all subsequent phases depend on this infrastructure.

---

## 1.1 Project Setup & Configuration

### Tasks

1. [ ] Install MongoDB and Mongoose packages
   ```bash
  npm install mongoose mongodb
  npm install -D mongodb-memory-server
   ```
2. [ ] Create `.env.example` file with all required database variables documented
3. [ ] Configure environment variables for local environment (`.env.local`)
4. [ ] Set up MongoDB connection configuration (`MONGODB_URI`)
5. [ ] Create local MongoDB instance
6. [ ] Set up database connection and test connectivity
7. [ ] Configure environment variables for staging environment
8. [ ] Create staging MongoDB instance
9. [ ] Configure environment variables for production environment
10. [ ] Create production MongoDB instance
11. [ ] Verify local connection, seed, and test database workflows work correctly

### Acceptance Criteria

- [ ] MongoDB and Mongoose installed and configured
- [ ] Database connection established and tested
- [ ] Environment variables properly configured
- [ ] `.env.example` file created with all required variables documented
- [ ] MongoDB connection settings correctly configured
- [ ] Can successfully connect, seed, and run tests against MongoDB
- [ ] Local, staging, and production databases created
- [ ] Database credentials secured and not committed to version control

### Deliverables

- Working database connection
- Environment configuration files
- MongoDB connection configuration
- Database instances (local, staging, production)

---

## 1.2 Database Schema Design

### Schema Collections

**Core Collections:**
```typescript
- users (_id, email, username, passwordHash, name, avatarUrl, createdAt, updatedAt)
- recipes (_id, userId, name, ingredients, instructions, notes, servings,
           sourceId, classificationId, dateAdded, calories, fat, cholesterol,
           sodium, protein, marked, imageUrl, isPublic, mealIds, courseIds,
           preparationIds, createdAt, updatedAt)
- classifications (_id, name, description, slug, createdAt, updatedAt)
- sources (_id, name, url, createdAt, updatedAt)
- cookbooks (_id, userId, name, description, isPublic, imageUrl,
             recipes: [{ recipeId, orderIndex }], createdAt, updatedAt)
```

**Taxonomy Collections:**
```typescript
- meals (_id, name, description, slug, createdAt, updatedAt)
- courses (_id, name, description, slug, createdAt, updatedAt)
- preparations (_id, name, description, slug, createdAt, updatedAt)
```

**Embedded Relationships:**
```typescript
- recipes.mealIds[]
- recipes.courseIds[]
- recipes.preparationIds[]
- cookbooks.recipes[] = [{ recipeId, orderIndex }]
```

**Additional Collections:**
```typescript
- sessions/accounts/verifications (Better-Auth)
- recipeLikes (_id, userId, recipeId, createdAt)
- future social collections as needed
```

### Tasks

12. [ ] Create directory structure `src/db/models/`
13. [ ] Define `User` model with all fields and types
14. [ ] Define `Recipe` model with all fields and types
15. [ ] Define `Classification` model with all fields and types
16. [ ] Define `Source` model with all fields and types
17. [ ] Define `Cookbook` model with all fields and types
18. [ ] Define `Meal` taxonomy model
19. [ ] Define `Course` taxonomy model
20. [ ] Define `Preparation` taxonomy model
21. [ ] Model recipe taxonomy relationships with `mealIds`, `courseIds`, and `preparationIds`
22. [ ] Model cookbook recipe ordering with embedded `recipes[{ recipeId, orderIndex }]`
23. [ ] Define Better-Auth backing collections/models as required
24. [ ] Define `RecipeLike` model
25. [ ] Configure schema validation rules and defaults
26. [ ] Configure timestamps on all primary models
27. [ ] Set up ownership and public/private fields on recipes and cookbooks
28. [ ] Create indexes on referenced ObjectId fields
29. [ ] Create indexes on recipe name and other search fields
30. [ ] Create indexes on user email and username for auth
31. [ ] Create indexes on classification, source, meal, course, preparation slugs
32. [ ] Verify model registration and connection initialization
33. [ ] Verify collections created with correct structure
34. [ ] Create seeder script for meals taxonomy data
35. [ ] Create seeder script for courses taxonomy data
36. [ ] Create seeder script for preparations taxonomy data
37. [ ] Test reference population with sample data
38. [ ] Test embedded cookbook recipe ordering with sample data
39. [ ] Test schema validation with sample data
40. [ ] Create database documentation file
41. [ ] Document local/staging/production MongoDB setup

### Acceptance Criteria

- [ ] All schema files created in proper directory structure
- [ ] All models defined with correct field types
- [ ] All primary collections created with expected structure
- [ ] Referenced ObjectId fields configured correctly
- [ ] Embedded relationships configured appropriately
- [ ] Indexes created on:
  - Referenced ObjectId fields
  - recipe name and ingredients (for search)
  - user email and username (for auth)
  - classification, source, meal, course, preparation slugs
- [ ] Collections initialize correctly on clean database
- [ ] Can insert test data into all primary collections
- [ ] Reference population and embedded ordering work correctly
- [ ] Seeder scripts created for taxonomy tables (meals, courses, preparations)

### Key Features

- `userId` on recipes and cookbooks for ownership
- `isPublic` flags for privacy control
- `marked` field for user favorites
- Image support built-in
- Embedded taxonomy arrays and cookbook recipe ordering
- Proper indexes on referenced fields and search fields

### Deliverables

- Complete Mongoose model files
- Database connection/model bootstrap
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
45. [ ] Create auth-related MongoDB collections/documents (sessions, accounts, verifications)
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

- Consider using MongoDB Atlas for shared staging/production hosting
- Better-Auth is recommended but Lucia is a good alternative
- Keep auth simple initially - OAuth can be added later
- Document all environment variables clearly
- Test auth flows thoroughly before proceeding
