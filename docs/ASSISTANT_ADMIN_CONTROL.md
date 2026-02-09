# Assistant Admin Control System - Complete Documentation

## 🎯 Problem Solved

The AI assistant was sometimes adding extra commentary and ranking statements not requested by the user.

### Example of the problem:
**User asks:** "Quels types sont super efficaces contre Dragon ?"  
**Old behavior:** "Le type le plus fort contre le Dragon est le Dragon lui-même, suivi du Glace et de la Fée."  
**Expected:** Only list the types: "Glace, Dragon, Fée" (or bullet list)

## ✅ Solution Implemented

A comprehensive admin-only control system that:
1. **Detects user intent** (list vs ranking vs explanation)
2. **Applies knowledge patches** for known problematic patterns
3. **Validates responses** to remove unwanted extra commentary
4. **Provides admin UI** to configure guardrails and rules

---

## 📂 Files Created

### Configuration Files
```
data/admin/
├── assistant-config.json        ← Guardrails and system rules
└── assistant-patches.json       ← Knowledge patches for corrections
```

### Library
```
lib/
└── assistantAdmin.ts            ← Core logic: intent detection, validation, prompts
```

### Components
```
components/
└── AssistantAdminPanel.tsx      ← Admin UI panel
```

### API Endpoints
```
app/api/admin/
├── assistant-config/route.ts    ← GET/PUT config
└── assistant-patches/route.ts   ← GET/PUT patches
```

### Modified Files
```
app/api/ai/assistant/route.ts    ← Updated to use new system
app/assistant/page.tsx            ← Integrated admin panel + metadata display
```

---

## 🏗️ Architecture

### 1. Intent Detection System

The system automatically detects what the user is asking for:

**Intent Types:**
- `list` - User wants a simple list (e.g., "Quels types sont super efficaces...")
- `ranking` - User wants a ranking or recommendation (e.g., "Quel est le meilleur type...")
- `explanation` - User wants an explanation (e.g., "Comment fonctionne...")
- `comparison` - User wants a comparison (e.g., "Différence entre...")
- `unknown` - Intent unclear

**Detection Patterns (from config):**
```json
{
  "list": ["quels types", "liste", "types super efficaces", "types forts"],
  "ranking": ["meilleur", "le plus", "classement", "top"],
  "explanation": ["comment", "pourquoi", "explique"],
  "comparison": ["différence", "comparer", "versus", "vs"]
}
```

### 2. Knowledge Patches System

Patches provide pre-written correct answers for known problematic queries.

**Patch Structure:**
```typescript
{
  id: "patch-1",
  enabled: true,
  trigger: "super efficaces.*contre.*dragon",  // regex pattern
  triggerType: "regex",
  scope: "type-chart",
  correctedAnswer: "Contre le type Dragon, les types super efficaces sont :\n• Glace\n• Dragon\n• Fée",
  behavior: "replace",  // or "prepend"
  notes: "Fix pour éviter les classements non demandés"
}
```

**How it works:**
1. User message is checked against all enabled patches
2. If a match is found and `behavior: "replace"`, the patched answer is returned immediately
3. No LLM call is made (faster + guaranteed correct)

### 3. Response Validator

Post-processes LLM responses to remove unwanted commentary.

**What it does:**
- Detects intent vs response mismatch
- If user asked for `list` but response contains ranking phrases → removes them
- Removes sentences with banned phrases:
  - "le type le plus fort"
  - "le meilleur type"
  - "en résumé"
  - "donc"
  - "à retenir"
  - "suivi du/de"
- Ensures clean output (no trailing empty lines)

**Example:**
```
Input (LLM response):
"Contre Dragon, les types super efficaces sont Glace, Dragon et Fée.
Le type le plus fort est le Dragon lui-même."

Output (after validation):
"Contre Dragon, les types super efficaces sont Glace, Dragon et Fée."
```

### 4. Enhanced System Prompt

The system prompt is dynamically built based on:
- Admin configuration (enabled guardrails and rules)
- Detected user intent
- Context-specific instructions

**Intent-Specific Instructions:**

For `list` intent:
```
- L'utilisateur demande une LISTE simple
- Réponds UNIQUEMENT avec la liste demandée, en format bullet points (•)
- NE PAS ajouter de commentaire final ou de classement
- NE PAS dire "le plus fort", "le meilleur", "suivi de", etc.
```

For `ranking` intent:
```
- L'utilisateur demande un CLASSEMENT ou une RECOMMANDATION
- Tu peux utiliser des termes comme "le meilleur", "le plus efficace"
- Justifie ton classement
```

---

## 🎨 Admin UI Features

### Admin Panel Access
- **Button location:** Assistant page header, next to "Réinitialiser"
- **Visibility:** Only for users with `isAdmin: true`
- **Button label:** "⚙️ Admin"

### Panel Tabs

