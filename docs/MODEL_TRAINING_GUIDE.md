# Model Download and Training Readiness Guide

## ✅ Current Status

Your Llama-3.1-8B-Instruct model has been successfully downloaded and is ready to use!

### Model Details
- **File**: `~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf`
- **Size**: 4.58 GB
- **Format**: GGUF (quantized to 4-bit for efficient inference)
- **Status**: ✅ Downloaded and verified
- **Server**: Running on `http://localhost:8000`

### Test Results
```
✅ GGUF Model File      - Model exists and is accessible
✅ Model Server         - Server is running on port 8000
✅ Training Data        - 5 sample examples ready
✅ HuggingFace Access   - Authenticated as: sabanali
```

---

## 🎯 How the Model Will Be Used

### 1. **Current Usage: Inference Server (GGUF)**
The downloaded GGUF model is currently running as an inference server. This is perfect for:
- ✅ Testing the AI service API
- ✅ Quick prototyping
- ✅ Development and demos
- ✅ Low-resource inference (CPU/Mac)

**Access it at**: `http://localhost:8000/v1/completions`

### 2. **For Fine-Tuning: HuggingFace Format Required**
For fine-tuning, we need the **full precision model** from HuggingFace, not the GGUF version.

**Why?**
- GGUF is optimized for inference (quantized, compressed)
- Fine-tuning requires full model weights with gradients
- We'll use LoRA/PEFT which needs the original transformer architecture

**The training script will automatically download**: `meta-llama/Llama-3.1-8B-Instruct`

---

## 🚀 Using Your Model for Training

### Option 1: Start from HuggingFace Model (Recommended)

The training script will download the full model automatically:

```bash
cd ai-service

# Activate virtual environment (if you have one)
source venv/bin/activate

# Run training
python training/train_ophthalmic_model.py \
  --data_path data/sample_training_data.jsonl \
  --output_dir ./fine_tuned_model \
  --num_epochs 3
```

**What happens:**
1. Downloads `meta-llama/Llama-3.1-8B-Instruct` from HuggingFace (~16GB)
2. Applies 4-bit quantization (QLoRA) for efficient training
3. Fine-tunes with LoRA adapters on your ophthalmic data
4. Saves the fine-tuned adapter weights (small, ~100-500MB)

### Option 2: Use GGUF Model for Inference Only

Keep using the GGUF model for serving:

```bash
# This is already running for you!
python -m llama_cpp.server \
  --model ~/.cache/llama-models/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \
  --host 0.0.0.0 \
  --port 8000 \
  --n_ctx 2048
```

**Perfect for:**
- AI service API endpoints
- Real-time queries
- Production inference (after fine-tuning, convert back to GGUF)

---

## 📝 Before Training: Add More Data

You currently have 5 training examples. For better results, add more:

### Current Training Data
Location: `ai-service/data/sample_training_data.jsonl`

Example format:
```json
{"prompt": "What are progressive lenses?", "completion": "Progressive lenses are multifocal lenses that..."}
{"prompt": "How to fit bifocals?", "completion": "When fitting bifocals, ensure..."}
```

### Recommended Amount
- **Minimum**: 50-100 examples (basic fine-tuning)
- **Good**: 500-1000 examples (solid performance)
- **Excellent**: 2000+ examples (expert-level model)

### Topics to Cover
1. Lens types (single vision, bifocal, progressive, high-index)
2. Coatings (anti-reflective, blue light, photochromic)
3. Frame selection and fitting
4. Prescription interpretation
5. Common issues and troubleshooting
6. Patient counseling and adaptation
7. Safety and contraindications
8. Product recommendations

---

## 🎓 Training Process Breakdown

### Step 1: Prepare Your Data
```bash
# Add more examples to your training file
nano ai-service/data/sample_training_data.jsonl

# Each line should be valid JSON:
# {"prompt": "question", "completion": "answer"}
```

