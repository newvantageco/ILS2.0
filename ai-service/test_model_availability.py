"""
Test Model Availability and Functionality

This script verifies that:
1. The downloaded GGUF model is accessible
2. The model server is running
3. The model can generate responses
4. The model is suitable for fine-tuning (we'll use HF format for training)
"""

import os
import sys
import json
import requests
from pathlib import Path


def test_gguf_model_file():
    """Test if GGUF model file exists and is accessible."""
    print("\n" + "="*60)
    print("1. Testing GGUF Model File Availability")
    print("="*60)
    
    model_path = Path.home() / ".cache" / "llama-models" / "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf"
    
    if model_path.exists():
        size_gb = model_path.stat().st_size / (1024**3)
        print(f"✅ Model file found: {model_path}")
        print(f"   Size: {size_gb:.2f} GB")
        return True
    else:
        print(f"❌ Model file not found at: {model_path}")
        return False


def test_model_server():
    """Test if the llama-cpp-python server is running."""
    print("\n" + "="*60)
    print("2. Testing Model Server")
    print("="*60)
    
    try:
        response = requests.get("http://localhost:8000/v1/models", timeout=5)
        if response.status_code == 200:
            models = response.json()
            print(f"✅ Server is running on http://localhost:8000")
            print(f"   Available models: {len(models.get('data', []))}")
            for model in models.get('data', []):
                print(f"   - {model['id']}")
            return True
        else:
            print(f"❌ Server responded with status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to server: {e}")
        print("   Make sure the server is running with:")
        print("   python -m llama_cpp.server --model ~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf --host 0.0.0.0 --port 8000")
        return False


def test_model_inference():
    """Test model inference capability."""
    print("\n" + "="*60)
    print("3. Testing Model Inference")
    print("="*60)
    
    test_prompt = "What is the difference between single vision and progressive lenses?"
    
    print(f"Prompt: {test_prompt}")
    print("Generating response...")
    
    try:
        response = requests.post(
            "http://localhost:8000/v1/chat/completions",
            headers={"Content-Type": "application/json"},
            json={
                "model": "gpt-3.5-turbo",  # API compatibility
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert in optical dispensing and ophthalmic care."
                    },
                    {
                        "role": "user",
                        "content": test_prompt
                    }
                ],
                "max_tokens": 200,
                "temperature": 0.7
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            answer = result['choices'][0]['message']['content']
            print(f"\n✅ Model Response:")
            print(f"   {answer}")
            print(f"\n   Tokens used: {result.get('usage', {})}")
            return True
        else:
            print(f"❌ Inference failed with status code: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Inference request failed: {e}")
        return False


def test_training_data():
    """Test if training data is available."""
    print("\n" + "="*60)
    print("4. Testing Training Data")
    print("="*60)
    
    data_path = Path(__file__).parent / "data" / "sample_training_data.jsonl"
    
    if data_path.exists():
        with open(data_path, 'r') as f:
            lines = f.readlines()
        print(f"✅ Training data found: {data_path}")
        print(f"   Number of examples: {len(lines)}")
        
        # Show first example
        if lines:
            first_example = json.loads(lines[0])
            print(f"\n   First example:")
            print(f"   Prompt: {first_example.get('prompt', '')[:80]}...")
            print(f"   Completion: {first_example.get('completion', '')[:80]}...")
        
        return True
    else:
        print(f"⚠️  Training data not found at: {data_path}")
        print("   You can create training data by adding Q&A pairs to this file")
        return False


def check_huggingface_access():
    """Check if we have access to HuggingFace for downloading the full model for training."""
    print("\n" + "="*60)
    print("5. Checking HuggingFace Access")
    print("="*60)
    
    try:
        # Check if huggingface_hub is installed
        import huggingface_hub
        from huggingface_hub import HfApi
        
        print(f"✅ huggingface_hub installed: v{huggingface_hub.__version__}")
        
        # Check authentication
        api = HfApi()
        try:
            user_info = api.whoami()
            print(f"✅ Authenticated as: {user_info.get('name', 'Unknown')}")
            return True
        except Exception:
            print("⚠️  Not authenticated with HuggingFace")
            print("   For fine-tuning, you may need to authenticate:")
            print("   huggingface-cli login")
            return False
            
    except ImportError:
        print("❌ huggingface_hub not installed")
        print("   Install with: pip install huggingface-hub")
        return False


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("🔍 MODEL AVAILABILITY AND FUNCTIONALITY TEST")
    print("="*60)
    
    results = {
        "GGUF Model File": test_gguf_model_file(),
        "Model Server": test_model_server(),
        "Model Inference": test_model_inference(),
        "Training Data": test_training_data(),
        "HuggingFace Access": check_huggingface_access(),
    }
    
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status:12} - {test_name}")
    
    all_passed = all(results.values())
    
    print("\n" + "="*60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("="*60)
        print("\nYour model is ready to use!")
        print("\nNext steps:")
        print("1. ✅ Model is running and accessible at http://localhost:8000")
        print("2. ✅ You can query the model via API")
        print("3. 📝 Add more training data to ai-service/data/sample_training_data.jsonl")
        print("4. 🚀 Run fine-tuning: python ai-service/training/train_ophthalmic_model.py")
        print("\nNote: For fine-tuning, we'll download the full HuggingFace model")
        print("      (not the GGUF version) as it requires the full model weights.")
    else:
        print("⚠️  SOME TESTS FAILED")
        print("="*60)
        print("\nPlease fix the failing tests before proceeding.")
        
        if not results["Model Server"]:
            print("\n💡 To start the model server:")
            print("   python -m llama_cpp.server \\")
            print("     --model ~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \\")
            print("     --host 0.0.0.0 --port 8000 --n_ctx 2048")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
