# External AI Integration Guide

## Overview

The Integrated Lens System now supports external AI providers for intelligent assistance:
- **OpenAI** (GPT-4, GPT-4 Turbo, GPT-3.5 Turbo)
- **Anthropic** (Claude 3 Opus, Sonnet, Haiku)

The system intelligently uses these providers for questions and learns over time to reduce dependency on external APIs.

## Features

### 1. Multi-Provider Support
- Primary and fallback provider configuration
- Automatic failover if primary provider is unavailable
- Cost tracking and token usage monitoring

### 2. Progressive Learning
- System starts with heavy reliance on external AI (0-25% learning)
- Gradually builds company-specific knowledge base
- Eventually becomes mostly autonomous (75-100% learning)
- Reduces API costs over time

### 3. Context-Aware Responses
- Uses company-specific documents and knowledge base
- Maintains conversation history
- Provides source attribution
- Confidence scoring for answers

## Setup Instructions

### Step 1: Get API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Store it securely - you won't be able to see it again

#### Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Sign in or create an account
3. Click "Create Key"
4. Copy the key (starts with `sk-ant-`)
5. Store it securely

### Step 2: Configure Environment Variables

Add your API keys to the `.env` file in the project root:

```bash
# External AI API Keys
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

**Important:** 
- At least one API key is required for AI features to work
- Both can be configured for redundancy
- Never commit `.env` files to version control

### Step 3: Restart the Server

After adding the API keys:

```bash
npm run dev
```

The server will automatically detect available providers on startup.

### Step 4: Configure Provider Settings

1. Log in as an admin user
2. Navigate to **Admin > AI Settings** (`/admin/ai-settings`)
3. Select your preferred:
   - **AI Provider** (OpenAI or Anthropic)
   - **Model** (based on your needs and budget)
4. Click **Save Settings**

## Model Comparison

### OpenAI Models

| Model | Best For | Speed | Cost | Context Window |
|-------|----------|-------|------|----------------|
| **GPT-4** | Complex reasoning, detailed analysis | Slower | High | 8K-32K tokens |
| **GPT-4 Turbo** | Balanced performance, faster responses | Fast | Medium | 128K tokens |
| **GPT-3.5 Turbo** | Quick questions, simple tasks | Very Fast | Low | 16K tokens |

### Anthropic Models

| Model | Best For | Speed | Cost | Context Window |
|-------|----------|-------|------|----------------|
| **Claude 3 Opus** | Most complex tasks, highest quality | Slower | High | 200K tokens |
| **Claude 3 Sonnet** | Balanced intelligence and speed | Medium | Medium | 200K tokens |
| **Claude 3 Haiku** | Quick responses, high volume | Very Fast | Low | 200K tokens |

## Pricing (Approximate)

### OpenAI
- **GPT-4:** $0.03/1K prompt tokens, $0.06/1K completion tokens
- **GPT-4 Turbo:** $0.01/1K prompt tokens, $0.03/1K completion tokens
- **GPT-3.5 Turbo:** $0.0005/1K prompt tokens, $0.0015/1K completion tokens

### Anthropic
- **Claude 3 Opus:** $0.015/1K input tokens, $0.075/1K output tokens
- **Claude 3 Sonnet:** $0.003/1K input tokens, $0.015/1K output tokens
- **Claude 3 Haiku:** $0.00025/1K input tokens, $0.00125/1K output tokens

*Note: Prices subject to change. Check provider websites for current pricing.*

## Usage

### Asking Questions

1. Navigate to **AI Assistant** in any role dashboard
2. Type your question in the chat interface
3. The system will:
   - Search your knowledge base
   - Check learned information
   - Query external AI if needed
   - Provide a response with sources

### Uploading Knowledge

1. Go to the **Knowledge Base** tab
2. Click **Upload Document**
3. Select files (PDF, DOCX, TXT, CSV, JSON)
4. AI will learn from these documents

### Training the System

The system automatically learns from:
- Conversations and feedback
- Uploaded documents
- User corrections
- Positive/negative ratings

## Best Practices

### 1. Start with a Good Provider
- Use **GPT-4 Turbo** or **Claude 3 Sonnet** for balanced performance
- Switch to cheaper models once learning progress is high

### 2. Build Your Knowledge Base
- Upload company documents early
- Add FAQs and procedures
- Include product catalogs
- Document common solutions

### 3. Provide Feedback
- Rate responses (thumbs up/down)
- Correct incorrect answers
- Mark helpful responses

### 4. Monitor Usage
- Check token usage in AI Settings
- Review estimated costs
- Adjust models based on budget

### 5. Security
- Never share API keys
- Use environment variables only
- Rotate keys periodically
- Monitor for unusual activity

## API Endpoints

The system provides these AI endpoints:

```
POST   /api/ai-assistant/ask              - Ask a question
GET    /api/ai-assistant/conversations     - List conversations
GET    /api/ai-assistant/knowledge         - View knowledge base
POST   /api/ai-assistant/knowledge/upload  - Upload documents
GET    /api/ai-assistant/settings          - Get AI settings
PUT    /api/ai-assistant/settings          - Update AI settings
GET    /api/ai-assistant/stats             - Usage statistics
```

## Troubleshooting

### "No AI providers available"
**Solution:** Add at least one API key to your `.env` file and restart the server.

### "Invalid API key"
**Solution:** 
- Verify the key is correct (no extra spaces)
- Check that the key hasn't been revoked
- Generate a new key from the provider

### "Rate limit exceeded"
**Solution:**
- Wait a few minutes before retrying
- Upgrade your API plan
- Switch to a different provider

### "High costs"
**Solution:**
- Use cheaper models (GPT-3.5, Claude Haiku)
- Reduce temperature (less creative but cheaper)
- Build knowledge base to reduce external calls

### Provider failover not working
**Solution:**
- Ensure both API keys are configured
- Check server logs for error details
- Verify network connectivity to both providers

## Architecture

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Neural Network │  (If learning progress > 25%)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Knowledge Base │  (Company documents)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  External AI    │  (OpenAI/Anthropic)
│  - Primary      │
│  - Fallback     │
└─────────────────┘
```

## Code Integration

### Using ExternalAIService

```typescript
import { ExternalAIService } from './services/ExternalAIService';

const aiService = new ExternalAIService();

const messages = [
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'What are the benefits of anti-reflective coating?' }
];

const response = await aiService.generateResponse(messages, {
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  maxTokens: 2000,
  temperature: 0.7
});

console.log(response.content);
console.log(`Tokens used: ${response.tokensUsed.total}`);
console.log(`Estimated cost: $${response.estimatedCost.toFixed(4)}`);
```

## Support

For issues or questions:
1. Check the server logs: `npm run dev`
2. Review AI Settings page for provider status
3. Test with a simple question first
4. Check provider status pages:
   - [OpenAI Status](https://status.openai.com/)
   - [Anthropic Status](https://status.anthropic.com/)

## Future Enhancements

- [ ] Support for additional providers (Cohere, Mistral)
- [ ] Fine-tuning with company data
- [ ] Advanced embeddings for better search
- [ ] Cost optimization recommendations
- [ ] A/B testing between models
- [ ] Multi-language support
