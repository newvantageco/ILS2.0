# External AI Integration - Quick Reference Card

## ⚡ Quick Setup (5 minutes)

### 1. Get API Keys
- **OpenAI:** https://platform.openai.com/api-keys
- **Anthropic:** https://console.anthropic.com/settings/keys

### 2. Add to .env
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Restart Server
```bash
npm run dev
```

### 4. Configure (Admin Only)
Navigate to: **Admin > AI Settings** (`/admin/ai-settings`)

---

## 📍 Access Points

| Feature | Path | Who Can Access |
|---------|------|----------------|
| AI Assistant | `/ecp/ai-assistant`<br>`/lab/ai-assistant`<br>`/supplier/ai-assistant`<br>`/admin/ai-assistant` | All users |
| AI Settings | `/admin/ai-settings` | Admin only |
| Help | `/help` | All users |

---

## 🎯 Model Quick Pick

### Need Best Quality?
- **GPT-4** or **Claude 3 Opus**
- Highest intelligence, slower, $$$

### Need Balanced Performance?
- **GPT-4 Turbo** or **Claude 3 Sonnet**
- Fast & smart, moderate cost $$

### Need Speed & Economy?
- **GPT-3.5 Turbo** or **Claude 3 Haiku**
- Very fast, cheapest $

---

## 🔧 Common Tasks

### Upload Knowledge
1. AI Assistant → Knowledge Base tab
2. Click Upload Document
3. Select PDF/DOCX/TXT/CSV/JSON
4. Done!

### Ask Questions
1. AI Assistant → Conversations tab
2. Type question
3. Get AI response with sources
4. Rate response (👍/👎)

### Change Provider
1. Admin > AI Settings
2. Select Provider (OpenAI/Anthropic)
3. Select Model
4. Save

### Check Status
- Green badge = Configured ✅
- Gray badge = Need API key ⚠️
- Learning progress bar = AI intelligence level

---

## 🚨 Troubleshooting

| Problem | Fix |
|---------|-----|
| "No providers available" | Add API key to `.env`, restart server |
| Gray status badges | Missing API key in `.env` |
| "Rate limit" error | Wait 1 minute or upgrade API plan |
| Slow responses | Switch to faster model (GPT-3.5/Haiku) |
| High costs | Use cheaper model, build knowledge base |

---

## 💡 Pro Tips

1. **Start with GPT-4 Turbo** - Best balance of quality and cost
2. **Upload documents early** - Reduces API calls and costs
3. **Rate responses** - Improves learning and accuracy
4. **Monitor progress bar** - Higher = less external API usage
5. **Use knowledge base** - System learns and becomes smarter

---

## 📊 Cost Examples (Rough Estimates)

### 100 Questions/Day

| Model | Monthly Cost* |
|-------|--------------|
| GPT-4 | ~$90 |
| GPT-4 Turbo | ~$30 |
| GPT-3.5 Turbo | ~$3 |
| Claude 3 Opus | ~$75 |
| Claude 3 Sonnet | ~$15 |
| Claude 3 Haiku | ~$2 |

*Assumes 200 tokens input, 500 tokens output per question

### Cost Reduction Over Time
- **Month 1:** 100% external AI = Full cost
- **Month 3:** 50% knowledge base = Half cost
- **Month 6:** 75% knowledge base = Quarter cost

---

## 🔐 Security Checklist

- [ ] API keys in `.env` file only
- [ ] `.env` file in `.gitignore`
- [ ] Never commit API keys
- [ ] Only admins can see keys
- [ ] Monitor usage regularly
- [ ] Rotate keys quarterly

---

## 📞 Support

**Server Logs:**
```bash
npm run dev
```
Look for:
- `[ExternalAIService:INFO] OpenAI client initialized` ✅
- `[ExternalAIService:INFO] Anthropic client initialized` ✅
- `[ExternalAIService:WARN] OPENAI_API_KEY not found` ⚠️

**Documentation:**
- Full Guide: `EXTERNAL_AI_SETUP_GUIDE.md`
- Implementation: `EXTERNAL_AI_IMPLEMENTATION_SUMMARY.md`

**Provider Status:**
- OpenAI: https://status.openai.com/
- Anthropic: https://status.anthropic.com/

---

## ✨ You're Ready!

Your AI is now powered by the world's best language models. Just add your API keys and start chatting! 🚀

**Default Settings:**
- Provider: OpenAI
- Model: GPT-4 Turbo
- Max Tokens: 2000
- Temperature: 0.7

**Change anytime in:** Admin > AI Settings
