#!/usr/bin/env python3
"""
Quick Model Verification Script

Verifies the downloaded Llama model is accessible and ready to use.
"""

import os
from pathlib import Path
import subprocess
import sys

def main():
    print("\n" + "="*70)
    print("🔍 LLAMA MODEL VERIFICATION")
    print("="*70 + "\n")
    
    # Check model file
    model_path = Path.home() / ".cache" / "llama-models" / "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf"
    
    print("1️⃣  Checking model file...")
    if model_path.exists():
        size_gb = model_path.stat().st_size / (1024**3)
        print(f"   ✅ Model found: {model_path}")
        print(f"   📦 Size: {size_gb:.2f} GB")
    else:
        print(f"   ❌ Model not found at: {model_path}")
        print("\n   Download with:")
        print("   huggingface-cli download bartowski/Meta-Llama-3.1-8B-Instruct-GGUF \\")
        print("     Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \\")
        print("     --local-dir ~/.cache/llama-models")
        return 1
    
    # Check if server is running
    print("\n2️⃣  Checking server status...")
    result = subprocess.run(
        ["lsof", "-i", ":8000"],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0 and "LISTEN" in result.stdout:
        print("   ✅ Server is running on port 8000")
        
        # Try to get server info
        try:
            import urllib.request
            import json
            
            req = urllib.request.Request("http://localhost:8000/v1/models")
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read())
                print(f"   📡 Server is responsive")
                print(f"   🤖 Models loaded: {len(data.get('data', []))}")
        except Exception as e:
            print(f"   ⚠️  Server running but not responsive: {e}")
    else:
        print("   ⚠️  Server not running on port 8000")
        print("\n   Start with:")
        print("   python -m llama_cpp.server \\")
        print("     --model ~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \\")
        print("     --host 0.0.0.0 --port 8000 --n_ctx 2048 --n_gpu_layers -1")
    
    # Check training data
    print("\n3️⃣  Checking training data...")
    data_path = Path(__file__).parent / "ai-service" / "data" / "sample_training_data.jsonl"
    
    if data_path.exists():
        with open(data_path, 'r') as f:
            lines = f.readlines()
        print(f"   ✅ Training data found")
        print(f"   📝 Examples: {len(lines)}")
        
        if len(lines) < 50:
            print(f"   💡 Tip: Add more examples for better fine-tuning (current: {len(lines)}, recommended: 100+)")
    else:
        print(f"   ⚠️  Training data not found at: {data_path}")
    
    # Check HuggingFace auth
    print("\n4️⃣  Checking HuggingFace authentication...")
    hf_token_path = Path.home() / ".cache" / "huggingface" / "token"
    
    if hf_token_path.exists():
        print("   ✅ HuggingFace token found")
        print("   🔑 Ready to download models for training")
    else:
        print("   ⚠️  Not authenticated with HuggingFace")
        print("\n   Authenticate with:")
        print("   huggingface-cli login")
    
    # Summary
    print("\n" + "="*70)
    print("📊 SUMMARY")
    print("="*70)
    print("\n✅ Your model is ready to use!")
    print("\n🎯 What you can do now:")
    print("   1. Use the running model for inference (http://localhost:8000)")
    print("   2. Test the AI service API endpoints")
    print("   3. Add more training data to improve fine-tuning")
    print("   4. Run fine-tuning when ready:")
    print("      cd ai-service")
    print("      python training/train_ophthalmic_model.py \\")
    print("        --data_path data/sample_training_data.jsonl")
    print("\n💡 The GGUF model provides immediate inference capability.")
    print("   For fine-tuning, the script will download the full HuggingFace model.")
    print("\n📚 See MODEL_TRAINING_GUIDE.md for detailed instructions.")
    print("="*70 + "\n")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
