"""
AI Service Test Script
Comprehensive testing of all AI service endpoints
"""

import asyncio
import sys
import os
from datetime import datetime
import httpx
import jwt
from typing import Dict, Any

# Configuration
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8080")
JWT_SECRET = os.getenv("JWT_SECRET", "test-secret-key")
TEST_COMPANY_ID = "test-company-001"
TEST_USER_ID = "test-user-001"


def generate_test_token() -> str:
    """Generate test JWT token."""
    payload = {
        "company_id": TEST_COMPANY_ID,
        "tenant_id": TEST_COMPANY_ID,
        "user_id": TEST_USER_ID,
        "exp": datetime.utcnow().timestamp() + 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def test_health_check():
    """Test health check endpoint."""
    print("\n" + "=" * 60)
    print("TEST: Health Check")
    print("=" * 60)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{AI_SERVICE_URL}/health")

            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] in ["healthy", "degraded"]

            print("✅ Health check passed")
            return True

    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False


async def test_chat(token: str):
    """Test chat endpoint."""
    print("\n" + "=" * 60)
    print("TEST: Chat Endpoint")
    print("=" * 60)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Test 1: Simple ophthalmic question
            print("\n📝 Test 1: Simple ophthalmic question")
            response = await client.post(
                f"{AI_SERVICE_URL}/api/v1/chat",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "message": "What are progressive lenses?",
                    "category": "ophthalmic",
                },
            )

            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Answer preview: {data['answer'][:200]}...")
                print(f"Used external AI: {data['usedExternalAi']}")
                print(f"Confidence: {data['confidence']}")
                print(f"Context used: {data['contextUsed']}")
                print(f"Processing time: {data['processingTimeMs']}ms")
                print(f"Sources: {len(data['sources'])} sources")
                print("✅ Test 1 passed")
            else:
                print(f"❌ Test 1 failed: {response.text}")
                return False

            # Test 2: With conversation history
            print("\n📝 Test 2: With conversation history")
            response = await client.post(
                f"{AI_SERVICE_URL}/api/v1/chat",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "message": "What are the benefits over bifocals?",
                    "category": "ophthalmic",
                    "conversation_history": [
                        {"role": "user", "content": "What are progressive lenses?"},
                        {
                            "role": "assistant",
                            "content": "Progressive lenses are multifocal lenses...",
                        },
                    ],
                },
            )

            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Answer preview: {data['answer'][:200]}...")
                print("✅ Test 2 passed")
            else:
                print(f"❌ Test 2 failed: {response.text}")

            # Test 3: Business query
            print("\n📝 Test 3: Business query")
            response = await client.post(
                f"{AI_SERVICE_URL}/api/v1/chat",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "message": "What are best practices for inventory management in optical retail?",
                    "category": "business",
                },
            )

            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Answer preview: {data['answer'][:200]}...")
                print("✅ Test 3 passed")
            else:
                print(f"❌ Test 3 failed: {response.text}")

            print("\n✅ All chat tests passed")
            return True

    except Exception as e:
        print(f"❌ Chat tests failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_product_recommendation(token: str):
    """Test product recommendation endpoint."""
    print("\n" + "=" * 60)
    print("TEST: Product Recommendation")
    print("=" * 60)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/api/v1/recommendations/product",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "prescription": {
                        "od_sphere": -3.50,
                        "od_cylinder": -0.75,
                        "od_axis": 180,
                        "os_sphere": -3.25,
                        "os_cylinder": -0.50,
                        "os_axis": 175,
                        "add": 2.00,
                        "pd": 63,
                    },
                    "patient_needs": "Computer work and driving at night",
                },
            )

            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Success: {data['success']}")
                print(
                    f"Recommendations preview: {data['data']['recommendations'][:200]}..."
                )
                print("✅ Product recommendation test passed")
                return True
            else:
                print(f"❌ Test failed: {response.text}")
                return False

    except Exception as e:
        print(f"❌ Product recommendation test failed: {e}")
        return False


async def test_add_knowledge(token: str):
    """Test add knowledge endpoint."""
    print("\n" + "=" * 60)
    print("TEST: Add Knowledge")
    print("=" * 60)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/api/v1/knowledge/add",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "content": """Test Knowledge Entry: Trivex Lenses

