#!/bin/bash

echo "🔧 Autobidder Zapier App Deployment Script"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install Zapier CLI globally if not already installed
if ! command -v zapier &> /dev/null; then
    echo "📦 Installing Zapier CLI..."
    npm install -g zapier-platform-cli
else
    echo "✅ Zapier CLI is already installed"
fi

# Navigate to zapier-app directory
cd zapier-app

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your test server URL and API key"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Edit zapier-app/.env with your test credentials:"
echo "   - TEST_SERVER_URL=https://your-autobidder-app.replit.app"
echo "   - TEST_API_KEY=your-test-api-key"
echo ""
echo "2. Login to Zapier:"
echo "   zapier login"
echo ""
echo "3. Test the app:"
echo "   cd zapier-app && npm test"
echo ""
echo "4. Register the app:"
echo "   zapier register \"Autobidder\""
echo ""
echo "5. Push to Zapier:"
echo "   zapier push"
echo ""
echo "📚 See ZAPIER_DEPLOYMENT_GUIDE.md for detailed instructions"