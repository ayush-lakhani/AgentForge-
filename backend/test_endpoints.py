import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoints():
    print("\n--- Testing New Endpoints ---")
    
    # 1. Login
    email = "debug_user_422@example.com"
    password = "password123"
    
    session = requests.Session()
    login_resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    
    if login_resp.status_code != 200:
        print(f"Login failed: {login_resp.text}")
        return

    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get History to find an ID
    history_resp = session.get(f"{BASE_URL}/api/history", headers=headers)
    print(f"History Status: {history_resp.status_code}")
    
    history_data = history_resp.json()
    strategies = history_data.get("history", [])
    
    if not strategies:
        print("No strategies found to test GET/DELETE.")
        return

    strategy_id = strategies[0]["id"]
    print(f"Testing with Strategy ID: {strategy_id}")
    
    # 3. Test GET /history/{id}
    print(f"Testing GET /api/history/{strategy_id}...")
    get_resp = session.get(f"{BASE_URL}/api/history/{strategy_id}", headers=headers)
    print(f"GET Status: {get_resp.status_code}")
    if get_resp.status_code == 200:
        print("GET Success!")
    else:
        print(f"GET Failed: {get_resp.text}")

    # 4. Test DELETE /history/{id}
    # Be careful not to delete something important, but this is a debug user.
    print(f"Testing DELETE /api/history/{strategy_id}...")
    del_resp = session.delete(f"{BASE_URL}/api/history/{strategy_id}", headers=headers)
    print(f"DELETE Status: {del_resp.status_code}")
    print(f"DELETE Response: {del_resp.text}")

if __name__ == "__main__":
    test_endpoints()
