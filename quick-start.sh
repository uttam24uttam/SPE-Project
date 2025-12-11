#!/bin/bash

# Doctor Appointment Application - Quick Start Script
# This script sets up and runs the entire application locally

set -e

echo "=================================="
echo "Doctor Appointment Application"
echo "Quick Start Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Create .env file if not exists
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cat > backend/.env << EOF
PORT=5000
MONGODB_URI=mongodb://admin:password@mongo:27017/doctor_appointment?authSource=admin
JWT_SECRET=your_secret_key_change_in_production
NODE_ENV=development
EOF
    echo -e "${GREEN}✓ Backend .env created${NC}"
fi

# Build and start services
echo -e "${YELLOW}Building and starting services...${NC}"
docker-compose up -d

echo -e "${GREEN}✓ Services are starting${NC}"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"

# Check MongoDB
if curl -s http://localhost:27017/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "${RED}✗ MongoDB is not responding${NC}"
fi

# Check Backend
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${YELLOW}⟳ Backend is still starting...${NC}"
fi

# Display service URLs
echo ""
echo -e "${GREEN}=================================="
echo "Services are running!"
echo "==================================${NC}"
echo ""
echo -e "${YELLOW}Frontend:${NC}  http://localhost"
echo -e "${YELLOW}Backend:${NC}   http://localhost:5000"
echo -e "${YELLOW}MongoDB:${NC}   localhost:27017"
echo ""
echo -e "${YELLOW}Test the application:${NC}"
echo "1. Open http://localhost in your browser"
echo "2. Register as Doctor or Patient"
echo "3. Test the features"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f frontend"
echo ""
echo -e "${YELLOW}To stop services:${NC}"
echo "  docker-compose down"
echo ""
