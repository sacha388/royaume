# Royaume

Scaffold initial d'une PWA mobile-only privée, pensée pour iPhone et construite avec Next.js App Router, TypeScript, Tailwind CSS et Supabase Auth.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth par email magic link
- PWA installable avec manifest, apple touch icon et meta iOS standalone

## Structure

```txt
app/
  (protected)/
    constellation/
    home/
    memories/
    settings/
    us/
  auth/
    callback/
  intro/
components/
  auth/
  home/
  layout/
  ui/
lib/
  supabase/
public/
  animations/
  icons/
supabase/
  sql/
types/
```

## Setup local

1. Installer les dependances :

```bash
npm install
```

2. Créer le fichier d'environnement local :

```bash
cp .env.example .env.local
```

3. Renseigner les clés Supabase dans `.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

   Optionnel — notifications Web Push (Safari iOS 16.4+, app sur l’écran d’accueil) : générer des clés VAPID (`npx web-push generate-vapid-keys`), puis renseigner `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, et la même valeur aléatoire pour `PUSH_GATE_KEY` et `NEXT_PUBLIC_PUSH_GATE_KEY` (voir `.env.example`).

4. Dans Supabase, activer l'authentification email. Pour le magic link local, ajouter `http://localhost:3000/auth/callback` dans les redirect URLs autorisées. Si Next utilise un autre port, ajouter aussi l'URL affichée dans le terminal.

5. Appliquer les migrations SQL partagées couple dans le SQL Editor (`supabase/sql/002_shared_couple_data.sql` puis `003_web_push.sql` pour les abonnements push).

6. Mettre ton animation Lottie dans :

```txt
public/animations/incoming-heart.json
```

7. Lancer l'app :

```bash
npm run dev
```

Puis ouvrir `http://localhost:3000` dans un navigateur mobile ou en mode responsive iPhone.

## Routes

Routes publiques :

- `/`
- `/intro`
- `/auth`

Routes protégées :

- `/home`
- `/settings`
- `/memories`
- `/us`
- `/constellation`

Supabase utilise aussi le route handler `/auth/callback` pour échanger le code du magic link contre une session.

## Cœurs

La Home permet d'envoyer un cœur aux utilisateurs connectés. Un envoi crée une ligne dans `public.hearts`, et les autres clients connectés reçoivent l'événement via Supabase Realtime.

Le JSON d'animation attendu est :

```txt
public/animations/incoming-heart.json
```

Si ce fichier n'existe pas encore, l'app affiche un cœur simple en fallback.

## Notifications Web Push (Safari iOS / PWA)

- L’utilisateur active les notifications depuis **Réglages** ; le service worker est [`public/sw.js`](public/sw.js). Sur iPhone : **iOS 16.4+**, ajouter le site à l’**écran d’accueil** depuis Safari, puis autoriser les notifications pour l’app web.
- Après chaque insert réussi : **cœur** → push partenaire ; **étoile** (si `created_by_profile` renseigné) → push partenaire ; **souvenir** → push partenaire. L’API [`app/api/push/dispatch/route.ts`](app/api/push/dispatch/route.ts) envoie via [`web-push`](https://www.npmjs.com/package/web-push) et les abonnements sont stockés en base ([`supabase/sql/003_web_push.sql`](supabase/sql/003_web_push.sql)).
- **Sécurité MVP** : `PUSH_GATE_KEY` et `NEXT_PUBLIC_PUSH_GATE_KEY` doivent être identiques ; la clé est exposée au client (acceptable pour une app très privée à deux). Pour ne plus dépendre du navigateur de l’expéditeur, tu peux brancher des **Database Webhooks** Supabase sur `couple_messages`, `constellation_stars`, `memories` qui appellent la même URL `dispatch` avec une vérification de signature côté serveur (sans clé publique dans le bundle).

## Pret

- Architecture App Router propre
- Layout mobile max 430px avec safe area iPhone
- Manifest PWA
- Apple touch icon générée par Next
- Meta iOS standalone
- Auth Supabase email magic link
- Envoi de cœur via Supabase
- Animation d'arrivée de cœur via Lottie JSON
- Ecoute realtime des nouveaux cœurs
- Persistance et refresh de session via `proxy.ts`
- Redirection hors de `/auth` si l'utilisateur est connecté
- Protection serveur des routes privées via le layout `(protected)`

## Placeholder

- Paramètres métier complémentaires dans `/settings`
