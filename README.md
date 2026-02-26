# Revenue OS

Revenue OS è una web app full-stack costruita con Next.js 14 per il controllo e la previsione del fatturato.

## Stack
- Next.js 14 + TypeScript + TailwindCSS
- Recharts + Framer Motion + Zustand
- API Routes di Next.js
- PostgreSQL + Prisma
- JWT auth con cookie httpOnly

## Setup
1. Installa dipendenze:
   ```bash
   npm install
   ```
2. Crea `.env` da `.env.example`.
3. Avvia PostgreSQL locale.

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
