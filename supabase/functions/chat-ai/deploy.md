# AI Chat Function Deployment Guide

## Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Get Claude API key from Anthropic Console
3. Ensure you're logged into Supabase CLI: `supabase login`

## Deployment Steps

### 1. Apply Database Migration
```bash
cd /path/to/your/project
supabase db push
```

### 2. Set Environment Variables
```bash
# Set Claude API key (replace with your actual key)
supabase secrets set CLAUDE_API_KEY=sk-ant-api03-your-key-here

# Verify secrets are set
supabase secrets list
```

### 3. Deploy Edge Function
```bash
# Deploy the chat-ai function
supabase functions deploy chat-ai

# Verify deployment
supabase functions list
```

### 4. Test the Function
```bash
# Test with curl (replace URL and token)
curl -X POST 'https://your-project.supabase.co/functions/v1/chat-ai' \
  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Hi, I want to improve my fitness",
    "conversationHistory": []
  }'
```

## Environment Variables Required
- `CLAUDE_API_KEY`: Your Anthropic Claude API key
- `SUPABASE_URL`: Automatically provided
- `SUPABASE_SERVICE_ROLE_KEY`: Automatically provided

## Rate Limits
- **Daily**: 50 messages per user
- **Hourly**: 10 messages per user
- Resets automatically

## Function URL
After deployment, your function will be available at:
`https://your-project-id.supabase.co/functions/v1/chat-ai`

## Monitoring
Check function logs with:
```bash
supabase functions logs chat-ai
```