### Step 2: Install Training Dependencies
```bash
cd ai-service
pip install -r requirements.txt

# Key packages:
# - transformers (HuggingFace models)
# - peft (LoRA/PEFT training)
# - trl (Supervised Fine-Tuning)
# - bitsandbytes (4-bit quantization)
```

### Step 3: Run Training
```bash
python training/train_ophthalmic_model.py \
  --data_path data/sample_training_data.jsonl \
  --output_dir ./ophthalmic_specialist_model \
  --num_epochs 3 \
  --learning_rate 2e-4 \
  --batch_size 1
```

**Training time estimates:**
- 100 examples: ~30-60 minutes (Mac M1/M2)
- 500 examples: ~2-3 hours
- 1000+ examples: ~4-8 hours

### Step 4: After Training
The fine-tuned model will be saved as **LoRA adapter weights** (small files).

To use it:

**Option A: Merge and convert to GGUF (for production inference)**
```bash
# Merge LoRA weights with base model
python merge_lora_weights.py \
  --base_model meta-llama/Llama-3.1-8B-Instruct \
  --lora_weights ./ophthalmic_specialist_model \
  --output_dir ./merged_model

# Convert to GGUF format
llama.cpp/convert.py ./merged_model \
  --outtype q4_K_M \
  --outfile ophthalmic_specialist.gguf
```

**Option B: Use with transformers library (Python)**
```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")
model = PeftModel.from_pretrained(base_model, "./ophthalmic_specialist_model")

tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")

# Now use model for inference
```

---

## 🔧 Troubleshooting

### Issue: "Model download failed"
**Solution**: Ensure you're authenticated with HuggingFace
```bash
huggingface-cli login
# Use token: hf_...
```

### Issue: "Out of memory during training"
**Solution**: Reduce batch size or use gradient accumulation
```bash
python training/train_ophthalmic_model.py \
  --batch_size 1 \
  --gradient_accumulation_steps 8
```

### Issue: "Training is too slow"
**Solution**: 
- Use GPU if available (training script detects automatically)
- For Mac: Ensure Metal Performance Shaders (MPS) is enabled
- Reduce `max_seq_length` to 512 or 768

### Issue: "Model quality is poor"
**Solution**:
1. Add more diverse training examples
2. Increase number of epochs (try 5-10)
3. Adjust learning rate (try 1e-4 to 5e-4)
4. Use more LoRA rank (increase `r` parameter)

---

## 📊 Model Performance Tracking

After training, evaluate your model:

```bash
# Test on held-out examples
python training/evaluate_model.py \
  --model_path ./ophthalmic_specialist_model \
  --test_data data/test_set.jsonl
```

**Metrics to track:**
- Answer accuracy (manual review)
- Response time
- Hallucination rate (incorrect information)
- User satisfaction scores

---

## 🎯 Quick Commands Reference

```bash
# Check model file
ls -lh ~/.cache/llama-models/*.gguf

# Check server status
curl http://localhost:8000/v1/models

# Test inference
curl -X POST http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What are progressive lenses?", "max_tokens": 100}'

# Run training
cd ai-service
python training/train_ophthalmic_model.py \
  --data_path data/sample_training_data.jsonl

# Test model availability
python test_model_availability.py
```

---

## 🎉 Summary

**Your setup is ready!**

✅ **GGUF Model**: Downloaded and running for inference  
✅ **Training Data**: 5 examples ready (add more for best results)  
✅ **HuggingFace Auth**: Configured for model downloads  
✅ **Training Script**: Ready to fine-tune on your data  

**Next steps:**
1. ✏️  Add more training examples (aim for 100-500+)
2. 🚀 Run training script when data is ready
3. 🧪 Test fine-tuned model
4. 🔄 Convert to GGUF for production use
5. 🌐 Deploy in AI service API

**The downloaded GGUF model gives you a headstart by:**
- Providing immediate inference capability
- Allowing you to test the AI service now
- Serving as the base architecture (we'll download full version for training)
- Being the target format after fine-tuning

You can start using the API endpoints **right now** while preparing training data!