#### 1. Guardrails Tab (🛡️)
Global behavior controls:
- ☑️ Répondre strictement à la question posée
- ☑️ Pas de classements sans demande explicite
- ☑️ Toujours en français
- ☑️ Admettre l'incertitude
- ☑️ Préférer les listes à puces
- ☑️ Activer le validateur de réponses

#### 2. Règles système Tab (📋)
Editable rules injected into system prompt:
- Toggle enable/disable
- Edit rule name
- Edit rule description
- Applied to all conversations

#### 3. Patches de connaissance Tab (🔧)
Knowledge corrections:
- Enable/disable per patch
- Edit trigger patterns (regex)
- Edit corrected answers
- Choose behavior (replace/prepend)
- Scope and notes

### Save Functionality
- **Save button:** Bottom right of panel
- **Status indicators:** 
  - ⏳ Sauvegarde...
  - ✓ Sauvegardé
  - ✕ Erreur
- **Persistence:** Saves to JSON files in `data/admin/`

---

## 🔒 Admin Authorization

### User Flag
In `data/users.json`:
```json
{
  "username": "Jiz3o",
  "isAdmin": true
}
```

### API Protection
All admin endpoints check authorization:
```typescript
import { isAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of code
}
```

### UI Visibility
Admin button only appears when:
```typescript
const { isAdmin } = useAdminView();

{isAdmin && (
  <button onClick={() => setAdminPanelOpen(true)}>
    ⚙️ Admin
  </button>
)}
```

---

## 📊 Metadata Display (Admin View Mode)

When Admin View is ON, response metadata is shown:

```
📊 Métadonnées de réponse:
Intent détecté: list
Validé: ✓ Oui
🔧 Patch appliqué: patch-1
```

**Metadata fields:**
- `intent` - Detected user intent
- `validated` - Whether validator ran
- `patched` - Whether a knowledge patch was applied
- `patchId` - ID of the applied patch
- `provider` - LLM provider used
- `model` - Model name
- `response_time_ms` - Response time

---

## 🧪 Test Cases

### Test Case 1: List Intent (No Ranking)

**User Input:**
```
Quels types sont super efficaces contre Dragon ?
```

**Expected Behavior:**
1. Intent detected: `list`
2. Patch matches: `patch-1`
3. Response (from patch):
```
Contre le type Dragon, les types super efficaces sont :
• Glace
• Dragon
• Fée
```

**Metadata:**
```json
{
  "intent": "list",
  "patched": true,
  "patchId": "patch-1",
  "provider": "patch"
}
```

✅ **Result:** NO extra ranking sentence, NO "le plus fort", ONLY the list.

---

### Test Case 2: List Intent (Validator Removes Extra)

**User Input:**
```
Quels types sont super efficaces contre Eau ?
```

**Without validator (old behavior):**
```
Les types super efficaces contre Eau sont Plante et Électrique.
Le type le plus fort est Plante car il résiste également à l'Eau.
```

**With validator (new behavior):**
```
Les types super efficaces contre Eau sont Plante et Électrique.
```

✅ **Result:** Validator removes the ranking sentence.

---

### Test Case 3: Ranking Intent (Allowed)

**User Input:**
```
Quel est le meilleur type contre Dragon ?
```

**Expected Behavior:**
1. Intent detected: `ranking`
2. LLM can use ranking language
3. Response:
```
Le meilleur type contre Dragon est Fée, car :
• Super efficace (×2 dégâts)
• Immunité contre les attaques Dragon
• Moins de faiblesses
```

✅ **Result:** Ranking language IS allowed because user explicitly asked for it.

---

### Test Case 4: Explanation Intent

**User Input:**
```
Comment fonctionne le STAB ?
```

**Expected Behavior:**
1. Intent detected: `explanation`
2. System prompt includes explanation-specific instructions
3. Response:
```
Le STAB (Same Type Attack Bonus) est un bonus de ×1.5 appliqué...
[detailed explanation]
```

✅ **Result:** Pedagogical explanation without unnecessary ranking.

---

## ⚙️ Configuration Options

### Guardrails (Toggles)

| Guardrail | Default | Effect |
|-----------|---------|--------|
| `strictAnswerOnly` | ✓ ON | Remove extra commentary not requested |
| `noRankingsUnlessAsked` | ✓ ON | No "le meilleur" unless user asks |
| `alwaysFrench` | ✓ ON | All responses in French |
| `admitUncertainty` | ✓ ON | Say "je ne sais pas" instead of guessing |
| `preferBulletLists` | ✓ ON | Use bullet points for type matchups |

### Response Validator (Sub-options)

| Option | Default | Effect |
|--------|---------|--------|
| `enabled` | ✓ ON | Run post-processing validation |
| `removeUnwantedPhrases` | ✓ ON | Remove banned phrases |
| `detectExtraCommentary` | ✓ ON | Detect and remove extra sentences |
| `ensureGrammar` | ✓ ON | Keep output grammatically correct |

