# WSL Ubuntu Setup Guide for Invoice Generator

This guide will help you set up the invoice generator project in your WSL Ubuntu environment.

## Prerequisites

1. **WSL Ubuntu** (already installed)
2. **Git** (for cloning the repository)
3. **Python 3.8+** (for backend)
4. **Node.js 18+** (for frontend)
5. **PostgreSQL** (local database)
6. **Supabase CLI** (optional, for local development)

## Step 1: Update WSL Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
```

## Step 2: Install Python and pip

```bash
sudo apt install python3 python3-pip python3-venv -y
```

## Step 3: Install Node.js and npm

```bash
# Install Node.js 18+ using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 4: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create a database user (replace 'your_username' with your preferred username)
sudo -u postgres createuser --interactive
# Enter your desired username when prompted
# Answer 'y' when asked if the user should be a superuser

# Create database
sudo -u postgres createdb invoice_generator

# Set password for your user (replace 'your_username' and 'your_password')
sudo -u postgres psql -c "ALTER USER your_username WITH PASSWORD 'your_password';"
```

## Step 5: Install Additional Dependencies

```bash
# Install system dependencies for Python packages
sudo apt install libpq-dev python3-dev build-essential libssl-dev libffi-dev -y

# Install additional dependencies for WeasyPrint (PDF generation)
sudo apt install libcairo2-dev libpango1.0-dev libgdk-pixbuf2.0-dev libffi-dev shared-mime-info -y
```

## Step 6: Set Up Environment Variables

Create a `.env` file in the backend directory:

```bash
cd backend
cp .env.example .env  # if .env.example exists, otherwise create .env manually
```

Edit the `.env` file with your local database configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/invoice_generator
DB_PASSWORD=your_password

# Supabase Configuration (you can use local development or create a free Supabase project)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your_secret_key_here
```

## Step 7: Set Up Python Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

## Step 8: Set Up Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Install Node.js dependencies
npm install
```

## Step 9: Initialize Database

```bash
# Navigate back to backend directory
cd ../backend

# Activate virtual environment if not already activated
source venv/bin/activate

# Initialize database migrations
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

## Step 10: Run the Application

### Terminal 1 - Backend (Flask)
```bash
cd backend
source venv/bin/activate
python app.py
```

### Terminal 2 - Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## Step 11: Access the Application

- **Frontend**: http://localhost:5173 (or the port shown in the Vite output)
- **Backend API**: http://localhost:5000

## Troubleshooting

### Common Issues:

1. **Port already in use**: 
   ```bash
   sudo lsof -i :5000  # Check what's using port 5000
   sudo kill -9 <PID>  # Kill the process
   ```

2. **Database connection issues**:
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check your `.env` file configuration
   - Ensure database and user exist

3. **Permission issues**:
   ```bash
   sudo chown -R $USER:$USER /path/to/your/project
   ```

4. **Python package installation issues**:
   ```bash
   # Upgrade pip
   pip install --upgrade pip
   
   # Install with verbose output
   pip install -r requirements.txt -v
   ```

## Development Workflow

1. **Create a new branch for your work**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

3. **Test your changes**:
   - Backend: Ensure Flask server runs without errors
   - Frontend: Ensure React app builds and runs
   - Database: Test database operations

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

## Additional Tools (Optional)

### Install Supabase CLI for local development:
```bash
npm install -g supabase
```

### Install additional development tools:
```bash
# Install code formatting tools
pip install black flake8
npm install -g prettier eslint

# Install database GUI (optional)
sudo apt install pgadmin4
```

## Notes

- The backend uses Flask with SQLAlchemy for database operations
- The frontend uses React with TypeScript and Tailwind CSS
- PDF generation is handled by WeasyPrint
- The application uses Supabase for authentication and real-time features
- Make sure to keep your `.env` file secure and never commit it to version control
