# Credit Shop

## Current State
The app uses a bottom tab bar (Home, Products, Settings) for navigation between top-level screens. There is no sidebar. Each screen (HomeScreen, ProductsScreen, SettingsScreen) has its own header styled inline. The app wraps all screens in App.tsx with a single `<main>` and a bottom `<nav>` bar for top-level tabs.

## Requested Changes (Diff)

### Add
- Left-side navigation drawer (sidebar) that slides in from the left
- Hamburger menu icon (☰) in the top-left of a unified header bar
- Sidebar menu items: Dashboard (Home), Customers (Home), Products, Settings
- Overlay/backdrop when sidebar is open; tap outside closes it
- Active page highlight in sidebar
- Smooth slide animation on open/close

### Modify
- App.tsx: add sidebar state, overlay, and a `Sidebar` component rendered at root level so it's available on all screens
- The existing bottom tab bar can be kept or removed — since we now have a sidebar, remove it to reduce clutter and free vertical space
- Each top-level screen's existing header: integrate the hamburger icon into the existing header (left side), keep the screen title centered, keep any existing right-side action buttons. Do NOT add a second header bar.

### Remove
- Bottom tab bar (replaced by sidebar navigation)

## Implementation Plan
1. Create `src/frontend/src/components/Sidebar.tsx` — sliding drawer with overlay, menu items (Dashboard, Customers, Products, Settings) with icons, active state highlight
2. Update `App.tsx` — add `sidebarOpen` state, pass `onOpenSidebar` callback down to screens, render `<Sidebar>` at root with navigate wiring, remove bottom `<nav>` tab bar
3. Update `HomeScreen.tsx` — add hamburger icon button to existing header left side, accept `onOpenSidebar` prop
4. Update `ProductsScreen.tsx` — same header update
5. Update `SettingsScreen.tsx` — same header update
