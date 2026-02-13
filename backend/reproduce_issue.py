import requests
import json
import time

BASE_URL = "http://localhost:8000"
EMAIL = "debug_user_repro@example.com"
PASSWORD = "password123"

def run_tests():
    print(f"--- Starting Reproduction Script ---\n")
    
    # 1. Login/Signup
    session = requests.Session()
    print("1. Logging in...")
    login_resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD})
    
    if login_resp.status_code == 401:
        print("   Login failed, trying signup...")
        signup_resp = session.post(f"{BASE_URL}/api/auth/signup", json={"email": EMAIL, "password": PASSWORD, "full_name": "Debug Repro"})
        if signup_resp.status_code == 200:
             print("   Signup success, logging in...")
             login_resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD})
        else:
             print(f"   Signup failed: {signup_resp.text}")
             return

    if login_resp.status_code != 200:
        print(f"   Login failed: {login_resp.text}")
        return

    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   Login successful.\n")

    # 2. Test Strategy Generation (The 422 Issue)
    print("2. Testing Strategy Generation (POST /api/strategy)...")
    
    # CASE A: Valid Payload
    print("   [A] Testing VALID payload...")
    payload_valid = {
        "goal": "sell coffee", 
        "audience": "college students",
        "industry": "F&B",
        "platform": "Instagram",
        "contentType": "Mixed Content",
        "experience": "beginner"
    }
    try:
        gen_resp = session.post(f"{BASE_URL}/api/strategy", json=payload_valid, headers=headers)
        print(f"   Status: {gen_resp.status_code}")
        if gen_resp.status_code == 200:
            print("   SUCCESS: Strategy generated.")
        else:
            print(f"   FAILED: {gen_resp.text}")
    except Exception as e:
        print(f"   Exception: {e}")



    # 3. Test History List
    print("\n3. Fetching History (GET /api/history)...")
    hist_resp = session.get(f"{BASE_URL}/api/history", headers=headers)
    print(f"   Status: {hist_resp.status_code}")
    history_data = hist_resp.json()
    strategies = history_data.get("history", [])
    print(f"   Found {len(strategies)} strategies.")
    
    if not strategies:
        print("   No strategies to test View/Delete.")
        return

    # 4. Test View (GET /api/history/{id})
    strategy_id = strategies[0]["id"]
    print(f"\n4. Testing View (GET /api/history/{strategy_id})...")
    view_resp = session.get(f"{BASE_URL}/api/history/{strategy_id}", headers=headers)
    print(f"   Status: {view_resp.status_code}")
    if view_resp.status_code == 200:
        print("   SUCCESS: Strategy details fetched.")
    else:
        print(f"   FAILED: {view_resp.text}")

    # 5. Test Delete (DELETE /api/history/{id})
    print(f"\n5. Testing Delete (DELETE /api/history/{strategy_id})...")
    del_resp = session.delete(f"{BASE_URL}/api/history/{strategy_id}", headers=headers)
    print(f"   Status: {del_resp.status_code}")
    if del_resp.status_code == 200:
        print("   SUCCESS: Strategy deleted.")
    else:
        print(f"   FAILED: {del_resp.text}")

if __name__ == "__main__":
    run_tests()
