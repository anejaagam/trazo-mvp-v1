# UI Component Consolidation Audit

**Date:** October 17, 2025  
**Purpose:** Audit all shadcn/ui components from prototypes for consolidation into main repo

## Current Main Repo Components (11)

✅ Already in `/components/ui/`:
- badge.tsx
- button.tsx
- card.tsx
- checkbox.tsx
- dropdown-menu.tsx
- field.tsx (custom)
- form-label.tsx (custom)
- input.tsx
- label.tsx
- progress-indicator.tsx (custom)
- toaster.tsx

## Components Found in Prototypes (45 total)

### ✅ Already in Main Repo (5)
- badge.tsx
- button.tsx
- card.tsx
- checkbox.tsx
- dropdown-menu.tsx
- input.tsx
- label.tsx

### 🔄 Need to Migrate (38)
Priority components needed for feature integration:

**High Priority (Phase 2 - Needed Immediately):**
1. accordion.tsx - Collapsible sections
2. alert-dialog.tsx - Confirmation dialogs
3. alert.tsx - Alert messages
4. avatar.tsx - User avatars
5. calendar.tsx - Date picker
6. command.tsx - Command palette
7. dialog.tsx - Modal dialogs
8. form.tsx - Form wrapper
9. popover.tsx - Popover menus
10. select.tsx - Dropdown select
11. separator.tsx - Visual separator
12. sheet.tsx - Side panel
13. sonner.tsx - Toast notifications
14. switch.tsx - Toggle switch
15. table.tsx - Data tables
16. tabs.tsx - Tab navigation
17. textarea.tsx - Text area input
18. tooltip.tsx - Tooltips

**Medium Priority (Phase 3 - Feature Integration):**
19. breadcrumb.tsx - Navigation breadcrumbs
20. context-menu.tsx - Right-click menus
21. hover-card.tsx - Hover cards
22. navigation-menu.tsx - Navigation menus
23. pagination.tsx - Pagination controls
24. progress.tsx - Progress bars
25. radio-group.tsx - Radio buttons
26. scroll-area.tsx - Custom scroll areas
27. skeleton.tsx - Loading skeletons
28. slider.tsx - Range sliders

**Low Priority (Future Features):**
29. aspect-ratio.tsx - Aspect ratio container
30. carousel.tsx - Carousel/slider
31. chart.tsx - Chart components
32. collapsible.tsx - Collapsible content
33. drawer.tsx - Drawer component
34. input-otp.tsx - OTP input
35. menubar.tsx - Menu bar
36. resizable.tsx - Resizable panels
37. sidebar.tsx - Sidebar (may conflict with dashboard sidebar)
38. toggle-group.tsx - Toggle group
39. toggle.tsx - Toggle button

## Migration Strategy

### Phase 2A: Essential Components (Immediate)
Migrate components needed for signup flow and basic features:
- ✅ dialog.tsx
- ✅ select.tsx
- ✅ form.tsx
- ✅ alert.tsx
- ✅ alert-dialog.tsx
- ✅ sonner.tsx (toast)
- ✅ tooltip.tsx
- ✅ separator.tsx

### Phase 2B: Data Display Components
Migrate components needed for dashboards:
- ✅ table.tsx
- ✅ tabs.tsx
- ✅ avatar.tsx
- ✅ switch.tsx
- ✅ textarea.tsx
- ✅ calendar.tsx

### Phase 2C: Advanced UI Components
Migrate remaining high-priority components:
- ✅ sheet.tsx
- ✅ popover.tsx
- ✅ command.tsx
- ✅ accordion.tsx

### Phase 3: Feature-Specific Components
Migrate as needed during feature integration:
- Breadcrumb, pagination, scroll-area, skeleton, etc.

## Source Prototype Reference

Most complete component libraries found in:
1. **BatchManagementPrototype** - 40+ components
2. **IdentityRolesPermissionPrototype** - 46 components
3. **WorkflowAndTaskManagementPrototype** - 45 components

## Implementation Notes

1. **Source of Truth:** Use BatchManagementPrototype or IdentityRolesPermissionPrototype as primary source (most recent)
2. **Styling:** Update all components to use main repo color tokens from tailwind.config.ts
3. **Testing:** Test each component with existing theme and design system
4. **Documentation:** Add usage examples for custom components

## Customization Required

All migrated components must:
- Use brand color palette (dark-green, lighter-green, lightest-green, blue)
- Match Lato font family
- Follow 4px spacing scale
- Support dark mode (if theme provider is added later)
- Include proper TypeScript types
- Be accessible (ARIA attributes)
