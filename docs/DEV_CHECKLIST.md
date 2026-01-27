# Development Checklist - Pokédex AI Pro

## Pre-Implementation Checks

### ✅ Structure Verification (COMPLETED)
- [x] Verify main pages under `/app`
- [x] Verify API routes under `/app/api`
- [x] Verify components structure
- [x] Verify lib utilities
- [x] **Result:** No `fs` imports in client components ✓
- [x] **Result:** No TypeScript errors ✓

### ✅ Existing Routes Status (VERIFIED)
- [x] `/` - Home page
- [x] `/pokemon` - Pokédex list
- [x] `/pokemon/[name]` - Pokémon detail
- [x] `/team` - Team builder
- [x] `/battle` - Battle system
- [x] `/quiz` - AI Quiz
- [x] `/auth/login` - Authentication
- [x] `/auth/register` - Registration
- [x] `/favorites` - Favorites
- [x] `/stats` - Statistics
- [x] `/compare` - Compare Pokémon
- [x] `/damage-calculator` - Basic damage calc

---

## Post-Feature Implementation Checks

### After Each Major Feature:

#### 1. TypeScript Compilation
```bash
npm run build
# or
npx tsc --noEmit
```
- [ ] No TypeScript errors
- [ ] No type warnings in critical paths

#### 2. Development Server
```bash
npm run dev
```
- [ ] Server starts without errors
- [ ] Port 3000 accessible
- [ ] Hot reload works

#### 3. Main Pages Load
- [ ] Home page renders
- [ ] Pokédex list loads
- [ ] Pokémon detail page works
- [ ] Team builder loads
- [ ] Battle page works
- [ ] New feature page works (if added)

#### 4. API Routes Health
- [ ] `/api/pokemon/*` responds
- [ ] `/api/auth/*` works
- [ ] `/api/team/*` works
- [ ] New API routes work (if added)

#### 5. Runtime Checks
- [ ] No console errors on page load
- [ ] No unhandled promise rejections
- [ ] No infinite loops/memory leaks
- [ ] Images/assets load correctly

#### 6. Feature-Specific Checks
- [ ] New feature UI renders
- [ ] New feature logic works
- [ ] Edge cases handled (empty states, errors)
- [ ] Mobile responsive (if UI added)
- [ ] Accessible (keyboard navigation, ARIA)

---

## Phase-Specific Verification

### Phase 1 - PWA + Offline Mode
- [ ] Manifest file valid
- [ ] Service worker registers
- [ ] Install prompt appears (if supported)
- [ ] Offline mode shows cached pages
- [ ] Offline fallback message appears
- [ ] Icons load correctly
- [ ] No SW errors in console

### Phase 2 - Team Sharing
- [ ] Share button generates URL
- [ ] QR code displays correctly
- [ ] Shared link loads team
- [ ] Import validates data
- [ ] Invalid data shows error
- [ ] QR scanner works (if implemented)

### Phase 3 - IV/EV Calculator
- [ ] Pokémon selection works
- [ ] Stats calculate correctly
- [ ] EV total validation works (≤510)
- [ ] Nature modifiers apply
- [ ] Level changes update stats
- [ ] Results match known calculators

### Phase 4 - Damage Calculator Pro
- [ ] Move selection works
- [ ] Damage range calculates
- [ ] Weather modifiers apply
- [ ] Terrain modifiers apply
- [ ] Screen modifiers apply
- [ ] Stat boosts work (-6 to +6)
- [ ] Type effectiveness correct

### Phase 5 - 3D Viewer
- [ ] Three.js loads without errors
- [ ] At least one model displays
- [ ] Rotation controls work
- [ ] Zoom works
- [ ] Fallback to sprite if model missing
- [ ] No WebGL errors

### Phase 6 - AI Features
- [ ] Mistral API key configured
- [ ] API calls succeed
- [ ] JSON responses validate
- [ ] Error handling works (no API key)
- [ ] Rate limiting respected
- [ ] Responses in French
- [ ] Team Builder suggests valid Pokémon
- [ ] Battle Commentator generates text
- [ ] Chatbot responds
- [ ] Quiz Generator creates questions

### Phase 7 - Navigation
- [ ] All nav links work
- [ ] No broken routes
- [ ] Hub pages load
- [ ] Breadcrumbs correct
- [ ] Mobile menu works

### Phase 8 - Quality
- [ ] Documentation complete
- [ ] Smoke tests pass
- [ ] No build warnings
- [ ] README updated

---

## Manual Testing Checklist (End-to-End)

### Critical Path Testing
1. [ ] Home → Pokédex → Detail page
2. [ ] Team Builder → Add 6 Pokémon → Save
3. [ ] Battle → Setup teams → Fight
4. [ ] Quiz → Complete quiz
5. [ ] Login → Access protected features

### New Features Testing
6. [ ] Install as PWA → Use offline
7. [ ] Share team → Import in new tab
8. [ ] IV Calculator → Calculate stats
9. [ ] Damage Calculator → Full scenario
10. [ ] 3D Viewer → View multiple Pokémon
11. [ ] AI Team Builder → Get suggestions
12. [ ] AI Chatbot → Ask questions

### Error Scenarios
13. [ ] Offline without cache → Friendly message
14. [ ] Invalid team import → Error message
15. [ ] Missing 3D model → Fallback
16. [ ] AI without API key → Graceful degradation
17. [ ] Invalid Pokémon name → 404 page

---

## Performance Checks

- [ ] Initial page load < 3s
- [ ] No layout shifts (CLS)
- [ ] Interactive < 5s (TTI)
- [ ] Image optimization working
- [ ] Caching effective

---

## Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Security Checks

- [ ] API keys not exposed in client
- [ ] No sensitive data in localStorage (plain text passwords)
- [ ] CORS configured correctly
- [ ] Input validation on all forms
- [ ] XSS protection

---

## Git Workflow

After each phase:
```bash
git status
git add .
git commit -m "feat: [Phase X] - [Feature Name]"
git push origin main
```

---

## Rollback Plan

If a feature breaks the app:
1. Identify the breaking change
2. Comment out the new code
3. Verify app works again
4. Fix the issue
5. Re-enable incrementally

---

## Notes

- Keep branches short-lived (merge to main frequently)
- Document breaking changes in commit messages
- Update README.md with new features
- Add screenshots for major UI changes
- Keep dependencies minimal

---

**Last Updated:** 2026-01-27  
**Current Phase:** Phase 0 ✓ COMPLETED
