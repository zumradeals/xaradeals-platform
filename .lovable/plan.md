
## Plan d'implémentation — XaraDeals Améliorations

### Phase 1 — PWA & Installabilité (sans service worker)
- Créer `manifest.json` avec icônes existantes
- Ajouter le lien dans `index.html`
- Rendre l'app installable sur mobile

### Phase 2 — Interface Favoris/Wishlist
- La table `favorites` existe déjà avec RLS
- Créer un hook `useFavorites`
- Ajouter le bouton ❤️ sur les `ProductCard`
- Créer une section "Mes favoris" dans la page Account

### Phase 3 — Système de coupons/codes promo
- Migration : table `coupons` (code, type, valeur, expiration, usage max)
- Migration : table `coupon_usages` (suivi par utilisateur)
- Interface admin pour créer/gérer les coupons
- Champ code promo dans le panier avec validation

### Phase 4 — Dashboard Analytics avancé
- Graphiques de ventes par période (jour/semaine/mois)
- Top produits vendus
- Revenus totaux, panier moyen
- Nouveaux clients par période

### Phase 5 — Export CSV commandes/clients
- Bouton export dans AdminOrders et AdminClients
- Génération CSV côté client

### Phase 6 — Badges de confiance sur page produit
- Icônes "Paiement sécurisé", "Livraison garantie", "Support 24/7"
- Section visible sur la page produit

### Phase 7 — Mode sombre basculable
- Le ThemeProvider existe déjà
- Ajouter un toggle dans le Header

### ⚠️ Non inclus (nécessite discussion)
- Programme de parrainage (complexe, nécessite réflexion business)
- Blog SEO (architecture CMS à définir)
- 2FA admin (configuration auth avancée)
- Notifications push/email (nécessite service externe)
