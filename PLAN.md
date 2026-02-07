# Instagram Profile Viewer - Implementation Plan

## Project Structure
```
ig-assessment/
├── backend/          # NestJS backend
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── instagram/
│   │   │   ├── instagram.module.ts
│   │   │   ├── instagram.controller.ts
│   │   │   ├── instagram.service.ts
│   │   │   └── dto/
│   │   │       ├── search-query.dto.ts
│   │   │       ├── user-param.dto.ts
│   │   │       ├── feed-query.dto.ts
│   │   │       └── comments-query.dto.ts
│   │   └── proxy/
│   │       ├── proxy.module.ts
│   │       ├── proxy.controller.ts   # Image/video proxy
│   │       └── proxy.service.ts
│   └── package.json
├── frontend/         # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts
│   │   │   ├── app.routes.ts
│   │   │   ├── core/
│   │   │   │   └── services/
│   │   │   │       └── instagram.service.ts
│   │   │   ├── shared/
│   │   │   │   ├── pipes/
│   │   │   │   └── components/
│   │   │   └── features/
│   │   │       ├── search/
│   │   │       ├── profile/
│   │   │       ├── post-detail/
│   │   │       ├── reel-viewer/
│   │   │       └── story-viewer/
│   │   └── styles.scss
│   └── package.json
└── README.md
```

## API Endpoints Discovered (IMAI)

| Feature | IMAI Endpoint | Param | Pagination |
|---------|--------------|-------|-----------|
| Search users | `GET /raw/ig/search/users/` | `keyword` | `has_more` |
| User info | `GET /raw/ig/user/info/` | `url` (username) | N/A |
| User feed | `GET /raw/ig/user/feed/` | `url`, `after` (cursor) | `end_cursor`, `more_available` |
| User reels | `GET /raw/ig/user/reels/` | `url`, `after` (cursor) | `end_cursor`, `more_available` |
| User stories | `GET /raw/ig/user/stories/` | `url` | N/A |
| User highlights | `GET /raw/ig/user/highlights/` | `url` | N/A |
| Highlight detail | `GET /raw/ig/highlight/info/` | `highlight_id` | N/A (500 error currently) |
| Media info | `GET /raw/ig/media/info/` | `code` (shortcode) | N/A |
| Media comments | `GET /raw/ig/media/comments/` | `code`, `after` | `end_cursor`, `has_more_comments` |
| Comment replies | `GET /raw/ig/media/comments/replies/` | `code`, `comment_id` | `end_cursor` |
| Contacts | `GET /exports/contacts/` | `url` | N/A |
| Hashtag feed | `GET /raw/ig/hashtag/feed/` | `hashtag` | Likely cursor-based |
| Search reels | `GET /raw/ig/search/reels/` | `keyword` | N/A |

**Note:** Tagged posts and reposts endpoints don't exist in the API. We'll show empty states for those tabs.

## Backend (NestJS) Plan

### Endpoints to create:
1. `GET /api/search?q=<query>` → proxies to `/raw/ig/search/users/?keyword=`
2. `GET /api/user/:username` → proxies to `/raw/ig/user/info/?url=` + `/exports/contacts/?url=`
3. `GET /api/user/:username/feed?cursor=` → proxies to `/raw/ig/user/feed/?url=&after=`
4. `GET /api/user/:username/reels?cursor=` → proxies to `/raw/ig/user/reels/?url=&after=`
5. `GET /api/user/:username/stories` → proxies to `/raw/ig/user/stories/?url=`
6. `GET /api/user/:username/highlights` → proxies to `/raw/ig/user/highlights/?url=`
7. `GET /api/highlight/:highlightId` → proxies to `/raw/ig/highlight/info/?highlight_id=`
8. `GET /api/media/:code` → proxies to `/raw/ig/media/info/?code=`
9. `GET /api/media/:code/comments?cursor=` → proxies to `/raw/ig/media/comments/?code=&after=`
10. `GET /api/media/:code/comments/:commentId/replies?cursor=` → proxies to `/raw/ig/media/comments/replies/?code=&comment_id=`
11. `GET /api/hashtag/:tag` → proxies to `/raw/ig/hashtag/feed/?hashtag=`
12. `GET /api/proxy/media?url=` → Proxies Instagram CDN images/videos to fix CORS

### Key architecture decisions:
- Use HttpModule (axios) for upstream API calls
- Single InstagramService with methods for each IMAI endpoint
- Media proxy endpoint to serve Instagram CDN content through our backend (avoids CORS issues)
- Input validation via class-validator DTOs
- Proper error mapping from IMAI errors to HTTP status codes
- CORS enabled for the Angular frontend

## Frontend (Angular) Plan

### Components & Routes:
- `/` → Search page (home)
- `/:username` → Profile page
- `/:username/post/:code` → Post detail (modal overlay on profile)
- `/:username/reel/:code` → Reel viewer

### Feature breakdown:

**1. Search (2.1)**
- SearchComponent with autocomplete dropdown
- Debounced input (300ms)
- Each result: avatar, username, full name, verified badge, follower count

**2. Profile Header (2.2)**
- Large circular profile pic with story ring (gradient) if active stories
- Username + verified badge
- Stats row: posts, followers, following
- Bold full name, bio text, external URL
- Contact info section

**3. Stories & Highlights Bar (2.3)**
- Horizontal scrollable row of highlights (circular thumbnails + titles)
- Story ring on profile pic when active stories

**4. Tab Navigation & Content Grid (2.4)**
- Tabs: Posts, Reels, Reposts, Tagged
- 3-column grid
- Hover overlay (likes + comments)
- Video/reel play icon + view count overlay
- Carousel multi-image icon overlay
- Infinite scroll with cursor pagination

**5. Post Detail Modal (2.5)**
- Left: image/video/carousel with arrows
- Right: user info, caption, comments (paginated), engagement stats
- URL updates on open, deep-linkable
- Click outside to close

**6. Reel Viewer (2.6)**
- Vertical full-screen style video
- Play/pause on click
- Username, caption, audio info overlay
- Engagement stats on right side
- Swipe/arrow navigation

**7. Story Viewer (2.7)**
- Full-screen overlay
- Progress bar segments
- Auto-advance (5s images, video duration for videos)
- Left/right click navigation
- Username + timestamp
- Close button

**8. Responsive Design (2.8)**
- CSS Grid responsive layout
- Mobile: full-screen modals, 3-col grid preserved

### Bonus features to implement:
- Comment replies (nested)
- Hashtag exploration (clickable hashtags → mini-feed)
- User mentions (@mentions → navigate to profile)
- Keyboard navigation (arrows, Escape)
- Dark mode toggle
- Skeleton loading (shimmer placeholders)

## Implementation Order

1. **Backend scaffolding** - NestJS project, modules, CORS, HttpModule
2. **Backend endpoints** - All controller/service/DTO implementation
3. **Backend media proxy** - Image/video proxy for CDN content
4. **Frontend scaffolding** - Angular project, routing, services
5. **Frontend search** - Search bar + autocomplete
6. **Frontend profile header** - Profile info display + contacts
7. **Frontend stories & highlights bar** - Highlights row, story ring
8. **Frontend content grid** - Tab nav, 3-col grid, infinite scroll
9. **Frontend post detail modal** - Modal with carousel, comments
10. **Frontend reel viewer** - Full-screen video viewer
11. **Frontend story viewer** - Story overlay with progress/auto-advance
12. **Frontend polish** - Responsive, dark mode, skeleton loading, keyboard nav
13. **Bonus features** - Comment replies, hashtag exploration, mentions
