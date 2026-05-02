# User Tier Feature Sets

This document defines the product feature set and content limits for each user
tier. It is the decision record for GitHub issue
[#334](https://github.com/dougis-org/cookbook-tanstack/issues/334).

The tier model itself is defined separately by the user data model work from
GitHub issue [#282](https://github.com/dougis-org/cookbook-tanstack/issues/282).
This document describes what each tier means for the product.

## Tier Philosophy

The tiers should create a clear ladder without making the free product useless.

- Anonymous visitors can discover and print public content.
- Home Cook users can contribute a small amount of public content for free.
- Prep Cook is primarily the ad-free tier, with higher public-content limits.
- Sous Chef unlocks private personal library use and recipe import.
- Executive Chef serves power users with high fixed limits and future advanced
  capabilities.

Prep Cook intentionally remains public-only. Users at that tier pay primarily to
remove ads, while their created content still helps grow the public site.
Private content starts at Sous Chef.

## Feature Matrix

| Capability | Anonymous | Home Cook | Prep Cook | Sous Chef | Executive Chef |
| --- | --- | --- | --- | --- | --- |
| Ads shown | Yes | Yes | No | No | No |
| Browse public recipes | Yes | Yes | Yes | Yes | Yes |
| Browse public cookbooks | Yes | Yes | Yes | Yes | Yes |
| Print public recipes | Yes | Yes | Yes | Yes | Yes |
| Print public cookbooks | Yes | Yes | Yes | Yes | Yes |
| Create recipes | No | Yes | Yes | Yes | Yes |
| Recipe limit | 0 | 10 | 100 | 500 | 2,500 |
| Create cookbooks | No | Yes | Yes | Yes | Yes |
| Cookbook limit | 0 | 1 | 10 | 25 | 200 |
| Recipe visibility | Not applicable | Public only | Public only | Public or private | Public or private |
| Cookbook visibility | Not applicable | Public only | Public only | Public or private | Public or private |
| Cookbook chapters | View only | No chapter cap | No chapter cap | No chapter cap | No chapter cap |
| Recipe import | No | No | No | Yes | Yes |

## Tier Definitions

### Anonymous

Anonymous visitors can browse and print public recipes and public cookbooks.
They see ads and cannot create, save, import, or manage personal content.

### Home Cook

Home Cook is the free registered tier. Home Cook users see ads and can create up
to 10 public recipes and 1 public cookbook.

Home Cook users cannot create private recipes, create private cookbooks, or
import recipes.

### Prep Cook

Prep Cook is the entry paid tier. Its primary benefit is ad removal. Prep Cook
users also receive higher public-content limits than Home Cook users: up to 100
public recipes and 10 public cookbooks.

Prep Cook users still cannot create private recipes, create private cookbooks,
or import recipes. This keeps the lower paid tier focused on ad removal and
public contribution.

### Sous Chef

Sous Chef is the personal library tier. Sous Chef users do not see ads and can
create up to 500 recipes and 25 cookbooks.

Sous Chef unlocks private recipes, private cookbooks, and recipe import.

### Executive Chef

Executive Chef is the power-user tier. Executive Chef users do not see ads and
can create up to 2,500 recipes and 200 cookbooks.

Executive Chef includes public and private content creation, recipe import, and
room for future advanced capabilities such as bulk tools, premium sharing, or
collaboration. Limits are intentionally high but finite rather than unlimited.

## Content Visibility Rules

Home Cook and Prep Cook users can create public content only. Any recipe or
cookbook they create should be visible as public content.

Sous Chef and Executive Chef users can choose public or private visibility for
recipes and cookbooks.

Anonymous visitors can only see public content. Registration is not required to
print public recipes or public cookbooks.

## Content Limits

| Limit | Home Cook | Prep Cook | Sous Chef | Executive Chef |
| --- | ---: | ---: | ---: | ---: |
| Recipes | 10 | 100 | 500 | 2,500 |
| Cookbooks | 1 | 10 | 25 | 200 |

Cookbook chapters do not have their own tier-specific cap. Cookbook count limits
control the scale of chapter usage.

## Import Policy

Recipe import is available only to Executive Chef users.

Home Cook and Prep Cook users cannot import recipes. This prevents lower tiers
from rapidly filling their content quota through bulk or semi-automated flows
and keeps import aligned with private-library use.

## Advertising Policy

Anonymous visitors and Home Cook users see ads.

Prep Cook, Sous Chef, and Executive Chef users do not see ads.

## Future Feature Placement

Future features should follow this tier intent unless a later decision record
changes the model.

| Feature Area | Expected Placement |
| --- | --- |
| Ad suppression | Prep Cook and above |
| Private recipes and cookbooks | Sous Chef and above |
| Recipe import | Executive Chef only |
| Bulk import/export | Executive Chef candidate |
| Advanced sharing | Sous Chef or Executive Chef candidate |
| Collaboration | Executive Chef candidate |
| Premium cookbook tools | Sous Chef or Executive Chef candidate |

## Implementation Planning Output

This document does not define implementation details. A separate planning issue
should produce:

- An implementation plan for enforcing this feature matrix.
- A list of execution issues that deliver the work in focused pieces.
- Any product or UX decisions needed before enforcement begins.
