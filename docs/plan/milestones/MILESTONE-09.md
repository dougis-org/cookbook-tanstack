# Milestone 09: Data Migration

**Duration**: 1 week
**Status**: Not Started
**Dependencies**: All previous milestones

## Overview

Migrate all existing data from the Laravel MySQL dump at `dump-recipe_laravel-202603111712.sql` into the new TanStack Start MongoDB database with validation and verification.

---

## 9.1 Laravel Data Extraction

### Extraction Tasks

1. [ ] Analyze Laravel SQL dump schema structure
1. [ ] Document all dumped tables with field names and types
1. [ ] Document all relationships and foreign keys from the dump
1. [ ] Create SQL dump extraction/parsing script
1. [ ] Extract users rows to JSON
1. [ ] Extract recipes rows to JSON
1. [ ] Extract classifications rows to JSON
1. [ ] Extract sources rows to JSON
1. [ ] Extract meals rows to JSON
1. [ ] Extract courses rows to JSON
1. [ ] Extract preparations rows to JSON
1. [ ] Extract cookbooks rows to JSON
1. [ ] Extract recipe_meals pivot rows to JSON
1. [ ] Extract recipe_courses pivot rows to JSON
1. [ ] Extract recipe_preparations pivot rows to JSON
1. [ ] Extract cookbook_recipes pivot rows to JSON
1. [ ] Preserve original SQL dump as the raw backup artifact
1. [ ] Extract all recipe image references and metadata
1. [ ] Organize extracted image metadata by legacy recipe ID
1. [ ] Create extraction validation script
1. [ ] Verify extracted row counts match the SQL dump
1. [ ] Verify foreign key references are intact in extracted data
1. [ ] Normalize legacy date formats and zero timestamps for downstream transforms
1. [ ] Verify text encoding (UTF-8/utf8mb3 to UTF-8)
1. [ ] Document any extraction issues

### Extraction Acceptance Criteria

#### Extraction Script Criteria

- [ ] SQL dump parser created
- [ ] Extracts all required tables to JSON
- [ ] Original SQL dump retained as backup
- [ ] Includes timestamps
- [ ] Handles large inserts efficiently
- [ ] Error handling implemented
- [ ] Progress indicator shown

#### Extraction Data Validation Criteria

- [ ] Row counts match SQL dump
- [ ] All relationships preserved
- [ ] No data loss
- [ ] Foreign key references intact
- [ ] Legacy timestamps normalized for downstream transforms
- [ ] Text encoding correct (UTF-8)

#### Extracted Data Artifacts

- [ ] users.json (email, name, password hash)
- [ ] recipes.json (all fields)
- [ ] classifications.json
- [ ] sources.json
- [ ] meals.json
- [ ] courses.json
- [ ] preparations.json
- [ ] cookbooks.json
- [ ] recipe_meals.json (pivot)
- [ ] recipe_courses.json (pivot)
- [ ] recipe_preparations.json (pivot)
- [ ] cookbook_recipes.json (pivot)

#### Extraction Image Criteria

- [ ] All recipe images exported
- [ ] Original filenames preserved
- [ ] Images organized by recipe ID
- [ ] Image metadata exported

### Extraction Deliverables

- SQL dump extraction script
- Extracted JSON files
- Extraction validation script
- Extracted image metadata

---

## 9.2 Data Transformation

### Transformation Tasks

1. [ ] Create transformation scripts
1. [ ] Create field mapping document (Laravel MySQL → MongoDB/Mongoose)
1. [ ] Transform user data (email, name, password)
1. [ ] Handle password hash compatibility
1. [ ] Transform user created_at timestamps
1. [ ] Transform recipe data (all fields)
1. [ ] Format ingredients properly for new schema
1. [ ] Format instructions properly for new schema
1. [ ] Transform recipe timestamps
1. [ ] Transform nutritional data
1. [ ] Transform classifications data
1. [ ] Transform sources data
1. [ ] Transform meals taxonomy data
1. [ ] Transform courses taxonomy data
1. [ ] Transform preparations taxonomy data
1. [ ] Transform cookbook data
1. [ ] Transform recipe_meals pivot data into recipe.mealIds arrays
1. [ ] Transform recipe_courses pivot data into recipe.courseIds arrays
1. [ ] Transform recipe_preparations pivot data into recipe.preparationIds arrays
1. [ ] Transform cookbook_recipes pivot data into embedded cookbook.recipes entries with orderIndex
1. [ ] Clean/sanitize text data and normalize invalid legacy timestamp values
1. [ ] Handle null values and MongoDB defaults appropriately
1. [ ] Validate transformed MongoDB document structure
1. [ ] Check for orphaned records after legacy ID to ObjectId mapping
1. [ ] Check for duplicate entries before import/upsert
1. [ ] Verify all transformed references resolve to valid ObjectIds
1. [ ] Create transformation validation report

