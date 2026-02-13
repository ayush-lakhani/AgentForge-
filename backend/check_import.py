import sys
import traceback

print("Attempting to import main...")
try:
    import main
    print("Import successful")
except Exception:
    traceback.print_exc()
