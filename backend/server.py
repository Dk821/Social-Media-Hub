from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import json
import random

# ---- Load .env file FIRST (before any os.getenv calls) ----
ROOT_DIR = Path(__file__).parent
env_path = ROOT_DIR / ".env"
load_dotenv(env_path)

# ---- Environment variables ----
# (AI provider config is handled by ai_gateway)

# ---- Import AI Gateway ----
from ai_gateway import generate_ai_response

# ---- Import Firebase modules ----
from firebase_config import db
from auth_middleware import get_current_user
import firestore_service
import url_content_service
import community_engagement_service
import caption_bio_service
from content_extractor import extract_content

# ---- FastAPI app ----
app = FastAPI()
api_router = APIRouter(prefix="/api")


class StrategyInput(BaseModel):
    brand_name: str
    industry: str
    target_audience: str
    goals: List[str]
    tone: str
    content_themes: List[str]
    preferred_content_types: Optional[Dict[str, List[str]]] = None  # New field for user-defined content types
    content_length: str = "short"  # short, medium, long
    generation_mode: str = "all"  # all or single platform
    selected_platform: Optional[str] = None  # Platform name if generation_mode is single
    duration_days: int = 7  # Number of days to generate content for (1-30)

    @field_validator('duration_days')
    @classmethod
    def clamp_duration(cls, v):
        if v < 1:
            return 1
        if v > 30:
            return 30
        return v

class ContentPillar(BaseModel):
    title: str
    description: str
    platforms: List[str]

class SocialPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    platform: str
    content: str
    pillar: str
    date: str
    status: str = "draft"
    content_type: str = "post"  # New field for content type