### Transformation Acceptance Criteria

#### Transformation Field Mapping Criteria

- [ ] All Laravel fields mapped to MongoDB document schema
- [ ] Missing fields handled (defaults/nulls)
- [ ] Extra fields documented
- [ ] Data types compatible
- [ ] Constraints satisfied
- [ ] Legacy IDs mapped to stable import identifiers/ObjectIds

#### Transformation User Criteria

- [ ] Email addresses preserved
- [ ] Names mapped correctly
- [ ] Password hashes converted (if needed)
- [ ] Created/updated dates preserved
- [ ] All users accounted for

#### Transformation Recipe Criteria

- [ ] All recipe fields mapped
- [ ] Ingredients formatted correctly
- [ ] Instructions formatted correctly
- [ ] Nutritional info preserved
- [ ] Servings converted
- [ ] Notes/marked field preserved
- [ ] Source relationships maintained
- [ ] Classification relationships maintained
- [ ] mealIds/courseIds/preparationIds arrays populated correctly

#### Transformation Taxonomy Criteria

- [ ] Meals mapped and linked
- [ ] Courses mapped and linked
- [ ] Preparations mapped and linked
- [ ] New taxonomy items created if needed

#### Transformation Cookbook Criteria

- [ ] All cookbooks preserved
- [ ] Ownership maintained
- [ ] Recipe order preserved
- [ ] Descriptions preserved
- [ ] Embedded recipe entries created with orderIndex

#### Transformation Validation Criteria

- [ ] No orphaned records
- [ ] All transformed references valid
- [ ] No duplicate entries
- [ ] Data integrity verified

### Transformation Deliverables

- Transformation scripts
- Transformed JSON files
- Data mapping documentation
- Validation reports

---

## 9.3 MongoDB Import

### Import Tasks

1. [ ] Create MongoDB import scripts with error handling
1. [ ] Back up new MongoDB database before import
1. [ ] Import users collection first
1. [ ] Verify user import count
1. [ ] Import classifications collection
1. [ ] Import sources collection
1. [ ] Import meals collection
1. [ ] Import courses collection
1. [ ] Import preparations collection
1. [ ] Import recipes collection
1. [ ] Verify recipe import count
1. [ ] Import cookbooks collection
1. [ ] Verify cookbook import count
1. [ ] Materialize recipe.mealIds arrays from transformed pivot data
1. [ ] Materialize recipe.courseIds arrays from transformed pivot data
1. [ ] Materialize recipe.preparationIds arrays from transformed pivot data
1. [ ] Materialize cookbook.recipes embedded entries with orderIndex
1. [ ] Handle duplicate detection and idempotent upserts
1. [ ] Handle missing referenced document errors
1. [ ] Handle schema validation and cast errors
1. [ ] Log failed imports
1. [ ] Implement rollback on critical errors
1. [ ] Verify document counts match extracted data
1. [ ] Verify all embedded and referenced relationships intact
1. [ ] Run sample MongoDB/Mongoose queries to test data
1. [ ] Generate import summary report

### Import Acceptance Criteria

#### Import Order Criteria

- [ ] Users imported first (dependencies)
- [ ] Taxonomy collections next
- [ ] Recipes next
- [ ] Cookbooks next
- [ ] Embedded relationship data materialized last

#### Import Error Handling Criteria

- [ ] Duplicate detection
- [ ] Missing reference validation
- [ ] Schema validation handled
- [ ] Failed imports logged
- [ ] Rollback on critical errors

#### Import Verification Criteria

- [ ] Document counts match extracted data
- [ ] All relationships intact
- [ ] No missing data
- [ ] Queries return expected results
- [ ] Sample spot checks pass

#### Import Script Criteria

- [ ] Idempotent (can run multiple times)
- [ ] Progress indicators
- [ ] Detailed logging
- [ ] Summary report generated
- [ ] Performance optimized (batch writes/upserts)

### Import Deliverables

- Import scripts
- Import logs
- Import summary report
- Error report (if any)

---

## 9.4 Image Migration

### Image Migration Tasks

1. [ ] Create image inventory script
1. [ ] List all recipe images from Laravel storage
1. [ ] Document original file paths
1. [ ] Create image upload script
1. [ ] Upload images to Cloudinary/S3 in batches
1. [ ] Organize by recipe ID or structure
1. [ ] Preserve original filenames or create mapping
1. [ ] Generate thumbnails automatically
1. [ ] Create image mapping manifest for recipe documents
1. [ ] Set primary imageUrl for each recipe
1. [ ] Preserve legacy-to-cloud filename/path mapping
1. [ ] Update image URLs in MongoDB recipe documents
1. [ ] Verify all uploaded images accessible
1. [ ] Test image URLs (no 404s)
1. [ ] Verify thumbnails work
1. [ ] Remove broken image links from database
1. [ ] Document missing images list
1. [ ] Create image migration statistics report

