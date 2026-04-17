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

4. Dans Supabase, activer l'authentification email. Pour le magic link local, ajouter `http://localhost:3000/auth/callback` dans les redirect URLs autorisées. Si Next utilise un autre port, ajouter aussi l'URL affichée dans le terminal.

5. Créer la table des cœurs dans Supabase en exécutant le SQL de `supabase/sql/001_hearts.sql` dans le SQL Editor.

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

- Experiences `/memories`, `/us`, `/constellation`
- Paramètres métier dans `/settings`
- Notifications système, chat, données couple
