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
            print("✅ Login successful")
            return token
        else:
            print(f"❌ Login failed: {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Connection error: {e}")
        sys.exit(1)

def create_dummy_strategy(token):
    print("\n📝 Creating dummy strategy to delete...")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "goal": "Test Delete Strategy",
        "audience": "Testers",
        "industry": "Testing",
        "platform": "Instagram",
        "contentType": "Mixed Content",
        "experience": "beginner"
    }
    
    try:
        response = requests.post(f"{API_URL}/api/strategy", json=data, headers=headers)
        if response.status_code == 200:
            strategy = response.json().get("strategy")
            # The strategy object structure might vary based on how it's returned
            # Strategy endpoint returns { success: true, strategy: {...} }
            # The inner strategy object has the '_id'
            
            # Correction: The logic in router returns:
            # { "success": True, "strategy": clean_strategy, ... }
            # clean_strategy does NOT always have _id because it's the input dict + generated stuff
            # We need to get the ID from the history list or look closely at response
            
            # Let's just fetch history to get the ID of the latest one
            print("✅ Dummy strategy created")
            return True
        else:
            print(f"❌ Failed to create strategy: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error creating strategy: {e}")
        return False

def get_latest_strategy_id(token):
    print("\n📜 Fetching history to find target strategy...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{API_URL}/api/history", headers=headers)
        if response.status_code == 200:
            data = response.json()
            history = data.get("history", [])
            if not history:
                print("⚠️ No history found")
                return None
            
            latest = history[0]
            print(f"✅ Found strategy: {latest.get('goal', 'Unknown')} (ID: {latest.get('id')})")
            return latest.get("id")
        else:
            print(f"❌ Failed to fetch history: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error fetching history: {e}")
        return None

def delete_strategy(token, strategy_id):
    print(f"\n🗑️ Deleting strategy {strategy_id}...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.delete(f"{API_URL}/api/history/{strategy_id}", headers=headers)
        if response.status_code == 200:
            print("✅ Delete request successful")
            return True
        else:
            print(f"❌ Delete failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error deleting strategy: {e}")
        return False

def verify_deletion(token, strategy_id):
    print(f"\n🔍 Verifying deletion of {strategy_id}...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        # Try to get specific ID
        response = requests.get(f"{API_URL}/api/history/{strategy_id}", headers=headers)
        if response.status_code == 404:
            print("✅ Strategy not found (Confirming deletion)")
            return True
        elif response.status_code == 200:
            print("❌ Strategy still exists!")
            return False
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error validating deletion: {e}")
        return False

def main():
    token = login()
    
    # 1. Create a strategy to delete
    if create_dummy_strategy(token):
        # 2. Get its ID
        strategy_id = get_latest_strategy_id(token)
        if strategy_id:
            # 3. Delete it
            if delete_strategy(token, strategy_id):
                # 4. Verify it's gone
                if verify_deletion(token, strategy_id):
                    print("\n🎉 DELETE TEST PASSED!")
                else:
                    print("\n⛔ DELETE TEST FAILED (Strategy still exists)")
            else:
                 print("\n⛔ DELETE TEST FAILED (Delete API error)")
        else:
            print("\n⛔ DELETE TEST FAILED (Could not retrieve ID)")
    else:
        print("\n⛔ DELETE TEST FAILED (Could not create dummy strategy)")

if __name__ == "__main__":
    main()
