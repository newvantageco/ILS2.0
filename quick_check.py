#!/usr/bin/env python3
"""
Quick Model Check - Verify Llama model is ready
"""
import sys
from pathlib import Path

print("\n" + "="*60)
print("🔍 QUICK MODEL CHECK")
print("="*60 + "\n")

# Check model
model_path = Path.home() / ".cache" / "llama-models" / "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf"
if model_path.exists():
    size_gb = model_path.stat().st_size / (1024**3)
    print(f"✅ Model Ready: {size_gb:.2f} GB")
else:
    print("❌ Model not found")
    sys.exit(1)

# Check server
import subprocess
result = subprocess.run(["lsof", "-i", ":8000"], capture_output=True, text=True)
if result.returncode == 0 and "LISTEN" in result.stdout:
    print("✅ Server Running: http://localhost:8000")
else:
    print("⚠️  Server not running on port 8000")

# Check training data
data_path = Path(__file__).parent / "ai-service" / "data" / "sample_training_data.jsonl"
if data_path.exists():
    with open(data_path, 'r') as f:
        count = len(f.readlines())
    print(f"✅ Training Data: {count} examples")
    if count < 50:
        print(f"   💡 Add {50-count} more for better results")
else:
    print("⚠️  Training data not found")

# Check HF auth
hf_token = Path.home() / ".cache" / "huggingface" / "token"
if hf_token.exists():
    print("✅ HuggingFace: Authenticated")
else:
    print("⚠️  HuggingFace: Not authenticated")

print("\n" + "="*60)
print("🎯 MODEL IS READY FOR USE!")
print("="*60)
print("\n📖 Run 'python3 training_readiness.py' for full guide\n")
