# Social Media Hub — Social Media Content Creator Hub

## Data Documentation Model

---

## 1. PROJECT DESCRIPTION

**Social Media Hub** is an AI-powered web application designed to assist social media creators, marketers, and brand managers in streamlining the entire content creation lifecycle. The platform leverages multiple artificial intelligence providers — including **Google Gemini**, **OpenAI**, **Grok**, and **OpenRouter** — through an intelligent multi-provider failover system, ensuring uninterrupted content generation even when individual service limits are reached.

Built with a **React 19** frontend and a **Python FastAPI** backend, Social Media Hub offers a modern, responsive, and premium user experience. The application stores all user data, content history, and preferences in **Google Firestore** (NoSQL), and authenticates users via **Firebase Authentication** supporting both Email/Password and Google OAuth sign-in methods.

The platform follows a **"Hub-and-Spoke"** architecture: a central homepage acts as the module hub, connecting users to four specialized AI-powered content tools. Each tool is self-contained yet shares a unified authentication layer, history system, favorites management, and profile dashboard.

**Key Highlights:**
- Multi-provider AI failover with automatic key rotation
- Platform-aware content generation (Instagram, Twitter/X, LinkedIn, Facebook)
- Four specialized AI content modules under one unified interface
- Real-time Firestore integration for data persistence and analytics
- Enterprise-grade architecture with clean separation of concerns

---

## 2. OVERVIEW OF PROJECT

### 2.1 Purpose

The purpose of Social Media Hub is to **eliminate the complexity and repetitiveness** involved in creating social media content across multiple platforms. Instead of manually crafting posts, bios, captions, and engagement strategies, users provide high-level inputs (brand identity, target audience, tone, goals) and the AI generates platform-optimized content within seconds.

### 2.2 Scope

The application covers the following scope areas:

| Area                     | Description                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **Content Calendars**    | AI-generated 1–30 day content calendars with pillar-based content strategy                     |
| **URL Repurposing**      | Extraction and transformation of web articles and YouTube videos into social-ready formats     |
| **Engagement Planning**  | AI-designed community engagement ladders (Awareness → Poll → Question → Story → CTA)          |
| **Caption & Bio Writing**| Quick-fire generation of captions, bios, taglines, and descriptions with character limits      |
| **History & Favorites**  | Centralized content library with sorting, filtering, and favorite management                   |
| **User Profiles**        | Personal dashboards with content statistics, donut charts, and activity timelines              |
| **Authentication**       | Secure login/registration via Firebase (Email/Password + Google OAuth)                         |

### 2.3 Technology Stack

| Layer        | Technology                                                                    |
| ------------ | ----------------------------------------------------------------------------- |
| **Frontend** | React 19, TailwindCSS 3, Radix UI (shadcn/ui), Framer Motion, React Router 7 |
| **Backend**  | Python 3, FastAPI, Uvicorn, Pydantic v2                                       |
| **Database** | Google Firestore (NoSQL)                                                      |
| **Auth**     | Firebase Authentication (Email/Password + Google OAuth)                       |
| **AI**       | Gemini, OpenRouter — Multi-provider failover with key rotation                |
| **Build**    | CRACO (Create React App Configuration Override)                               |

### 2.4 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    FRONTEND HUB (React 19)                           │
│                                                                      │
│  HomePage ──► Calendar Generator | URL Repurposer                    │
│           ──► Engagement Planner | Caption & Bio Generator           │
│           ──► History Page       | Profile Dashboard                 │
│                                                                      │
│  Axios (Auth Interceptor) ── Firebase Auth Context                   │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ REST API (HTTP)
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI + Uvicorn)                        │
│                                                                      │
│  server.py ── auth_middleware.py (Firebase JWT Verification)         │
│      │                                                               │
│      ├─ /api/calendars    ── firestore_service.py                    │
│      ├─ /api/url          ── url_content_service.py + extractor      │
│      ├─ /api/community    ── community_engagement_service.py         │
│      └─ /api/caption      ── caption_bio_service.py                  │
│                                                                      │
│  ai_gateway.py ── Gemini (Key Rotation) → OpenRouter (Failover)      │
└────────────────┬──────────────────────────┬──────────────────────────┘
                 ▼                          ▼
        [ AI Providers ]          [ Google Firestore ]
