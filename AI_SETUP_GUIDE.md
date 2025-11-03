# AI Assistant Setup Guide

This guide will help you configure the AI Assistant feature in the Integrated Lens System. You have three options for AI providers:

## Option 1: Local AI with Llama (Recommended for Privacy & Cost)

**Llama via Ollama** - Run AI models locally on your machine. This is completely free and keeps all data private.

### Installation Steps:

1. **Install Ollama**
   ```bash
   # macOS/Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Or download from: https://ollama.ai/download
   ```

2. **Download a Model**
   ```bash
   # Llama 3.1 (8B) - Recommended, fast and capable
   ollama pull llama3.1:latest
   
   # OR Llama 2 (7B) - Lighter weight
   ollama pull llama2
   
   # OR Mistral (7B) - Good alternative
   ollama pull mistral
   
   # OR CodeLlama for technical queries
   ollama pull codellama
   ```

3. **Start Ollama Server** (Usually starts automatically)
   ```bash
   ollama serve
   ```

4. **Configure .env File**
   ```env
   # Enable local AI
   USE_LOCAL_AI=true
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.1:latest
   ```

5. **Test It**
   ```bash
   # Test Ollama is working
   curl http://localhost:11434/api/tags
   ```

**Benefits:**
- ✅ **FREE** - No API costs
- ✅ **Private** - Data never leaves your server
- ✅ **Fast** - No network latency for local requests
- ✅ **Offline** - Works without internet

**Requirements:**
- At least 8GB RAM (16GB recommended)
- ~5GB disk space per model

---

## Option 2: OpenAI (GPT-4, GPT-3.5)

**OpenAI** provides powerful cloud-based models with excellent performance.

### Setup Steps:

1. **Get API Key**
   - Go to: https://platform.openai.com/api-keys
   - Create account or sign in
   - Click "Create new secret key"
   - Copy the key (starts with `sk-proj-...`)

2. **Configure .env File**
   ```env
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   USE_LOCAL_AI=false
   ```

**Pricing (Approximate):**
- GPT-4: $0.03 per 1K input tokens, $0.06 per 1K output tokens
- GPT-3.5: $0.0005 per 1K input tokens, $0.0015 per 1K output tokens

**Benefits:**
- ✅ Best performance for complex tasks
- ✅ Most reliable and consistent
- ✅ No local hardware requirements

---

## Option 3: Anthropic (Claude 3)

**Anthropic Claude** offers strong reasoning and analysis capabilities.

### Setup Steps:

1. **Get API Key**
   - Go to: https://console.anthropic.com/settings/keys
   - Create account or sign in
   - Click "Create Key"
   - Copy the key (starts with `sk-ant-...`)

2. **Configure .env File**
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   USE_LOCAL_AI=false
   ```

**Pricing (Approximate):**
- Claude 3 Opus: $15 per 1M input tokens, $75 per 1M output tokens
- Claude 3 Sonnet: $3 per 1M input tokens, $15 per 1M output tokens
- Claude 3 Haiku: $0.25 per 1M input tokens, $1.25 per 1M output tokens

**Benefits:**
- ✅ Excellent for analysis and reasoning
- ✅ Long context windows
- ✅ Strong safety features

---

## Using Multiple Providers (Fallback Configuration)

You can configure multiple providers for redundancy:

```env
# Local AI first (free and private)
USE_LOCAL_AI=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:latest

# Cloud AI as backup
OPENAI_API_KEY=sk-proj-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Fallback Order:**
1. Ollama (if USE_LOCAL_AI=true and available)
2. Anthropic (if configured)
3. OpenAI (if configured)

---

## Verifying Your Setup

After configuring, restart the development server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

Check the logs for confirmation:
```
[ExternalAIService:INFO] Ollama client initialized at http://localhost:11434 with model llama3.1:latest
[ExternalAIService:INFO] Available AI providers: ollama, openai, anthropic
```

---

## Recommendations

### For Development/Testing:
- **Use Ollama (Llama 3.1)** - Free, fast, private

### For Production:
- **Ollama for 80% of queries** - Keeps costs down
- **OpenAI GPT-4 as fallback** - Handles complex cases
- Set `USE_LOCAL_AI=true` to prefer local AI

### For Maximum Privacy (Healthcare/Regulated Industries):
- **Only use Ollama** - All data stays local
- Don't configure cloud API keys

---

## Troubleshooting

### Ollama Not Working?

```bash
# Check if Ollama is running
ollama list

# Restart Ollama
killall ollama
ollama serve

# Test API directly
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "Hello, how are you?"
}'
```

### Cloud API Not Working?

1. Check your API key is valid
2. Verify you have credits/billing enabled
3. Check for typos in the `.env` file
4. Restart the development server

---

## Model Comparison

| Model | Speed | Quality | Cost | Privacy |
|-------|-------|---------|------|---------|
| Llama 3.1 (Ollama) | ⚡⚡⚡ | ⭐⭐⭐⭐ | FREE | 🔒🔒🔒 |
| Llama 2 (Ollama) | ⚡⚡⚡ | ⭐⭐⭐ | FREE | 🔒🔒🔒 |
| GPT-4 | ⚡⚡ | ⭐⭐⭐⭐⭐ | $$$ | 🔒 |
| GPT-3.5 | ⚡⚡⚡ | ⭐⭐⭐⭐ | $ | 🔒 |
| Claude 3 Opus | ⚡⚡ | ⭐⭐⭐⭐⭐ | $$$$ | 🔒 |
| Claude 3 Sonnet | ⚡⚡⚡ | ⭐⭐⭐⭐ | $$ | 🔒 |

---

## Questions?

For more information about the AI Assistant feature, see:
- `AI_ASSISTANT_IMPLEMENTATION.md` - Technical implementation details
- `AI_IMPLEMENTATION_COMPLETE.md` - Feature overview
- `EXTERNAL_AI_IMPLEMENTATION_SUMMARY.md` - External AI integration

---

**Last Updated:** November 2025
