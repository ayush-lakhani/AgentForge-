print("1. Importing app.core.config...")
try:
    from app.core import config
    print("   Success")
except Exception as e:
    print(f"   Failed: {e}")

print("2. Importing app.models.schemas...")
try:
    from app.models import schemas
    print("   Success")
except Exception as e:
    print(f"   Failed: {e}")

print("3. Importing app.core.database...")
try:
    from app.core import database
    print("   Success")
except Exception as e:
    print(f"   Failed: {e}")

print("4. Importing app.core.security...")
try:
    from app.core import security
    print("   Success")
except Exception as e:
    print(f"   Failed: {e}")

print("5. Importing app.routers.auth...")
try:
    from app.routers import auth
    print("   Success")
except Exception as e:
    print(f"   Failed: {e}")

print("6. Importing app.main...")
try:
    from app import main
    print("   Success")
except Exception as e:
    print(f"   Failed: {e}")
