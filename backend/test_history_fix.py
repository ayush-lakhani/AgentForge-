"""
Test script to verify the history bug fix
Tests that each strategy returns ONLY its own data, not mixed data
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# You'll need to replace this with a valid token
TOKEN = "your_token_here"  # Get from localStorage after logging in

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

print("=" * 70)
print("AGENTFORGE HISTORY BUG TEST")
print("=" * 70)

# Test 1: Get history list
print("\n1️⃣ Testing GET /api/history...")
try:
    response = requests.get(f"{BASE_URL}/api/history", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        history = data.get('history', [])
        print(f"✅ Found {len(history)} strategies")
        
        if len(history) >= 2:
            # Test 2: Get first strategy
            strategy1_id = history[0].get('id') or history[0].get('_id')
            strategy1_industry = history[0].get('industry', 'Unknown')
            
            print(f"\n2️⃣ Testing GET /api/history/{strategy1_id}...")
            print(f"   Strategy 1: {strategy1_industry}")
            
            response1 = requests.get(f"{BASE_URL}/api/history/{strategy1_id}", headers=headers)
            if response1.status_code == 200:
                data1 = response1.json()
                print(f"✅ Strategy 1 loaded")
                print(f"   Has personas: {bool(data1.get('personas'))}")
                print(f"   Has keywords: {bool(data1.get('keywords'))}")
                print(f"   Has strategic_guidance: {bool(data1.get('strategic_guidance'))}")
                print(f"   Industry: {data1.get('industry')}")
                
                # Test 3: Get second strategy
                strategy2_id = history[1].get('id') or history[1].get('_id')
                strategy2_industry = history[1].get('industry', 'Unknown')
                
                print(f"\n3️⃣ Testing GET /api/history/{strategy2_id}...")
                print(f"   Strategy 2: {strategy2_industry}")
                
                response2 = requests.get(f"{BASE_URL}/api/history/{strategy2_id}", headers=headers)
                if response2.status_code == 200:
                    data2 = response2.json()
                    print(f"✅ Strategy 2 loaded")
                    print(f"   Has personas: {bool(data2.get('personas'))}")
                    print(f"   Has keywords: {bool(data2.get('keywords'))}")
                    print(f"   Has strategic_guidance: {bool(data2.get('strategic_guidance'))}")
                    print(f"   Industry: {data2.get('industry')}")
                    
                    # Test 4: Verify data isolation
                    print(f"\n4️⃣ Verifying Data Isolation...")
                    
                    # Check if industries are different
                    if data1.get('industry') != data2.get('industry'):
                        print(f"✅ Industries are different: '{data1.get('industry')}' vs '{data2.get('industry')}'")
                    else:
                        print(f"⚠️  Industries are same (might be expected if user generated same industry)")
                    
                    # Check if personas are different
                    personas1 = data1.get('personas', [])
                    personas2 = data2.get('personas', [])
                    
                    if personas1 and personas2:
                        persona1_name = personas1[0].get('name') if personas1 else None
                        persona2_name = personas2[0].get('name') if personas2 else None
                        
                        if persona1_name != persona2_name:
                            print(f"✅ Personas are different: '{persona1_name}' vs '{persona2_name}'")
                        else:
                            print(f"❌ BUG: Personas are identical! Data might be mixed!")
                    
                    # Check if keywords are different
                    keywords1 = data1.get('keywords', [])
                    keywords2 = data2.get('keywords', [])
                    
                    if keywords1 and keywords2:
                        keyword1_term = keywords1[0].get('term') if keywords1 else None
                        keyword2_term = keywords2[0].get('term') if keywords2 else None
                        
                        if keyword1_term != keyword2_term:
                            print(f"✅ Keywords are different: '{keyword1_term}' vs '{keyword2_term}'")
                        else:
                            print(f"❌ BUG: Keywords are identical! Data might be mixed!")
                    
                    print(f"\n5️⃣ Summary:")
                    print(f"   Strategy 1 ID: {strategy1_id}")
                    print(f"   Strategy 2 ID: {strategy2_id}")
                    print(f"   Data properly isolated: {data1.get('industry') != data2.get('industry')}")
                    
        else:
            print(f"⚠️  Need at least 2 strategies to test. Found: {len(history)}")
            print(f"   Please generate 2+ strategies first")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nTo run this test:")
    print("1. Log in to the app at http://localhost:5173")
    print("2. Open browser console and run: localStorage.getItem('token')")
    print("3. Copy the token and paste it in this script")
    print("4. Run: python test_history_fix.py")

print("\n" + "=" * 70)
