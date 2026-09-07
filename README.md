# Pulse — Backend API

Node.js/Express REST API for the Smart Event Management Platform. Handles authentication, event CRUD, bookmarks, and live weather enrichment for event venues.

## Tech Stack

- **Runtime:** Node.js 18+, Express
- **Database:** MongoDB with Mongoose ODM
- **Auth:** JWT (jsonwebtoken) + bcryptjs for password hashing
- **External API:** Open-Meteo Geocoding API + Forecast API (no key required)

## Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js               # Mongoose connection
│   ├── models/
│   │   ├── User.js              # User schema (bcrypt password hashing)
│   │   └── Event.js             # Event schema (text index for search)
│   ├── middleware/
│   │   ├── auth.js              # JWT "protect" middleware
│   │   └── errorHandler.js      # 404 + centralized error handler
│   ├── controllers/
│   │   ├── authController.js    # register / login / getMe
│   │   └── eventController.js   # event CRUD, bookmarks, weather
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── eventRoutes.js
│   ├── utils/
│   │   ├── weatherApi.js        # Open-Meteo integration
│   │   └── seed.js              # Sample data seeder
│   ├── app.js                   # Express app config (CORS, JSON, routes)
│   └── server.js                # Entry point — connects DB, starts server
├── package.json
└── .env.example
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm
- A MongoDB instance — either:
  - Local: [MongoDB Community Server](https://www.mongodb.com/try/download/community), or
  - Cloud: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Installation

```bash
cd backend
npm install
cp .env.example .env      # then edit MONGO_URI and JWT_SECRET
npm run seed                # loads 5 sample events into the DB
npm run dev                  # starts API on http://localhost:5000
```

### Environment Variables

| Variable | Description |
|---|---|
| `PORT` | API server port (default 5000) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_ORIGIN` | Frontend origin, for CORS |
| `GEOCODING_API_BASE` | Open-Meteo geocoding endpoint (defaults set) |
| `WEATHER_API_BASE` | Open-Meteo forecast endpoint (defaults set) |

### Run Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start API with nodemon (auto-reload) |
| `npm start` | Start API in production mode |
| `npm run seed` | Seed 5 sample events into the database |

## API Documentation

Base URL: `http://localhost:5000/api`

All authenticated endpoints require header: `Authorization: Bearer <token>`

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Returns `{ status: "ok" }` |

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account, returns JWT |
| POST | `/auth/login` | — | Log in, returns JWT |
| GET | `/auth/me` | ✅ | Current user profile + bookmark IDs |

**POST `/auth/register`**
```json
// Request
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123" }

// Response 201
{
  "token": "eyJhbGciOi...",
  "user": { "id": "66f...", "name": "Jane Doe", "email": "jane@example.com" }
}
```

**POST `/auth/login`**
```json
// Request
{ "email": "jane@example.com", "password": "secret123" }

// Response 200
{
  "token": "eyJhbGciOi...",
  "user": { "id": "66f...", "name": "Jane Doe", "email": "jane@example.com" }
}
```

**GET `/auth/me`**
```json
// Response 200
{ "id": "66f...", "name": "Jane Doe", "email": "jane@example.com", "bookmarks": ["66a...", "66b..."] }
```

### Events

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/events` | — | List events (query: `search, category, city, isOnline, from, to, page, limit`) |
| GET | `/events/:id` | — | Event details |
| GET | `/events/:id/weather` | — | Live weather for the event's venue |
| POST | `/events` | ✅ | Create an event |
| PUT | `/events/:id` | ✅ (owner only) | Update an event |
| DELETE | `/events/:id` | ✅ (owner only) | Delete an event |
| POST | `/events/:id/bookmark` | ✅ | Toggle bookmark on/off |
| GET | `/events/bookmarks/me` | ✅ | List current user's bookmarked events |

**GET `/events?search=react&category=Conference&page=1`**
```json
{
  "events": [
    {
      "_id": "66f1...",
      "title": "React Summit",
      "category": "Conference",
      "date": "2026-11-12T00:00:00.000Z",
      "location": { "city": "Amsterdam", "country": "Netherlands" },
      "isOnline": false,
      "tags": ["react", "frontend"]
    }
  ],
  "pagination": { "total": 1, "page": 1, "pages": 1 }
}
```

**POST `/events`**
```json
// Request
{
  "title": "Node.js Meetup",
  "description": "Monthly meetup for backend developers.",
  "category": "Meetup",
  "date": "2026-10-05T18:00:00.000Z",
  "isOnline": false,
  "location": { "city": "Colombo", "country": "Sri Lanka" },
  "tags": ["nodejs", "backend"],
  "capacity": 80
}

// Response 201 — the created event document
```

**GET `/events/:id/weather`**
```json
{
  "location": { "city": "Amsterdam", "country": "Netherlands", "lat": 52.37, "lon": 4.89 },
  "weather": {
    "current": { "temperature_2m": 14.2, "wind_speed_10m": 11.4 },
    "daily": { "temperature_2m_max": [15.1], "temperature_2m_min": [9.8] }
  }
}
```

**POST `/events/:id/bookmark`**
```json
// Response 200
{ "bookmarked": true, "bookmarks": ["66a...", "66b..."] }
```

## Architecture Decisions

**Tech choices** — Express + Mongoose because the data model (events, users, bookmarks) is naturally document-shaped, and Mongoose provides schema validation without SQL migration overhead.

**Folder structure** — Standard MVC-ish split (`models` / `controllers` / `routes` / `middleware`) so responsibilities stay isolated and testable independently of the HTTP layer.

**Authentication** — Stateless JWT auth: passwords hashed with bcrypt (10 salt rounds), a signed JWT returned on login/register, verified per-request via a `protect` middleware. This keeps the API stateless and horizontally scalable, at the cost of no built-in token revocation (see Future Improvements).

**External API integration** — Open-Meteo was chosen over a paid weather provider because it requires no API key and has generous free-tier limits. Coordinates are geocoded once per event and cached on the `Event` document (`location.lat` / `location.lon`) to avoid re-geocoding on every request.

**Tradeoffs / Assumptions**
- Single "owner" model for events — no team/co-organizer support.
- Weather is fetched live on each request rather than cached with a TTL, since the assignment scope didn't call for a caching layer.
- Text search uses MongoDB's built-in `$text` index rather than a dedicated search engine (e.g. Elasticsearch), which is sufficient at this scale.
- No request rate limiting yet on auth endpoints.

## Future Improvements

**Features:** RSVP/attendee lists, email notifications/reminders, event cover image uploads, admin moderation endpoints.

**Scalability:** Redis cache for weather responses and hot event queries; background job for geocoding instead of on-demand; compound indexes for common filter combinations (category + date, city + date).

**Security:** refresh-token rotation and revocation/blacklisting, rate limiting on auth routes (e.g. `express-rate-limit`), request validation via Zod/Joi on all write endpoints, `helmet.js` for HTTP header hardening, move tokens to HTTP-only cookies instead of client-stored JWTs to reduce XSS exposure.