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

## Securite admin (schema)
Ce schema montre la verification d'acces et les fonctions reservees.

```mermaid
graph TD
	Login[Authentification] --> Session[Session active]
	Session --> Check[Verification isAdmin]
	Check -->|Non| Refus[Redirection / Acces refuse]
	Check -->|Oui| AdminUI[UI Admin]
	AdminUI --> AdminAPI[/api/admin/*]
	AdminAPI --> UsersJSON[data/users.json]
```

Le role admin est stocke localement et controle a chaque route protegee.

## Liens avec le cours IA
- **Gouvernance**: supervision des modules IA et moderation.
- **Traçabilite**: lecture de statistiques et etat du systeme.

## Limites
- Gestion des droits simplifiee (role unique).
- Base de donnees JSON locale (pas de vrai SGBD).
