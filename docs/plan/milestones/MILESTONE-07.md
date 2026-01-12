# Milestone 07: User Features & Social

**Duration**: 1 week
**Status**: Not Started
**Dependencies**: Milestones 02 (Core Recipe Management), 04 (Cookbook Management)

## Overview

Implement user-facing social features including profiles, favorites, cookbook following, ratings, and user interactions.

---

## 7.1 User Profiles

### Tasks

1. [ ] Create `/users/[id]` dynamic route
2. [ ] Create tRPC user profile query
3. [ ] Build UserProfile page component
4. [ ] Display user avatar (or default placeholder)
5. [ ] Display username
6. [ ] Display user bio/description
7. [ ] Display joined date (formatted)
8. [ ] Display recipe count
9. [ ] Display cookbook count
10. [ ] Query user's public recipes
11. [ ] Display user's recipes in grid
12. [ ] Query user's public cookbooks
13. [ ] Display user's cookbooks in grid
14. [ ] Add "Edit Profile" button (owner only)
15. [ ] Create profile edit modal/page
16. [ ] Create profile edit form
17. [ ] Add display name input field
18. [ ] Add bio textarea (max 500 chars)
19. [ ] Add email input field
20. [ ] Add password change fields (current, new, confirm)
21. [ ] Implement avatar upload component
22. [ ] Wire avatar upload to image storage
23. [ ] Add form validation
24. [ ] Wire form submit to tRPC update mutation
25. [ ] Show loading state during save
26. [ ] Display success message
27. [ ] Handle update errors
28. [ ] Add privacy settings (optional)
29. [ ] Add profile visibility toggle (optional)
30. [ ] Test profile display
31. [ ] Test profile editing
32. [ ] Test avatar upload
33. [ ] Make profile page responsive

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

34. [ ] Verify recipe_likes table exists (from Milestone 01)
35. [ ] Add indexes on recipe_likes for performance
36. [ ] Create `recipes.toggleFavorite` mutation (verify from Milestone 02)
37. [ ] Create `recipes.getFavorites` query
38. [ ] Add favorite count query to recipes
39. [ ] Create heart icon button component
40. [ ] Add favorite button to RecipeCard
41. [ ] Add favorite button to recipe detail page
42. [ ] Show filled heart if favorited
43. [ ] Show outline heart if not favorited
44. [ ] Wire button to toggle mutation
45. [ ] Add optimistic UI update
46. [ ] Show success feedback
47. [ ] Display favorite count on recipe
48. [ ] Create `/favorites` page route
49. [ ] Build favorites list page
50. [ ] Query user's favorited recipes
51. [ ] Display favorites in grid layout
52. [ ] Add unfavorite button on each card
53. [ ] Create empty state for no favorites
54. [ ] Add "My Favorites" link to navigation
55. [ ] Add filters/sorting to favorites page
56. [ ] Test favorite toggle functionality
57. [ ] Test favorites page
58. [ ] Make favorites page responsive

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

59. [ ] Verify cookbook_followers table exists (from Milestone 01)
60. [ ] Add unique constraint on (user_id, cookbook_id)
61. [ ] Add indexes for performance
62. [ ] Create `cookbooks.toggleFollow` mutation
63. [ ] Create `cookbooks.getFollowing` query
64. [ ] Add follower count query to cookbooks
65. [ ] Create follow button component
66. [ ] Add follow button to CookbookCard
67. [ ] Add follow button to cookbook detail page
68. [ ] Show "Following" state when followed
69. [ ] Show "Follow" state when not followed
70. [ ] Wire button to toggle mutation
71. [ ] Add optimistic UI update
72. [ ] Show success feedback
73. [ ] Display follower count on cookbook
74. [ ] Create `/following` page route
75. [ ] Build following list page
76. [ ] Query user's followed cookbooks
77. [ ] Display following in grid layout
78. [ ] Add unfollow button on each card
79. [ ] Create empty state for no follows
80. [ ] Add "Following" link to navigation
81. [ ] Add notifications for new recipes (optional)
82. [ ] Test follow toggle functionality
83. [ ] Test following page
84. [ ] Make following page responsive

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

85. [ ] Create recipe_ratings table schema
86. [ ] Add user_id, recipe_id, rating (1-5) fields
87. [ ] Add unique constraint on (user_id, recipe_id)
88. [ ] Create recipe_reviews table schema
89. [ ] Add user_id, recipe_id, text, created_at fields
90. [ ] Generate migration for ratings and reviews tables
91. [ ] Run migration on local database
92. [ ] Add indexes for performance
93. [ ] Create `recipes.rate` mutation
94. [ ] Create `recipes.updateRating` mutation
95. [ ] Create `recipes.addReview` mutation
96. [ ] Create `recipes.updateReview` mutation
97. [ ] Create `recipes.deleteReview` mutation
98. [ ] Create `recipes.getReviews` query with pagination
99. [ ] Create StarRating component
100. [ ] Add interactive star selection
101. [ ] Add hover preview for rating
102. [ ] Add rating display to RecipeCard
103. [ ] Show average stars on cards
104. [ ] Show rating count on cards
105. [ ] Add rating section to recipe detail page
106. [ ] Implement submit rating functionality
107. [ ] Create review form component
108. [ ] Add text area (500-1000 chars)
109. [ ] Add character counter
110. [ ] Add validation
111. [ ] Wire form to review mutation
112. [ ] Create reviews list component
113. [ ] Display reviews with user info
114. [ ] Show user avatar in reviews
115. [ ] Format timestamps (relative)
116. [ ] Add pagination to reviews list
117. [ ] Add edit button for own reviews
118. [ ] Add delete button for own reviews
119. [ ] Create empty state for no reviews
120. [ ] Add helpful votes feature (optional)
121. [ ] Test rating submission
122. [ ] Test review submission
123. [ ] Test rating aggregation
124. [ ] Make rating/review components responsive

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

125. [ ] Create activities table schema
126. [ ] Add user_id, activity_type, target_id, created_at fields
127. [ ] Generate migration for activities table
128. [ ] Run migration on local database
129. [ ] Add indexes for performance
130. [ ] Create activity tracking utility
131. [ ] Track recipe creation events
132. [ ] Track cookbook creation events
133. [ ] Track recipe favorite events
134. [ ] Track cookbook follow events
135. [ ] Track review submission events
136. [ ] Create `activities.getFeed` query with pagination
137. [ ] Add filters for activity type
138. [ ] Add filters for user
139. [ ] Add filters for date range
140. [ ] Create ActivityFeed component
141. [ ] Create ActivityCard component
142. [ ] Display user avatar in activity
143. [ ] Display activity type (created, favorited, etc.)
144. [ ] Display target (recipe/cookbook name)
145. [ ] Add links to relevant pages
146. [ ] Format timestamps (relative, "2h ago")
147. [ ] Add pagination to feed
148. [ ] Add feed to homepage (optional)
149. [ ] Add feed to user profile page
150. [ ] Create filter controls for feed
151. [ ] Add empty state for no activities
152. [ ] Test activity tracking
153. [ ] Test activity feed display
154. [ ] Test feed pagination
155. [ ] Make activity feed responsive

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
