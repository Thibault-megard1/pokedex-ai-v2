# Admin View Mode - Complete Documentation

## Overview
Admin View is a **read-only inspection mode** that adds debug overlays, tooltips, and information panels to help developers understand how the website works internally. This is NOT a full admin dashboard - it's a developer tool for inspection and debugging.

## Key Principles
1. **Read-only**: Admin View displays information but does NOT allow editing or mutations
2. **Invisible to non-admins**: Only users with `isAdmin: true` can see the toggle
3. **Non-intrusive**: Site behaves EXACTLY the same when Admin View is OFF
4. **Visually distinct**: Admin UI uses orange gradient, dashed borders, and pulsing animations
5. **Never blocks critical buttons**: Debug panels are collapsible and positioned carefully

## Architecture

### Core Components

#### 1. AdminViewProvider (`components/AdminViewProvider.tsx`)
React Context provider that manages admin view state globally.

**Features:**
- Checks user admin status via `isUserAdmin` prop from server
- Manages toggle state in localStorage (`adminViewEnabled`)
- Provides `useAdminView()` hook for consuming components

**Usage:**
```tsx
const { isAdmin, adminViewEnabled, toggleAdminView } = useAdminView();
```

#### 2. AdminDebugComponents (`components/AdminDebugComponents.tsx`)
Reusable UI components for displaying debug information.

**Components:**
- `AdminDebugPanel`: Collapsible panel with JSON data display
- `AdminDebugTooltip`: Small tooltip for inline hints
- `AdminDebugBox`: Wrapper with visual admin styling

**Usage:**
```tsx
<AdminDebugPanel 
  title="Debug Title"
  data={{
    key1: value1,
    key2: value2
  }}
/>
```

#### 3. Admin Debug Styles (`app/globals.css`)
CSS classes for consistent admin UI styling:
- `.admin-debug`: Base orange gradient style
- `.admin-debug-panel`: Collapsible panel
- `.admin-debug-tooltip`: Tooltip positioning
- `.admin-debug-box`: Wrapper box
- `.admin-debug-pulse`: Pulsing animation

### Integration Points

#### 1. Root Layout (`app/layout.tsx`)
- Wraps entire app with `AdminViewProvider`
- Checks user admin status server-side
- Passes `isUserAdmin` prop to context

```tsx
const user = await getUserFromRequest();
<AdminViewProvider isUserAdmin={user?.isAdmin === true}>
  {children}
</AdminViewProvider>
```

#### 2. Navigation Bar (`components/NavBar.tsx`)
**Desktop:**
- Toggle button next to language switcher
- Orange when ON, gray when OFF
- Shows 🔍 (ON) or 👁️ (OFF) emoji

**Mobile:**
- Full-width toggle button in mobile menu
- Positioned after Admin Dashboard link
- Same color coding as desktop

## Page Implementations

### 1. Quiz Page (`app/quiz/page.tsx`)
Displays personality quiz debug information.

**Debug Information Shown:**
- **Question Debug Panel:**
  - Question ID and type
  - Weight value
  - Answer mapping logic
  - Selected option details

- **Results Debug Panel:**
  - Top 3 Pokémon matches
  - Confidence scores
  - Selection reasoning
  - Alternative matches considered

**Location:**
- Question panel: Below question text, above options
- Results panel: Below personality display, above Pokémon cards

### 2. Battle Page (`app/battle/page.tsx`)
Shows battle calculation internals and damage formulas.

**Debug Information Shown:**
- Attacker/Defender stats
- Move details (name, type, power, category)
- Base damage calculation
- Type effectiveness multiplier
- STAB (Same Type Attack Bonus) indicator
- Random factor (0.85-1.0)
- Final damage value
- Full damage formula
- Applied modifiers list

**API Endpoint:**
- `POST /api/admin/battle-debug`
- Admin-only (checks `isAdmin()`)
- Returns detailed calculation breakdown

**Location:**
- Debug panel appears at bottom of Battle Results section
- Only shown after battle completes

### 3. Pokémon Detail Pages (`app/pokemon/[name]/page.tsx`)
Displays Pokémon data source and loading information.

**Debug Information Shown:**
- Pokémon ID and name
- Data source (`pokemon-cache`)
- Sprite URLs (normal and shiny)
- Background image URL
- Region and generation
- Cache status (`loaded`, `cached`, `fresh`)
- Cry audio URL
- Total base stats sum
- Type array

**Location:**
- Positioned between `HistoryTracker` and main container
- Collapsible to avoid interfering with content

## User Authorization

### Admin Flag
Located in `data/users.json`:
```json
{
  "username": "Jiz3o",
  "isAdmin": true
}
```

### Authorization Check
Server-side check in `lib/auth.ts`:
```typescript
export function isAdmin() {
  const user = getUserFromRequest();
  return user?.isAdmin === true;
}
```

### Current Admin Users
- **Jiz3o**: Full admin access

### Test Users (Non-admin)
- **Clement**: Regular user (no admin toggle visible)

## CSS Styling

### Admin Debug Classes
```css
.admin-debug {
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  border: 2px dashed #f97316;
  border-radius: 0.5rem;
  padding: 1rem;
}

.admin-debug-panel {
  position: relative;
  margin: 1rem 0;
  animation: adminPulse 2s ease-in-out infinite;
}

@keyframes adminPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); }
}
```

