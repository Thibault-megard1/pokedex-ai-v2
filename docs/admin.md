# Administration

## Objectif
Permettre aux enseignants/administrateurs de gerer utilisateurs, theme et analytics.

## Fonctionnement
- UI: `app/admin/page.tsx`.
- API: `app/api/admin/*` (users, theme, analytics, maintenance).
- Reglages: `lib/siteSettings.ts`.

## IA
Cette fonctionnalite n'utilise pas d'intelligence artificielle.

## Mode admin
- Un utilisateur est admin si `isAdmin=true` dans `data/users.json`.
- Les routes admin verifient le role via les sessions.

## Liens avec le cours IA
- **Gouvernance**: supervision des modules IA et moderation.
- **Traçabilite**: lecture de statistiques et etat du systeme.

## Limites
- Gestion des droits simplifiee (role unique).
- Base de donnees JSON locale (pas de vrai SGBD).
