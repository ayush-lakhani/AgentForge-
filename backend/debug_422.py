import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def debug_422():
    print("\n--- Debugging 422 Error ---")
    
    # 1. Login/Signup to get token
    email = "debug_user_422@example.com"
    password = "password123"
    
    session = requests.Session()
    
    # Try login
    login_resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    
    if login_resp.status_code != 200:
        print("Login failed, trying signup...")
        signup_resp = session.post(f"{BASE_URL}/api/auth/signup", json={"email": email, "password": password})
        if signup_resp.status_code != 200:
             print(f"Signup failed: {signup_resp.text}")
             # Try login again in case user exists but password matches (idempotency)
             
        # Login again
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
        
    if login_resp.status_code != 200:
        print(f"FATAL: Could not get auth token. {login_resp.text}")
        return

    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Send Strategy Request
    payload = {
      "goal": "sell coffee",
      "audience": "collage student",
      "industry": "Coffee & Tea",
      "platform": "Instagram",
      "contentType": "Mixed Content",
      "experience": "beginner"
    }
    
    print(f"Sending payload: {json.dumps(payload, indent=2)}")
    
    resp = session.post(f"{BASE_URL}/api/strategy", json=payload, headers=headers)
    
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == "__main__":
    debug_422()
