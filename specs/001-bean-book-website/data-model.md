# Data Model: Bean Book Website

## Review

One published issue → one Review.

| Field | Type | Source / Validation |
|-------|------|---------------------|
| `id` | number | Issue number |
| `url` | string | Issue html_url (`http(s)` only) |
| `submittedAt` | ISO date string | Issue `created_at` |
| `author` | `{ login, avatarUrl, profileUrl }` | Issue user; avatar/profile are GitHub URLs |
| `name` | string | Required; text-sanitized |
| `roaster` | string | Dropdown value, or freeform when "Other (not listed)" |
| `roastType` | enum | Filter / Espresso / Omni / Unknown |
| `roastLevel` | enum | Light … Dark / Unknown |
| `blend` | enum | Single Origin / Blend / Unknown |
| `rating` | number | 1.00–5.00, step 0.25 (else review rejected) |
| `decaf` | boolean | Checkbox |
| `organic` | boolean | Checkbox |
| `roastDate` | string \| null | Optional `YYYY-MM-DD` |
| `origins` | string[] | Split on ", " when blend; sanitized |
| `process` | enum \| null | Washed/Natural/Honey/Anaerobic/… |
| `species` | enum \| null | Arabica/Robusta/… |
| `variety` | string \| null | Free text |
| `currency` | enum | EUR default |
| `cost` | number \| null | Parsed float ≥ 0 |
| `weightGrams` | number \| null | Parsed int > 0 |
| `flavours` | string[] | Checked flavour options (max 10, from allowed set) |
| `brewMethod` | enum \| null | Espresso/V60/… |
| `website` | string \| null | `http(s)` only |
| `notes` | string \| null | Free text, sanitized |
| `buyAgain` | boolean | Checkbox |

## Bean

Aggregation of Reviews sharing a normalized identity.

| Field | Type | Notes |
|-------|------|-------|
| `slug` | string | URL-safe id derived from roaster+name |
| `key` | string | `normalize(roaster)⟟normalize(name)` |
| `name` | string | Display name (from most complete review) |
| `roaster` | string | Display roaster |
| `averageRating` | number | Mean of review ratings, 2 dp |
| `reviewCount` | number | Count of reviews |
| `valuePer100g` | `{ value, currency }` \| null | Cheapest observed price per 100g across reviews (currency of that review; not converted) |
| `facts` | object | Merged **intrinsic** facts (roastType, roastLevel, blend, decaf, organic, species, process, origins, website, roastDate). Purchase data (cost/weight/currency) is **not** here — it lives on each Review |
| `flavours` | string[] | Union of review flavours (capped) |
| `reviews` | Review[] | Newest first |

**Normalization**: lowercase → strip diacritics → trim → collapse internal
whitespace. Used only for the identity key, not for display.

**Purchase vs intrinsic data**: `cost`, `weightGrams` and `currency` describe a
specific purchase, so they stay on the Review (shown on each review card). The
Bean only exposes the derived `valuePer100g` for comparison.

## beans.json (build artifact)

```json
{
  "generatedAt": "2026-07-08T00:00:00Z",
  "buildId": "__BUILD_ID__",
  "beans": [ { "slug": "…", "name": "…", "roaster": "…",
              "averageRating": 3.5, "reviewCount": 2,
              "facts": { }, "flavours": [], "reviews": [ ] } ]
}
```