class GeneratedCalendar(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    strategy: StrategyInput
    pillars: List[ContentPillar]
    posts: List[SocialPost]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_favorite: bool = False

class RegenerateRequest(BaseModel):
    post_id: str
    calendar_id: str

class UpdateContentTypeRequest(BaseModel):
    post_id: str
    calendar_id: str
    content_type: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None

EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Content type configurations for each platform
PLATFORM_CONTENT_TYPES = {
    "LinkedIn": ["text_post", "article", "carousel", "video", "poll"],
    "Twitter": ["tweet", "thread", "poll"],
    "Instagram": ["post", "reel", "carousel", "story"],
    "Facebook": ["post", "video", "story", "carousel"]
}

# Platform character limits
PLATFORM_CHARACTER_LIMITS = {
    "LinkedIn": {
        "recommended": 1300,
        "max": 3000,
        "description": "LinkedIn posts work best under 1,300 characters"
    },
    "Twitter": {
        "recommended": 280,
        "max": 280,
        "description": "Twitter has a strict 280 character limit"
    },
    "Instagram": {
        "recommended": 2200,
        "max": 2200,
        "description": "Instagram captions can be up to 2,200 characters"
    },
    "Facebook": {
        "recommended": 500,
        "max": 63206,
        "description": "Facebook recommends posts under 500 characters for better engagement"
    }
}

# Content length presets
CONTENT_LENGTH_RANGES = {
    "short": {"min": 400, "max": 600, "description": "Short & punchy (400-600 chars)"},
    "medium": {"min": 600, "max": 1000, "description": "Balanced content (600-1000 chars)"},
    "long": {"min": 1000, "max": 1500, "description": "Detailed, in-depth posts (1000-1500 chars)"}
}

# Default content types if user doesn't specify
DEFAULT_CONTENT_TYPE_DISTRIBUTION = {
    "LinkedIn": ["text_post", "article", "carousel"],
    "Twitter": ["tweet", "thread"],
    "Instagram": ["post", "reel", "carousel"],
    "Facebook": ["post", "video"]
}

FALLBACK_PILLARS = {
    "default": [
        {"title": "Educational Content", "description": "Share industry insights and how-to guides", "platforms": ["LinkedIn", "Twitter"]},
        {"title": "Behind The Scenes", "description": "Show your team and company culture", "platforms": ["Instagram", "Facebook"]},
        {"title": "Customer Stories", "description": "Showcase testimonials and success stories", "platforms": ["LinkedIn", "Facebook"]},
        {"title": "Product Updates", "description": "Announce new features and improvements", "platforms": ["Twitter", "LinkedIn"]}
    ]
}

FALLBACK_POSTS = {
    "LinkedIn": [
        "I've been reflecting on {topic} lately, and here's what I've realized:\n\nMost people overcomplicate it. They chase trends instead of focusing on what actually works.\n\nHere are 3 things that made the biggest difference for us at {brand}:\n\n1️⃣ Consistency over perfection — Show up daily, even when it's not perfect.\n2️⃣ Listen more than you speak — Your audience tells you what they need.\n3️⃣ Measure what matters — Vanity metrics are distracting.\n\nThe truth? {topic} isn't about being the loudest in the room. It's about being the most valuable.\n\nWhat's been your biggest lesson? Drop it in the comments 👇\n\n#Growth #Strategy #ContentCreation #BusinessTips",
        "Let me be honest about {topic}:\n\nWhen we started at {brand}, we had no clue what we were doing. We made every mistake in the book.\n\nBut after months of trial and error, we figured out a framework that actually works:\n\n🎯 Step 1: Define your core message. What do you stand for?\n🎯 Step 2: Create content that solves real problems for real people.\n🎯 Step 3: Engage authentically — no one likes a bot.\n🎯 Step 4: Analyze, iterate, and improve every single week.\n\nThe results? Our engagement went up 3x in 90 days.\n\nIf you're struggling with {topic}, try this framework for 30 days.\n\nLike this? ♻️ Repost to help someone in your network.\n\n#Leadership #Marketing #GrowthMindset",
        "Unpopular opinion about {topic}:\n\nYou don't need to be an expert to start. You need to start TO BECOME an expert.\n\nEvery successful person in {topic} started from zero. They didn't wait for the perfect moment. They created it.\n\nAt {brand}, we embraced this mindset, and it transformed our approach:\n\n✅ We stopped overthinking and started executing\n✅ We treated every failure as a lesson\n✅ We focused on providing value, not chasing likes\n\nThe result? More meaningful connections, better content, and real growth.\n\nWhat's holding you back from starting? Let's talk about it 💬\n\n#Entrepreneurship #ContentStrategy #BrandBuilding"
    ],
    "Twitter": [
        "Hot take on {topic}:\n\nConsistency beats talent when talent doesn't show up consistently.\n\nHere's the framework we use at {brand}:\n\n1. Define your message\n2. Create value daily\n3. Engage with your community\n4. Measure and iterate\n\nSimple? Yes. Easy? No. Worth it? Absolutely. 🎯\n\n#ContentTips #Marketing",
        "Something most people get wrong about {topic}:\n\nThey focus on going VIRAL instead of going VALUABLE.\n\nThe brands that win aren't the loudest — they're the most helpful.\n\nAt {brand}, we shifted to a value-first approach and saw 3x engagement in 90 days.\n\nTry it. Your audience will thank you. 🙏",
        "Thread: 5 lessons we learned about {topic} the hard way 🧵\n\n1/ Stop copying what works for others. Your audience is unique.\n\n2/ Consistency isn't posting daily. It's showing up with the SAME quality, message, and authenticity every time.\n\n3/ Engagement matters more than reach. A small engaged audience beats a large silent one.\n\nMore below 👇"
    ],
    "Instagram": [
        "Real talk about {topic} 💡\n\nEveryone's chasing followers, but nobody's chasing VALUE.\n\nHere's what we learned at {brand} after months of trial and error:\n\n1️⃣ Your content should solve a problem, not just look pretty\n2️⃣ Engagement > Reach (a small engaged audience beats a large silent one)\n3️⃣ Show up authentically — people connect with REAL, not PERFECT\n4️⃣ Track what works and double down on it\n\nThe game has changed. It's not about who posts the most — it's about who provides the most value.\n\nSave this for later ✨ and share with someone who needs to hear it!\n\n#ContentCreator #SocialMediaTips #DigitalMarketing #GrowthMindset #BrandStrategy",
        "POV: You finally understood the truth about {topic} 🚀\n\nIt's not about being perfect.\nIt's not about posting every day.\nIt's not about going viral.\n\nIt IS about:\n✨ Being authentic\n✨ Providing real value\n✨ Building genuine connections\n✨ Staying consistent with your message\n\nAt {brand}, this shift in mindset changed everything.\n\nFollow for more content like this and let's grow together 🌱\n\n#ContentStrategy #Inspiration #EntrepreneurMindset #MarketingTips #CreativeStrategy",
        "Stop scrolling — this will change how you think about {topic} 👇\n\nMost brands fail because they create content for themselves, not their audience.\n\nHere's our 4-step framework at {brand}:\n\n📌 LISTEN: What questions does your audience actually ask?\n📌 CREATE: Build content that answers those questions\n📌 ENGAGE: Respond to every comment and DM\n📌 ITERATE: Track performance and improve weekly\n\nSimple but powerful. Try it for 30 days and watch the difference.\n\nDouble tap if you agree ❤️ | Save for later 🔖\n\n#SocialMediaMarketing #ContentTips #BrandGrowth #MarketingStrategy"
    ],
    "Facebook": [
        "We've been working on {topic} at {brand}, and I wanted to share something real with this community 💬\n\nWhen we first started, we thought success meant having millions of followers and viral posts. But after months of trial and error, we realized something important:\n\nThe most impactful content isn't the flashiest — it's the most HELPFUL.\n\nHere are 3 things that changed our approach:\n\n1. We started listening to our community instead of just broadcasting\n2. We focused on solving real problems, not chasing trends\n3. We measured engagement quality, not just quantity\n\nWhat's your experience with {topic}? I'd love to hear your stories below! 👇",
        "Community question time! 🙋‍♀️\n\nWe at {brand} have been diving deep into {topic}, and I'm curious about YOUR experiences.\n\nHere's what we've learned so far:\n\n✅ Starting is harder than continuing — but the first step matters most\n✅ Your unique perspective IS your competitive advantage\n✅ Consistency + authenticity = long-term growth\n✅ Community feedback is the best content strategy\n\nNow I want to hear from YOU:\n\n🔹 What's been your biggest challenge with {topic}?\n🔹 What advice would you give to someone just starting out?\n🔹 What's one thing you wish you knew earlier?\n\nDrop your thoughts in the comments — let's learn from each other! 💡",
        "Here's what {brand} is doing differently with {topic}, and the results speak for themselves 📈\n\nWe stopped following the crowd and started following the DATA.\n\nOur approach:\n1️⃣ Research what our audience actually wants (not what we THINK they want)\n2️⃣ Create content that provides genuine value\n3️⃣ Engage with every single comment and message\n4️⃣ Review analytics weekly and adjust our strategy\n\nThe outcome? Better engagement, stronger community, and content that actually makes a difference.\n\nWant to see how we do it? Like this post and I'll share our complete framework in the comments! ⬇️"
    ]
}




def generate_fallback_pillars(strategy: StrategyInput) -> List[ContentPillar]:
    return [ContentPillar(**pillar) for pillar in FALLBACK_PILLARS["default"]]

def generate_fallback_post(platform: str, pillar: str, brand: str) -> str:
    templates = FALLBACK_POSTS.get(platform, FALLBACK_POSTS["LinkedIn"])
    template = random.choice(templates)
    return template.replace("{topic}", pillar).replace("{brand}", brand)

def determine_content_type(platform: str, content: str, preferred_types: Optional[List[str]] = None) -> str:
    """
    Determine content type based on platform, content characteristics, and user preferences.
    Uses rule-based logic with intelligent heuristics.
    """
    content_length = len(content)
    
    # Get available types for this platform
    available_types = PLATFORM_CONTENT_TYPES.get(platform, ["post"])
    
    # If user specified preferred types for this platform, use those
    if preferred_types:
        available_types = [t for t in preferred_types if t in PLATFORM_CONTENT_TYPES.get(platform, [])]
        if not available_types:
            available_types = PLATFORM_CONTENT_TYPES.get(platform, ["post"])
    
    # Rule-based logic for each platform
    if platform == "LinkedIn":
        if content_length > 300:
            return "article" if "article" in available_types else "carousel"
        elif content_length > 150:
            return "carousel" if "carousel" in available_types else "text_post"
        else:
            return "text_post" if "text_post" in available_types else available_types[0]
    
    elif platform == "Twitter":
        if content_length > 200 or content.count('\n') > 2:
            return "thread" if "thread" in available_types else "tweet"
        else:
            return "tweet" if "tweet" in available_types else available_types[0]
    
    elif platform == "Instagram":
        # Check for video/reel indicators
        if "video" in content.lower() or "watch" in content.lower():
            return "reel" if "reel" in available_types else "post"
        elif content_length > 150 or content.count('\n') > 3:
            return "carousel" if "carousel" in available_types else "post"
        else:
            return "post" if "post" in available_types else available_types[0]
    
    elif platform == "Facebook":
        if "video" in content.lower() or "watch" in content.lower():
            return "video" if "video" in available_types else "post"
        elif content_length > 200:
            return "carousel" if "carousel" in available_types else "post"
        else:
            return "post" if "post" in available_types else available_types[0]
    
    # Default fallback
    return available_types[0] if available_types else "post"


# =============================================
#  AUTH ENDPOINTS
# =============================================

@api_router.post("/auth/profile")
async def auth_profile(user: dict = Depends(get_current_user)):
    """Called on every login — creates profile if new user, returns profile."""
    profile = firestore_service.create_or_update_profile_on_login(
        uid=user["uid"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture", ""),
    )
    return profile


@api_router.get("/user/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get the full user profile with usage stats."""
    profile = firestore_service.get_user_profile(user["uid"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@api_router.put("/user/profile")
async def update_profile(updates: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    """Update editable profile fields."""
    profile = firestore_service.update_user_profile(
        user["uid"],
        updates.model_dump(exclude_none=True)
    )
    return profile


@api_router.get("/user/dashboard-stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    """Get extended stats and recent activity for the profile dashboard."""
    return firestore_service.get_dashboard_stats(user["uid"])


# =============================================
#  CALENDAR ENDPOINTS (now user-scoped)
# =============================================

@api_router.post("/strategy", response_model=GeneratedCalendar)
async def create_strategy(strategy: StrategyInput, user: dict = Depends(get_current_user)):
    try:
        session_id = str(uuid.uuid4())
        
        # Determine platforms to generate content for
        if strategy.generation_mode == "single" and strategy.selected_platform:
            platforms = [strategy.selected_platform]
        else:
            platforms = ["LinkedIn", "Twitter", "Instagram", "Facebook"]
        
        # Get content length range
        length_range = CONTENT_LENGTH_RANGES.get(strategy.content_length, CONTENT_LENGTH_RANGES["short"])
        
        pillars_prompt = f"""
Based on this brand strategy, generate 4 content pillars in JSON format:
- Brand: {strategy.brand_name}
- Industry: {strategy.industry}
- Target Audience: {strategy.target_audience}
- Goals: {', '.join(strategy.goals)}
- Tone: {strategy.tone}
- Themes: {', '.join(strategy.content_themes)}

Return ONLY a JSON array with this structure:
[
  {{"title": "Pillar Name", "description": "Brief description", "platforms": ["LinkedIn", "Twitter"]}}
]
Make it specific to the brand and industry. 4 pillars total.
"""
        
        try:
            pillars_response = await generate_ai_response(pillars_prompt)
            pillars_data = json.loads(pillars_response.strip().replace('```json', '').replace('```', ''))
            pillars = [ContentPillar(**p) for p in pillars_data]
        except:
            pillars = generate_fallback_pillars(strategy)
        
        posts = []
        start_date = datetime.now(timezone.utc)
        
        # Get user-defined content types or use defaults
        content_type_preferences = strategy.preferred_content_types or DEFAULT_CONTENT_TYPE_DISTRIBUTION
        
        duration = min(max(strategy.duration_days, 1), 30)
        for day in range(duration):
            current_date = start_date + timedelta(days=day)
            date_str = current_date.strftime("%Y-%m-%d")
            
            for platform in platforms:
                pillar = random.choice(pillars)
                
                # Get preferred content types for this platform
                preferred_types = content_type_preferences.get(platform, DEFAULT_CONTENT_TYPE_DISTRIBUTION.get(platform, ["post"]))
                selected_content_type = random.choice(preferred_types) if preferred_types else "post"
                
                # Get platform-specific character limit
                platform_limit = PLATFORM_CHARACTER_LIMITS.get(platform, {}).get("max", 500)
                
                # Build carousel-specific instructions if content type is carousel
                carousel_instructions = ""
                if selected_content_type == "carousel":
                    carousel_instructions = """

⚠️ MANDATORY CAROUSEL SLIDE FORMAT — YOU MUST FOLLOW THIS:
Since this is a CAROUSEL post, you MUST structure the content into separate slides.
- Create exactly 2-3 slides
- Start each slide with "Slide 1:", "Slide 2:", "Slide 3:" on its own line
- Add a blank line between each slide
- Slide 1: Strong attention-grabbing hook
- Slide 2: Provide value — tips, insights, or actionable takeaways
- Slide 3: Call to action + hashtags
- Each slide MUST be a complete, standalone message
- DO NOT skip the slide labels. Every slide MUST start with "Slide X:"

Example format:
Slide 1:
[Hook content here]

Slide 2:
[Value/tips content here]

Slide 3:
[CTA + hashtags here]
"""
                
                post_prompt = f"""
You are a professional social media content writer creating a {platform} {selected_content_type} for the brand "{strategy.brand_name}".

Brand Details:
- Industry: {strategy.brand_name}'s industry
- Content Pillar: {pillar.title} — {pillar.description}
- Tone of Voice: {strategy.tone}
- Target Audience: {strategy.target_audience}
- Content Type: {selected_content_type}

WRITING STYLE REQUIREMENTS:
- Write like a professional content writer / copywriter
- Start with a strong hook (question, bold statement, or surprising fact) to grab attention
- Include real value — tips, insights, lessons, or actionable takeaways
- Use short paragraphs and line breaks for readability
- Add relevant emojis naturally (don't overuse)
- Include a clear call-to-action at the end (e.g., comment, share, save, follow)
- Add 3-5 relevant hashtags at the end
- Make it feel authentic and engaging, NOT generic or robotic
{carousel_instructions}
CHARACTER LENGTH REQUIREMENTS:
- Target length: {length_range['min']}-{length_range['max']} characters ({strategy.content_length} format)
- Platform max: {platform_limit} characters
- You MUST write at least {length_range['min']} characters. Short 1-2 line posts are NOT acceptable.

Platform-specific guidelines:
- LinkedIn: Professional, thought-leadership style. Use line breaks. Share insights and lessons learned.
- Twitter tweet: Must be under 280 chars. Be concise but impactful.
- Twitter thread: Write an engaging thread starter that makes people want to read more.
- Instagram: Visual storytelling, emotional, with relevant emojis. Include hashtags.
- Facebook: Community-focused, conversational, encourage discussion.

Return ONLY the post text. No quotes, no labels, no extra formatting.
Remember: Write {length_range['min']}-{length_range['max']} characters of high-quality, engaging content.
"""
                
                try:
                    post_content = await generate_ai_response(post_prompt)
                    post_content = post_content.strip().strip('"').strip("'")
                    
                    # Use AI-validated content type determination
                    final_content_type = determine_content_type(platform, post_content, preferred_types)
                except Exception as e:
                    logging.warning(f"Gemini failed for {platform}/{day}, using fallback: {e}")
                    post_content = generate_fallback_post(platform, pillar.title, strategy.brand_name)
                    final_content_type = selected_content_type
                
                post = SocialPost(
                    platform=platform,
                    content=post_content,
                    pillar=pillar.title,
                    date=date_str,
                    status="draft",
                    content_type=final_content_type
                )
                posts.append(post)
        
        calendar = GeneratedCalendar(
            strategy=strategy,
            pillars=pillars,
            posts=posts
        )
        
        doc = calendar.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        # Save to Firestore (user-scoped)
        firestore_service.save_calendar(user["uid"], doc)
        
        return calendar
        
    except Exception as e:
        logging.error(f"Strategy creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/calendars")
async def get_calendars(user: dict = Depends(get_current_user)):
    """Get all calendars for the authenticated user."""
    calendars = firestore_service.get_calendars(user["uid"])
    return calendars

@api_router.get("/calendar/{calendar_id}")
async def get_calendar(calendar_id: str, user: dict = Depends(get_current_user)):
    """Get a single calendar by ID, user-scoped."""
    calendar = firestore_service.get_calendar(user["uid"], calendar_id)
    if not calendar:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return calendar

@api_router.delete("/calendar/{calendar_id}")
async def delete_calendar(calendar_id: str, user: dict = Depends(get_current_user)):
    """Delete a calendar and update usage stats."""
    success = firestore_service.delete_calendar(user["uid"], calendar_id)
    if not success:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return {"success": True, "message": "Calendar deleted"}

@api_router.post("/calendar/{calendar_id}/favorite")
async def toggle_favorite(calendar_id: str, user: dict = Depends(get_current_user)):
    """Toggle favorite status on a calendar."""
    result = firestore_service.toggle_favorite(user["uid"], calendar_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Calendar not found")
    return {"success": True, "is_favorite": result}


# =============================================
#  HISTORY ENDPOINT (paginated, sorted, filtered)
# =============================================

@api_router.get("/history")
async def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    sort: str = Query("newest", pattern="^(newest|oldest|most_posts)$"),
    filter_by: str = Query("all", pattern="^(all|favorites)$"),
    user: dict = Depends(get_current_user),
):
    """Paginated history with sorting and filtering."""
    return firestore_service.get_history(
        uid=user["uid"],
        page=page,
        limit=limit,
        sort=sort,
        filter_by=filter_by,
    )


# =============================================
#  POST MODIFICATION ENDPOINTS (user-scoped)
# =============================================

@api_router.post("/regenerate")
async def regenerate_post(request: RegenerateRequest, user: dict = Depends(get_current_user)):
    try:
        calendar = firestore_service.get_calendar(user["uid"], request.calendar_id)
        if not calendar:
            raise HTTPException(status_code=404, detail="Calendar not found")
        
        post_index = None
        for idx, post in enumerate(calendar['posts']):
            if post['id'] == request.post_id:
                post_index = idx
                break
        
        if post_index is None:
            raise HTTPException(status_code=404, detail="Post not found")
        
        old_post = calendar['posts'][post_index]
        strategy = StrategyInput(**calendar['strategy'])
        
        # Use the same content length settings as the original generation
        length_range = CONTENT_LENGTH_RANGES.get(strategy.content_length, CONTENT_LENGTH_RANGES["short"])
        platform_limit = PLATFORM_CHARACTER_LIMITS.get(old_post['platform'], {}).get("max", 500)
        
        # Build carousel-specific instructions if content type is carousel
        carousel_instructions = ""
        old_content_type = old_post.get('content_type', 'post')
        if old_content_type == "carousel":
            carousel_instructions = """

⚠️ MANDATORY CAROUSEL SLIDE FORMAT — YOU MUST FOLLOW THIS:
Since this is a CAROUSEL post, you MUST structure the content into separate slides.
- Create exactly 2-3 slides
- Start each slide with "Slide 1:", "Slide 2:", "Slide 3:" on its own line
- Add a blank line between each slide
- Slide 1: Strong attention-grabbing hook
- Slide 2: Provide value — tips, insights, or actionable takeaways
- Slide 3: Call to action + hashtags
- Each slide MUST be a complete, standalone message
- DO NOT skip the slide labels. Every slide MUST start with "Slide X:"

Example format:
Slide 1:
[Hook content here]

Slide 2:
[Value/tips content here]

Slide 3:
[CTA + hashtags here]
"""
        
        post_prompt = f"""
You are a professional social media content writer creating a NEW {old_post['platform']} {old_content_type} for the brand "{strategy.brand_name}".

Brand Details:
- Industry: {strategy.industry}
- Content Pillar: {old_post['pillar']}
- Tone of Voice: {strategy.tone}
- Target Audience: {strategy.target_audience}
- Content Type: {old_content_type}

IMPORTANT: Write a COMPLETELY DIFFERENT post from this previous version:
"{old_post['content'][:200]}..."

WRITING STYLE REQUIREMENTS:
- Write like a professional content writer / copywriter
- Start with a strong hook (question, bold statement, or surprising fact) to grab attention
- Include real value — tips, insights, lessons, or actionable takeaways
- Use short paragraphs and line breaks for readability
- Add relevant emojis naturally (don't overuse)
- Include a clear call-to-action at the end (e.g., comment, share, save, follow)
- Add 3-5 relevant hashtags at the end
- Make it feel authentic and engaging, NOT generic or robotic
{carousel_instructions}
CHARACTER LENGTH REQUIREMENTS:
- Target length: {length_range['min']}-{length_range['max']} characters ({strategy.content_length} format)
- Platform max: {platform_limit} characters
- You MUST write at least {length_range['min']} characters. Short 1-2 line posts are NOT acceptable.

Platform-specific guidelines:
- LinkedIn: Professional, thought-leadership style. Use line breaks. Share insights and lessons learned.
- Twitter tweet: Must be under 280 chars. Be concise but impactful.
- Twitter thread: Write an engaging thread starter that makes people want to read more.
- Instagram: Visual storytelling, emotional, with relevant emojis. Include hashtags.
- Facebook: Community-focused, conversational, encourage discussion.

Return ONLY the post text. No quotes, no labels, no extra formatting.
Remember: Write {length_range['min']}-{length_range['max']} characters of high-quality, engaging content.
"""
        
        try:
            new_content = await generate_ai_response(post_prompt)
            new_content = new_content.strip().strip('"').strip("'")
        except:
            new_content = generate_fallback_post(old_post['platform'], old_post['pillar'], strategy.brand_name)
        
        calendar['posts'][post_index]['content'] = new_content
        
        # Update in Firestore
        firestore_service.update_calendar_data(
            user["uid"], request.calendar_id, {"posts": calendar['posts']}
        )
        
        return {"success": True, "new_content": new_content}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Regenerate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/update-content-type")
async def update_content_type(request: UpdateContentTypeRequest, user: dict = Depends(get_current_user)):
    """
    Allow users to manually change the content type of a post
    """
    try:
        calendar = firestore_service.get_calendar(user["uid"], request.calendar_id)
        if not calendar:
            raise HTTPException(status_code=404, detail="Calendar not found")
        
        post_index = None
        for idx, post in enumerate(calendar['posts']):
            if post['id'] == request.post_id:
                post_index = idx
                break
        
        if post_index is None:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Validate content type for the platform
        platform = calendar['posts'][post_index]['platform']
        valid_types = PLATFORM_CONTENT_TYPES.get(platform, ["post"])
        
        if request.content_type not in valid_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid content type '{request.content_type}' for {platform}. Valid types: {', '.join(valid_types)}"
            )
        
        # Update content type
        calendar['posts'][post_index]['content_type'] = request.content_type
        
        # Update in Firestore
        firestore_service.update_calendar_data(
            user["uid"], request.calendar_id, {"posts": calendar['posts']}
        )
        
        return {"success": True, "content_type": request.content_type}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Update content type error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/content-types/{platform}")
async def get_content_types(platform: str):
    """
    Get available content types for a specific platform
    """
    content_types = PLATFORM_CONTENT_TYPES.get(platform, ["post"])
    return {"platform": platform, "content_types": content_types}

@api_router.get("/platform-limits")
async def get_platform_limits():
    """
    Get character limits for all platforms
    """
    return PLATFORM_CHARACTER_LIMITS

@api_router.get("/content-lengths")
async def get_content_lengths():
    """
    Get available content length presets
    """
    return CONTENT_LENGTH_RANGES

class UpdatePostContentRequest(BaseModel):
    post_id: str
    calendar_id: str
    content: str

class UpdatePostStatusRequest(BaseModel):
    post_id: str
    calendar_id: str
    status: str  # draft, scheduled, published

class GenerateHashtagsRequest(BaseModel):
    content: str
    platform: str
    industry: str = ""
    brand_name: str = ""

@api_router.post("/update-post-content")
async def update_post_content(request: UpdatePostContentRequest, user: dict = Depends(get_current_user)):
    """Update post content (inline editing)"""
    try:
        calendar = firestore_service.get_calendar(user["uid"], request.calendar_id)
        if not calendar:
            raise HTTPException(status_code=404, detail="Calendar not found")
        
        post_index = None
        for idx, post in enumerate(calendar['posts']):
            if post['id'] == request.post_id:
                post_index = idx
                break
        
        if post_index is None:
            raise HTTPException(status_code=404, detail="Post not found")
        
        calendar['posts'][post_index]['content'] = request.content
        
        # Update in Firestore
        firestore_service.update_calendar_data(
            user["uid"], request.calendar_id, {"posts": calendar['posts']}
        )
        
        return {"success": True, "content": request.content}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Update post content error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/update-post-status")
async def update_post_status(request: UpdatePostStatusRequest, user: dict = Depends(get_current_user)):
    """Update post status (draft/scheduled/published)"""
    try:
        valid_statuses = ["draft", "scheduled", "published"]
        if request.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        calendar = firestore_service.get_calendar(user["uid"], request.calendar_id)
        if not calendar:
            raise HTTPException(status_code=404, detail="Calendar not found")
        
        post_index = None
        for idx, post in enumerate(calendar['posts']):
            if post['id'] == request.post_id:
                post_index = idx
                break
        
        if post_index is None:
            raise HTTPException(status_code=404, detail="Post not found")
        
        calendar['posts'][post_index]['status'] = request.status
        
        # Update in Firestore
        firestore_service.update_calendar_data(
            user["uid"], request.calendar_id, {"posts": calendar['posts']}
        )
        
        return {"success": True, "status": request.status}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Update post status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/generate-hashtags")
async def generate_hashtags(request: GenerateHashtagsRequest, user: dict = Depends(get_current_user)):
    """Generate hashtags, CTA, and emoji suggestions using Gemini"""
    try:
        session_id = str(uuid.uuid4())
        
        prompt = f"""Based on this social media post, generate:
1. 5-8 relevant hashtags (with #)
2. 1 compelling call-to-action (CTA)
3. 5 relevant emojis that could enhance this post

Post content: "{request.content}"
Platform: {request.platform}
Industry: {request.industry or 'General'}
Brand: {request.brand_name or 'N/A'}

Return ONLY valid JSON in this exact format:
{{"hashtags": ["#tag1", "#tag2"], "cta": "Your call to action here", "emojis": ["emoji1", "emoji2"]}}
"""
        
        try:
            response = await generate_ai_response(prompt)
            cleaned = response.strip().replace('```json', '').replace('```', '').strip()
            result = json.loads(cleaned)
            
            if 'hashtags' not in result:
                result['hashtags'] = []
            if 'cta' not in result:
                result['cta'] = ''
            if 'emojis' not in result:
                result['emojis'] = []
                
            return result
        except:
            # Fallback suggestions
            platform_hashtags = {
                "LinkedIn": ["#Leadership", "#Innovation", "#Business", "#Growth", "#Networking"],
                "Twitter": ["#Trending", "#Tech", "#News", "#Tips", "#MustRead"],
                "Instagram": ["#InstaGood", "#PhotoOfTheDay", "#Explore", "#Viral", "#Trending"],
                "Facebook": ["#Community", "#Support", "#ShareThis", "#FeelGood", "#Together"]
            }
            return {
                "hashtags": platform_hashtags.get(request.platform, ["#Content", "#Social", "#Brand", "#Marketing", "#Growth"]),
                "cta": "Learn more and join the conversation! 👇",
                "emojis": ["🚀", "💡", "🎯", "✨", "🔥"]
            }
    except Exception as e:
        logging.error(f"Generate hashtags error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================
#  URL CONTENT REPURPOSING ENDPOINTS
# =============================================

class UrlAnalyzeRequest(BaseModel):
    url: str

class UrlGenerateRequest(BaseModel):
    source_url: str
    url_type: str
    extracted_summary: str
    analysis: dict
    target_audience: str
    goal: str          # engagement / awareness / leads
    platform: str      # LinkedIn / Twitter / Instagram / Facebook
    format: str        # post / carousel / thread / video_script
    tone: str          # professional / friendly / casual / inspirational

# Format-specific output schemas for AI prompts
FORMAT_SCHEMAS = {
    "carousel": '{"slides": ["slide 1 text", "slide 2 text", "slide 3 text"], "caption": "engaging caption", "hashtags": ["#tag1", "#tag2"]}',
    "post": '{"hook": "attention-grabbing opening line", "body": "main content with value", "cta": "call to action", "hashtags": ["#tag1", "#tag2"]}',
    "thread": '{"tweets": ["tweet 1 (hook)", "tweet 2 (value)", "tweet 3 (value)", "tweet 4 (CTA)"], "hashtags": ["#tag1", "#tag2"]}',
    "video_script": '{"hook": "opening hook (first 3 seconds)", "talking_points": ["point 1", "point 2", "point 3"], "closing_cta": "final call to action"}',
}


@api_router.post("/url/analyze")
async def analyze_url(request: UrlAnalyzeRequest, user: dict = Depends(get_current_user)):
    """
    Step 1: Extract content from a URL and analyze it with AI.
    Supports YouTube videos (transcript) and web pages (scraping).
    """
    try:
        # Extract content
        try:
            extraction = extract_content(request.url)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Build AI analysis prompt
        analysis_prompt = f"""Analyze the following content extracted from a URL and return ONLY valid JSON with no extra text:

{{
  "summary": "A concise 2-3 sentence summary of the entire content",
  "main_topic": "The primary topic or subject",
  "key_points": ["key point 1", "key point 2", "key point 3", "key point 4", "key point 5"],
  "suggested_formats": ["carousel", "thread", "post", "video_script"],
  "suggested_angles": ["angle 1 for social media content", "angle 2", "angle 3"]
}}

Rules:
- summary: 2-3 sentences capturing the essence of the content
- key_points: 3-6 most important takeaways
- suggested_formats: which social media formats would work best (pick from: carousel, post, thread, video_script)
- suggested_angles: creative angles a content creator could use to repurpose this

Content:
\"\"\"
{extraction['raw_text']}
\"\"\"
"""

        try:
            ai_response = await generate_ai_response(analysis_prompt)
            cleaned = ai_response.strip().replace('```json', '').replace('```', '').strip()
            analysis = json.loads(cleaned)
        except json.JSONDecodeError:
            # Fallback analysis if AI returns non-JSON
            analysis = {
                "summary": extraction['text_preview'][:200],
                "main_topic": "Content from URL",
                "key_points": ["See the extracted content for details"],
                "suggested_formats": ["post", "carousel", "thread"],
                "suggested_angles": ["Educational breakdown", "Key takeaways summary"]
            }
        except Exception as e:
            logging.warning(f"AI analysis failed, using fallback: {e}")
            analysis = {
                "summary": extraction['text_preview'][:200],
                "main_topic": "Content from URL",
                "key_points": ["See the extracted content for details"],
                "suggested_formats": ["post", "carousel", "thread"],
                "suggested_angles": ["Educational breakdown", "Key takeaways summary"]
            }

        return {
            "source_url": request.url,
            "url_type": extraction["url_type"],
            "summary": analysis.get("summary", ""),
            "main_topic": analysis.get("main_topic", ""),
            "key_points": analysis.get("key_points", []),
            "suggested_formats": analysis.get("suggested_formats", []),
            "suggested_angles": analysis.get("suggested_angles", []),
            "extracted_text_preview": extraction["text_preview"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"URL analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/url/generate")
async def generate_from_url(request: UrlGenerateRequest, user: dict = Depends(get_current_user)):
    """
    Step 2: Generate platform-optimized content from analyzed URL content.
    Returns format-specific structured output.
    """
    try:
        # Get platform character limit
        platform_limit = PLATFORM_CHARACTER_LIMITS.get(request.platform, {}).get("max", 2000)

        # Get format-specific schema
        output_schema = FORMAT_SCHEMAS.get(request.format, FORMAT_SCHEMAS["post"])

        # Build key points string
        key_points_str = "\n".join(
            f"- {kp}" for kp in request.analysis.get("key_points", [])
        )

        generation_prompt = f"""You are a professional social media content creator. Create a {request.platform} {request.format} by repurposing the content below.

Source Summary:
{request.extracted_summary}

Key Points:
{key_points_str}

Requirements:
- Target Audience: {request.target_audience}
- Goal: {request.goal}
- Tone: {request.tone}
- Platform: {request.platform}
- Format: {request.format}
- Platform character limit: {platform_limit} characters

Platform-specific guidelines:
- LinkedIn: Professional thought-leadership style, use line breaks, share insights.
- Twitter: Thread tweets MUST be under 280 chars each. Be concise but impactful.
- Instagram: Visual storytelling, emotional, include hashtags and emojis.
- Facebook: Community-focused, conversational, encourage discussion.

Format instructions:
- carousel: Create 3-5 slide texts (each slide is a standalone message), a caption, and hashtags.
- post: Write a hook (attention-grabbing opener), body (main value), CTA (call to action), and hashtags.
- thread: Write 4-6 tweets (each under 280 chars), plus hashtags for the first tweet.
- video_script: Write a hook (first 3 seconds), 3-5 talking points, and a closing CTA.

Return ONLY valid JSON in this exact structure:
{output_schema}

Rules:
- Make content engaging, valuable, and platform-appropriate
- Do NOT include any text outside the JSON
- Ensure the content is a genuine repurposing of the source material, not generic filler
"""

        try:
            ai_response = await generate_ai_response(generation_prompt)
            cleaned = ai_response.strip().replace('```json', '').replace('```', '').strip()
            output = json.loads(cleaned)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500,
                detail="AI returned invalid format. Please try again."
            )
        except Exception as e:
            logging.error(f"AI generation failed: {e}")
            raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

        # Build the generation record
        gen_id = str(uuid.uuid4())
        generation_data = {
            "id": gen_id,
            "source_url": request.source_url,
            "url_type": request.url_type,
            "extracted_summary": request.extracted_summary,
            "analysis": request.analysis,
            "platform": request.platform,
            "format": request.format,
            "tone": request.tone,
            "target_audience": request.target_audience,
            "goal": request.goal,
            "final_output": output,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # Save to Firestore
        url_content_service.save_url_generation(user["uid"], generation_data)

        return {
            "id": gen_id,
            "source_url": request.source_url,
            "platform": request.platform,
            "format": request.format,
            "output": output,
            "created_at": generation_data["created_at"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"URL generate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/url/history")
async def get_url_history(user: dict = Depends(get_current_user)):
    """Get all URL generations for the authenticated user, newest first."""
    try:
        items = url_content_service.get_url_generations(user["uid"])
        return {"items": items, "total": len(items)}
    except Exception as e:
        logging.error(f"URL history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/url/generation/{generation_id}")
async def get_url_generation(generation_id: str, user: dict = Depends(get_current_user)):
    """Get a single URL generation by ID."""
    data = url_content_service.get_url_generation(user["uid"], generation_id)
    if not data:
        raise HTTPException(status_code=404, detail="Generation not found")
    return data


@api_router.delete("/url/{generation_id}")
async def delete_url_generation(generation_id: str, user: dict = Depends(get_current_user)):
    """Delete a URL generation."""
    success = url_content_service.delete_url_generation(user["uid"], generation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Generation not found")
    return {"success": True, "message": "Generation deleted"}


@api_router.post("/url/{generation_id}/favorite")
async def toggle_url_favorite(generation_id: str, user: dict = Depends(get_current_user)):
    """Toggle favorite status on a URL generation."""
    new_state = url_content_service.toggle_favorite(user["uid"], generation_id)
    if new_state is None:
        raise HTTPException(status_code=404, detail="Generation not found")
    return {"is_favorite": new_state}



# =============================================
#  COMMUNITY ENGAGEMENT PLANNER ENDPOINTS
# =============================================

class EngagementPlanInput(BaseModel):
    goal: str             # engagement / brand_awareness / lead_generation / community_building
    target_audience: str
    industry: str
    tone: str             # professional / casual / inspirational / bold / educational
    platform: str         # LinkedIn / Twitter / Instagram / Facebook
    content_length: str = "medium"  # short / medium / long


# Platform-specific engagement formatting rules
ENGAGEMENT_PLATFORM_RULES = {
    "LinkedIn": {
        "tone_note": "Professional and value-focused",
        "formatting": "Use paragraph spacing, minimal emojis, value-driven hooks",
        "char_limit": 1300,
    },
    "Twitter": {
        "tone_note": "Concise with a strong hook in the first line",
        "formatting": "Thread-style if long, keep each part under 280 chars",
        "char_limit": 280,
    },
    "Instagram": {
        "tone_note": "Captions optimized for saves, emoji usage allowed",
        "formatting": "Include hashtag block at the end, visual storytelling",
        "char_limit": 2200,
    },
    "Facebook": {
        "tone_note": "Conversational and community-friendly",
        "formatting": "Slightly longer captions allowed, encourage discussion",
        "char_limit": 500,
    },
}


@api_router.post("/community/plan")
async def create_engagement_plan(request: EngagementPlanInput, user: dict = Depends(get_current_user)):
    """
    Generate a structured community engagement plan with 5 post types
    tailored to the selected platform.
    """
    try:
        platform_rules = ENGAGEMENT_PLATFORM_RULES.get(
            request.platform,
            ENGAGEMENT_PLATFORM_RULES["LinkedIn"]
        )
        length_range = CONTENT_LENGTH_RANGES.get(
            request.content_length, CONTENT_LENGTH_RANGES["medium"]
        )

        engagement_prompt = f"""You are a senior social media strategist. Generate a structured community engagement plan for the platform "{request.platform}".

Context:
- Primary Goal: {request.goal}
- Target Audience: {request.target_audience}
- Industry: {request.industry}
- Brand Tone: {request.tone}
- Content Length: {request.content_length} ({length_range['min']}-{length_range['max']} characters per post)

Platform Rules for {request.platform}:
- Tone: {platform_rules['tone_note']}
- Formatting: {platform_rules['formatting']}
- Character limit: {platform_rules['char_limit']} characters

Generate exactly 5 engagement-focused posts. Each post MUST be {length_range['min']}-{length_range['max']} characters and follow the platform rules above.

1. AWARENESS POST:
   - Introduce a topic relevant to the industry
   - Hook-driven opening line that grabs attention
   - Soft call-to-action at the end

2. POLL:
   - A question in poll format
   - Provide exactly 4 options
   - Engagement-driven tone that encourages voting

3. QUESTION POST:
   - Open-ended question that sparks discussion
   - Acts as a conversation starter
   - Encourages comments and replies

4. STORYTELLING POST:
   - Start with a hook
   - Present a conflict or problem
   - Share the lesson learned
   - End with a soft CTA

5. CALL-TO-ACTION POST:
   - Strong hook in the first line
   - Clear offer or value proposition
   - Direct, action-oriented CTA
   - Include relevant hashtags

Return ONLY valid JSON in this exact structure (no extra text, no markdown):
{{
  "platform": "{request.platform}",
  "posts": {{
    "awareness": {{
      "title": "Awareness Post",
      "content": "full post text here",
      "purpose": "one-line purpose description"
    }},
    "poll": {{
      "title": "Poll",
      "content": "poll question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "purpose": "one-line purpose description"
    }},
    "question": {{
      "title": "Question Post",
      "content": "full post text here",
      "purpose": "one-line purpose description"
    }},
    "storytelling": {{
      "title": "Storytelling Post",
      "content": "full post text here",
      "purpose": "one-line purpose description"
    }},
    "cta": {{
      "title": "Call-to-Action Post",
      "content": "full post text here",
      "purpose": "one-line purpose description"
    }}
  }},
  "suggested_posting_order": ["awareness", "poll", "question", "storytelling", "cta"],
  "engagement_strategy_notes": "2-3 sentence strategy summary explaining why this order and approach works for the target audience"
}}

CRITICAL: Your response MUST be ONLY the JSON object above. Do NOT include any additional text, explanations, or markdown formatting before or after the JSON. Start your response with {{ and end with }}.
"""

        import re

        def _clean_ai_json(raw: str) -> dict:
            """Try multiple strategies to extract valid JSON from AI response."""
            # Step 1: strip markdown fences (```json ... ``` or ``` ... ```)
            text = raw.strip()
            text = re.sub(r'```(?:json|JSON)?\s*\n?', '', text).strip()

            # Step 2: remove control characters (keep \n \r \t)
            text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

            # Strategy 1: direct parse (strict=False allows literal newlines in strings)
            try:
                return json.loads(text, strict=False)
            except json.JSONDecodeError:
                pass

            # Strategy 2: extract the outermost { ... } using brace counting
            # (string-aware — skips braces inside quoted strings)
            start = text.find('{')
            if start != -1:
                depth = 0
                end = start
                in_string = False
                escape_next = False
                for i in range(start, len(text)):
                    c = text[i]
                    if escape_next:
                        escape_next = False
                        continue
                    if c == '\\' and in_string:
                        escape_next = True
                        continue
                    if c == '"':
                        in_string = not in_string
                        continue
                    if in_string:
                        continue
                    if c == '{':
                        depth += 1
                    elif c == '}':
                        depth -= 1
                        if depth == 0:
                            end = i
                            break
                candidate = text[start:end + 1]
                try:
                    return json.loads(candidate, strict=False)
                except json.JSONDecodeError:
                    pass

                # Strategy 3: fix trailing commas and retry
                fixed = re.sub(r',\s*([}\]])', r'\1', candidate)
                try:
                    return json.loads(fixed, strict=False)
                except json.JSONDecodeError:
                    pass

            raise json.JSONDecodeError("No valid JSON found", text[:200], 0)

        def _validate_plan_structure(data: dict) -> dict:
            """Ensure the parsed plan has the required keys, fill defaults if missing."""
            if "posts" not in data:
                raise json.JSONDecodeError("Missing 'posts' key", str(data)[:100], 0)
            posts = data["posts"]
            for key in ["awareness", "poll", "question", "storytelling", "cta"]:
                if key not in posts:
                    posts[key] = {"title": key.replace("_", " ").title(), "content": "", "purpose": ""}
                post = posts[key]
                if "content" not in post or not post["content"]:
                    raise json.JSONDecodeError(f"Post '{key}' has no content", str(data)[:100], 0)
            if "suggested_posting_order" not in data:
                data["suggested_posting_order"] = ["awareness", "poll", "question", "storytelling", "cta"]
            if "engagement_strategy_notes" not in data:
                data["engagement_strategy_notes"] = ""
            return data

        MAX_RETRIES = 3
        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                logging.info(f"Engagement plan generation attempt {attempt}/{MAX_RETRIES}")
                ai_response = await generate_ai_response(engagement_prompt)
                plan_output = _clean_ai_json(ai_response)
                plan_output = _validate_plan_structure(plan_output)
                break  # Success
            except json.JSONDecodeError as e:
                last_error = e
                logging.warning(
                    f"Attempt {attempt}/{MAX_RETRIES} — JSON parse failed: {e.msg}. "
                    f"Raw snippet: {ai_response[:300] if 'ai_response' in locals() else 'N/A'}"
                )
                if attempt == MAX_RETRIES:
                    raise HTTPException(
                        status_code=500,
                        detail="AI returned invalid format after retry. Please try again."
                    )
            except Exception as e:
                logging.error(f"AI engagement plan attempt {attempt} failed: {e}")
                if attempt == MAX_RETRIES:
                    raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

        # Build the plan record
        plan_id = str(uuid.uuid4())
        plan_data = {
            "id": plan_id,
            "goal": request.goal,
            "target_audience": request.target_audience,
            "industry": request.industry,
            "tone": request.tone,
            "platform": request.platform,
            "content_length": request.content_length,
            "plan_output": plan_output,
            "is_favorite": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # Save to Firestore
        community_engagement_service.save_engagement_plan(user["uid"], plan_data)

        return {
            "id": plan_id,
            "platform": request.platform,
            "plan": plan_output,
            "created_at": plan_data["created_at"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Engagement plan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/community/plans")
async def get_engagement_plans(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    sort: str = Query("newest", pattern="^(newest|oldest)$"),
    filter_by: str = Query("all", pattern="^(all|favorites)$"),
    user: dict = Depends(get_current_user)
):
    """Get engagement plans for the authenticated user, paginated."""
    try:
        return community_engagement_service.get_engagement_plans(
            uid=user["uid"],
            page=page,
            limit=limit,
            sort=sort,
            filter_by=filter_by,
        )
    except Exception as e:
        logging.error(f"Engagement plans list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/community/plan/{plan_id}")
async def get_engagement_plan(plan_id: str, user: dict = Depends(get_current_user)):
    """Get a single engagement plan by ID."""
    data = community_engagement_service.get_engagement_plan(user["uid"], plan_id)
    if not data:
        raise HTTPException(status_code=404, detail="Engagement plan not found")
    return data


@api_router.delete("/community/plan/{plan_id}")
async def delete_engagement_plan(plan_id: str, user: dict = Depends(get_current_user)):
    """Delete an engagement plan."""
    success = community_engagement_service.delete_engagement_plan(user["uid"], plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Engagement plan not found")
    return {"success": True, "message": "Engagement plan deleted"}


@api_router.post("/community/plan/{plan_id}/favorite")
async def toggle_engagement_favorite(plan_id: str, user: dict = Depends(get_current_user)):
    """Toggle favorite status on an engagement plan."""
    new_state = community_engagement_service.toggle_favorite(user["uid"], plan_id)
    if new_state is None:
        raise HTTPException(status_code=404, detail="Engagement plan not found")
    return {"is_favorite": new_state}


# =============================================
#  AI CAPTION & BIO GENERATOR ENDPOINTS
# =============================================

class CaptionBioInput(BaseModel):
    content_type: str   # caption / bio / tagline / description
    platform: str       # Instagram / Twitter / LinkedIn / Facebook
    brand_name: str
    tone: str           # professional / casual / inspirational / bold / witty / friendly
    key_points: str
    num_variations: int = 5

CAPTION_BIO_LIMITS = {
    "Instagram": {
        "bio": {"max": 150, "label": "Bio"},
        "caption": {"max": 2200, "label": "Caption"},
        "tagline": {"max": 150, "label": "Tagline"},
        "description": {"max": 2200, "label": "Description"},
    },
    "Twitter": {
        "bio": {"max": 160, "label": "Bio"},
        "caption": {"max": 280, "label": "Caption/Tweet"},
        "tagline": {"max": 160, "label": "Tagline"},
        "description": {"max": 280, "label": "Description"},
    },
    "LinkedIn": {
        "bio": {"max": 2600, "label": "About/Summary"},
        "caption": {"max": 1300, "label": "Post Caption"},
        "tagline": {"max": 220, "label": "Headline/Tagline"},
        "description": {"max": 2600, "label": "Description"},
    },
    "Facebook": {
        "bio": {"max": 101, "label": "Bio (Intro)"},
        "caption": {"max": 500, "label": "Post Caption"},
        "tagline": {"max": 255, "label": "Page Tagline"},
        "description": {"max": 255, "label": "Page Description"},
    },
}


@api_router.get("/caption/limits")
async def get_caption_limits():
    """Get character limits for all platforms and content types."""
    return CAPTION_BIO_LIMITS


@api_router.post("/caption/generate")
async def generate_caption_bio(request: CaptionBioInput, user: dict = Depends(get_current_user)):
    """
    Generate 3-5 AI variations of a caption, bio, tagline, or description
    with platform-specific character limits enforced.
    """
    try:
        platform_limits = CAPTION_BIO_LIMITS.get(request.platform, {})
        type_info = platform_limits.get(request.content_type, {"max": 500, "label": request.content_type})
        char_limit = type_info["max"]
        num_vars = max(3, min(request.num_variations, 5))

        prompt = f"""You are an expert social media copywriter. Generate exactly {num_vars} unique variations of a {request.content_type} for {request.platform}.

Brand: {request.brand_name}
Tone: {request.tone}
Key Points / Context: {request.key_points}
Content Type: {request.content_type}
Platform: {request.platform}
Character Limit: {char_limit} characters MAX per variation

Platform-specific guidelines:
- Instagram: Use emojis, be visual and emotional, include relevant hashtags for captions.
- Twitter/X: Be punchy, concise, add personality. Bios under 160 chars. Captions under 280.
- LinkedIn: Professional, thought-leadership tone. Bios can be longer and detailed.
- Facebook: Community-focused, conversational, encourage engagement.

Content type instructions:
- "caption": Write a compelling social media post caption with a hook, value, and CTA.
- "bio": Write a platform profile bio that represents the brand identity.
- "tagline": Write a short, memorable brand tagline/slogan.
- "description": Write a detailed brand or page description.

Rules:
- Each variation MUST be UNDER {char_limit} characters
- Each variation should have a different style, angle, or hook
- Make every variation ready to copy-paste directly into the platform
- Do NOT number the variations in the content itself

Return ONLY valid JSON in this exact structure:
{{
  "variations": [
    {{
      "text": "the actual caption/bio/tagline text",
      "char_count": 123,
      "style": "brief style label like: professional, witty, emotional, bold, minimal"
    }}
  ],
  "platform": "{request.platform}",
  "content_type": "{request.content_type}",
  "char_limit": {char_limit}
}}

CRITICAL: Return ONLY the JSON. No markdown, no extra text.
"""

        import re

        def _clean_caption_json(raw: str) -> dict:
            text = raw.strip()
            text = re.sub(r'```(?:json|JSON)?\s*\n?', '', text).strip()
            text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

            try:
                return json.loads(text, strict=False)
            except json.JSONDecodeError:
                pass

            start = text.find('{')
            if start != -1:
                depth = 0
                end = start
                in_string = False
                escape_next = False
                for i in range(start, len(text)):
                    c = text[i]
                    if escape_next:
                        escape_next = False
                        continue
                    if c == '\\' and in_string:
                        escape_next = True
                        continue
                    if c == '"':
                        in_string = not in_string
                        continue
                    if in_string:
                        continue
                    if c == '{':
                        depth += 1
                    elif c == '}':
                        depth -= 1
                        if depth == 0:
                            end = i
                            break
                candidate = text[start:end + 1]
                try:
                    return json.loads(candidate, strict=False)
                except json.JSONDecodeError:
                    pass

                fixed = re.sub(r',\s*([}\]])', r'\1', candidate)
                try:
                    return json.loads(fixed, strict=False)
                except json.JSONDecodeError:
                    pass

            raise json.JSONDecodeError("No valid JSON found", text[:200], 0)

        MAX_RETRIES = 3
        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                logging.info(f"Caption/bio generation attempt {attempt}/{MAX_RETRIES}")
                ai_response = await generate_ai_response(prompt)
                result = _clean_caption_json(ai_response)

                if "variations" not in result or not isinstance(result["variations"], list):
                    raise json.JSONDecodeError("Missing 'variations' key", str(result)[:100], 0)

                # Recalculate char_count for accuracy
                for v in result["variations"]:
                    v["char_count"] = len(v.get("text", ""))

                break
            except json.JSONDecodeError as e:
                last_error = e
                logging.warning(f"Attempt {attempt}/{MAX_RETRIES} — caption JSON parse failed: {e.msg}")
                if attempt == MAX_RETRIES:
                    raise HTTPException(
                        status_code=500,
                        detail="AI returned invalid format after retry. Please try again."
                    )
            except Exception as e:
                logging.error(f"AI caption attempt {attempt} failed: {e}")
                if attempt == MAX_RETRIES:
                    raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

        # Build the generation record
        gen_id = str(uuid.uuid4())
        gen_data = {
            "id": gen_id,
            "content_type": request.content_type,
            "platform": request.platform,
            "brand_name": request.brand_name,
            "tone": request.tone,
            "key_points": request.key_points,
            "char_limit": char_limit,
            "variations": result["variations"],
            "is_favorite": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # Save to Firestore
        caption_bio_service.save_caption_generation(user["uid"], gen_data)

        return {
            "id": gen_id,
            "platform": request.platform,
            "content_type": request.content_type,
            "char_limit": char_limit,
            "variations": result["variations"],
            "created_at": gen_data["created_at"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Caption/bio generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/caption/history")
async def get_caption_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    sort: str = Query("newest", pattern="^(newest|oldest)$"),
    filter_by: str = Query("all", pattern="^(all|favorites)$"),
    user: dict = Depends(get_current_user)
):
    """Get caption/bio generations for the authenticated user, paginated."""
    try:
        return caption_bio_service.get_caption_generations(
            uid=user["uid"],
            page=page,
            limit=limit,
            sort=sort,
            filter_by=filter_by,
        )
    except Exception as e:
        logging.error(f"Caption history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/caption/generation/{gen_id}")
async def get_caption_generation(gen_id: str, user: dict = Depends(get_current_user)):
    """Get a single caption/bio generation by ID."""
    data = caption_bio_service.get_caption_generation(user["uid"], gen_id)
    if not data:
        raise HTTPException(status_code=404, detail="Caption generation not found")
    return data


@api_router.delete("/caption/{gen_id}")
async def delete_caption_generation(gen_id: str, user: dict = Depends(get_current_user)):
    """Delete a caption/bio generation."""
    success = caption_bio_service.delete_caption_generation(user["uid"], gen_id)
    if not success:
        raise HTTPException(status_code=404, detail="Caption generation not found")
    return {"success": True, "message": "Caption generation deleted"}


@api_router.post("/caption/{gen_id}/favorite")
async def toggle_caption_favorite(gen_id: str, user: dict = Depends(get_current_user)):
    """Toggle favorite status on a caption/bio generation."""
    new_state = caption_bio_service.toggle_favorite(user["uid"], gen_id)
    if new_state is None:
        raise HTTPException(status_code=404, detail="Caption generation not found")
    return {"is_favorite": new_state}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)