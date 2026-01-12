# Milestone 07: User Features & Social

**Duration**: 1 week
**Status**: Not Started
**Dependencies**: Milestones 02 (Core Recipe Management), 04 (Cookbook Management)

## Overview

Implement user-facing social features including profiles, favorites, cookbook following, ratings, and user interactions.

---

## 7.1 User Profiles

### Tasks

- [ ] Create /users/[id] route
- [ ] Build user profile page
- [ ] Display user info (name, email, joined date)
- [ ] Show user's recipes
- [ ] Show user's cookbooks
- [ ] Add profile editing for own profile
- [ ] Build profile edit form
- [ ] Implement avatar upload
- [ ] Add bio/description field
- [ ] Implement privacy settings (optional)

### Acceptance Criteria

**Profile Display:**
- [ ] Shows username and avatar
- [ ] Shows bio/description
- [ ] Shows joined date
- [ ] Shows recipe count
- [ ] Shows cookbook count
- [ ] Lists user's public recipes
- [ ] Lists user's public cookbooks
- [ ] Responsive design

**Profile Editing:**
- [ ] Can edit own profile only
- [ ] Can update display name
- [ ] Can update bio
- [ ] Can upload avatar
- [ ] Can change email
- [ ] Can change password
- [ ] Validation works
- [ ] Changes save correctly

**Privacy:**
- [ ] Other users can view public profile
- [ ] Own profile shows edit button
- [ ] Private recipes hidden (optional)
- [ ] Privacy settings work (optional)

### Deliverables

- User profile page
- Profile edit form
- Avatar upload

---

## 7.2 Favorites System

### Tasks

- [ ] Add favorites table/field
- [ ] Create favorites tRPC mutations
- [ ] Add "Favorite" button to recipe cards
- [ ] Add "Favorite" button to recipe detail
- [ ] Build favorites list page
- [ ] Implement toggle favorite functionality
- [ ] Add favorite count to recipes
- [ ] Show favorite status in UI
- [ ] Add "My Favorites" to navigation

### Acceptance Criteria

**Database:**
- [ ] user_favorites table exists
- [ ] Stores userId and recipeId
- [ ] Unique constraint on pair
- [ ] Indexes for performance

**Functionality:**
- [ ] Can favorite a recipe
- [ ] Can unfavorite a recipe
- [ ] Favorite state persists
- [ ] Favorite count accurate
- [ ] Only authenticated users can favorite
- [ ] Cannot favorite own recipes (optional)

**UI:**
- [ ] Heart icon shows favorite state
- [ ] Filled heart = favorited
- [ ] Outline heart = not favorited
- [ ] Click toggles state
- [ ] Optimistic UI update
- [ ] Success feedback
- [ ] Favorite count displayed

**Favorites Page:**
- [ ] Shows all user's favorites
- [ ] Grid/list layout
- [ ] Can unfavorite from list
- [ ] Empty state if no favorites
- [ ] Filtering/sorting works

### Deliverables

- Favorites database table
- Favorite toggle functionality
- Favorites list page

---

## 7.3 Cookbook Following

### Tasks

- [ ] Add cookbook_follows table
- [ ] Create follow tRPC mutations
- [ ] Add "Follow" button to cookbooks
- [ ] Build following list page
- [ ] Implement toggle follow functionality
- [ ] Add follower count to cookbooks
- [ ] Show follow status in UI
- [ ] Add notifications (optional)

### Acceptance Criteria

**Database:**
- [ ] cookbook_follows table exists
- [ ] Stores userId and cookbookId
- [ ] Unique constraint on pair
- [ ] Indexes for performance

**Functionality:**
- [ ] Can follow a cookbook
- [ ] Can unfollow a cookbook
- [ ] Follow state persists
- [ ] Follower count accurate
- [ ] Only authenticated users can follow
- [ ] Cannot follow own cookbooks

**UI:**
- [ ] Follow button on cookbook cards
- [ ] Follow button on cookbook detail
- [ ] Button shows follow state
- [ ] Click toggles state
- [ ] Optimistic UI update
- [ ] Success feedback
- [ ] Follower count displayed

**Following Page:**
- [ ] Shows all followed cookbooks
- [ ] Card/grid layout
- [ ] Can unfollow from list
- [ ] Empty state if no follows
- [ ] Updates when new recipes added

