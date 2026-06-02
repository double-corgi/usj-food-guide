# Vercel Deployment

This project is ready for Vercel as a standard Next.js app.

## Build Settings

- Framework Preset: Next.js
- Install Command: `npm install`
- Build Command: `npm run build`
- Development Command: `npm run dev`

## Environment Variables

The app can render from generated JSON without Supabase variables. Set these only when using Supabase-backed production features.

Required for Supabase-backed production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ACCESS_KEY`
- `CRON_SECRET`

Optional:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_ANALYTICS_ENDPOINT`
- `NEXT_PUBLIC_ENABLE_LOCAL_ANALYTICS`

Do not commit `.env` or `.env.local`.

## Deploy

```bash
npm run lint
npm run typecheck
npm run build
npm exec --yes vercel -- deploy --prod
```

## Post-deploy Smoke Test

Check these routes on the production URL:

- `/`
- `/foods`
- `/foods/food-62sv4l`
- `/eaten`
- `/areas`

