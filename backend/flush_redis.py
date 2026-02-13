import os
import redis
import dotenv

dotenv.load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

try:
    print(f"Connecting to Redis at {REDIS_URL}...")
    r = redis.from_url(REDIS_URL, decode_responses=True)
    r.ping()
    print("Redis connected.")
    
    # Flush all keys
    print("Flushing all keys...")
    r.flushall()
    print("✅ Redis cache cleared successfully!")
    
except Exception as e:
    print(f"❌ Failed to clear Redis: {e}")
    print("If you don't use Redis, this is expected and you can ignore it.")