Trivex is a lightweight, impact-resistant lens material similar to polycarbonate but with better optical clarity.

Key Features:
- Similar impact resistance to polycarbonate
- Better abbe value (43-45 vs 30 for polycarbonate)
- Lightweight (specific gravity 1.11)
- 100% UV protection built-in
- Excellent for rimless frames

Best For:
- Patients wanting impact protection with better optics
- Rimless and semi-rimless frames
- Sports and safety applications
- Children's eyewear
""",
                    "category": "ophthalmic",
                    "summary": "Trivex lenses - impact-resistant material with better optics than polycarbonate",
                    "tags": ["lens-materials", "trivex", "safety"],
                    "filename": "test_trivex_knowledge.txt",
                },
            )

            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Success: {data['success']}")
                print(f"Knowledge ID: {data['data']['id']}")
                print("✅ Add knowledge test passed")
                return True
            else:
                print(f"❌ Test failed: {response.text}")
                return False

    except Exception as e:
        print(f"❌ Add knowledge test failed: {e}")
        return False


async def test_learning_progress(token: str):
    """Test learning progress endpoint."""
    print("\n" + "=" * 60)
    print("TEST: Learning Progress")
    print("=" * 60)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AI_SERVICE_URL}/api/v1/learning/progress",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Success: {data['success']}")
                progress_data = data["data"]
                print(f"Total Progress: {progress_data['totalProgress']}%")
                print(
                    f"Knowledge Base Entries: {progress_data['knowledgeBaseEntries']}"
                )
                print(f"Learned Entries: {progress_data['learnedEntries']}")
                print(f"Validated Entries: {progress_data['validatedEntries']}")
                print(f"Learning Rate: {progress_data['learningRate']}%")
                print("✅ Learning progress test passed")
                return True
            else:
                print(f"❌ Test failed: {response.text}")
                return False

    except Exception as e:
        print(f"❌ Learning progress test failed: {e}")
        return False


async def test_feedback(token: str):
    """Test feedback endpoint."""
    print("\n" + "=" * 60)
    print("TEST: Feedback Submission")
    print("=" * 60)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/api/v1/feedback",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "helpful": True,
                    "rating": 5,
                    "comments": "Very helpful explanation of progressive lenses!",
                },
            )

            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Success: {data['success']}")
                print("✅ Feedback test passed")
                return True
            else:
                print(f"❌ Test failed: {response.text}")
                return False

    except Exception as e:
        print(f"❌ Feedback test failed: {e}")
        return False


async def test_system_health(token: str):
    """Test system health endpoint."""
    print("\n" + "=" * 60)
    print("TEST: System Health")
    print("=" * 60)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AI_SERVICE_URL}/api/v1/system/health",
                headers={
                    "Authorization": f"Bearer {token}",
                },
            )

            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Success: {data['success']}")
                health_data = data["data"]
                print(f"Database: {'✅' if health_data['database'] else '❌'}")
                print(
                    f"OpenAI: {'✅' if health_data['llmServices']['openai'] else '❌'}"
                )
                print(
                    f"Anthropic: {'✅' if health_data['llmServices']['anthropic'] else '❌'}"
                )
                print("✅ System health test passed")
                return True
            else:
                print(f"❌ Test failed: {response.text}")
                return False

    except Exception as e:
        print(f"❌ System health test failed: {e}")
        return False


async def run_all_tests():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("🧪 ILS 2.0 AI SERVICE TEST SUITE")
    print("=" * 60)
    print(f"Service URL: {AI_SERVICE_URL}")
    print(f"Test Company: {TEST_COMPANY_ID}")
    print(f"Test User: {TEST_USER_ID}")

    # Generate token
    print("\n🔑 Generating test token...")
    token = generate_test_token()
    print("✅ Token generated")

    # Track results
    results = {}

    # Run tests
    results["health"] = await test_health_check()
    results["chat"] = await test_chat(token)
    results["product_recommendation"] = await test_product_recommendation(token)
    results["add_knowledge"] = await test_add_knowledge(token)
    results["learning_progress"] = await test_learning_progress(token)
    results["feedback"] = await test_feedback(token)
    results["system_health"] = await test_system_health(token)

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for result in results.values() if result)
    total = len(results)

    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(run_all_tests())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test suite failed with error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
