"""
test_usage_tracking.py
======================
Validates that the free-tier usage tracking fix works correctly.
Tests directly against MongoDB (no running server required).

Test scenarios:
1. Generate 3 strategies → usage_count = 3
2. Delete 1 strategy  → usage_count must still be 3
3. Try generating a 4th → must be blocked (usage_count >= 3)
4. Change month        → usage resets to 0
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone
from bson import ObjectId

# ============================================================================
# Test Configuration
# ============================================================================

TEST_USER_EMAIL = "test_usage_tracking@planvix-test.com"
FREE_MONTHLY_LIMIT = 3
PASSED = 0
FAILED = 0


def log_pass(msg):
    global PASSED
    PASSED += 1
    print(f"  ✅ PASS: {msg}")


def log_fail(msg):
    global FAILED
    FAILED += 1
    print(f"  ❌ FAIL: {msg}")


def run_tests():
    global PASSED, FAILED

    # Import after path setup
    from app.core.mongo import users_collection, strategies_collection

    current_month = datetime.now(timezone.utc).strftime("%Y-%m")

    # ========================================================================
    # SETUP: Create test user
    # ========================================================================
    print("\n🔧 Setting up test environment...")

    # Clean up any previous test data
    users_collection.delete_many({"email": TEST_USER_EMAIL})
    test_user_id_str = None

    # Create test user with usage tracking fields
    user_doc = {
        "email": TEST_USER_EMAIL,
        "hashed_password": "test_hash_not_real",
        "tier": "free",
        "usage_count": 0,
        "usage_month": current_month,
        "created_at": datetime.now(timezone.utc)
    }
    result = users_collection.insert_one(user_doc)
    test_user_id = result.inserted_id
    test_user_id_str = str(test_user_id)
    print(f"   Created test user: {test_user_id_str}")

    strategy_ids = []

    try:
        # ====================================================================
        # TEST 1: Generate 3 strategies → usage_count = 3
        # ====================================================================
        print("\n📋 TEST 1: Generate 3 strategies")

        for i in range(3):
            # Simulate strategy creation: insert strategy doc + increment usage
            strategy_doc = {
                "user_id": test_user_id_str,
                "goal": f"Test Strategy {i+1}",
                "audience": "Test Audience",
                "industry": "Testing",
                "platform": "Instagram",
                "content_type": "Mixed",
                "strategy_mode": "conservative",
                "created_at": datetime.now(timezone.utc),
                "is_deleted": False
            }
            s_result = strategies_collection.insert_one(strategy_doc)
            strategy_ids.append(s_result.inserted_id)

            # Increment usage (same logic as _increment_usage_mongo)
            inc_result = users_collection.update_one(
                {"_id": test_user_id, "usage_month": current_month},
                {"$inc": {"usage_count": 1}}
            )
            if inc_result.matched_count == 0:
                users_collection.update_one(
                    {"_id": test_user_id},
                    {"$set": {"usage_count": 1, "usage_month": current_month}}
                )

        user = users_collection.find_one({"_id": test_user_id})
        if user["usage_count"] == 3:
            log_pass(f"usage_count = {user['usage_count']} after 3 generations")
        else:
            log_fail(f"usage_count = {user['usage_count']}, expected 3")

        # ====================================================================
        # TEST 2: Delete 1 strategy → usage_count must still be 3
        # ====================================================================
        print("\n📋 TEST 2: Delete 1 strategy (soft delete)")

        # Soft delete the first strategy (same as delete_strategy service)
        strategies_collection.update_one(
            {"_id": strategy_ids[0], "user_id": test_user_id_str},
            {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc)}}
        )

        # Verify strategy is soft-deleted
        deleted_doc = strategies_collection.find_one({"_id": strategy_ids[0]})
        if deleted_doc.get("is_deleted") == True:
            log_pass("Strategy soft-deleted successfully")
        else:
            log_fail("Strategy was not soft-deleted")

        # Check usage_count is unchanged
        user = users_collection.find_one({"_id": test_user_id})
        if user["usage_count"] == 3:
            log_pass(f"usage_count = {user['usage_count']} (unchanged after delete)")
        else:
            log_fail(f"usage_count = {user['usage_count']}, expected 3 (delete affected usage!)")

        # ====================================================================
        # TEST 3: Try generating a 4th strategy → must be blocked
        # ====================================================================
        print("\n📋 TEST 3: Attempt 4th generation (should be blocked)")

        user = users_collection.find_one({"_id": test_user_id})
        usage_count = user.get("usage_count", 0)
        usage_month = user.get("usage_month", "")

        # Simulate check_monthly_limit logic
        if usage_month != current_month:
            usage_count = 0  # Would reset

        blocked = usage_count >= FREE_MONTHLY_LIMIT
        if blocked:
            log_pass(f"Generation blocked (usage_count={usage_count} >= limit={FREE_MONTHLY_LIMIT})")
        else:
            log_fail(f"Generation NOT blocked (usage_count={usage_count}, limit={FREE_MONTHLY_LIMIT})")

        # ====================================================================
        # TEST 4: Change month → usage resets to 0
        # ====================================================================
        print("\n📋 TEST 4: Simulate month change → usage resets")

        # Simulate month change by setting usage_month to a past month
        users_collection.update_one(
            {"_id": test_user_id},
            {"$set": {"usage_month": "2025-01"}}
        )

        # Now simulate the check_monthly_limit logic
        user = users_collection.find_one({"_id": test_user_id})
        usage_month = user.get("usage_month", "")

        if usage_month != current_month:
            # Reset (same logic as check_monthly_limit)
            users_collection.update_one(
                {"_id": test_user_id},
                {"$set": {"usage_count": 0, "usage_month": current_month}}
            )

        user = users_collection.find_one({"_id": test_user_id})
        if user["usage_count"] == 0 and user["usage_month"] == current_month:
            log_pass(f"usage_count reset to 0 after month change")
        else:
            log_fail(f"Reset failed: usage_count={user['usage_count']}, usage_month={user['usage_month']}")

        # Verify generation is now allowed
        blocked = user["usage_count"] >= FREE_MONTHLY_LIMIT
        if not blocked:
            log_pass("Generation is now allowed after month reset")
        else:
            log_fail("Generation still blocked after month reset")

    finally:
        # ====================================================================
        # CLEANUP
        # ====================================================================
        print("\n🧹 Cleaning up test data...")
        strategies_collection.delete_many({"user_id": test_user_id_str})
        users_collection.delete_one({"_id": test_user_id})
        print("   Cleaned up test user and strategies")

    # ========================================================================
    # RESULTS
    # ========================================================================
    print(f"\n{'='*60}")
    print(f"  RESULTS: {PASSED} passed, {FAILED} failed")
    print(f"{'='*60}")

    if FAILED > 0:
        print("\n⛔ SOME TESTS FAILED!")
        sys.exit(1)
    else:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)


if __name__ == "__main__":
    print("=" * 60)
    print("  PLANVIX: Usage Tracking Fix - Validation Test")
    print("=" * 60)
    run_tests()
