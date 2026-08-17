# Composants Metronic e-commerce (legacy)

Ces fichiers proviennent du template Metronic Store Admin et ne sont **pas** utilisés par le CRM FORM'SSI :

- `components/_deprecated-metronic/tables/*.tsx` (anciennement `components/tables/`)
- `components/order-details-sheet.tsx`
- `components/product-form-sheet.tsx`
- `components/product-info-sheet.tsx`
- `components/customer-details-sheet.tsx` (utilisé par `pricing.tsx` landing uniquement)

Seul `components/tables/customer-list.tsx` reste branché (liste users legacy).

Ne pas brancher de nouvelles pages CRM sur ces composants. Suppression prévue après migration landing pricing.
