# Social Media Hub - Social Media Content Creator Hub

## Project Overview

**Social Media Hub** is a comprehensive AI-powered platform for social media creators, marketers, and brand managers. It streamlines the content creation lifecycle through four specialized modules:

1. **AI Calendar Generator**: Generates 1-30 day content calendars based on brand strategy, complete with platform-specific posts, content pillars, and content-type awareness.
2. **URL Content Repurposer**: Transforms web articles or YouTube videos into social-ready carousels, threads, posts, and video scripts.
3. **Community Engagement Planner**: Creates platform-optimized engagement ladders using awareness, poll, question, storytelling, and CTA steps.
4. **AI Caption & Bio Generator**: Produces 3-5 AI variations of captions, bios, taglines, and descriptions with platform-specific character limits.

The application follows a hub-and-spoke design, uses multi-provider AI failover, and stores user content, history, favorites, and profile stats in Google Firestore.

---

## Tech Stack

| Layer        | Technology                                                                    |
| ------------ | ----------------------------------------------------------------------------- |
| **Frontend** | React 19, TailwindCSS 3, Radix UI (shadcn/ui), Framer Motion, React Router 7 |
| **Backend**  | Python 3, FastAPI, Uvicorn, Pydantic v2                                       |
| **Database** | Google Firestore (NoSQL)                                                      |
| **Auth**     | Firebase Authentication (Email/Password + Google OAuth)                       |
| **AI**       | Gemini, OpenAI, Grok (xAI), OpenRouter - Multi-provider failover              |
| **Build**    | CRACO (Create React App Configuration Override)                               |

---

## Project Structure

```text
content_calender_4_3_2026/
|-- README.md
|-- data_project.md
|-- backend/
|   |-- .env
|   |-- server.py
|   |-- ai_gateway.py
|   |-- auth_middleware.py
|   |-- firebase_config.py
|   |-- firestore_service.py
|   |-- url_content_service.py
|   |-- community_engagement_service.py
|   |-- caption_bio_service.py
|   |-- content_extractor.py
|   |-- tester_api.py
|   |-- requirements.txt
|   `-- venv/
`-- frontend/
    |-- .env
    |-- package.json
    |-- craco.config.js
    |-- tailwind.config.js
    |-- postcss.config.js
    |-- public/
    |-- build/
    `-- src/
        |-- App.js
        |-- App.css
        |-- index.js
        |-- index.css
        |-- firebase.js
        |-- contexts/
        |   `-- AuthContext.js
        |-- hooks/
        |   `-- use-toast.js
        |-- lib/
        |   |-- axiosConfig.js
        |   `-- utils.js
        |-- components/
        |   |-- Navbar.js
        |   |-- ProtectedRoute.js
        |   `-- ui/
        `-- pages/
            |-- HomePage.js
            |-- Dashboard.js
            |-- CalendarView.js
            |-- UrlGeneratorPage.js
            |-- UrlGenerationView.js
            |-- EngagementPlannerPage.js
            |-- EngagementPlanView.js
            |-- CaptionBioPage.js
            |-- CaptionGenerationView.js
            |-- HistoryPage.js
            |-- ProfilePage.js
            |-- LoginPage.js
            `-- RegisterPage.js
```

---

## Architecture Diagram

```text
+--------------------------------------------------------------------+
|                    FRONTEND HUB (HomePage.js)                      |
|                                                                    |
|  Calendar Generator | URL Repurposer | Engagement Planner          |
|  Caption & Bio Generator | History | Profile                       |
|                                                                    |
|  Axios (axiosConfig.js) - Unified Auth and API communication       |
+-------------------------------+------------------------------------+
                                |
                                | HTTP (REST API)
                                v
+--------------------------------------------------------------------+
|                        BACKEND (FastAPI)                            |
|                                                                    |
|  server.py (entry) -> auth_middleware.py -> service modules         |
|                                                                    |
|  /api/calendars   -> firestore_service.py                           |
|  /api/url         -> url_content_service.py + content_extractor.py  |
|  /api/community   -> community_engagement_service.py                |
|  /api/caption     -> caption_bio_service.py                         |
|                                                                    |
|  ai_gateway.py -> Gemini -> OpenAI -> Grok -> OpenRouter           |
+-------------------------------+------------------------------------+
                                |
                    +-----------+-----------+
                    |                       |
                    v                       v
              [ AI Providers ]      [ Google Firestore ]
