PLEASE READ DOCS AT DOCS.md
# Instagram Profile Viewer

A full-stack Instagram Profile Viewer that replicates the look and feel of an Instagram profile page using real data from the IMAI API. Built with **NestJS** (backend) and **Angular 19** (frontend).

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm 9+
- Angular CLI (`npm install -g @angular/cli`)

### Backend Setup

```bash
cd backend
npm install
npm run start:dev
```

The backend runs on `http://localhost:3000`. API endpoints are prefixed with `/api`.

### Frontend Setup

```bash
cd frontend
npm install
ng serve
```

The frontend runs on `http://localhost:4200`.

### Environment Variables

The backend uses environment variables configured in `backend/.env`:

- `IMAI_API_KEY` - API key for the IMAI API
- `IMAI_BASE_URL` - Base URL for the IMAI API (defaults to `https://imai.co/api`)

## Architecture & Design Decisions

### Backend (NestJS)

- **Modular architecture**: All Instagram-related functionality is encapsulated in a single `InstagramModule` with clean separation between controllers, services, DTOs, and interfaces.
- **Service layer pattern**: `ImaiApiService` handles raw HTTP communication with the IMAI API, while `InstagramService` maps raw API responses to clean, typed domain models.
- **Media proxy**: A dedicated media proxy endpoint (`/api/instagram/media/proxy`) handles CORS issues with Instagram CDN URLs, with domain allowlisting for security.
- **Input validation**: All endpoints use class-validator DTOs with NestJS ValidationPipe for request validation.
- **Error handling**: Global exception filter catches all errors and returns consistent JSON error responses.
- **No `any` types**: All TypeScript interfaces are fully typed with explicit raw API response types.

### Frontend (Angular 19)

- **Standalone components**: All components use Angular 19's standalone component pattern — no NgModules.
- **Signals-based state**: State management uses Angular signals for reactive, fine-grained updates.
- **Lazy loading**: Routes use dynamic imports for code splitting. Images use native `loading="lazy"`.
- **CSS custom properties**: Theme system uses CSS variables, enabling instant light/dark mode switching.
- **Responsive design**: All components adapt between desktop and mobile layouts at 735px breakpoint, matching Instagram's behavior.

### API Integration

The backend acts as a middleware layer between the Angular frontend and the IMAI API:

| Feature | Backend Endpoint | IMAI Endpoint |
|---------|-----------------|---------------|
| Search | `GET /api/instagram/search?q=` | `/raw/ig/search/users/` |
| Profile | `GET /api/instagram/profile/:username` | `/raw/ig/user/info/` |
| Posts | `GET /api/instagram/feed/:username/posts` | `/raw/ig/user/feed/` |
| Reels | `GET /api/instagram/feed/:username/reels` | `/raw/ig/user/reels/` |
| Tagged | `GET /api/instagram/feed/:username/tagged` | `/raw/ig/user/tagged/` |
| Stories | `GET /api/instagram/feed/:username/stories` | `/raw/ig/user/stories/` |
| Highlights | `GET /api/instagram/feed/:username/highlights` | `/raw/ig/user/highlights/` |
| Highlight Detail | `GET /api/instagram/highlight/:id` | `/raw/ig/highlight/` |
| Post Detail | `GET /api/instagram/post/:postId` | `/raw/ig/media/info/` |
| Comments | `GET /api/instagram/post/:postId/comments` | `/raw/ig/media/comments/` |
| Comment Replies | `GET /api/instagram/post/:postId/comments/:commentId/replies` | `/raw/ig/media/comments/replies/` |
| Contacts | `GET /api/instagram/profile/:username/contacts` | `/exports/contacts/` |
| Hashtag Feed | `GET /api/instagram/hashtag/:tag` | `/raw/ig/hashtag/feed/` |
| Media Proxy | `GET /api/instagram/media/proxy?url=` | Direct CDN proxy |

All paginated endpoints support cursor-based pagination via `?cursor=` query parameter.

## Features Implemented

### Core Features (Part 1 & 2)

- **Search**: Autocomplete dropdown with debounced search, profile pictures, verified badges, and follower counts
- **Profile Header**: Full Instagram-style layout with profile picture (story ring), stats, bio, external URL
- **Stories & Highlights**: Highlight thumbnails row, clickable to open story viewer
- **Tab Navigation**: Posts / Reels / Tagged tabs with Instagram-style icons
- **Content Grid**: 3-column grid with hover overlays (likes + comments), play/carousel indicators
- **Infinite Scroll**: Cursor-based pagination with intersection observer
- **Post Detail Modal**: Left media (carousel/video/image) + right sidebar with comments, likes, timestamp
- **Reel Viewer**: Full-screen vertical video player with play/pause, mute, engagement stats
- **Story Viewer**: Full-screen overlay with progress bars, auto-advance (5s for images), click navigation
- **Contact Info**: Email, phone, and social links display
- **Media Handling**: Backend media proxy for CORS-safe image/video loading

### Bonus Features (Part 3)

- **Comment Replies**: "View replies" button under comments with nested reply loading and pagination
- **Hashtag Exploration**: Hashtags in captions are clickable links (rendered via `CaptionPipe`)
- **User Mentions**: @mentions in captions are clickable links (rendered via `CaptionPipe`)
- **Keyboard Navigation**: Arrow keys navigate between posts in detail modal, Escape closes modals, arrow keys navigate reels and stories
- **Dark Mode**: Full dark theme support with localStorage persistence, system preference detection, and toggle button in header
- **Skeleton Loading**: Shimmer animation skeleton placeholders for profile header, search results, comments, and grid items

## Project Structure

```
ig-assessment/
├── backend/
│   ├── src/
│   │   ├── common/
│   │   │   └── filters/           # Global exception filter
│   │   ├── instagram/
│   │   │   ├── controllers/       # Route handlers (search, profile, feed, post, highlight, hashtag, media-proxy)
│   │   │   ├── services/          # Business logic (ImaiApiService, InstagramService)
│   │   │   ├── dto/               # Request validation DTOs
│   │   │   ├── interfaces/        # TypeScript interfaces
│   │   │   └── instagram.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── .env
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── core/
│       │   │   ├── models/        # TypeScript interfaces
│       │   │   └── services/      # API service, Theme service
│       │   ├── shared/
│       │   │   ├── components/    # Skeleton, VerifiedBadge
│       │   │   ├── pipes/         # TimeAgo, ShortNumber, Caption
│       │   │   └── directives/    # IntersectionObserver
│       │   └── features/
│       │       ├── search/        # Search component
│       │       └── profile/       # Profile page + sub-components
│       └── styles.scss            # Global styles with theme variables
└── README.md
```


