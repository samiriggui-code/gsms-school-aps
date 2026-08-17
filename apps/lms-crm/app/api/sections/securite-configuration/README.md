# Section: securite-configuration

Endpoints cibles:

- `acces/users`
- `acces/roles`
- `acces/permissions`
- `acces/logs`
- `parametres/settings` — **canonique** (GET settings + POST general/notifications/social)
- `parametres/module-settings` — layouts dashboard (ModuleSetting)
- `parametres/integrations` — état services (lecture seule)
- `acces/settings/*` — alias déprécié → re-export `parametres/settings/*`

Profil établissement (SystemSetting) : `administration-facturation/tenant/profile` (voir `@/lib/company-profile`).
