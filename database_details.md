# Social Media Hub Firestore Database Schema

This document outlines the Firestore collection and document structure for the Social Media Hub AI Content Calendar project.

## Overview
The database is structured using Firebase Firestore, emphasizing **user isolation**. Most data is stored within sub-collections under each user's unique identifier (`uid`).

---

## 1. User Profiles (`users` collection)
Stores base user information and global usage statistics.

**Path:** `users/{uid}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | String | Unique Firebase Auth identifier |
| `email` | String | User's email address |
| `name` | String | Display name |
| `picture` | String | Profile picture URL |
| `joined_at` | Timestamp | ISO 8601 creation date |
| `last_login` | Timestamp | ISO 8601 last login date |
| `total_calendars` | Number | Count of saved calendars |
| `total_posts` | Number | Total social media posts generated |
| `favorites_count` | Number | Count of items marked as favorite |

---

## 2. AI Content Calendars (`calendars` sub-collection)
Stores full content strategies and multi-platform social media posts.

**Path:** `users/{uid}/calendars/{calendar_id}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | UUID (v4) for the calendar |
| `owner_uid` | String | The UID of the user who owns this calendar |
| `is_favorite` | Boolean | Whether the calendar is bookmarked |
| `created_at` | Timestamp | Generation timestamp |
| `strategy` | Object | The input parameters used for generation (brand, industry, etc.) |
| `pillars` | Array\<Object> | Core content themes (Title, Description, Platforms) |
| `posts` | Array\<Object> | Generated social posts (Platform, Content, Date, Status, etc.) |

---

## 3. URL Content Repurposing (`url_generations` sub-collection)
Stores content generated from external URLs or YouTube videos.

**Path:** `users/{uid}/url_generations/{gen_id}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | UUID for the generation |
| `source_url` | String | The original URL analyzed |
| `url_type` | String | Type of source (e.g., "YouTube", "Website") |
| `extracted_summary`| String | AI-generated summary of the source |
| `platform` | String | Target social platform |
| `format` | String | Output format (post, carousel, thread, etc.) |
| `final_output` | Object | Structured AI output (content, hook, slides, etc.) |
| `created_at` | Timestamp | Generation timestamp |
| `is_favorite` | Boolean | Whether the item is bookmarked |

---

## 4. Community Engagement Plans (`engagement_plans` sub-collection)
Stores structured engagement strategies with multiple post variants.

**Path:** `users/{uid}/engagement_plans/{plan_id}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | UUID for the plan |
| `goal` | String | Primary objective (Engagement, Brand Awareness, etc.) |
| `platform` | String | Target platform |
| `plan_output` | Object | Dictionary of 5 post types (Awareness, Poll, Question, Story, CTA) |
| `is_favorite` | Boolean | Whether the plan is bookmarked |
| `created_at` | Timestamp | Generation timestamp |

---

## 5. AI Caption & Bio Generations (`caption_generations` sub-collection)
Stores short-form creative copy and profile bios.

**Path:** `users/{uid}/caption_generations/{gen_id}`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | UUID for the generation |
| `content_type` | String | Generation type (caption, bio, tagline, description) |
| `platform` | String | Target platform |
| `brand_name` | String | Name of the brand |
| `variations` | Array\<Object> | Multiple AI variants (Text, Style, Char Count) |
| `is_favorite` | Boolean | Whether the generation is bookmarked |
| `created_at` | Timestamp | Generation timestamp |
