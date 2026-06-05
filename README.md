# Memori — Flashcards con repetición espaciada

Aplicación web de estudio con flashcards, inspirada en Anki pero con una interfaz moderna.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Appwrite (Auth + Database + Storage)
- Vercel (deploy)

## Configuración rápida

### 1. Appwrite
1. Crea cuenta en [cloud.appwrite.io](https://cloud.appwrite.io)
2. Crea un proyecto → copia el **Project ID**
3. En **Auth** → habilita Email/Password
4. En **Databases** → crea base de datos con ID `memori-db`
5. Crea estas colecciones (ver detalles abajo):
   - `decks`
   - `cards`
   - `reviews`
   - `user_stats`
6. En **Storage** → crea bucket `card-images`
7. En **Settings > Platforms** → añade `http://localhost:3000`

### 2. Variables de entorno
Copia `.env.local` y pon tus IDs reales:
```
NEXT_PUBLIC_APPWRITE_PROJECT_ID=tu-project-id-aqui
```

### 3. Instalar y ejecutar
```bash
npm install
npm run dev
```

## Colecciones de Appwrite

### `decks`
| Atributo | Tipo | Requerido | Default |
|---|---|---|---|
| userId | String(36) | Sí | — |
| name | String(100) | Sí | — |
| description | String(500) | No | "" |
| color | String(7) | No | "#f59e0b" |
| totalCards | Integer | No | 0 |
| dueCards | Integer | No | 0 |
| lastStudied | Datetime | No | — |

Índices: `userId` (key), `userId+updatedAt` (key)

### `cards`
| Atributo | Tipo | Requerido | Default |
|---|---|---|---|
| userId | String(36) | Sí | — |
| deckId | String(36) | Sí | — |
| question | String(1000) | Sí | — |
| answer | String(5000) | Sí | — |
| tags | String(50)[] | No | [] |
| imageId | String(36) | No | — |
| difficulty | Integer | No | 0 |
| nextReview | Datetime | No | — |
| interval | Integer | No | 1 |
| easeFactor | Float | No | 2.5 |
| repetitions | Integer | No | 0 |

Índices: `userId`, `deckId`, `userId+nextReview` (key), `deckId+createdAt`

### `reviews`
| Atributo | Tipo | Requerido |
|---|---|---|
| userId | String(36) | Sí |
| cardId | String(36) | Sí |
| deckId | String(36) | Sí |
| rating | Integer | Sí |
| timeSpent | Integer | No |
| reviewedAt | Datetime | Sí |

Índices: `userId`, `userId+reviewedAt`, `cardId`

### `user_stats`
| Atributo | Tipo | Default |
|---|---|---|
| userId | String(36) | — |
| currentStreak | Integer | 0 |
| longestStreak | Integer | 0 |
| lastStudyDate | Datetime | — |
| totalReviews | Integer | 0 |
| totalTimeSeconds | Integer | 0 |
| cardsLearned | Integer | 0 |

Índice: `userId`

## Permisos
En todas las colecciones:
- Activa **Document Security**
- El código asigna permisos automáticamente por usuario

## Deploy en Vercel
1. Sube el repo a GitHub
2. Importa en [vercel.com](https://vercel.com)
3. Añade todas las variables de entorno
4. Deploy → añade el dominio a Platforms en Appwrite

## Atajos de teclado (sesión de estudio)
- `Espacio` → Mostrar respuesta
- `1` → Muy difícil
- `2` → Difícil
- `3` → Fácil
- `4` → Muy fácil
