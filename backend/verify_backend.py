import requests
import time
import random

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    print("Testing /api/health...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            print(f"✅ Health Check Passed: {response.json()}")
            return True
        else:
            print(f"❌ Health Check Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False

def test_auth():
    print("\nTesting Authentication Flow...")
    email = f"testUser_{random.randint(1000, 9999)}@example.com"
    password = "securePassword123"
    
    # Signup
    print(f"1. Signing up user: {email}")
    signup_data = {"email": email, "password": password}
    try:
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
        if response.status_code == 200:
            token_data = response.json()
            print(f"   ✅ Signup Successful. Token received.")
            access_token = token_data["access_token"]
        else:
            print(f"   ❌ Signup Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Connection Error: {e}")
        return False

    # Login
    print(f"2. Logging in user: {email}")
    login_data = {"email": email, "password": password}
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            print(f"   ✅ Login Successful. Token received: {token_data['access_token'][:10]}...")
            return True
        else:
            print(f"   ❌ Login Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Connection Error: {e}")
        return False

if __name__ == "__main__":
    if test_health():
        test_auth()