### Banned Phrases (Default List)
```
"le type le plus fort"
"le meilleur type"
"en résumé"
"donc"
"à retenir"
"suivi du"
"suivi de"
```

**Admins can edit this list in the config file or via the UI (future enhancement).**

---

## 🔄 Request Flow

```
┌─────────────┐
│ User Query  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ 1. Load Config      │ ← assistant-config.json
│    Load Patches     │ ← assistant-patches.json
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 2. Check Patches    │ ← Regex matching
└──────┬──────────────┘
       │
       ├─ Match? ──► Return Patched Answer (skip LLM)
       │
       ▼ No match
┌─────────────────────┐
│ 3. Detect Intent    │ ← Pattern matching
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 4. Build System     │ ← Dynamic prompt based on intent
│    Prompt           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 5. Call LLM         │ ← Mistral/Ollama/GPT
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 6. Validate & Clean │ ← Remove unwanted phrases
│    Response         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 7. Return Response  │ ← With metadata
│    + Metadata       │
└─────────────────────┘
```

---

## 🛠️ Adding New Patches

### Via Admin UI
1. Open Assistant page
2. Click "⚙️ Admin" button
3. Go to "🔧 Patches de connaissance" tab
4. Edit existing patch or add new one
5. Click "💾 Sauvegarder"

### Via JSON File
Edit `data/admin/assistant-patches.json`:
```json
{
  "patches": [
    {
      "id": "patch-4",
      "enabled": true,
      "trigger": "super efficaces.*contre.*acier",
      "triggerType": "regex",
      "scope": "type-chart",
      "correctedAnswer": "Contre le type Acier, les types super efficaces sont :\n• Feu\n• Combat\n• Sol",
      "behavior": "replace",
      "notes": "Réponse standardisée pour Acier"
    }
  ]
}
```

---

## 🔍 Debugging

### Enable Admin View
1. Log in as admin user
2. Toggle Admin View ON in navbar
3. Admin View indicator appears in Assistant page
4. Metadata boxes show under each assistant response

### Metadata Inspection
Shows:
- Detected intent
- Whether validation ran
- If patch was applied
- Which patch ID
- Provider and model used
- Response time

### Console Logs
Check browser console for:
```
[Assistant] Intent detected: list
[Assistant] Patch matched: patch-1
[Assistant] Response validated and cleaned
```

---

## 📝 Maintenance

### Regular Tasks
1. **Review conversation logs** to identify new problematic patterns
2. **Add patches** for frequently occurring issues
3. **Update system rules** based on user feedback
4. **Test with real queries** after config changes

### Performance Monitoring
- Patches are faster than LLM calls (instant return)
- Monitor `response_time_ms` in metadata
- If responses are slow, consider adding more patches

---

## ✅ Success Criteria Checklist

### Problem Fixed
- ✅ No extra ranking sentences when not asked
- ✅ Clean bullet list responses for "quels types" queries
- ✅ "Le meilleur" only appears when user asks for ranking
- ✅ Validator removes unwanted commentary

### Admin Controls Working
- ✅ Admin button visible only to admins
- ✅ Panel opens and loads config
- ✅ Toggles work and save persist
- ✅ Patches can be edited
- ✅ Save functionality works

### Non-Admin Users Unaffected
- ✅ No admin button visible
- ✅ No metadata displayed
- ✅ System works exactly as before (with improvements)
- ✅ No errors or console warnings

### Integration Complete
- ✅ API uses new system
- ✅ Assistant page integrates admin panel
- ✅ Metadata displayed when admin view ON
- ✅ All files compile without errors

---

## 🚀 Future Enhancements

### Possible Additions
1. **Patch Analytics**: Track which patches are used most often
2. **Response History**: Store and analyze past responses
3. **A/B Testing**: Compare responses with/without validator
4. **Custom Banned Phrases**: UI for adding/removing banned phrases
5. **Intent Override**: Manual intent selection in admin mode
6. **Export/Import Config**: Share configurations between environments
7. **Response Rating**: Users rate responses, feed into improvements

---

## 📞 Support

### For Admins
- Panel accessible via "⚙️ Admin" button in Assistant page
- Changes save to `data/admin/assistant-config.json` and `assistant-patches.json`
- Restart not required (config reloaded per request)

### For Developers
- Core logic in `lib/assistantAdmin.ts`
- API routes in `app/api/admin/`
- Component in `components/AssistantAdminPanel.tsx`
- Integration in `app/api/ai/assistant/route.ts`

### Troubleshooting
- **Admin button not visible?** Check `isAdmin: true` in `data/users.json`
- **Patches not working?** Check regex syntax in patches config
- **Validator too aggressive?** Disable `removeUnwantedPhrases` or edit banned phrases list
- **Intent detection wrong?** Add more patterns to `intentDetection.patterns` in config

---

**Version:** 1.0  
**Date:** 2024  
**Status:** ✅ Production Ready

