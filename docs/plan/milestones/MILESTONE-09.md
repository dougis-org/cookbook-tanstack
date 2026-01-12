# Milestone 09: Data Migration

**Duration**: 1 week
**Status**: Not Started
**Dependencies**: All previous milestones

## Overview

Migrate all existing data from the Laravel MySQL/PostgreSQL database to the new TanStack Start application database with validation and verification.

---

## 9.1 Laravel Data Export

### Tasks

1. [ ] Analyze Laravel database schema structure
2. [ ] Document all tables with field names and types
3. [ ] Document all table relationships and foreign keys
4. [ ] Create Laravel Artisan export command
5. [ ] Export users table to JSON
6. [ ] Export recipes table to JSON
7. [ ] Export classifications table to JSON
8. [ ] Export sources table to JSON
9. [ ] Export meals table to JSON
10. [ ] Export courses table to JSON
11. [ ] Export preparations table to JSON
12. [ ] Export cookbooks table to JSON
13. [ ] Export recipe_meals junction table to JSON
14. [ ] Export recipe_courses junction table to JSON
15. [ ] Export recipe_preparations junction table to JSON
16. [ ] Export cookbook_recipes junction table to JSON
17. [ ] Export to CSV as backup
18. [ ] Export all recipe images with metadata
19. [ ] Organize images by recipe ID
20. [ ] Create export validation script
21. [ ] Verify export row counts match database
22. [ ] Verify foreign key references intact
23. [ ] Verify date formats consistent
24. [ ] Verify text encoding (UTF-8)
25. [ ] Document any export issues

### Acceptance Criteria

**Export Scripts:**
- [ ] Artisan command created
- [ ] Exports all tables to JSON
- [ ] Exports to CSV as backup
- [ ] Includes timestamps
- [ ] Handles large datasets (pagination)
- [ ] Error handling implemented
- [ ] Progress indicator shown

**Data Validation:**
- [ ] Row counts match database
- [ ] All relationships preserved
- [ ] No data loss
- [ ] Foreign key references intact
- [ ] Date formats consistent
- [ ] Text encoding correct (UTF-8)

**Exported Data:**
- [ ] users.json (email, name, password hash)
- [ ] recipes.json (all fields)
- [ ] classifications.json
- [ ] sources.json
- [ ] meals.json
- [ ] courses.json
- [ ] preparations.json
- [ ] cookbooks.json
- [ ] recipe_meals.json (junction)
- [ ] recipe_courses.json (junction)
- [ ] recipe_preparations.json (junction)
- [ ] cookbook_recipes.json (junction)

**Images:**
- [ ] All recipe images exported
- [ ] Original filenames preserved
- [ ] Images organized by recipe ID
- [ ] Image metadata exported

### Deliverables

- Laravel export command
- Exported JSON files
- Export validation script
- Exported images

---

## 9.2 Data Transformation

### Tasks

26. [ ] Create transformation scripts
27. [ ] Create field mapping document (Laravel → New DB)
28. [ ] Transform user data (email, name, password)
29. [ ] Handle password hash compatibility
30. [ ] Transform user created_at timestamps
31. [ ] Transform recipe data (all fields)
32. [ ] Format ingredients properly for new schema
33. [ ] Format instructions properly for new schema
34. [ ] Transform recipe timestamps
35. [ ] Transform nutritional data
36. [ ] Transform classifications data
37. [ ] Transform sources data
38. [ ] Transform meals taxonomy data
39. [ ] Transform courses taxonomy data
40. [ ] Transform preparations taxonomy data
41. [ ] Transform cookbook data
42. [ ] Transform recipe_meals junction data
43. [ ] Transform recipe_courses junction data
44. [ ] Transform recipe_preparations junction data
45. [ ] Transform cookbook_recipes junction with order
46. [ ] Clean/sanitize text data (remove invalid chars)
47. [ ] Handle null values appropriately
48. [ ] Validate transformed data structure
49. [ ] Check for orphaned records
50. [ ] Check for duplicate entries
51. [ ] Verify all foreign keys valid
52. [ ] Create transformation validation report

### Acceptance Criteria

**Field Mapping:**
- [ ] All Laravel fields mapped to new schema
- [ ] Missing fields handled (defaults/nulls)
- [ ] Extra fields documented
- [ ] Data types compatible
- [ ] Constraints satisfied

**User Data:**
- [ ] Email addresses preserved
- [ ] Names mapped correctly
- [ ] Password hashes converted (if needed)
- [ ] Created/updated dates preserved
- [ ] All users accounted for

