---
name: Agent Wrapped documentation conventions
description: Location, format, and conventions for the changelog and project status files in this repo
type: project
---

Changelog is at `docs/changelog.md`. Follows Keep a Changelog format (https://keepachangelog.com/en/1.1.0/). Uses a single `[Unreleased]` section with subsections: Added, Changed, Fixed, Removed. No version numbers yet — everything accumulates under Unreleased until a release is cut.

Project status is at `docs/project_status.md`. Contains:
- Current phase label and task checklist (checkboxes)
- Phase 2 and Phase 3 backlog (unchecked)
- Milestones table with Status and Target columns
- Known Blockers section
- Decisions Log table (Date | Decision | Rationale)

Date format used throughout: YYYY-MM-DD.

**Why:** CLAUDE.md instructs updating both files after major milestones and additions.
**How to apply:** Always update both files together. Add changelog entries under the appropriate subsection (Added/Changed/Fixed). Log product/architectural decisions in the Decisions Log table in project_status.md.
