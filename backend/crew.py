"""
CrewAI Multi-Agent System - 4 Elite Agents for Content Strategy
Each agent has a specific role, goal, and backstory designed for maximum performance
"""

from crewai import Agent, Task, Crew, Process
from langchain_groq import ChatGroq
from models import StrategyInput, ContentStrategy
import json
import os

# SerpAPI Tool for Real Keyword Research
try:
    from crewai_tools import SerperDevTool
    SERPAPI_ENABLED = bool(os.getenv("SERPAPI_KEY"))
    if SERPAPI_ENABLED:
        serper_tool = SerperDevTool()
except ImportError:
    SERPAPI_ENABLED = False
    print("⚠️  crewai-tools not installed. SerpAPI disabled.")

# Initialize Groq LLM (Llama-3.3-70B)
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.7,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

def create_content_strategy_crew(strategy_input: StrategyInput) -> dict:
    """
    Creates and executes a 4-agent CrewAI workflow for content strategy generation
    
    Args:
        strategy_input: Validated input containing goal, audience, industry, platform
        
    Returns:
        dict: Complete content strategy matching ContentStrategy schema
    """
    
    # ============================================================================
    # AGENT 1: AUDIENCE INTELLIGENCE SURGEON
    # ============================================================================
    audience_surgeon = Agent(
        role="Audience Intelligence Surgeon",
        goal="Build 3x conversion personas from raw business inputs using deep psychological profiling",
        backstory="""You are a master audience psychologist with 15 years studying consumer behavior.
        You've created high-converting personas for Fortune 500 brands like Nike, Apple, and Spotify.
        Your personas don't just describe demographics - they expose deep emotional triggers, 
        daily frustrations, and aspirational desires that drive purchasing decisions.
        You can predict objections before they happen and craft messaging that resonates at a primal level.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

    # ============================================================================
    # AGENT 2: CULTURAL TREND SNIPER
    # ============================================================================
    trend_sniper = Agent(
        role="Cultural Trend Sniper",
        goal="Predict 90-day viral content gaps before they hit Google Trends",
        backstory="""You spent 5 years on TikTok's trend prediction team and predicted 50+ viral moments.
        You don't just follow trends - you predict them by analyzing cultural undercurrents, 
        micro-communities, and emerging behaviors that competitors miss.
        Your superpower is finding content gaps where competitors are completely asleep.
        You've helped creators go from 0 to 100K followers by exploiting these invisible opportunities.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

    # ============================================================================
    # AGENT 3: ORGANIC TRAFFIC ARCHITECT (+ SerpAPI Tool)
    # ============================================================================
    traffic_architect = Agent(
        role="Organic Traffic Architect",
        goal="Engineer 30-day keyword ladders with REAL search volume data that actually rank",
        backstory="""You're an SEO strategist who ranked 200+ sites to page 1 using low-competition keywords.
        You don't waste time on high-difficulty keywords - you build 'keyword ladders' that start with 
        easy wins and progressively build authority.
        You understand search intent at a molecular level and can predict which keywords will convert.
        Your strategies have generated millions in organic revenue for e-commerce and SaaS brands.
        You use SerpAPI to get REAL keyword search volumes instead of guessing.""",
        verbose=True,
        allow_delegation=False,
        tools=[serper_tool] if SERPAPI_ENABLED else [],  # Real keyword research!
        llm=llm
    )

    # ============================================================================
    # AGENT 4: CHIEF STRATEGY SYNTHESIZER
    # ============================================================================
    strategy_synthesizer = Agent(
        role="Chief Strategy Synthesizer",
        goal="Output pixel-perfect JSON execution plans with zero parsing errors",
        backstory="""You're a former content director who built systems for $100M+ brands like Red Bull and GoPro.
        Your superpower is taking complex research and transforming it into executable action plans.
        You create 30-day content calendars so detailed that junior creators can execute flawlessly.
        Every post you plan has a strategic purpose, from hook to CTA.
        You ALWAYS output perfectly structured JSON that passes strict validation.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

    # ============================================================================
    # AGENT 5: ROI PREDICTION ANALYST (NEW)
    # ============================================================================
    roi_predictor = Agent(
        role="ROI Prediction Analyst",
        goal="Estimate traffic lift and engagement boost using industry benchmarks",
        backstory="""You're a data-driven marketing analyst who's predicted outcomes for 500+ campaigns.
        You analyze content strategies and forecast measurable results based on:
        - Industry benchmarks (SaaS vs F&B vs E-commerce)
        - Platform algorithms (Instagram vs LinkedIn engagement rates)
        - Content type performance (Reels vs Posts vs Blogs)
        - Audience size and growth potential
        Your predictions are typically within 15% of actual results after 60 days.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

    # ============================================================================
    # TASK 1: BUILD 3 DISTINCT PERSONAS
    # ============================================================================
    persona_task = Task(
        description=f"""
        Analyze this SPECIFIC business and create THREE ultra-detailed buyer personas covering different segments:
        - Business Goal: {strategy_input.goal}
        - Target Audience: {strategy_input.audience}
        - Industry: {strategy_input.industry}
        - Platform: {strategy_input.platform}
        - Content Type: {strategy_input.contentType}
        - Experience Level: {strategy_input.experience}
        
        🚨 CRITICAL VALIDATION RULES 🚨
        1. Generate 3 DISTINCT personas - NOT the same persona 3 times
        2. Each persona MUST have DIFFERENT age ranges (e.g., 18-24, 25-34, 35-45)
        3. NO GENERIC "Working Professional" or "25-34" defaults unless highly specific to the industry
        4. Each persona MUST mention the actual industry ({strategy_input.industry}) in pain_points or desires
        5. If you output generic personas, the task FAILS - regenerate with specific details!
        
        📋 CONCRETE EXAMPLES TO FOLLOW:
        
        Example 1: Coffee Business (F&B + college students/working professionals + Instagram)
        ✅ CORRECT OUTPUT:
        {{
          "personas": [
            {{
              "name": "Stressed College Caffeine Addict",
              "age_range": "18-24",
              "occupation": "Full-time University Student",
              "pain_points": ["$5 lattes drain student budget", "Need caffeine for late-night study sessions", "Campus coffee is terrible", "Guilty about daily Starbucks habit", "Can't afford quality coffee regularly"],
              "desires": ["Affordable specialty coffee subscription", "Instagram-worthy coffee moments", "Budget-friendly caffeine fix", "Support local coffee roasters", "Become a coffee connoisseur on student budget"],
              "objections": ["Subscriptions are too expensive for students", "Worried about commitment", "Not sure if I'll like the coffee", "Shipping costs add up", "Prefer instant gratification of buying in-store"],
              "daily_habits": ["Scrolls Instagram during morning coffee", "Studies at cafes 3-4 times/week", "Posts coffee flatlay photos", "Watches coffee brewing Reels", "Checks Instagram between classes"],
              "content_preferences": ["15-30 sec coffee brewing Reels", "Aesthetic coffee photography", "Student budget hacks", "Behind-the-scenes cafe content", "Quick coffee recipes"]
            }},
            {{
              "name": "Busy Remote Worker Coffee Enthusiast",
              "age_range": "25-34",
              "occupation": "Remote Tech Professional",
              "pain_points": ["Office coffee machine broke - now WFH coffee sucks", "Spend too much on daily cafe runs", "No time to learn proper brewing", "Zoom fatigue needs caffeine boost", "Want cafe quality at home desk"],
              "desires": ["Convenient coffee delivery to home office", "Impress coworkers on Zoom with fancy coffee", "Discover new coffee varieties", "Morning coffee ritual that saves time", "Feel like a barista without leaving desk"],
              "objections": ["Already spending too much on subscriptions", "Might not have time to brew properly", "Worried about coffee going stale", "Unsure about auto-delivery scheduling", "Commitment issues with monthly subscriptions"],
              "daily_habits": ["Checks Instagram during work breaks", "Brews coffee 2-3 times during workday", "Shares WFH setup photos on Stories", "Scrolls Reels during lunch", "Engages with food/coffee content in evening"],
              "content_preferences": ["Quick WFH coffee hacks Reels", "Coffee subscription unboxing", "Brewing tutorial short videos", "Office setup aesthetic posts", "Coffee pairing suggestions"]
            }},
            {{
              "name": "Middle-Aged Coffee Connoisseur Parent",
              "age_range": "35-45",
              "occupation": "Marketing Manager & Parent",
              "pain_points": ["Morning chaos with kids - need reliable coffee", "Grocery store coffee disappoints", "No time to visit specialty coffee shops", "Want to explore coffee but overwhelmed by options", "Need something special beyond Nespresso pods"],
              "desires": ["Curated coffee experience delivered", "Discover artisan roasters without research", "Enjoy premium coffee during rare me-time", "Feel sophisticated despite busy parent life", "Support small businesses through coffee purchases"],
              "objections": ["Family budget is tight - is specialty coffee worth it?", "Kids might spill expensive coffee", "Already have too many subscriptions", "Worried about coffee preferences changing", "Skeptical about online coffee quality"],
              "daily_habits": ["Quick Instagram scroll during morning coffee", "Checks Stories while kids are at school", "Engages with food/lifestyle content", "Saves coffee recipes for weekends", "Shares family moments on Instagram"],
              "content_preferences": ["Informational Posts about coffee origins", "Longer-form educational content", "Coffee + parenting lifestyle posts", "Recipe carousel posts for coffee drinks", "Authentic behind-the-scenes Stories"]
            }}
          ]
        }}
        
        Example 2: Fashion Business (Fashion & Apparel + girls 12-40 + Instagram)
        ✅ CORRECT OUTPUT:
        {{
          "personas": [
            {{
              "name": "Trendy Tween Fashion Explorer",
              "age_range": "12-17",
              "occupation": "Middle/High School Student",
              "pain_points": ["School dress code limits fashion creativity", "Can't afford trendy clothes on allowance", "Body changing - clothes don't fit for long", "Parents don't understand fashion trends", "Peer pressure to wear latest styles"],
              "desires": ["Look stylish on small budget", "Stand out without breaking rules", "Keep up with TikTok fashion trends", "Build unique personal style", "Get compliments from friends at school"],
              "objections": ["Mom controls my shopping budget", "Worried clothes won't fit next year", "Friends might not like my style choices", "Shipping takes too long for events", "Returns are complicated for teens"],
              "daily_habits": ["Scrolls Instagram fashion accounts before school", "Creates outfit ideas on Pinterest", "Watches fashion haul videos", "Takes mirror selfies daily", "Shares OOTD posts on Instagram"],
              "content_preferences": ["Outfit inspiration Reels", "Back-to-school fashion Posts", "DIY styling hacks", "Fashion challenge videos", "Affordable fashion finds"]
            }},
            {{
              "name": "Young Professional Fashion-Forward Woman",
              "age_range": "25-34",
              "occupation": "Corporate Professional / Young Entrepreneur",
              "pain_points": ["Office wear is boring but trendy clothes aren't professional", "No time to shop between work and social life", "Want to look put-together without effort", "Fast fashion guilt vs. budget constraints", "Body confidence issues with online shopping"],
              "desires": ["Effortless work-to-weekend wardrobe", "Sustainable fashion on realistic budget", "Look polished in Zoom meetings and IRL", "Express personality through professional style", "Build capsule wardrobe that works"],
              "objections": ["Online sizing is always wrong", "Quality concerns with online fashion", "Return process is time-consuming", "Too many brands - decision fatigue", "Worried about keeping up with changing trends"],
              "daily_habits": ["Morning Instagram scroll for outfit inspo", "Saves fashion Reels during commute", "Online shops during work breaks", "Shares work outfit Stories", "Engages with fashion influencers"],
              "content_preferences": ["Workwear styling Reels", "Capsule wardrobe Posts", "Outfit transition videos (desk to dinner)", "Try-on hauls", "Fashion investment pieces guides"]
            }},
            {{
              "name": "Mature Style-Conscious Woman",
              "age_range": "35-40",
              "occupation": "Senior Professional / Business Owner",
              "pain_points": ["Stores target younger women - feel overlooked", "Want age-appropriate fashion without looking 'old'", "Body has changed - old styles don't work", "Too busy for shopping trips", "Fashion content feels too young or too matronly"],
              "desires": ["Sophisticated yet modern wardrobe", "Quality over quantity - investment pieces", "Clothes that fit real adult bodies", "Express individuality at this life stage", "Feel confident and polished effortlessly"],
              "objections": ["Sizing inconsistency makes online risky", "Quality doesn't match price point online", "Tired of fast fashion disappointments", "Prefer trying on before buying", "Skeptical of influencer recommendations"],
              "daily_habits": ["Checks Instagram during morning coffee", "Engages with fashion content in the evening", "Saves styling ideas for weekend shopping", "Shares empowerment/lifestyle content", "Follows quality-focused fashion accounts"],
              "content_preferences": ["Timeless fashion Posts", "Quality vs. price comparison content", "Styling tips for mature women", "Before/after outfit transformations", "Sustainable fashion Stories"]
            }}
          ]
        }}
        
        🎯 YOUR TASK:
        Generate 3 personas for: {strategy_input.industry} industry targeting {strategy_input.audience}
        
        Output MUST be a JSON object with "personas" array containing exactly 3 persona objects.
        Each persona object MUST include:
        - "name": Industry + audience specific (NOT generic!)
        - "age_range": Covers different segments of {strategy_input.audience}
        - "occupation": Specific to the age/industry context
        - "pain_points": Array of 5 points specific to {strategy_input.industry}
        - "desires": Array of 5 desires related to {strategy_input.goal}
        - "objections": Array of 5 objections specific to buying from {strategy_input.industry}
        - "daily_habits": Array of 5 habits including {strategy_input.platform} usage
        - "content_preferences": Array of 5 formats aligned with {strategy_input.contentType}
        
        ❌ FAIL CONDITIONS (DON'T DO THIS):
        - Using "Working Professional" without industry context
        - All 3 personas have same age_range
        - Generic pain points like "Limited time" that apply to anyone
        - No mention of {strategy_input.industry} in pain_points or desires
        - Content preferences don't match {strategy_input.contentType}
        
        Make each persona psychologically DEEP, SPECIFIC, and ACTIONABLE for content creation!
        """,
        agent=audience_surgeon,
        expected_output="JSON object with 'personas' array containing 3 highly specific, distinct persona objects"
    )

    # ============================================================================
    # TASK 2: FIND COMPETITOR GAPS
    # ============================================================================
    gaps_task = Task(
        description=f"""
        Based on this industry and audience, identify 5 content gaps competitors are missing:
        - Industry: {strategy_input.industry}
        - Audience: {strategy_input.audience}
        - Platform: {strategy_input.platform}
        
        Output a JSON array of objects, each with:
        - "gap": The specific opportunity competitors are missing
        - "impact": Impact level (High/Medium/Low)
        - "implementation": How to exploit this gap
        
        Focus on culturally relevant gaps emerging RIGHT NOW (not obvious evergreen topics).
        """,
        agent=trend_sniper,
        expected_output="JSON array of 5 competitor gaps",
        context=[persona_task]
    )

    # ============================================================================
    # TASK 3: STRATEGIC EXECUTION GUIDANCE (NEW)
    # ============================================================================
    strategy_guidance_task = Task(
        description=f"""
        Based on the persona and competitor gaps, create a detailed strategic execution guide.
        
        - Goal: {strategy_input.goal}
        - Audience: {strategy_input.audience}
        - Industry: {strategy_input.industry}
        - Platform: {strategy_input.platform}
        - Content Type: {strategy_input.contentType}
        - Experience Level: {strategy_input.experience}
        
        Output a JSON object with these strategic guidance sections:
        
        - "what_to_do": Array of 5-7 specific content types/topics to create
          (MUST be optimized for {strategy_input.contentType}!)
          (e.g., for "Reels": "Behind-the-scenes 15-sec clips", "Trending audio transitions")
          (e.g., for "Blogs": "2000-word how-to guides", "Case study breakdowns")
        
        - "how_to_do_it": Array of 5-7 tactical execution tips
          (Specific to {strategy_input.contentType} format!)
          (e.g., for Reels: "Hook in first 3 seconds", "Use text overlays")
          (e.g., for Blogs: "Use H2/H3 structure", "Add internal links")
        
        - "where_to_post": Object with platform-specific guidance:
          {{
            "primary_platform": "{strategy_input.platform}",
            "posting_locations": Array of specific places for {strategy_input.contentType} on {strategy_input.platform},
            "cross_promotion": Array of 2-3 other platforms to repurpose {strategy_input.contentType}
          }}
        
        - "when_to_post": Object with timing strategy:
          {{
            "best_days": Array of optimal days,
            "best_times": Array of time slots optimized for {strategy_input.contentType},
            "frequency": Posting frequency realistic for {strategy_input.contentType},
            "consistency_tips": Array of 2-3 tips for staying consistent with {strategy_input.contentType}
          }}
        
        - "what_to_focus_on": Array of 5 key success metrics for {strategy_input.contentType}
          (Different for Reels vs Blogs vs Posts!)
          (e.g., Reels: "Watch time percentage", Blogs: "Time on page", Posts: "Save rate")
        
        - "why_it_works": Array of 5 psychological/strategic reasons {strategy_input.contentType} works
          (Specific to the format!)
        
        - "productivity_boosters": Array of 5 tips to maximize {strategy_input.contentType} creation efficiency
          (Format-specific workflows!)
        
        - "things_to_avoid": Array of 5 common mistakes with {strategy_input.contentType}
          (Format-specific pitfalls!)
        
        Make everything SPECIFIC to {strategy_input.platform}, {strategy_input.industry}, and {strategy_input.contentType}!
        Crucially, tailor the technical complexity to the user's experience level: {strategy_input.experience}.
        Not generic advice - actionable, tactical guidance tailored to the content format and skill level!
        """,
        agent=strategy_synthesizer,
        expected_output="JSON object with detailed strategic execution guidance optimized for content type",
        context=[persona_task, gaps_task]
    )

    # ============================================================================
    # TASK 4: BUILD KEYWORD LADDER
    # ============================================================================
    keywords_task = Task(
        description=f"""
        Create a 10-keyword ladder for organic ranking:
        - Goal: {strategy_input.goal}
        - Audience: {strategy_input.audience}
        - Industry: {strategy_input.industry}
        - Platform: {strategy_input.platform}
        
        Output a JSON array of 10 keyword objects, each with:
        - "term": Keyword phrase
        - "intent": Search intent (Informational/Transactional/Navigational)
        - "difficulty": Keyword difficulty (Easy/Medium/Hard) - prioritize Easy
        - "monthly_searches": Estimated monthly searches (e.g., "1K-10K")
        - "priority": Priority score 1-10 (higher = more important)
        - "hashtags": Array of 5 relevant hashtags (with # symbol) optimized for {strategy_input.platform}
        
        For hashtags: Mix of popular (100K-1M posts), medium (10K-100K), and niche (1K-10K) tags.
        Make them specific to the keyword and industry, not generic like #love or #instagood.
        
        Start with Easy keywords and build toward Medium. Avoid Hard keywords.
        Focus on keywords the target audience ACTUALLY searches for.
        """,
        agent=traffic_architect,
        expected_output="JSON array of 10 keywords with hashtags",
        context=[persona_task, gaps_task, strategy_guidance_task]
    )

    # ============================================================================
    # TASK 5: CREATE 30-DAY CALENDAR + SAMPLE POSTS
    # ============================================================================
    calendar_task = Task(
        description=f"""
        Create a complete execution plan with:
        
        1. A 30-day content calendar (array of 12 items representing key posts across 4 weeks)
        2. Three ready-to-post sample posts with PROFESSIONAL-GRADE image prompts
        
        ALL CONTENT must be optimized for: {strategy_input.contentType}
        
        **CALENDAR (12 items):**
        Each item must have:
        - "week": Week number (1-4)
        - "day": Day number (1-7)
        - "topic": Specific content topic (aligned with {strategy_input.contentType})
        - "format": Content format - MUST match {strategy_input.contentType} preference
        - "caption_hook": Opening hook (first line of caption)
        - "cta": Call-to-action
        
        **SAMPLE POSTS (3 items):**
        Each post must have:
        - "title": Catchy title/hook
        - "caption": Full caption (100-150 words) optimized for {strategy_input.contentType}
        - "hashtags": Array of 7-10 relevant hashtags
        - "image_prompt": DETAILED AI image generation prompt (follow the rules below!)
        - "best_time": Optimal posting time for {strategy_input.contentType}
        
        **CRITICAL: IMAGE PROMPT ENGINEERING RULES**
        You are a SENIOR PROMPT ENGINEER. Create image prompts that would generate stunning, viral-worthy visuals.
        
        Each image_prompt MUST include:
        1. **Main Subject**: What's the focal point? (person, product, scene)
        2. **Setting/Environment**: Where is this happening? Be specific
        3. **Lighting**: Natural light, golden hour, studio lighting, neon, etc.
        4. **Mood/Atmosphere**: Emotional tone (inspiring, cozy, energetic, professional)
        5. **Color Palette**: Specific colors or color schemes (warm tones, vibrant, pastel, monochrome)
        6. **Composition**: Angle and framing (overhead flat lay, close-up, wide shot, rule of thirds)
        7. **Style**: Photography style (commercial, cinematic, minimalist, editorial, lifestyle)
        8. **Technical Details**: Camera details if relevant (shallow depth of field, bokeh, sharp focus)
        9. **Platform-Specific Elements**: Props or elements that work for {strategy_input.platform}
        10. **Trending Aesthetics**: Current visual trends in {strategy_input.industry}
        
        EXAMPLE OF BAD IMAGE PROMPT (too vague):
        "Professional workspace with laptop showing dashboard, vibrant colors"
        
        EXAMPLE OF EXCELLENT IMAGE PROMPT (detailed, specific):
        "Aesthetic flat lay on marble desk, MacBook Pro displaying Instagram analytics with rising engagement graph, scattered coffee beans around steaming latte with heart latte art, iPhone showing trending Reel with play button, warm golden hour sunlight streaming from left creating soft shadows, cozy morning productivity vibe, color palette: cream whites, warm browns, gold accents, shot from directly overhead at 90 degrees, shallow depth of field with coffee cup in sharp focus and background softly blurred, minimalist lifestyle photography style, includes small succulent plant and gold pen for visual interest, optimized for Instagram feed aesthetic"
        
        Make EVERY image prompt this detailed and specific! Think like a professional content creator hiring a photographer.
        
        Output a JSON object with:
        {{
            "calendar": [... 12 calendar items optimized for {strategy_input.contentType} ...],
            "sample_posts": [... 3 sample posts with DETAILED image prompts ...]
        }}
        
        Base everything on:
        - Goal: {strategy_input.goal}
        - Platform: {strategy_input.platform}
        - Industry: {strategy_input.industry}
        - Content Type: {strategy_input.contentType} (CRITICAL!)
        - Audience insights from previous agents
        - Competitor gaps from previous agents
        - Strategic guidance from previous agents
        - Keywords from previous agents
        
        Make every post strategically aligned with the goal, visually stunning, and optimized for {strategy_input.contentType}!
        """,
        agent=strategy_synthesizer,
        expected_output="JSON object with calendar and sample_posts arrays with professional image prompts optimized for content type",
        context=[persona_task, gaps_task, strategy_guidance_task, keywords_task]
    )

    # ============================================================================
    # TASK 6: ROI PREDICTION (NEW)
    # ============================================================================
    roi_task = Task(
        description=f"""
        Based on the complete content strategy, predict measurable ROI outcomes:
        
        Context:
        - Platform: {strategy_input.platform}
        - Content Type: {strategy_input.contentType}
        - Industry: {strategy_input.industry}
        - Audience: {strategy_input.audience}
        
        Analyze the persona, keywords, and calendar to estimate:
        
        Output a JSON object with:
        - "traffic_lift_percentage": Expected traffic increase over next 60 days (e.g., "23%", "15-25%")
        - "engagement_boost_percentage": Expected engagement rate lift (e.g., "41%", "30-50%")
        - "estimated_monthly_reach": Projected monthly audience reach (e.g., "5K-10K", "10K-25K")
        - "conversion_rate_estimate": Expected conversion rate range (e.g., "2-3%", "1.5-2.5%")
        - "time_to_results": Realistic timeline to see results (e.g., "30-45 days", "60-90 days")
        
        Base predictions on:
        - Industry benchmarks ({strategy_input.industry} typical performance)
        - Platform algorithms ({strategy_input.platform} engagement rates)
        - Content type effectiveness ({strategy_input.contentType} performance data)
        - Audience size and growth potential
        - Keyword difficulty and search volume
        
        Be realistic and data-driven. Don't overpromise.
        """,
        agent=roi_predictor,
        expected_output="JSON object with ROI predictions",
        context=[persona_task, keywords_task, calendar_task]
    )

    # ============================================================================
    # CREATE AND EXECUTE CREW
    # ============================================================================
    crew = Crew(
        agents=[audience_surgeon, trend_sniper, traffic_architect, strategy_synthesizer, roi_predictor],
        tasks=[persona_task, gaps_task, strategy_guidance_task, keywords_task, calendar_task, roi_task],
        process=Process.sequential,  # Execute tasks in order
        verbose=True
    )

    # Execute the crew with inputs
    result = crew.kickoff(inputs=strategy_input.dict())

    # ============================================================================
    # PARSE AND STRUCTURE OUTPUT
    # ============================================================================
    try:
        # Extract outputs from each task
        persona_output = persona_task.output.raw if hasattr(persona_task.output, 'raw') else str(persona_task.output)
        gaps_output = gaps_task.output.raw if hasattr(gaps_task.output, 'raw') else str(gaps_task.output)
        strategy_guidance_output = strategy_guidance_task.output.raw if hasattr(strategy_guidance_task.output, 'raw') else str(strategy_guidance_task.output)
        keywords_output = keywords_task.output.raw if hasattr(keywords_task.output, 'raw') else str(keywords_task.output)
        calendar_output = calendar_task.output.raw if hasattr(calendar_task.output, 'raw') else str(calendar_task.output)
        roi_output = roi_task.output.raw if hasattr(roi_task.output, 'raw') else str(roi_task.output)

        # Clean and parse JSON from each output
        persona_data = clean_and_parse_json(persona_output)
        gaps_data = clean_and_parse_json(gaps_output)
        strategy_guidance_data = clean_and_parse_json(strategy_guidance_output)
        keywords_data = clean_and_parse_json(keywords_output)
        calendar_data = clean_and_parse_json(calendar_output)
        roi_data = clean_and_parse_json(roi_output)

        # Combine into final strategy
        final_strategy = {
            "personas": persona_data.get("personas", [persona_data]) if isinstance(persona_data, dict) else persona_data,
            "competitor_gaps": gaps_data,
            "strategic_guidance": strategy_guidance_data,
            "keywords": keywords_data,
            "calendar": calendar_data.get("calendar", []),
            "sample_posts": calendar_data.get("sample_posts", []),
            "roi_prediction": roi_data
        }

        return final_strategy

    except Exception as e:
        raise ValueError(f"Failed to parse CrewAI output: {str(e)}")


def clean_and_parse_json(text: str) -> dict | list:
    """
    Extract and parse JSON from text that might contain markdown code blocks or extra text
    """
    # Remove markdown code blocks
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    
    text = text.strip()
    
    # Try to find JSON object or array
    start_obj = text.find("{")
    start_arr = text.find("[")
    
    if start_obj != -1 and (start_arr == -1 or start_obj < start_arr):
        # Find matching closing brace
        brace_count = 0
        for i in range(start_obj, len(text)):
            if text[i] == "{":
                brace_count += 1
            elif text[i] == "}":
                brace_count -= 1
                if brace_count == 0:
                    text = text[start_obj:i+1]
                    break
    elif start_arr != -1:
        # Find matching closing bracket
        bracket_count = 0
        for i in range(start_arr, len(text)):
            if text[i] == "[":
                bracket_count += 1
            elif text[i] == "]":
                bracket_count -= 1
                if bracket_count == 0:
                    text = text[start_arr:i+1]
                    break
    
    return json.loads(text)
