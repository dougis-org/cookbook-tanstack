# Milestone 09: Data Migration

**Duration**: 1 week
**Status**: Not Started
**Dependencies**: All previous milestones

## Overview

Migrate all existing data from the Laravel MySQL/PostgreSQL database to the new TanStack Start application database with validation and verification.

---

## 9.1 Laravel Data Export

### Tasks

- [ ] Analyze Laravel database schema
- [ ] Document all tables and relationships
- [ ] Create Laravel export command
- [ ] Export users table
- [ ] Export recipes table
- [ ] Export classifications table
- [ ] Export sources table
- [ ] Export meals, courses, preparations tables
- [ ] Export cookbooks table
- [ ] Export cookbook_recipes junction table
- [ ] Export all junction tables
- [ ] Export images/files
- [ ] Verify export completeness
- [ ] Create export validation script

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

- [ ] Create transformation scripts
- [ ] Map Laravel schema to new schema
- [ ] Transform user data
- [ ] Transform recipe data
- [ ] Transform taxonomy data
- [ ] Transform cookbook data
- [ ] Transform junction data
- [ ] Handle password hashes (bcrypt compatibility)
- [ ] Handle timestamps (format conversion)
- [ ] Clean/sanitize data
- [ ] Validate transformed data
- [ ] Create data mapping documentation

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

- [ ] Create import scripts
- [ ] Import users first
- [ ] Import taxonomy tables (classifications, sources, meals, courses, preparations)
- [ ] Import recipes
- [ ] Import cookbooks
- [ ] Import junction tables (recipe relationships)
- [ ] Import cookbook recipes
- [ ] Handle import errors
- [ ] Verify import success
- [ ] Generate import report

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

- [ ] Inventory all recipe images
- [ ] Upload images to Cloudinary/S3
- [ ] Maintain folder structure
- [ ] Update image URLs in database
- [ ] Generate thumbnails
- [ ] Verify all images accessible
- [ ] Update image references in recipes
- [ ] Remove broken image links
- [ ] Document missing images

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

- [ ] Create verification test suite
- [ ] Verify user count matches
- [ ] Verify recipe count matches
- [ ] Verify cookbook count matches
- [ ] Test user authentication
- [ ] Test recipe queries
- [ ] Test search functionality
- [ ] Test filtering
- [ ] Test relationships (meals, courses, etc.)
- [ ] Test cookbook functionality
- [ ] Test image loading
- [ ] Perform sample user workflows
- [ ] Document discrepancies
- [ ] Fix critical issues
- [ ] Generate final verification report

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
