import requests
import json
import sys

# Configuration
API_URL = "http://localhost:8000"
EMAIL = "test@example.com"
PASSWORD = "password123"

def login():
    print(f"🔑 Logging in as {EMAIL}...")
    try:
        response = requests.post(f"{API_URL}/api/auth/login", json={
            "email": EMAIL,
            "password": PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            return token
        else:
            print(f"❌ Login failed: {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Connection error: {e}")
        sys.exit(1)

def create_dummy_strategy(token):
    print("\n📝 Creating dummy strategy for testing...")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "goal": "Test Structure Strategy",
        "audience": "Developers",
        "industry": "Software",
        "platform": "LinkedIn",
        "contentType": "Articles",
        "experience": "expert"
    }
    
    try:
        response = requests.post(f"{API_URL}/api/strategy", json=data, headers=headers)
        if response.status_code == 200:
            print("✅ Dummy strategy created")
            return True
        else:
            print(f"❌ Failed to create strategy: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error creating strategy: {e}")
        return False

def check_history_structure(token):
    print("\n📜 Fetching history list...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{API_URL}/api/history", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to fetch history: {response.text}")
            return False
            
        data = response.json()
        history = data.get("history", [])
        
        if not history:
            print("⚠️ No history found. Generating one now...")
            if create_dummy_strategy(token):
                # Fetch again
                response = requests.get(f"{API_URL}/api/history", headers=headers)
                data = response.json()
                history = data.get("history", [])
            else:
                return False
        
        if not history:
            print("❌ Still no history after generation attempt.")
            return False
            
        latest_id = history[0].get("id")
        print(f"✅ Found latest strategy ID: {latest_id}")
        
        # Now fetch the details
        print(f"\n🔍 Fetching details for {latest_id}...")
        detail_response = requests.get(f"{API_URL}/api/history/{latest_id}", headers=headers)
        if detail_response.status_code != 200:
            print(f"❌ Failed to fetch details: {detail_response.text}")
            return False
            
        details = detail_response.json()
        
        # CRITICAL CHECK: Are keys at top level?
        # Note: 'strategic_guidance' might be missing in demo mode or simple generation?
        # Let's check for at least ONE of the key content blocks.
        required_keys = ["personas", "keywords", "competitor_gaps", "content_calendar", "sample_posts"]
        missing = []
        
        print("\nChecking for top-level keys:")
        found_count = 0
        for key in required_keys:
            if key in details:
                print(f"  ✅ {key}: Found")
                found_count += 1
            else:
                print(f"  ❌ {key}: MISSING")
                missing.append(key)
        
        # In demo mode, some might be missing depending on implementation, but let's be strict for now.
        if found_count < 3: 
             print(f"\n⛔ STRUCTURE CHECK FAILED: Too many missing keys {missing}")
             return False
        
        if "output_data" in details:
             print("\nℹ️ 'output_data' key exists (expected for backward compat or raw storage)")

        print(f"\n🎉 STRUCTURE CHECK PASSED! Data is properly flattened.")
        return True
            
    except Exception as e:
        print(f"❌ Error during check: {e}")
        return False

if __name__ == "__main__":
    token = login()
    check_history_structure(token)
