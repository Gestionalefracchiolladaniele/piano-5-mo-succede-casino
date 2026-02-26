# Revenue OS

Revenue OS è una web app full-stack costruita con Next.js 14 per il controllo e la previsione del fatturato, ottimizzata per deploy semplice su Lovable/Vercel.

## Stack
- Next.js 14 + TypeScript + TailwindCSS
- Recharts + Framer Motion + Zustand
- API Routes di Next.js (no microservizi)
- PostgreSQL + Prisma
- JWT auth con cookie httpOnly

## Setup
1. Installa dipendenze:
   ```bash
   npm install
   ```
2. Crea `.env` da `.env.example`.
3. Avvia PostgreSQL locale (opzionale in locale demo: l'app usa fallback dati se DB non raggiungibile).

## Prisma migrate
```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

## Seed database
```bash
npm run prisma:seed
```

## Run in development
```bash
npm run dev
```

## Build produzione
```bash
npm run build
npm run start
```

## Accesso rapido demo
Dalla landing il bottone **Enter Revenue OS** passa da `/api/auth/demo`, imposta un cookie JWT demo e apre `/dashboard`.
In assenza database configurato, la dashboard resta comunque funzionante con dati demo fallback.