**Recipe Data:**
- [ ] All recipe fields mapped
- [ ] Ingredients formatted correctly
- [ ] Instructions formatted correctly
- [ ] Nutritional info preserved
- [ ] Servings converted
- [ ] Notes/marked field preserved
- [ ] Source relationships maintained
- [ ] Classification relationships maintained

**Taxonomy Data:**
- [ ] Meals mapped and linked
- [ ] Courses mapped and linked
- [ ] Preparations mapped and linked
- [ ] New taxonomy items created if needed

**Cookbooks:**
- [ ] All cookbooks preserved
- [ ] Ownership maintained
- [ ] Recipe order preserved
- [ ] Descriptions preserved

**Validation:**
- [ ] No orphaned records
- [ ] All foreign keys valid
- [ ] No duplicate entries
- [ ] Data integrity verified

### Deliverables

- Transformation scripts
- Transformed JSON files
- Data mapping documentation
- Validation reports

---

## 9.3 Database Import

### Tasks

53. [ ] Create import scripts with error handling
54. [ ] Back up new database before import
55. [ ] Import users table first
56. [ ] Verify user import count
57. [ ] Import classifications table
58. [ ] Import sources table
59. [ ] Import meals table
60. [ ] Import courses table
61. [ ] Import preparations table
62. [ ] Import recipes table
63. [ ] Verify recipe import count
64. [ ] Import cookbooks table
65. [ ] Verify cookbook import count
66. [ ] Import recipe_meals junction table
67. [ ] Import recipe_courses junction table
68. [ ] Import recipe_preparations junction table
69. [ ] Import cookbook_recipes junction table with order
70. [ ] Handle duplicate detection
71. [ ] Handle foreign key validation errors
72. [ ] Handle constraint violations
73. [ ] Log failed imports
74. [ ] Implement rollback on critical errors
75. [ ] Verify row counts match export
76. [ ] Verify all relationships intact
77. [ ] Run sample queries to test data
78. [ ] Generate import summary report

### Acceptance Criteria

**Import Order:**
- [ ] Users imported first (dependencies)
- [ ] Taxonomy tables next
- [ ] Recipes next
- [ ] Cookbooks next
- [ ] Junction tables last

**Error Handling:**
- [ ] Duplicate detection
- [ ] Foreign key validation
- [ ] Constraint violations handled
- [ ] Failed imports logged
- [ ] Rollback on critical errors

**Verification:**
- [ ] Row counts match export
- [ ] All relationships intact
- [ ] No missing data
- [ ] Queries return expected results
- [ ] Sample spot checks pass

**Import Scripts:**
- [ ] Idempotent (can run multiple times)
- [ ] Progress indicators
- [ ] Detailed logging
- [ ] Summary report generated
- [ ] Performance optimized (batch inserts)

### Deliverables

- Import scripts
- Import logs
- Import summary report
- Error report (if any)

---

## 9.4 Image Migration

### Tasks

79. [ ] Create image inventory script
80. [ ] List all recipe images from Laravel storage
81. [ ] Document original file paths
82. [ ] Create image upload script
83. [ ] Upload images to Cloudinary/S3 in batches
84. [ ] Organize by recipe ID or structure
85. [ ] Preserve original filenames or create mapping
86. [ ] Generate thumbnails automatically
87. [ ] Create recipe_images records in database
88. [ ] Set primary image for each recipe
89. [ ] Set image order correctly
90. [ ] Update image URLs in database
91. [ ] Verify all uploaded images accessible
92. [ ] Test image URLs (no 404s)
93. [ ] Verify thumbnails work
94. [ ] Remove broken image links from database
95. [ ] Document missing images list
96. [ ] Create image migration statistics report

### Acceptance Criteria

**Upload:**
- [ ] All images uploaded successfully
- [ ] Organized by recipe ID or similar
- [ ] Original filenames preserved (or mapped)
- [ ] Image metadata preserved
- [ ] Thumbnails generated automatically

**Database:**
- [ ] recipe_images table populated
- [ ] URLs point to cloud storage
- [ ] Primary image set correctly
- [ ] Image order preserved

**Verification:**
- [ ] All image URLs accessible
- [ ] No 404 errors
- [ ] Images display correctly
- [ ] Thumbnails work
- [ ] Full-size images load

**Documentation:**
- [ ] Missing images documented
- [ ] Broken links documented
- [ ] Migration statistics recorded