```

---

## Backend - API Endpoints

### Core & Auth

| Method | Endpoint                    | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| GET    | `/api/health`               | Health/status check                |
| GET    | `/api/auth/me`              | Get current authenticated user     |
| GET    | `/api/auth/profile`         | Fetch current user profile         |
| PUT    | `/api/auth/profile`         | Update profile details             |
| GET    | `/api/user/dashboard-stats` | Fetch profile/dashboard statistics |

### Calendar Generator

| Method | Endpoint                      | Description                       |
| ------ | ----------------------------- | --------------------------------- |
| POST   | `/api/strategy`               | Generate a content calendar       |
| GET    | `/api/history`                | List calendar history             |
| GET    | `/api/calendar/{id}`          | Get a single generated calendar   |
| DELETE | `/api/calendar/{id}`          | Delete a calendar                 |
| POST   | `/api/calendar/{id}/favorite` | Toggle calendar favorite          |
| POST   | `/api/posts/regenerate`       | Regenerate an individual post     |
| POST   | `/api/posts/content`          | Generate hashtags, CTA, or emojis |
| PATCH  | `/api/posts/status`           | Update post status                |

### URL Repurposer

| Method | Endpoint                   | Description                        |
| ------ | -------------------------- | ---------------------------------- |
| POST   | `/api/url/analyze`         | Analyze article or YouTube source  |
| POST   | `/api/url/generate`        | Generate repurposed social content |
| GET    | `/api/url/history`         | List URL generation history        |
| GET    | `/api/url/generation/{id}` | Get a single URL generation        |
| DELETE | `/api/url/{id}`            | Delete URL generation              |
| POST   | `/api/url/{id}/favorite`   | Toggle URL generation favorite     |

### Engagement Planner

| Method | Endpoint                       | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| POST   | `/api/community/plan`          | Generate an engagement plan      |
| GET    | `/api/community/plans`         | List engagement plans            |
| GET    | `/api/community/plan/{id}`     | Get a single engagement plan     |
| DELETE | `/api/community/{id}`          | Delete engagement plan           |
| POST   | `/api/community/{id}/favorite` | Toggle engagement plan favorite  |

### Caption & Bio Generator

| Method | Endpoint                       | Description                         |
| ------ | ------------------------------ | ----------------------------------- |
| POST   | `/api/caption/generate`        | Generate captions, bios, or taglines |
| GET    | `/api/caption/history`         | List caption generation history     |
| GET    | `/api/caption/generation/{id}` | Get a single caption generation     |
| DELETE | `/api/caption/{id}`            | Delete caption generation           |
| POST   | `/api/caption/{id}/favorite`   | Toggle caption generation favorite  |
| GET    | `/api/caption/limits`          | Get platform character limits       |

---

## Data Models

### Calendar System

- **StrategyInput**: `brand_name`, `industry`, `target_audience`, `goals[]`, `tone`, `content_themes[]`, `preferred_content_types`, `content_length`, `generation_mode`, `duration_days`
- **ContentPillar**: `title`, `description`, `platforms[]`
- **SocialPost**: `id`, `platform`, `content`, `pillar`, `date`, `status`, `content_type`
- **GeneratedCalendar**: `id`, `strategy`, `pillars[]`, `posts[]`, `created_at`, `is_favorite`

### URL Repurposer

- **UrlAnalyzeRequest**: `url`
- **UrlGenerateRequest**: `source_url`, `url_type`, `extracted_summary`, `analysis{}`, `target_audience`, `goal`, `platform`, `format`, `tone`

### Engagement Planner

- **EngagementPlanInput**: `goal`, `target_audience`, `industry`, `tone`, `platform`, `content_length`
- **Plan Output**: 5-post ladder covering awareness, poll, question, storytelling, and CTA

### Caption & Bio Generator

- **CaptionBioInput**: `content_type`, `platform`, `brand_name`, `tone`, `key_points`, `num_variations`
- **Platform Limits**:
  - Instagram: bio 150, caption 2200
  - Twitter/X: bio 160, caption 280
  - LinkedIn: bio 2600, headline 220
  - Facebook: bio 101, description 255

---

## Key Features

### 1. Home Page - Module Hub

- Central landing page linking all major content tools
- Personalized greeting and dashboard stats
- Quick access to history and profile sections
- Platform-aware, module-driven workflow

### 2. AI Calendar Generator

- Generates 1-30 day calendars from brand strategy
- Supports platform-specific formats such as reels, carousels, threads, posts, and polls
- Allows inline editing, status updates, and single-post regeneration
- Generates hashtags, CTA text, and emoji suggestions

### 3. URL Content Repurposing

- Extracts content from web pages and YouTube transcripts
- Uses a two-step analyze and generate workflow
- Produces platform-ready posts, carousels, threads, and video scripts

### 4. Community Engagement Planner

- Builds 5-step engagement ladders for community growth
- Adapts output to the selected platform
- Supports awareness, poll, question, storytelling, and CTA sequencing

### 5. AI Caption & Bio Generator

- Creates captions, bios, taglines, and descriptions
- Produces 3-5 variations per request
- Enforces platform-specific character limits
- Supports copy-to-clipboard and history saving

### 6. Multi-Provider AI Failover

- Rotates between multiple Gemini keys
- Falls back across multiple AI providers
- Improves reliability when provider limits or outages occur

### 7. Universal Content History

- Organizes calendars, URL generations, engagement plans, and captions
- Supports sorting, filtering, favorites, and deletion
- Provides quick access to detail pages for each content type

### 8. User Profile Dashboard

- Displays account info and editable user details
- Shows stats across all modules
- Includes content distribution and recent activity views

---

## Frontend Routing

| Path                      | Component             | Description                     |
| ------------------------- | --------------------- | ------------------------------- |
| `/`                       | HomePage              | Module hub landing              |
| `/login`                  | LoginPage             | Email/password and Google login |
| `/register`               | RegisterPage          | User registration               |
| `/calendar-generator`     | Dashboard             | Calendar creation wizard        |
| `/calendar/:id`           | CalendarView          | Calendar detail view            |
| `/url-generator`          | UrlGeneratorPage      | URL repurposing tool            |
| `/url-generation/:id`     | UrlGenerationView     | URL generation detail view      |
| `/engagement-planner`     | EngagementPlannerPage | Engagement planner tool         |
| `/engagement-plan/:id`    | EngagementPlanView    | Engagement plan detail view     |
| `/caption-generator`      | CaptionBioPage        | Caption and bio generation tool |
| `/caption-generation/:id` | CaptionGenerationView | Caption generation detail view  |
| `/history`                | HistoryPage           | Universal content history       |
| `/profile`                | ProfilePage           | Profile dashboard and settings  |

---

## Firestore Database Schema

```text
Firestore Root
`-- users (collection)
    `-- {uid} (document)
        |-- profile fields
        |   |-- total_posts
        |   |-- total_calendars
        |   |-- favorites_count
        |   |-- url_generations
        |   |-- engagement_plans
        |   |-- caption_generations
        |   `-- total_content
        |-- calendars (subcollection)
        |   `-- {id}: strategy, posts[], pillars[], is_favorite, created_at
        |-- url_generations (subcollection)
        |   `-- {id}: source_url, url_type, analysis, final_output, is_favorite, created_at
        |-- engagement_plans (subcollection)
        |   `-- {id}: goal, platform, plan_output{}, is_favorite, created_at
        `-- caption_generations (subcollection)
            `-- {id}: brand_name, platform, content_type, tone, key_points, variations[], char_limit, is_favorite, created_at
```

---

## Backend Service Files

| File                              | Purpose                                        |
| --------------------------------- | ---------------------------------------------- |
| `server.py`                       | Main FastAPI app and route definitions         |
| `ai_gateway.py`                   | AI provider failover and key rotation          |
| `auth_middleware.py`              | Firebase JWT verification                      |
| `firebase_config.py`              | Firebase Admin SDK initialization              |
| `firestore_service.py`            | Core Firestore CRUD and dashboard stats        |
| `url_content_service.py`          | URL repurposer Firestore operations            |
| `community_engagement_service.py` | Engagement planner Firestore operations        |
| `caption_bio_service.py`          | Caption and bio Firestore operations           |
| `content_extractor.py`            | Web scraping and YouTube transcript extraction |