```

---

## 3. DESCRIPTION OF MODULES

### Module 1: AI Calendar Generator

**Purpose:** Generate AI-powered content calendars spanning 1 to 30 days, tailored to a brand's identity, audience, and strategic goals.

**Key Features:**
- Accepts brand name, industry, target audience, goals, tone, content themes, and preferred content types as input
- Generates structured content calendars with **content pillars** (thematic categories)
- Creates platform-specific posts (Instagram, Twitter/X, LinkedIn, Facebook) with appropriate content types (post, reel, carousel, thread, poll, story, etc.)
- Supports three content length presets: **Short**, **Medium**, and **Long**
- Inline post editing with real-time Firestore sync
- Status management per post: **Draft → Scheduled → Published**
- Single-post AI regeneration for refining individual posts
- AI-powered hashtag, CTA, and emoji generation for any post

**Frontend Pages:** `Dashboard.js` (creation wizard), `CalendarView.js` (detail view)

**Backend Endpoints:** `/api/strategy`, `/api/history`, `/api/calendar/{id}`, `/api/posts/regenerate`, `/api/posts/content`, `/api/posts/status`

**Data Model:**
- `StrategyInput`: brand_name, industry, target_audience, goals[], tone, content_themes[], preferred_content_types, content_length, generation_mode, duration_days
- `ContentPillar`: title, description, platforms[]
- `SocialPost`: id, platform, content, pillar, date, status, content_type
- `GeneratedCalendar`: id, strategy, pillars[], posts[], created_at, is_favorite

---

### Module 2: URL Content Repurposer

**Purpose:** Transform any web article or YouTube video into social media-ready content formats.

**Key Features:**
- **Web Scraping**: Extracts textual content from blog posts and articles using `content_extractor.py`
- **YouTube Transcript Extraction**: Pulls video transcripts for video-to-text conversion
- Two-step workflow: **Analyze** (extract & summarize) → **Generate** (repurpose into target format)
- Supported output formats: **Carousel**, **Thread**, **Post**, **Video Script**
- Platform-specific formatting and character limits applied
- Configurable tone and target audience for output customization

**Frontend Pages:** `UrlGeneratorPage.js` (tool interface), `UrlGenerationView.js` (detail view)

**Backend Endpoints:** `/api/url/analyze`, `/api/url/generate`, `/api/url/history`, `/api/url/generation/{id}`

**Data Model:**
- `UrlAnalyzeRequest`: url (web URL or YouTube link)
- `UrlGenerateRequest`: source_url, url_type, extracted_summary, analysis{}, target_audience, goal, platform, format, tone

---

### Module 3: Community Engagement Planner

**Purpose:** Create structured engagement strategies using a 5-step "engagement ladder" to maximize community interaction on any platform.

**Key Features:**
- Generates a progression of 5 platform-optimized posts designed to build community engagement
- Engagement ladder sequence: **Awareness → Poll → Question → Storytelling → CTA**
- Each step in the ladder is tailored to the specified platform's formatting rules and character limits
- Configurable inputs: goal, target audience, industry, tone, platform, content length

**Frontend Pages:** `EngagementPlannerPage.js` (tool interface), `EngagementPlanView.js` (detail view)

**Backend Endpoints:** `/api/community/plan`, `/api/community/plans`, `/api/community/plan/{id}`

**Data Model:**
- `EngagementPlanInput`: goal, target_audience, industry, tone, platform, content_length
- Plan output: 5-post ladder structure with stage-specific content

---

### Module 4: AI Caption & Bio Generator

**Purpose:** Instantly generate multiple AI-crafted variations of captions, bios, taglines, and descriptions with platform-specific character limits.

**Key Features:**
- Supports 4 content types: **Caption**, **Bio**, **Tagline**, **Description**
- Generates 3–5 unique AI variations per request
- Platform character limits enforced and visually displayed:
  - Instagram: Bio 150, Caption 2200
  - Twitter/X: Bio 160, Caption 280
  - LinkedIn: Bio 2600, Headline 220
  - Facebook: Bio 101, Description 255
- One-click copy-to-clipboard functionality
- Auto-saves to Firestore history

**Frontend Pages:** `CaptionBioPage.js` (tool interface), `CaptionGenerationView.js` (detail view)

**Backend Endpoints:** `/api/caption/generate`, `/api/caption/history`, `/api/caption/generation/{id}`, `/api/caption/limits`

**Data Model:**
- `CaptionBioInput`: content_type, platform, brand_name, tone, key_points, num_variations (3-5)
- Platform limits: Predefined per platform per content type

---

### Module 5: Authentication & User Management

**Purpose:** Secure user authentication and personalized profile management.

**Key Features:**
- Firebase Authentication with Email/Password and Google OAuth
- Protected routes via `ProtectedRoute.js` component
- Axios interceptor auto-attaches Firebase JWT tokens to all API requests
- User profile with editable display name
- Stats dashboard: calendars, posts, favorites, URL generations, engagement plans, caption generations
- Donut chart showing content distribution across modules
- Recent activity timeline with type-specific icons and timestamps

**Frontend Pages:** `LoginPage.js`, `RegisterPage.js`, `ProfilePage.js`

**Backend Endpoints:** `/api/auth/profile`, `/api/auth/me`, `/api/user/dashboard-stats`

---

### Module 6: Universal Content History

**Purpose:** Centralized content library for browsing, filtering, and managing all generated content.

**Key Features:**
- Tabbed interface with 4 tabs: **Calendars**, **URL Generations**, **Engagement Plans**, **Captions**
- Sorting: Newest first / Oldest first
- Filtering: All / Favorites only
- Pagination support for large content libraries
- Delete and favorite toggle actions on each item
- One-click navigation to detail view for any content item

**Frontend Pages:** `HistoryPage.js`

---

## 4. FUNCTIONAL REQUIREMENTS

### FR-01: User Registration & Login
- The system shall allow users to register using Email/Password credentials.
- The system shall allow users to sign in via Google OAuth.
- The system shall issue Firebase JWT tokens upon successful authentication.
- The system shall protect all content-generation routes behind authentication.

### FR-02: AI Calendar Generation
- The system shall accept brand strategy inputs (brand name, industry, audience, goals, tone, themes, content types, length, duration).
- The system shall generate AI-powered content calendars for 1 to 30 days.
- The system shall produce platform-specific social media posts with assigned content pillars.
- The system shall allow inline editing of post content with real-time Firestore persistence.
- The system shall support changing individual post status (Draft, Scheduled, Published).
- The system shall enable single-post AI regeneration.
- The system shall generate AI-powered hashtags, CTAs, and emojis on demand.

### FR-03: URL Content Repurposing
- The system shall accept a web URL or YouTube link as input.
- The system shall extract and summarize content from web pages and YouTube transcripts.
- The system shall repurpose extracted content into social media formats (Carousel, Thread, Post, Video Script).
- The system shall apply platform-specific formatting and character limits to generated content.

### FR-04: Community Engagement Planning
- The system shall generate a 5-post engagement ladder based on user-provided inputs.
- Each engagement ladder shall follow the sequence: Awareness → Poll → Question → Storytelling → CTA.
- The system shall format each ladder post according to the selected platform's rules and limits.

### FR-05: Caption & Bio Generation
- The system shall generate 3 to 5 AI variations for captions, bios, taglines, or descriptions.
- The system shall enforce platform-specific character limits (Instagram, Twitter/X, LinkedIn, Facebook).
- The system shall provide a copy-to-clipboard function for each generated variation.
- The system shall automatically save all generations to Firestore.

### FR-06: Content History Management
- The system shall display all generated content in a tabbed history interface (Calendars, URL Gens, Engagement Plans, Captions).
- The system shall support sorting by creation date (newest/oldest).
- The system shall support filtering by favorites.
- The system shall allow deletion of individual history items.
- The system shall support toggling favorite status on any content item.

### FR-07: User Profile & Dashboard
- The system shall display a profile page with account information and editable display name.
- The system shall compute and display content statistics (calendars, posts, favorites, URL gens, engagement plans, caption generations, total content).
- The system shall render a donut chart showing content distribution across all modules.
- The system shall show a recent activity timeline with type-specific icons.

### FR-08: AI Failover System
- The system shall rotate across multiple Gemini API keys for load balancing.
- The system shall automatically failover to the next AI provider (Gemini → OpenRouter) if the current provider fails or hits a rate limit.

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### NFR-01: Performance
- The AI content generation shall complete within approximately 30 seconds per request.
- The frontend shall render pages within 2 seconds on standard broadband connections.
- Firestore reads/writes shall use optimized batch operations where possible.

### NFR-02: Scalability
- The backend shall be stateless, allowing horizontal scaling behind a load balancer.
- Firestore subcollections per user shall allow independent scaling of user data.
- The AI gateway shall support adding new providers without modifying existing provider logic.

### NFR-03: Security
- All API endpoints (except auth) shall require a valid Firebase JWT token.
- Firebase Admin SDK shall verify tokens server-side before processing requests.
- Environment variables shall store all API keys and credentials (never hardcoded).
- CORS shall be configured to accept requests only from the frontend origin.

### NFR-04: Reliability
- The multi-provider AI failover system shall ensure content generation succeeds even if 1 or more AI providers are unavailable.
- Gemini API key rotation shall distribute load across multiple keys to prevent rate-limiting.
- All Firestore operations shall include error handling with meaningful error messages returned to the frontend.

### NFR-05: Usability
- The UI shall follow a modern, responsive design using TailwindCSS and Radix UI (shadcn/ui).
- The platform shall support desktop and mobile viewports.
- All interactive elements shall provide visual feedback (hover effects, loading states, success/error toasts).
- Content generation forms shall display clear input labels and validation messages.

### NFR-06: Maintainability
- The backend shall follow a clean separation of concerns: routing (server.py), AI logic (ai_gateway.py), data persistence (service files), and authentication (middleware).
- The frontend shall use a component-based architecture with reusable UI components (46+ shadcn/ui components).
- All API inputs shall be validated using Pydantic v2 models.

### NFR-07: Availability
- The application shall target 99.5% uptime, limited primarily by third-party AI provider availability.
- Firebase Authentication and Firestore provide built-in high availability through Google Cloud infrastructure.

### NFR-08: Compatibility
- The frontend shall support all modern browsers (Chrome, Firefox, Safari, Edge — latest 2 versions).
- The application shall be responsive across desktop (1024px+), tablet (768px–1023px), and mobile (<768px) viewports.



# **EXISTING SYSTEM**

The existing system for social media content creation is largely **manual, fragmented, and inefficient**. Content creators, marketers, and brand managers rely on multiple disconnected tools and platforms to plan, create, and manage their social media presence.

Currently, users depend on:

* Manual brainstorming for content ideas
* Separate tools for scheduling (e.g., basic planners)
* Individual AI tools for captions or posts (without integration)
* Manual copy-paste workflows across platforms

These systems lack **centralization and automation**, forcing users to switch between different applications for tasks such as content planning, caption writing, engagement strategy, and analytics.

Moreover, traditional tools do not provide:

* Platform-specific optimized content generation
* Intelligent content calendars based on strategy
* Automated repurposing of URLs or videos into social content
* Integrated engagement planning frameworks

Even when AI tools are used, they typically:

* Work in isolation (no shared history or workflow)
* Do not support multi-platform formatting
* Lack failover mechanisms, leading to interruptions when API limits are reached

As a result, the existing system suffers from **low productivity, high time consumption, inconsistent content quality, and lack of scalability**.

---

## **Disadvantages of Existing System**

The existing system presents several limitations that hinder efficient content creation. Since the process is mostly manual, it requires significant time and effort to generate ideas, write posts, and maintain consistency across platforms. The lack of integration between tools forces users to switch between multiple applications, increasing complexity and reducing productivity. Additionally, most systems do not provide platform-specific optimization, resulting in content that may not perform well on different social media channels. There is also no centralized storage for content history, making it difficult to track or reuse previous work. Furthermore, existing AI tools often lack reliability due to API limitations and do not include failover mechanisms, which can interrupt workflow. Overall, these issues lead to inefficiency, inconsistency, and reduced effectiveness in social media management.

---

# **PROPOSED SYSTEM**

To overcome the limitations of the existing system, the proposed system — **Social Media Hub** — introduces a **comprehensive AI-powered social media content generation platform** that integrates all content creation functionalities into a single unified system.

The proposed system is designed as a **web-based application** that leverages advanced AI technologies and modern architecture to automate and streamline the entire content lifecycle. 

### **Key Features of Proposed System**

* **AI-Powered Content Automation**
  Generates calendars, captions, bios, and engagement strategies automatically based on user inputs such as brand identity, audience, and goals.

* **Multi-Module Architecture**
  Includes four major modules:

  * AI Calendar Generator
  * URL Content Repurposer
  * Community Engagement Planner
  * Caption & Bio Generator

* **Multi-AI Provider Failover System**
  Uses multiple AI providers (Gemini, OpenRouter, etc.) with automatic failover and key rotation to ensure uninterrupted service. 

* **Platform-Specific Optimization**
  Generates content tailored for Instagram, Twitter/X, LinkedIn, and Facebook with character limits and formatting.

* **Centralized Content Management**
  Stores all generated content in Firestore with history, favorites, and filtering features.

* **Modern Web Architecture**

  * Frontend: React 19
  * Backend: FastAPI
  * Database: Firestore
  * Authentication: Firebase Auth

* **Real-Time Data Synchronization**
  Enables live updates and seamless user experience across modules.

### **Advantages of Proposed System**

* Reduces manual effort significantly
* Improves content quality and consistency
* Saves time through automation
* Provides centralized platform for all tasks
* Ensures reliability through AI failover
* Enhances user productivity and scalability

---

# **FEASIBILITY STUDY**

The feasibility study evaluates the practicality and viability of the proposed system from different perspectives.

---

## **1. Technical Feasibility**

The proposed system is technically feasible as it uses **modern and widely adopted technologies** such as React, FastAPI, Firebase, and AI APIs.

* The required technologies are:

  * Easily available and well-documented
  * Supported by strong developer communities
* Cloud-based services like Firestore and Firebase ensure:

  * High scalability
  * Real-time performance
* AI integration is achievable using APIs like Gemini and OpenRouter with failover support 

Thus, the system can be successfully developed and deployed using existing tools and infrastructure.

---

## **2. Economic Feasibility**

The system is economically feasible due to its **low initial investment and scalable cost model**.

* Development cost is minimized using:

  * Open-source frameworks (React, FastAPI)
  * Pay-as-you-go cloud services (Firebase)
* AI API costs are usage-based and can be optimized using:

  * Multi-provider failover
  * Efficient request handling

Additionally, the system provides high value by:

* Reducing manpower effort
* Increasing productivity for users

Hence, the benefits outweigh the operational costs.

---

## **3. Operational Feasibility**

The system is highly user-friendly and operationally feasible.

* Simple and intuitive UI design
* Minimal training required for users
* Automated workflows reduce manual intervention
* Centralized dashboard improves usability

Users such as content creators and marketers can easily adopt the system without technical expertise.

---

## **4. Schedule Feasibility**

The project can be completed within a **reasonable timeframe** as:

* Development uses modular architecture
* Each module can be built independently
* Existing libraries and APIs reduce development time

A typical academic project timeline (3–6 months) is sufficient to complete and deploy the system.

---

## **5. Legal Feasibility**

The system complies with legal and ethical standards:

* Uses authenticated APIs and licensed services
* Ensures secure user data handling via Firebase Authentication
* Does not violate copyright (content is AI-generated or user-provided URLs)

---

## **Conclusion of Feasibility Study**

The proposed system is **technically viable, economically beneficial, operationally efficient, and legally compliant**, making it a strong and practical solution for modern social media content automation.