### Deliverables

- Cookbook follows table
- Follow toggle functionality
- Following list page

---

## 7.4 Ratings & Reviews

### Tasks

- [ ] Add ratings table
- [ ] Add reviews table
- [ ] Create rating tRPC mutations
- [ ] Build star rating component
- [ ] Add rating to recipe cards
- [ ] Add rating to recipe detail
- [ ] Implement submit rating
- [ ] Build review form
- [ ] Implement submit review
- [ ] Display reviews list
- [ ] Add helpful votes (optional)
- [ ] Implement rating aggregation

### Acceptance Criteria

**Database:**
- [ ] ratings table (recipeId, userId, rating 1-5)
- [ ] reviews table (recipeId, userId, text, createdAt)
- [ ] Unique constraint userId + recipeId
- [ ] Indexes for performance

**Rating:**
- [ ] Can rate recipe 1-5 stars
- [ ] Can update own rating
- [ ] Average rating calculated
- [ ] Rating count displayed
- [ ] Only authenticated users can rate
- [ ] Cannot rate own recipes

**Reviews:**
- [ ] Can write review with rating
- [ ] Can edit own review
- [ ] Can delete own review
- [ ] Reviews displayed newest first
- [ ] Pagination for reviews
- [ ] Character limit (500-1000)
- [ ] Validation enforced

**Display:**
- [ ] Star rating component works
- [ ] Average stars shown on cards
- [ ] Rating count shown
- [ ] Reviews list formatted nicely
- [ ] User avatar in reviews
- [ ] Timestamp formatted
- [ ] Empty state if no reviews

### Deliverables

- Rating/review database tables
- Star rating component
- Review form and list
- Rating aggregation

---

## 7.5 Activity Feed

### Tasks

- [ ] Create activities table
- [ ] Implement activity tracking
- [ ] Build activity feed component
- [ ] Track recipe creation
- [ ] Track cookbook creation
- [ ] Track favorites
- [ ] Track follows
- [ ] Add feed to homepage (optional)
- [ ] Add feed to profile page
- [ ] Implement feed pagination

### Acceptance Criteria

**Tracking:**
- [ ] Recipe creation tracked
- [ ] Cookbook creation tracked
- [ ] Favorites tracked
- [ ] Follows tracked
- [ ] Reviews tracked
- [ ] Activities stored with timestamp

**Feed Display:**
- [ ] Shows recent activities
- [ ] Formatted as cards/items
- [ ] Shows user, action, target
- [ ] Links to relevant pages
- [ ] Timestamps relative (2h ago)
- [ ] Pagination works
- [ ] Responsive design

**Filtering:**
- [ ] Can filter by activity type
- [ ] Can filter by user
- [ ] Can filter by date range
- [ ] Default: last 30 days

### Deliverables

- Activities tracking system
- Activity feed component
- Feed on profile/homepage

---

## Testing Checklist

### Unit Tests

- [ ] Favorite toggle logic
- [ ] Follow toggle logic
- [ ] Rating validation
- [ ] Review validation
- [ ] Activity tracking

### Integration Tests

- [ ] Can view profile
- [ ] Can edit own profile
- [ ] Can favorite recipe
- [ ] Can unfavorite recipe
- [ ] Can follow cookbook
- [ ] Can submit rating
- [ ] Can write review
- [ ] Activity feed updates

### Manual Testing

- [ ] View other user's profile
- [ ] Edit own profile
- [ ] Upload avatar
- [ ] Favorite multiple recipes
- [ ] View favorites page
- [ ] Follow cookbooks
- [ ] Submit ratings
- [ ] Write reviews
- [ ] View activity feed

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No critical bugs
- [ ] Social features working
- [ ] Ready for next milestone

---

## Dependencies

- Milestone 02 (Core Recipe Management)
- Milestone 04 (Cookbook Management)

---

## Blockers & Risks

**Potential Blockers:**
- Activity feed performance with many users
- Review moderation needs
- Privacy concerns

**Mitigation:**
- Implement pagination and caching
- Add report/flag functionality
- Clear privacy policies
- Consider moderation tools

---

## Notes

- Keep social features optional initially
- Monitor for spam/abuse
- Consider rate limiting for reviews
- Activity feed can be simplified
- Privacy features important for user trust
