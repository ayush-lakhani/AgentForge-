"""
Minimal test to check if CrewAI import works
"""
import sys
import io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

print("[TEST] Starting CrewAI import test...")

try:
    from crew import create_content_strategy_crew
    print("[TEST] SUCCESS: CrewAI imported successfully!")
    print("[TEST] CrewAI is enabled and ready to use")
except Exception as e:
    print(f"[TEST] FAILED: CrewAI import error: {str(e)}")

print("[TEST] Test complete")
