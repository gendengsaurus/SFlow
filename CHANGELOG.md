# Changelog

All notable changes to **ScriptFlow** will be documented in this file.

---

## [1.4.2] - 2026-01-02

### ✨ Highlights
- **Vibrant Theme Refresh**: Boosted color saturation and contrast across Dracula, Monokai, and Nord themes. The UI now "pops" with more energy and better visibility.

### 🎨 UI & Theming Improvements
- **Premium Table UI**: 
    - Re-designed table headers with high-contrast accent colors and bold typography.
    - Added professional "IDE-style" hover indicators (sleek vertical border on the left) for table rows.
    - Improved data hierarchy using alternating primary and secondary thematic text colors.
- **Dropdown Menu Theming**: Added solid, non-transparent backgrounds for Script/HTML selectors and Google context menus.
- **Enhanced Icons**: Action icons in tables now feature a subtle glow and smooth transition effects.

### ⚙️ Technical Refactor
- **Class-Based Theming**: Migrated table theming logic from aggressive JavaScript inline style overrides to a cleaner, performance-oriented CSS class system.
- **CSS variable Consistency**: Improved usage of CSS variables for better inheritance and easier theme management.

### 🐛 Bug Fixes
- Fixed "hover leakage" where row indicators appeared in the middle of table columns.
- Corrected white-on-white text issues in several dashboard scenarios.
- Smoothed out hover transitions for better performance on large trigger lists.

---

## [1.4.1] - Previous Version
- Initial implementation of the theme engine and basic Google Apps Script UI support.