### Image Migration Acceptance Criteria

#### Image Upload Criteria

- [ ] All images uploaded successfully
- [ ] Organized by recipe ID or similar
- [ ] Original filenames preserved (or mapped)
- [ ] Image metadata preserved
- [ ] Thumbnails generated automatically

#### Image Database Criteria

- [ ] Recipe documents updated with imageUrl values
- [ ] URLs point to cloud storage
- [ ] Primary image set correctly
- [ ] Legacy image mapping manifest preserved

#### Image Verification Criteria

- [ ] All image URLs accessible
- [ ] No 404 errors
- [ ] Images display correctly
- [ ] Thumbnails work
- [ ] Full-size images load

#### Image Documentation Criteria

- [ ] Missing images documented
- [ ] Broken links documented
- [ ] Migration statistics recorded

### Image Migration Deliverables

- Uploaded images
- Updated MongoDB documents with image URLs
- Image migration report
- Missing images list

---

## 9.5 Post-Migration Verification

### Verification Tasks

1. [ ] Create automated verification test suite
1. [ ] Verify user count (Laravel dump = MongoDB)
1. [ ] Verify recipe count (Laravel dump = MongoDB)
1. [ ] Verify cookbook count (Laravel dump = MongoDB)
1. [ ] Verify classification count matches
1. [ ] Verify source count matches
1. [ ] Verify taxonomy counts match
1. [ ] Verify embedded relationship counts match legacy pivot totals
1. [ ] Test user authentication with migrated accounts
1. [ ] Test recipe queries return expected results
1. [ ] Test search functionality works correctly
1. [ ] Test filter functionality works correctly
1. [ ] Test meal relationships intact
1. [ ] Test course relationships intact
1. [ ] Test preparation relationships intact
1. [ ] Test cookbook functionality works
1. [ ] Test cookbook recipe order preserved
1. [ ] Test image loading and display
1. [ ] View 10 random recipes (verify all render)
1. [ ] Open 5 random cookbooks (verify all work)
1. [ ] Search for common terms (verify results)
1. [ ] Filter by various criteria (verify works)
1. [ ] Check 10 random user profiles
1. [ ] Test queries performant (< 500ms)
1. [ ] Check for inefficient populate/query patterns
1. [ ] Monitor for memory leaks
1. [ ] Document all discrepancies found
1. [ ] Fix critical issues immediately
1. [ ] Track low-priority issues for later
1. [ ] Generate final verification report
1. [ ] Obtain sign-off from stakeholders

### Verification Acceptance Criteria

#### Verification Data Criteria

- [ ] User count: Laravel dump = MongoDB
- [ ] Recipe count: Laravel dump = MongoDB
- [ ] Cookbook count: Laravel dump = MongoDB
- [ ] Classification count matches
- [ ] Source count matches
- [ ] Taxonomy counts match
- [ ] Embedded relationship counts match

#### Verification Functionality Criteria

- [ ] Users can log in
- [ ] Recipes display correctly
- [ ] Search returns results
- [ ] Filters work
- [ ] Cookbooks load correctly
- [ ] Images display
- [ ] Relationships intact

#### Verification Workflow Criteria

- [ ] View 10 random recipes (all render)
- [ ] Open 5 cookbooks (all work)
- [ ] Search for common terms (results accurate)
- [ ] Filter by various criteria (works)
- [ ] Check 10 random users (profiles work)

#### Verification Performance Criteria

- [ ] Queries performant (< 500ms)
- [ ] No excessive populate/query patterns
- [ ] Images load quickly
- [ ] No memory leaks

#### Verification Issue Criteria

- [ ] All critical issues documented
- [ ] High-priority issues fixed
- [ ] Low-priority issues tracked for later
- [ ] No blockers for launch

### Verification Deliverables

- Verification test suite
- Verification report
- Issue log
- Sign-off documentation

---

## Testing Checklist

### Data Integrity

- [ ] Extraction captures all records
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

Potential blockers:

- Large dataset size
- Data inconsistencies in Laravel dump
- Schema mismatches
- Image migration failures
- Import errors

Mitigation:

- Test with sample data first
- Clean data before export
- Implement robust error handling
- Backup everything
- Plan for rollback scenarios
- Batch process large datasets
- Monitor import progress

---

## Notes

- **CRITICAL**: Preserve the raw Laravel SQL dump at `dump-recipe_laravel-202603111712.sql`
- **CRITICAL**: Backup new MongoDB database before import
- Run migration in staging environment first
- Test thoroughly before production migration
- Plan for downtime during production migration
- Consider running Laravel and new app in parallel initially
- Document all steps for repeatability
- Keep migration scripts for reference
- Plan for data cleanup post-migration
