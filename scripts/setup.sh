#!/bin/bash

# CAP Development Setup Script
# This script sets up the development environment for Civic AI Canon Platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for colored output
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}  CAP Development Setup${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check system requirements
check_requirements() {
    print_header
    print_info "Checking system requirements..."
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python 3 is required but not installed"
        exit 1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION found"
    else
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        print_success "Git $GIT_VERSION found"
    else
        print_error "Git is required but not installed"
        exit 1
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker $DOCKER_VERSION found (optional)"
    else
        print_warning "Docker not found (optional for containerized development)"
    fi
    
    # Check MySQL/MariaDB (optional)
    if command -v mysql &> /dev/null; then
        print_success "MySQL client found"
    elif command -v mariadb &> /dev/null; then
        print_success "MariaDB client found"
    else
        print_warning "MySQL/MariaDB client not found (will use Docker container)"
    fi
}

# Setup Python virtual environment
setup_python_env() {
    print_info "Setting up Python virtual environment..."
    
    VENV_DIR="cap_venv"
    
    if [ -d "$VENV_DIR" ]; then
        print_warning "Virtual environment already exists at $VENV_DIR"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf $VENV_DIR
        else
            print_info "Using existing virtual environment"
            return
        fi
    fi
    
    python3 -m venv $VENV_DIR
    source $VENV_DIR/bin/activate
    
    print_success "Virtual environment created and activated"
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install Python dependencies
    print_info "Installing Python dependencies..."
    if [ -f "apps/cap/requirements.txt" ]; then
        pip install -r apps/cap/requirements.txt
        print_success "Python dependencies installed"
    else
        print_warning "requirements.txt not found, skipping Python dependencies"
    fi
    
    # Install development dependencies
    if [ -f "apps/cap/requirements-dev.txt" ]; then
        pip install -r apps/cap/requirements-dev.txt
        print_success "Development dependencies installed"
    fi
}

# Setup Node.js environment
setup_node_env() {
    print_info "Setting up Node.js environment..."
    
    if [ -f "apps/cap/package.json" ]; then
        cd apps/cap
        
        if [ -d "node_modules" ]; then
            print_warning "node_modules already exists"
            read -p "Do you want to reinstall? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm -rf node_modules package-lock.json
                npm install
            fi
        else
            npm install
        fi
        
        print_success "Node.js dependencies installed"
        cd ../../
    else
        print_warning "package.json not found, skipping Node.js dependencies"
    fi
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    if command -v docker &> /dev/null; then
        print_info "Starting database container..."
        
        # Check if container already exists
        if docker ps -a --format 'table {{.Names}}' | grep -q "cap-mariadb"; then
            print_info "Database container already exists"
            docker start cap-mariadb
        else
            docker run -d \
                --name cap-mariadb \
                -e MYSQL_ROOT_PASSWORD=root \
                -e MYSQL_DATABASE=cap_db \
                -e MYSQL_USER=cap_user \
                -e MYSQL_PASSWORD=cap_pass \
                -p 3306:3306 \
                mariadb:10.6
            
            print_success "Database container started"
        fi
        
        # Wait for database to be ready
        print_info "Waiting for database to be ready..."
        sleep 10
        
        # Test connection
        if docker exec cap-mariadb mysql -uroot -proot -e "SELECT 1;" &> /dev/null; then
            print_success "Database connection successful"
        else
            print_error "Database connection failed"
        fi
    else
        print_warning "Docker not available, skipping database setup"
        print_info "Please ensure MySQL/MariaDB is running locally"
    fi
}

# Setup Frappe environment
setup_frappe() {
    print_info "Setting up Frappe environment..."
    
    # Install frappe-cli if not available
    if ! command -v bench &> /dev/null; then
        print_info "Installing Frappe Bench..."
        pip install frappe-bench
        print_success "Frappe Bench installed"
    else
        print_success "Frappe Bench already installed"
    fi
    
    # Check if bench already exists
    if [ -d "frappe-bench" ]; then
        print_warning "Frappe bench directory already exists"
        cd frappe-bench
        print_info "Using existing bench installation"
    else
        print_info "Initializing Frappe Bench..."
        bench init frappe-bench --python python3
        cd frappe-bench
        
        # Add the app
        print_info "Adding CAP app..."
        bench get-app cap /path/to/cap_development/apps/cap
        
        # Create a new site
        print_info "Creating CAP site..."
        bench new-site cap-local --db-host=localhost --db-port=3306 --db-name=cap_db --db-user=cap_user --db-password=cap_pass
        
        # Install the app on the site
        print_info "Installing CAP app on the site..."
        bench --site cap-local install-app cap
        
        print_success "Frappe environment setup complete"
    fi
}

# Create environment file
create_env_file() {
    print_info "Creating environment file..."
    
    cat > .env << EOF
# CAP Development Environment
# Generated on $(date)

# Database Configuration
DATABASE_URL=mysql://cap_user:cap_pass@localhost:3306/cap_db
DB_HOST=localhost
DB_PORT=3306
DB_USER=cap_user
DB_PASSWORD=cap_pass
DB_NAME=cap_db

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Application Configuration
SECRET_KEY=development-secret-key
DEBUG=True
ENVIRONMENT=development

# AI Configuration (Optional)
# OPENAI_API_KEY=your_openai_key
# ANTHROPIC_API_KEY=your_anthropic_key

# Email Configuration (Optional)
# SMTP_SERVER=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email
# SMTP_PASSWORD=your_password

# Security
ENCRYPTION_KEY=development-encryption-key

# Logging
LOG_LEVEL=DEBUG
LOG_FILE=logs/cap.log
EOF

    print_success "Environment file created at .env"
}

# Create start script
create_start_script() {
    print_info "Creating start script..."
    
    cat > start.sh << 'EOF'
#!/bin/bash

# CAP Development Server Start Script

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Starting CAP Development Server${NC}"
echo -e "${BLUE}=====================================${NC}"

# Activate virtual environment if exists
if [ -f "cap_venv/bin/activate" ]; then
    echo -e "${GREEN}Activating Python virtual environment...${NC}"
    source cap_venv/bin/activate
fi

# Load environment variables
if [ -f ".env" ]; then
    echo -e "${GREEN}Loading environment variables...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start database if using Docker
if command -v docker &> /dev/null && docker ps -a --format 'table {{.Names}}' | grep -q "cap-mariadb"; then
    if ! docker ps | grep -q "cap-mariadb"; then
        echo -e "${YELLOW}Starting database container...${NC}"
        docker start cap-mariadb
        sleep 5
    fi
fi

# Start development server
cd frappe-bench
echo -e "${GREEN}Starting development server...${NC}"
bench start --host 0.0.0.0 --port 8000
EOF

    chmod +x start.sh
    print_success "Start script created at start.sh"
}

# Create Docker development script
create_docker_script() {
    print_info "Creating Docker development script..."
    
    cat > docker-dev.sh << 'EOF'
#!/bin/bash

# CAP Docker Development Script

set -e

case "$1" in
    "up")
        echo "Starting CAP development environment..."
        docker-compose up -d
        echo "Services started. Access CAP at http://localhost:8000"
        ;;
    "down")
        echo "Stopping CAP development environment..."
        docker-compose down
        ;;
    "logs")
        echo "Showing logs for CAP application..."
        docker-compose logs -f cap-app
        ;;
    "shell")
        echo "Opening shell in CAP application container..."
        docker-compose exec cap-app bash
        ;;
    "db-shell")
        echo "Opening MySQL shell..."
        docker-compose exec mariadb mysql -uroot -proot cap_db
        ;;
    "restart")
        echo "Restarting CAP development environment..."
        docker-compose restart cap-app
        ;;
    *)
        echo "Usage: $0 {up|down|logs|shell|db-shell|restart}"
        echo ""
        echo "Commands:"
        echo "  up       - Start the development environment"
        echo "  down     - Stop all containers"
        echo "  logs     - Show application logs"
        echo "  shell    - Open shell in app container"
        echo "  db-shell - Open MySQL shell"
        echo "  restart  - Restart application container"
        exit 1
        ;;
esac
EOF

    chmod +x docker-dev.sh
    print_success "Docker development script created at docker-dev.sh"
}

# Main setup function
main() {
    print_header
    
    # Check if we're in the right directory
    if [ ! -f "README.md" ] || [ ! -d "apps" ]; then
        print_error "Please run this script from the CAP project root directory"
        exit 1
    fi
    
    # Create directories
    mkdir -p logs
    
    check_requirements
    setup_python_env
    setup_node_env
    setup_database
    setup_frappe
    create_env_file
    create_start_script
    create_docker_script
    
    print_header
    print_success "CAP Development Environment Setup Complete!"
    echo
    print_info "Next steps:"
    echo "  1. Activate the virtual environment: source cap_venv/bin/activate"
    echo "  2. Start the development server: ./start.sh"
    echo "  3. Or use Docker: ./docker-dev.sh up"
    echo
    print_info "Access CAP at: http://localhost:8000"
    echo "  Username: Administrator"
    echo "  Password: (check console output for password)"
    echo
    print_info "For help, see: https://github.com/your-org/cap#setup"
    echo
}

# Run main function
main "$@"