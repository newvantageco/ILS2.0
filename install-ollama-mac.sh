#!/bin/bash

# Quick Ollama Setup for macOS

echo "🚀 Setting up Ollama on macOS..."
echo ""

# Check if Homebrew is installed
if command -v brew &> /dev/null; then
    echo "✅ Homebrew found"
    echo ""
    echo "Installing Ollama via Homebrew..."
    brew install ollama
else
    echo "⚠️  Homebrew not found"
    echo ""
    echo "Please install Ollama manually:"
    echo "1. Download from: https://ollama.ai/download"
    echo "2. Or visit: https://ollama.ai/download/mac"
    echo "3. Double-click the downloaded .dmg file"
    echo "4. Drag Ollama to Applications"
    echo ""
    exit 1
fi

echo ""
echo "✅ Ollama installed!"
echo ""
echo "Starting Ollama server..."
ollama serve &
sleep 3

echo ""
echo "Downloading Llama 3.1 model (this may take a few minutes)..."
ollama pull llama3.1:latest

echo ""
echo "✅ Setup complete!"
echo ""
echo "Test Ollama with:"
echo "  ollama list"
echo ""
echo "Your AI Assistant is now ready to use!"
echo "Navigate to: http://localhost:3000/ecp/ai-assistant"
