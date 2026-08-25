# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-25

First release. An in-house Lucide icon picker for Sanity Studio v6.

### Added

- `lucide-icon` schema type with a searchable grid picker in a dialog.
- All 2,035 Lucide icons, taken verbatim from `iconNames` in `lucide-react/dynamic`, so every
  name the picker offers is one `DynamicIcon` can resolve.
- Glyphs load per icon as you scroll, in windows of 120, rather than bundling ~632 KB of icon
  data into the Studio.
- `allowedIcons` schema option to restrict the choices.
- Values Lucide does not recognise render as a `not found` card instead of a blank space.
- Search ranks exact matches first, then name prefixes, then word prefixes.
- `ICON_NAMES` and `isIconName` exported for frontend validation.
- `scripts/find-legacy-icons.mjs` to find and rewrite the 153 icon names the unmaintained
  community plugin stored in a form Lucide rejects.
- Full keyboard support in the picker: a roving tabindex so the grid is a single tab stop
  rather than 2,035, arrow keys for 2D movement, Home/End, arrow-down out of the search field
  into the grid, and focus returned to the field when the dialog closes.
- Test suite (`pnpm test`, Node's built-in runner) covering the catalogue, the search ranking,
  the schema-option parsing and the legacy name map. The first test asserts that every name
  the picker offers is one `DynamicIcon` can resolve — the regression that motivated this
  plugin.
