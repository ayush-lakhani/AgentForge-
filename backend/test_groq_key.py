"""
Quick script to get your Groq API key and test CrewAI
"""
import os
from dotenv import load_dotenv

load_dotenv()

groq_key = os.getenv("GROQ_API_KEY", "")

print("=" * 60)
print("🔑 GROQ API KEY STATUS")
print("=" * 60)

if groq_key and len(groq_key) > 10:
    print(f"✅ Groq API Key Found: {groq_key[:10]}...")
    print(f"   Length: {len(groq_key)} characters")
    
    # Test import
    try:
        from app.services.crew import create_content_strategy_crew
        print("✅ CrewAI module imported successfully")
        print("\n🎉 CREWAI IS READY TO USE!")
    except Exception as e:
        print(f"❌ CrewAI import failed: {e}")
else:
    print("❌ No Groq API Key found!")
    print("\n📝 TO GET A FREE GROQ API KEY:")
    print("   1. Visit: https://console.groq.com")
    print("   2. Sign up / Log in")
    print("   3. Click 'API Keys' in sidebar")
    print("   4. Click 'Create API Key'")
    print("   5. Copy the key (starts with 'gsk_')")
    print("   6. Paste it in backend/.env file:")
    print("      GROQ_API_KEY=gsk_your_key_here")

print("=" * 60)