### Color Scheme
- **Primary**: Orange (#f97316)
- **Background**: Light orange gradient
- **Border**: Dashed orange
- **Text**: Dark gray on light, light orange on dark

## Toggle Behavior

### State Management
1. **Initial State**: OFF (unless stored in localStorage)
2. **Toggle Action**: Click button to switch ON/OFF
3. **Persistence**: State saved to `localStorage.adminViewEnabled`
4. **Rehydration**: State restored on page load

### Visibility Rules
```typescript
// Component visibility check
if (!isAdmin || !adminViewEnabled) return null;
```

### Storage Key
```typescript
localStorage.getItem('adminViewEnabled') // 'true' or 'false'
```

## Testing Checklist

### ✅ Admin User (Jiz3o)
- [ ] Toggle button visible in desktop navbar
- [ ] Toggle button visible in mobile menu
- [ ] Button changes color when clicked (orange = ON, gray = OFF)
- [ ] State persists after page reload
- [ ] Debug panels appear on Quiz page (questions + results)
- [ ] Debug panel appears on Battle Results
- [ ] Debug panel appears on Pokémon detail pages
- [ ] Collapsing/expanding panels works
- [ ] No JavaScript console errors

### ✅ Non-Admin User (Clement)
- [ ] NO toggle button in navbar
- [ ] NO toggle button in mobile menu
- [ ] NO debug panels visible anywhere
- [ ] Site functions exactly as normal
- [ ] No admin-related console errors

### ✅ Functionality Tests
- [ ] Quiz: Question debug shows correct IDs and weights
- [ ] Quiz: Results debug shows top 3 matches with scores
- [ ] Battle: Debug panel shows damage calculations
- [ ] Battle: Type effectiveness displayed correctly
- [ ] Pokémon: Data source and cache status shown
- [ ] Pokémon: Sprite URLs and metadata correct

## Future Enhancements

### Planned Features (Not Yet Implemented)
1. **Game Mode Debug**
   - Battle state inspector
   - Team composition analyzer
   - Experience/level tracking

2. **More Pages**
   - Team Builder debug (type coverage, weaknesses)
   - Damage Calculator debug (formula step-by-step)
   - Compare page debug (stat difference breakdown)

3. **Enhanced Battle Debug**
   - Round-by-round breakdown
   - HP tracking per round
   - Move effectiveness history

4. **Performance Monitoring**
   - API call timing
   - Cache hit/miss rates
   - Component render counts

### Write Access (Future)
While Admin View is currently read-only, the infrastructure supports future write capabilities:
- Edit button placeholders in `AdminDebugPanel`
- API endpoint structure for mutations
- Permission checks already in place

**Note**: Write access should be implemented separately with proper validation, confirmation dialogs, and audit logging.

## Troubleshooting

### Toggle Not Appearing
1. Check `data/users.json` for `isAdmin: true`
2. Verify user is logged in
3. Check browser console for errors
4. Clear localStorage and refresh

### Debug Panels Not Showing
1. Verify admin toggle is ON (orange)
2. Check component conditional: `if (!isAdmin || !adminViewEnabled) return null`
3. Ensure data is being passed to panel
4. Check browser console for render errors

### State Not Persisting
1. Check localStorage in DevTools
2. Verify key: `adminViewEnabled`
3. Clear localStorage and toggle again
4. Check for localStorage quota errors

## Code Locations

### Core Files
- `components/AdminViewProvider.tsx` - Context provider
- `components/AdminDebugComponents.tsx` - UI components
- `app/globals.css` - Styles (search for `.admin-debug`)
- `components/NavBar.tsx` - Toggle button integration

### Page Integrations
- `app/quiz/page.tsx` - Quiz debug panels
- `app/battle/page.tsx` - Battle debug panel
- `app/pokemon/[name]/page.tsx` - Pokémon debug panel

### API Endpoints
- `app/api/admin/battle-debug/route.ts` - Battle calculation debug

### Auth System
- `lib/auth.ts` - `isAdmin()` function
- `data/users.json` - User admin flags
- `app/layout.tsx` - Server-side admin check

## Best Practices

### Adding Admin View to New Pages
1. Import hooks and components:
```tsx
import { useAdminView } from "@/components/AdminViewProvider";
import { AdminDebugPanel } from "@/components/AdminDebugComponents";
```

2. Get admin state:
```tsx
const { isAdmin, adminViewEnabled } = useAdminView();
```

3. Add debug panel with early return:
```tsx
<AdminDebugPanel 
  title="Page Debug Info"
  data={{ /* your data */ }}
/>
// Component internally checks: if (!isAdmin || !adminViewEnabled) return null
```

4. Position carefully:
- Avoid blocking navigation or critical buttons
- Place after headers but before main content
- Use collapsible panels for large data

### Data to Display
- Internal IDs and keys
- API endpoints called
- Cache status
- Calculation formulas
- Selection algorithms
- Performance metrics
- Error states

### What NOT to Display
- User passwords or tokens
- Sensitive personal data
- Production API keys
- Internal server paths
- Database credentials

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintainer**: Development Team
