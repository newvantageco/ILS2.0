#!/bin/bash

# AI Assistant Setup Script for Integrated Lens System
# This script helps you quickly set up AI capabilities

set -e

echo "============================================"
echo "  AI Assistant Setup - Integrated Lens System"
echo "============================================"
echo ""

# Function to check if Ollama is installed
check_ollama() {
    if command -v ollama &> /dev/null; then
        echo "✅ Ollama is installed"
        return 0
    else
        echo "❌ Ollama is not installed"
        return 1
    fi
}

# Function to check if Ollama server is running
check_ollama_running() {
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        echo "✅ Ollama server is running"
        return 0
    else
        echo "❌ Ollama server is not running"
        return 1
    fi
}

echo "Choose your AI setup option:"
echo ""
echo "1) Install Ollama (Local Llama - FREE, PRIVATE, FAST)"
echo "2) Use OpenAI (Cloud - Requires API Key)"
echo "3) Use Anthropic Claude (Cloud - Requires API Key)"
echo "4) Skip AI setup (configure manually later)"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "Installing Ollama (Local Llama)..."
        echo "=================================="
        
        if check_ollama; then
            echo "Ollama is already installed!"
        else
            echo "Installing Ollama..."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                echo "Downloading Ollama for macOS..."
                curl -fsSL https://ollama.ai/install.sh | sh
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                # Linux
                echo "Installing Ollama for Linux..."
                curl -fsSL https://ollama.ai/install.sh | sh
            else
                echo "Please install Ollama manually from: https://ollama.ai/download"
                exit 1
            fi
        fi
        
        echo ""
        echo "Starting Ollama server..."
        ollama serve &
        OLLAMA_PID=$!
        sleep 3
        
        if check_ollama_running; then
            echo ""
            echo "Downloading Llama 3.1 model (this may take a few minutes)..."
            ollama pull llama3.1:latest
            
            echo ""
            echo "✅ Setup complete!"
            echo ""
            echo "Ollama has been configured with Llama 3.1."
            echo ""
            echo "Updating .env file..."
            
            # Update .env file
            if grep -q "USE_LOCAL_AI" .env; then
                sed -i.bak 's/USE_LOCAL_AI=.*/USE_LOCAL_AI=true/' .env
            else
                echo "USE_LOCAL_AI=true" >> .env
            fi
            
            if grep -q "OLLAMA_BASE_URL" .env; then
                sed -i.bak 's|OLLAMA_BASE_URL=.*|OLLAMA_BASE_URL=http://localhost:11434|' .env
            else
                echo "OLLAMA_BASE_URL=http://localhost:11434" >> .env
            fi
            
            if grep -q "OLLAMA_MODEL" .env; then
                sed -i.bak 's/OLLAMA_MODEL=.*/OLLAMA_MODEL=llama3.1:latest/' .env
            else
                echo "OLLAMA_MODEL=llama3.1:latest" >> .env
            fi
            
            echo ""
            echo "✅ .env file updated!"
            echo ""
            echo "To complete setup, restart your development server:"
            echo "  npm run dev"
        else
            echo "❌ Failed to start Ollama server"
            exit 1
        fi
        ;;
        
    2)
        echo ""
        echo "Setting up OpenAI..."
        echo "==================="
        echo ""
        echo "You'll need an OpenAI API key from: https://platform.openai.com/api-keys"
        echo ""
        read -p "Enter your OpenAI API key (starts with sk-proj-): " api_key
        
        if [[ ! $api_key =~ ^sk-proj- ]]; then
            echo "❌ Invalid API key format. Key should start with 'sk-proj-'"
            exit 1
        fi
        
        # Update .env file
        if grep -q "OPENAI_API_KEY" .env; then
            sed -i.bak "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$api_key/" .env
        else
            echo "OPENAI_API_KEY=$api_key" >> .env
        fi
        
        # Disable local AI preference
        if grep -q "USE_LOCAL_AI" .env; then
            sed -i.bak 's/USE_LOCAL_AI=.*/USE_LOCAL_AI=false/' .env
        fi
        
        echo ""
        echo "✅ OpenAI configured!"
        echo ""
        echo "To complete setup, restart your development server:"
        echo "  npm run dev"
        ;;
        
    3)
        echo ""
        echo "Setting up Anthropic Claude..."
        echo "============================="
        echo ""
        echo "You'll need an Anthropic API key from: https://console.anthropic.com/settings/keys"
        echo ""
        read -p "Enter your Anthropic API key (starts with sk-ant-): " api_key
        
        if [[ ! $api_key =~ ^sk-ant- ]]; then
            echo "❌ Invalid API key format. Key should start with 'sk-ant-'"
            exit 1
        fi
        
        # Update .env file
        if grep -q "ANTHROPIC_API_KEY" .env; then
            sed -i.bak "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" .env
        else
            echo "ANTHROPIC_API_KEY=$api_key" >> .env
        fi
        
        # Disable local AI preference
        if grep -q "USE_LOCAL_AI" .env; then
            sed -i.bak 's/USE_LOCAL_AI=.*/USE_LOCAL_AI=false/' .env
        fi
        
        echo ""
        echo "✅ Anthropic Claude configured!"
        echo ""
        echo "To complete setup, restart your development server:"
        echo "  npm run dev"
        ;;
        
    4)
        echo ""
        echo "Setup skipped. You can configure AI manually by editing the .env file."
        echo "See AI_SETUP_GUIDE.md for detailed instructions."
        ;;
        
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "============================================"
echo "For more information, see: AI_SETUP_GUIDE.md"
echo "============================================"
