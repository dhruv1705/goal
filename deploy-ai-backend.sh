#!/bin/bash

# Deploy AI Backend to Supabase
# This script sets up the Supabase Edge Function and database for AI chat

echo "🚀 Deploying AI Chat Backend to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Please log in to Supabase first:"
    echo "supabase login"
    exit 1
fi

echo "📝 Step 1: Applying database migration for rate limiting..."
supabase db push

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed"
    exit 1
fi

echo "✅ Database migration completed"

# Prompt for Claude API key if not set
echo "🔑 Step 2: Setting up Claude API key..."
if ! supabase secrets list | grep -q "CLAUDE_API_KEY"; then
    echo "Please enter your Claude API key from Anthropic Console:"
    read -s CLAUDE_API_KEY
    
    if [ -z "$CLAUDE_API_KEY" ]; then
        echo "❌ API key cannot be empty"
        exit 1
    fi
    
    supabase secrets set CLAUDE_API_KEY="$CLAUDE_API_KEY"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to set API key"
        exit 1
    fi
    
    echo "✅ Claude API key configured"
else
    echo "✅ Claude API key already configured"
fi

echo "🚀 Step 3: Deploying Edge Function..."
supabase functions deploy chat-ai

if [ $? -ne 0 ]; then
    echo "❌ Function deployment failed"
    exit 1
fi

echo "✅ Edge Function deployed successfully"

echo "🎉 AI Backend deployment completed!"
echo ""
echo "Your AI chat function is now available at:"
echo "https://$(supabase status | grep API | awk '{print $3}' | head -1)/functions/v1/chat-ai"
echo ""
echo "📊 Rate Limits:"
echo "- Daily: 50 messages per user"
echo "- Hourly: 10 messages per user"
echo ""
echo "🔍 Monitor function logs with:"
echo "supabase functions logs chat-ai"