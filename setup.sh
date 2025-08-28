#!/bin/bash

echo "🚀 Setting up SoBoCo Task Management App..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Database setup will be done manually
echo "🗄️  Database setup will be done manually (see README.md)"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please set up your database connection:"
echo "   - Run: npm run setup:db (interactive setup)"
echo "   - Or manually update the .env file with your credentials"
    echo ""
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run setup:db (to configure database connection)"
echo "2. Set up database tables (see README.md for instructions)"
echo "3. Run: npm run dev (to start the backend)"
echo "4. Run: cd frontend && npm start (to start the frontend)"
echo ""
echo "For more information, see the README.md file"
