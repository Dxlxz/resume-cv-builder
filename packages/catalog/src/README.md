# Reference Catalog

Versioned vocabulary bundles power searchable pickers in the resume builder and an **Admin Mode** for local customization.

## Storage

- **Bundled packs:** `src/catalog/bundles/` (`malaysia-default`, `international-default`)
- **User overrides:** `localStorage` key `resume-cv-builder-catalog-v1` (separate from resume draft)

## Catalog types

`skill`, `skill-category`, `language`, `language-proficiency`, `occupation`, `industry`, `institution`, `degree-type`, `location`, `certification`, `action-verb`

Pickers write **canonical label strings** into the existing resume schema (v2). No document schema change in v1.

## Export pack format

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-06-11T12:00:00.000Z",
  "bundleId": "malaysia-default",
  "manifest": { "id": "malaysia-default", "name": "...", "version": "1.0.0" },
  "mergedEntries": [ { "id": "...", "catalogType": "skill", "label": "Python", "active": true } ]
}
```

Import via **Manage catalogs** → Import catalog JSON (merge or replace).

## Admin Mode

Navigate to `#/admin` or use **Manage catalogs** in the toolbar.

## Preset sync

`malaysia-corporate` → `malaysia-default` bundle; `international-generic` → `international-default`.
