from app.models.schemas import StrategyInput

def generate_demo_strategy(strategy_input: StrategyInput) -> dict:
    """Generate demo strategy when CrewAI is not available"""
    return {
        "personas": [
            {
                "name": f"{strategy_input.audience.title()} Enthusiast (Young)",
                "age_range": "18-24",
                "occupation": "Student/Early Career",
                "pain_points": ["Limited budget", "Time constraints", "Learning curve", "Overwhelmed by options", "Need quick results"],
                "desires": ["Affordable solutions", "Easy to use", "Quick wins", "Build skills", "Feel confident"],
                "objections": ["Too expensive", "Not sure if it works", "Already tried others", "No time to learn", "Quality concerns"],
                "daily_habits": [f"Checks {strategy_input.platform} daily", "Consumes content during commute", "Engages in evening", "Weekend planning", "Follows trends"],
                "content_preferences": ["Short video", "Quick tips", "Behind-the-scenes", "Trendy content", "Mobile-friendly"]
            },
            {
                "name": f"{strategy_input.audience.title()} Professional",
                "age_range": "25-34",
                "occupation": "Working Professional",
                "pain_points": ["Limited time", "Struggling with consistency", "Unsure about strategy", "Algorithm changes", "Difficulty measuring ROI"],
                "desires": ["Grow authentically", "Create easily", "Build brand", "Monetize expertise", "Save time"],
                "objections": ["Too expensive", "Not sure if it works", "Already tried others", "No time to learn", "Quality concerns"],
                "daily_habits": [f"Checks {strategy_input.platform} daily", "Consumes content during commute", "Engages in evening", "Plans on weekends", "Follows influencers"],
                "content_preferences": ["Short video", "Quick tips", "Behind-the-scenes", "UGC", "Data insights"]
            },
            {
                "name": f"{strategy_input.audience.title()} Expert",
                "age_range": "35-45",
                "occupation": "Senior Professional/Manager",
                "pain_points": ["Keeping up with trends", "Delegating content creation", "ROI measurement", "Brand consistency", "Scaling challenges"],
                "desires": ["Efficient systems", "Proven strategies", "Team collaboration", "Authority building", "Long-term growth"],
                "objections": ["Implementation complexity", "Team training needed", "Budget allocation", "Risk of change", "Competitive concerns"],
                "daily_habits": [f"Strategic {strategy_input.platform} review", "Industry research", "Team meetings", "Performance analysis", "Networking"],
                "content_preferences": ["Educational posts", "Case studies", "Industry insights", "Professional content", "Long-form valuable content"]
            }
        ],
        "competitor_gaps": [
            {"gap": "Lack of personalized strategies", "impact": "High", "implementation": "AI personalization engine"},
            {"gap": "No real-time trends", "impact": "High", "implementation": "Trend monitoring"},
            {"gap": "Missing analytics", "impact": "Medium", "implementation": "Performance tracking"},
            {"gap": "Limited platform insights", "impact": "Medium", "implementation": "Platform optimization"},
            {"gap": "No collaboration", "impact": "Low", "implementation": "Team tools"}
        ],
        "keywords": [
            {
                "term": f"{strategy_input.industry.lower()} content ideas", 
                "intent": "Informational", 
                "difficulty": "Easy", 
                "monthly_searches": "5K-10K", 
                "priority": 10,
                "hashtags": [f"#{strategy_input.industry.replace(' ', '')}Content", "#ContentIdeas", "#MarketingTips", "#SocialMediaStrategy", "#ContentCreation"]
            },
            {
                "term": f"grow on {strategy_input.platform.lower()}", 
                "intent": "Informational", 
                "difficulty": "Easy", 
                "monthly_searches": "10K-50K", 
                "priority": 9,
                "hashtags": [f"#{strategy_input.platform}Growth", f"#{strategy_input.platform}Tips", "#SocialMediaGrowth", "#DigitalMarketing", "#GrowYourBusiness"]
            },
            {
                "term": f"{strategy_input.platform.lower()} tips", 
                "intent": "Informational", 
                "difficulty": "Easy", 
                "monthly_searches": "5K-10K", 
                "priority": 8,
                "hashtags": [f"#{strategy_input.platform}Tips", "#SocialMediaTips", "#MarketingHacks", "#ContentStrategy", "#DigitalMarketing"]
            },
            {
                "term": f"{strategy_input.industry.lower()} marketing", 
                "intent": "Transactional", 
                "difficulty": "Medium", 
                "monthly_searches": "5K-10K", 
                "priority": 7,
                "hashtags": [f"#{strategy_input.industry.replace(' ', '')}Marketing", "#IndustryTips", "#B2BMarketing", "#MarketingStrategy", "#BusinessGrowth"]
            },
            {
                "term": f"viral {strategy_input.platform.lower()} content", 
                "intent": "Informational", 
                "difficulty": "Medium", 
                "monthly_searches": "5K-10K", 
                "priority": 6,
                "hashtags": ["#ViralContent", f"#{strategy_input.platform}Viral", "#ContentMarketing", "#SocialMedia", "#Trending"]
            }
        ],
        "strategic_guidance": {
            "what_to_do": ["Behind-the-scenes content", "User testimonials", "Educational carousels", "Quick tip Reels", "Industry insights"],
            "how_to_do_it": ["Hook in first 3 seconds", "Add captions/text overlays", "Use trending audio", "Include clear CTA", "Post consistently"],
            "where_to_post": {
                "primary_platform": strategy_input.platform,
                "posting_locations": ["Feed", "Reels", "Stories"],
                "cross_promotion": ["TikTok (repurpose)", "YouTube Shorts"]
            },
            "when_to_post": {
                "best_days": ["Tuesday", "Thursday", "Saturday"],
                "best_times": ["9-11 AM", "1-3 PM", "7-9 PM"],
                "frequency": "3-5 times per week",
                "consistency_tips": ["Batch create on Sundays", "Schedule in advance"]
            },
            "what_to_focus_on": ["Engagement rate over followers", "Save rate for value", "Comment quality", "Share potential", "Watch time"],
            "why_it_works": ["Video captures attention faster", "Consistency trains algorithm", "Value builds trust", "Storytelling creates connection", "Clear CTAs drive action"],
            "productivity_boosters": ["Batch create content", "Use templates", "Repurpose across platforms", "Set reminders", "Plan 2 weeks ahead"],
            "things_to_avoid": ["Don't post without CTA", "Avoid overly salesy tone", "Don't ignore comments", "Avoid inconsistency", "Don't skip captions"]
        },
        "calendar": [
            {"week": 1, "day": 1, "topic": "Introduction", "format": "Reel", "caption_hook": "Here's why...", "cta": "Follow for more"},
            {"week": 1, "day": 3, "topic": "Quick Win", "format": "Carousel", "caption_hook": "Want results?", "cta": "Save this"},
            {"week": 2, "day": 2, "topic": "Educational", "format": "Post", "caption_hook": "Did you know...", "cta": "Share this"}
        ],
        "sample_posts": [
            {
                "title": "🚀 Game-Changing Strategy",
                "caption": f"If you're in {strategy_input.industry}, listen up.\n\n✅ Consistent posting\n✅ Authentic storytelling\n✅ Value-first\n\nComment 'STRATEGY' 👇",
                "hashtags": [f"#{strategy_input.industry.replace(' ', '')}", f"#{strategy_input.platform}Marketing", "#ContentStrategy"],
                "image_prompt": f"Professional workspace with {strategy_input.platform} dashboard, vibrant colors",
                "best_time": "Weekdays 9-11 AM"
            }
        ],
        "roi_prediction": {
            "traffic_lift_percentage": "18-25%",
            "engagement_boost_percentage": "35-45%",
            "estimated_monthly_reach": "5K-15K",
            "conversion_rate_estimate": "1.5-2.5%",
            "time_to_results": "30-60 days"
        }
    }


