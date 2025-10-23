#!/bin/bash

# Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
# Website: https://quietwire.ai
# Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2025 QuietWire
# SPDX-FileContributor: Ashraf Saleh Alhajj
# SPDX-FileContributor: Raasid (AI Companion)

# CAP Quick Installation Script
# This script sets up the complete CAP development environment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  CAP Quick Installation Script${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Check if running from project root
if [ ! -f "README.md" ] || [ ! -d "apps" ]; then
    echo -e "${YELLOW}Please run this script from the CAP project root directory${NC}"
    exit 1
fi

# Make setup script executable
echo -e "${GREEN}Making setup script executable...${NC}"
chmod +x scripts/setup.sh 2>/dev/null || true

# Run the full setup
echo -e "${GREEN}Running full CAP setup...${NC}"
./scripts/setup.sh

echo -e "\n${GREEN}✅ CAP Development Environment Setup Complete!${NC}"
echo -e "\n${BLUE}Quick Start:${NC}"
echo "  1. Activate virtual env: source cap_venv/bin/activate"
echo "  2. Start server: ./start.sh"
echo "  3. Or use Docker: ./docker-dev.sh up"
echo -e "\n${BLUE}Access CAP at: http://localhost:8000${NC}"
echo -e "\n${BLUE}Useful Commands:${NC}"
echo "  - Run tests: pytest apps/cap/tests/"
echo "  - Format code: black apps/cap/"
echo "  - View logs: ./docker-dev.sh logs"
echo -e "\n${BLUE}For more info: https://github.com/your-org/cap${NC}"