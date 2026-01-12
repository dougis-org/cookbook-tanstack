# Milestone 01: Foundation & Infrastructure

**Duration**: 2 weeks
**Status**: Not Started
**Dependencies**: None

## Overview

Establish the technical foundation for the CookBook-TanStack application including database setup, authentication system, and API layer. This milestone is critical as all subsequent phases depend on this infrastructure.

---

## 1.1 Project Setup & Configuration

### Tasks

- [ ] Install and configure Drizzle ORM
  ```bash
  npm install drizzle-orm postgres
  npm install -D drizzle-kit
  ```
- [ ] Set up database connection
- [ ] Configure environment variables (.env.local, .env.production)
- [ ] Set up Drizzle config file
- [ ] Create database instance (local + staging + production)

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

- [ ] Create Drizzle schema files in `src/db/schema/`
- [ ] Define all table schemas with proper types
- [ ] Set up foreign key relationships
- [ ] Create indexes for performance
- [ ] Write initial migration
- [ ] Run migration to create tables

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

- [ ] Install Better-Auth
  ```bash
  npm install better-auth
  ```
- [ ] Configure auth with email/password + OAuth (Google, GitHub optional)
- [ ] Create auth configuration file
- [ ] Set up auth routes and handlers
- [ ] Create auth middleware for protected routes
- [ ] Implement session management
- [ ] Create auth context/hooks for React
- [ ] Create user registration flow
- [ ] Create login flow with email/password
- [ ] Implement "Remember me" functionality
- [ ] Create password reset flow
- [ ] Set up session storage and management
- [ ] Create protected route wrapper components
- [ ] Build user profile page
- [ ] Create auth context hooks (`useAuth`, `useUser`)

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

- [ ] Install tRPC
  ```bash
  npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query
  ```
- [ ] Create tRPC router structure
- [ ] Set up tRPC context with user session
- [ ] Configure tRPC with Drizzle
- [ ] Create base queries and mutations
- [ ] Set up React Query integration
- [ ] Create tRPC client hooks

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
