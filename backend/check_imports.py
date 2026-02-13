try:
    from app.main import app
    print("✅ Import successful! The package structure is correct.")
except ImportError as e:
    print(f"❌ Import failed: {e}")
except Exception as e:
    print(f"❌ An error occurred: {e}")
