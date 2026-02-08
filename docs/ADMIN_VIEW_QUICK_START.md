# Admin View - Quick Start Guide

## What is Admin View?
A developer inspection mode that shows debug information as overlays on the website. It's read-only and only visible to admin users.

## How to Enable

### For Admin Users (e.g., Jiz3o)

1. **Login** as an admin user
2. **Desktop**: Look for the toggle button in the navbar (top-right, next to language switcher)
3. **Mobile**: Open menu (☰), find "Admin View" button below "Admin" link
4. **Click** the toggle button:
   - 🔍 Orange = Admin View ON
   - 👁️ Gray = Admin View OFF
5. **Navigate** to any page to see debug panels

### Pages with Admin Debug Info

#### Quiz Page (`/quiz`)
- **Question Debug**: Shows question ID, type, weight, answer logic
- **Results Debug**: Shows top 3 matches, confidence scores, reasoning

#### Battle Page (`/battle`)
- **Battle Debug**: Shows damage formula, type effectiveness, STAB, modifiers
- Appears after battle completes

#### Pokémon Pages (`/pokemon/[name]`)
- **Data Debug**: Shows ID, data source, sprites, cache status, stats

## Quick Visual Reference

### Toggle Button States

**ON (Active):**
```
🔍 Admin View ON
[Orange background, pulsing border]
```

**OFF (Inactive):**
```
👁️ Admin View OFF
[Gray background, no animation]
```

### Debug Panel Example
```
┌─────────────────────────────────────┐
│ 🔧 Pokemon Detail Data     [ - ]    │ ← Orange dashed border
├─────────────────────────────────────┤
│ {                                    │
│   "id": 25,                         │
│   "name": "pikachu",                │
│   "dataSource": "pokemon-cache",    │
│   "sprite": "https://...",          │
│   "types": ["electric"],            │
│   "totalStats": 320                 │
│ }                                    │
└─────────────────────────────────────┘
```

## For Non-Admin Users
If you don't have admin privileges:
- You won't see any toggle button
- No debug panels will appear
- Site works exactly as normal

## Toggling Admin Flag

To make a user an admin, edit `data/users.json`:

```json
{
  "username": "YourUsername",
  "isAdmin": true  ← Add this line
}
```

Restart the server for changes to take effect.

## Common Issues

**Toggle button not visible?**
- Check if logged in
- Verify `isAdmin: true` in users.json
- Refresh the page

**Debug panels not showing?**
- Make sure toggle is ON (orange)
- Check if you're on a supported page
- Open browser console for errors

**State not saving?**
- Check localStorage in DevTools
- Clear cache and try again

## Keyboard Shortcuts
Currently none - feature for future enhancement.

## Support
For issues or questions, check `docs/ADMIN_VIEW_MODE.md` for full documentation.