### Deliverables

- Uploaded images
- Updated database with image URLs
- Image migration report
- Missing images list

---

## 9.5 Post-Migration Verification

### Tasks

97. [ ] Create automated verification test suite
98. [ ] Verify user count (Laravel = New DB)
99. [ ] Verify recipe count (Laravel = New DB)
100. [ ] Verify cookbook count (Laravel = New DB)
101. [ ] Verify classification count matches
102. [ ] Verify source count matches
103. [ ] Verify taxonomy counts match
104. [ ] Verify junction record counts match
105. [ ] Test user authentication with migrated accounts
106. [ ] Test recipe queries return expected results
107. [ ] Test search functionality works correctly
108. [ ] Test filter functionality works correctly
109. [ ] Test meal relationships intact
110. [ ] Test course relationships intact
111. [ ] Test preparation relationships intact
112. [ ] Test cookbook functionality works
113. [ ] Test cookbook recipe order preserved
114. [ ] Test image loading and display
115. [ ] View 10 random recipes (verify all render)
116. [ ] Open 5 random cookbooks (verify all work)
117. [ ] Search for common terms (verify results)
118. [ ] Filter by various criteria (verify works)
119. [ ] Check 10 random user profiles
120. [ ] Test queries performant (< 500ms)
121. [ ] Check for N+1 query issues
122. [ ] Monitor for memory leaks
123. [ ] Document all discrepancies found
124. [ ] Fix critical issues immediately
125. [ ] Track low-priority issues for later
126. [ ] Generate final verification report
127. [ ] Obtain sign-off from stakeholders

### Acceptance Criteria

**Data Verification:**
- [ ] User count: Laravel = New DB
- [ ] Recipe count: Laravel = New DB
- [ ] Cookbook count: Laravel = New DB
- [ ] Classification count matches
- [ ] Source count matches
- [ ] Taxonomy counts match
- [ ] Junction record counts match

**Functionality Testing:**
- [ ] Users can log in
- [ ] Recipes display correctly
- [ ] Search returns results
- [ ] Filters work
- [ ] Cookbooks load correctly
- [ ] Images display
- [ ] Relationships intact

**Sample Workflows:**
- [ ] View 10 random recipes (all render)
- [ ] Open 5 cookbooks (all work)
- [ ] Search for common terms (results accurate)
- [ ] Filter by various criteria (works)
- [ ] Check 10 random users (profiles work)

**Performance:**
- [ ] Queries performant (< 500ms)
- [ ] No N+1 query issues
- [ ] Images load quickly
- [ ] No memory leaks

**Issues:**
- [ ] All critical issues documented
- [ ] High-priority issues fixed
- [ ] Low-priority issues tracked for later
- [ ] No blockers for launch

### Deliverables

- Verification test suite
- Verification report
- Issue log
- Sign-off documentation

---

## Testing Checklist

### Data Integrity

- [ ] Export captures all records
- [ ] Transformation preserves data
- [ ] Import creates all records
- [ ] No data loss
- [ ] Relationships intact

### Functionality

- [ ] Users can authenticate
- [ ] Recipes accessible
- [ ] Search works
- [ ] Filters work
- [ ] Cookbooks functional
- [ ] Images load

### Performance

- [ ] Import completes in reasonable time
- [ ] Queries performant
- [ ] No bottlenecks identified

### Manual Verification

- [ ] Spot check 20+ recipes
- [ ] Check 5+ cookbooks
- [ ] Verify 10+ users
- [ ] Test end-to-end workflows

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Data verification complete
- [ ] Documentation updated
- [ ] Sign-off obtained
- [ ] No critical issues
- [ ] Ready for testing milestone

---

## Dependencies

- All previous milestones must be complete

---

## Blockers & Risks

**Potential Blockers:**
- Large dataset size
- Data inconsistencies in Laravel DB
- Schema mismatches
- Image migration failures
- Import errors

**Mitigation:**
- Test with sample data first
- Clean data before export
- Implement robust error handling
- Backup everything
- Plan for rollback scenarios
- Batch process large datasets
- Monitor import progress

---

## Notes

- **CRITICAL**: Backup Laravel database before export
- **CRITICAL**: Backup new database before import
- Run migration in staging environment first
- Test thoroughly before production migration
- Plan for downtime during production migration
- Consider running Laravel and new app in parallel initially
- Document all steps for repeatability
- Keep migration scripts for reference
- Plan for data cleanup post-migration
