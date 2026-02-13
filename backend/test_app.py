"""
Test if FastAPI app can be created successfully
"""
import sys
import io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

print("[TEST] Testing FastAPI app creation...")

try:
    from main import app
    print("[TEST] SUCCESS: FastAPI app created successfully!")
    print(f"[TEST] App title: {app.title}")
    print(f"[TEST] App version: {app.version}")
except Exception as e:
    print(f"[TEST] FAILED: App creation error: {str(e)}")
    import traceback
    traceback.print_exc()

print("[TEST] Test complete")
