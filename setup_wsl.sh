#!/bin/bash

# WSL Ubuntu Setup Script for Invoice Generator
# Run this script in your WSL Ubuntu terminal

set -e  # Exit on any error

echo "🚀 Starting WSL Ubuntu setup for Invoice Generator..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in WSL
if ! grep -qi microsoft /proc/version; then
    print_warning "This script is designed for WSL Ubuntu. You may be running it in a different environment."
fi

# Step 1: Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install Python and pip
print_status "Installing Python and pip..."
sudo apt install python3 python3-pip python3-venv -y

# Step 3: Install Node.js
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Step 4: Install PostgreSQL
print_status "Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
print_status "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Step 5: Install additional dependencies
print_status "Installing additional system dependencies..."
sudo apt install libpq-dev python3-dev build-essential libssl-dev libffi-dev -y
sudo apt install libcairo2-dev libpango1.0-dev libgdk-pixbuf2.0-dev shared-mime-info -y

# Step 6: Create database user and database
print_status "Setting up PostgreSQL database..."
read -p "Enter your desired database username: " DB_USER
read -s -p "Enter your desired database password: " DB_PASSWORD
echo

# Create user and database
sudo -u postgres createuser --superuser $DB_USER || true
sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres createdb invoice_generator || true

# Step 7: Set up backend environment
print_status "Setting up backend environment..."
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
print_status "Creating .env file..."
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/invoice_generator
DB_PASSWORD=$DB_PASSWORD

# Supabase Configuration (you'll need to update these)
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
EOF

print_warning "Please update the Supabase configuration in backend/.env file"

# Step 8: Set up frontend
print_status "Setting up frontend..."
cd ../frontend
npm install

# Step 9: Initialize database
print_status "Initializing database..."
cd ../backend
source venv/bin/activate

# Check if migrations directory exists
if [ ! -d "migrations" ]; then
    flask db init
fi

flask db migrate -m "Initial migration"
flask db upgrade

print_status "✅ Setup completed successfully!"

echo
echo "🎉 Your WSL Ubuntu environment is ready!"
echo
echo "Next steps:"
echo "1. Update the Supabase configuration in backend/.env"
echo "2. Start the backend: cd backend && source venv/bin/activate && python app.py"
echo "3. Start the frontend: cd frontend && npm run dev"
echo
echo "Access URLs:"
echo "- Frontend: http://localhost:5173"
echo "- Backend API: http://localhost:5000"
echo
echo "Database credentials:"
echo "- Username: $DB_USER"
echo "- Database: invoice_generator"
echo "- Host: localhost"
echo "- Port: 5432"