def generate_experience_based_strategy(input_data: dict) -> tuple[str, list]:
    """
    Generates the 'Tactical Blueprint' (HTML) and Sample Posts based on inputs.
    This serves as the deterministic/logic-based layer of the strategy.
    
    Args:
        input_data (dict): Strategy inputs (goal, audience, etc.)
        
    Returns:
        tuple: (blueprint_html_string, sample_posts_list)
    """
    
    # Re-use demo strategy logic to get structured data
    # converting dict back to StrategyInput for the existing function
    strategy_input_obj = StrategyInput(**input_data)
    base_data = generate_demo_strategy(strategy_input_obj)
    
    # Extract data for the blueprint
    guidance = base_data["strategic_guidance"]
    
    # Build HTML Blueprint
    # This creates the "Tactical Blueprint" tab content in the frontend
    html = f"""
    <div class="blueprint-container">
        <div class="blueprint-section">
            <h3>🎯 30-Day Execution Plan</h3>
            <p><strong>Focus:</strong> {input_data.get('goal', 'Growth')}</p>
            <p><strong>Frequency:</strong> {guidance['when_to_post']['frequency']}</p>
        </div>
        
        <div class="blueprint-section">
            <h3>💡 Content Pillars</h3>
            <ul>
                {"".join([f"<li>{item}</li>" for item in guidance['what_to_do'][:3]])}
            </ul>
        </div>
        
        <div class="blueprint-section">
            <h3>🚀 Growth Tactics</h3>
            <ul>
                {"".join([f"<li>{item}</li>" for item in guidance['how_to_do_it'][:3]])}
            </ul>
        </div>
        
        <div class="blueprint-section">
            <h3>📈 Key Metrics</h3>
            <p>Focus on: {", ".join(guidance['what_to_focus_on'][:3])}</p>
        </div>
    </div>
    """
    
    return html, base_data["sample_posts"]
