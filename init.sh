#!/bin/bash

# Set executable permissions for scripts
chmod +x quick-start.sh
chmod +x deploy.sh
chmod +x cleanup.sh

echo "Script permissions set successfully!"
echo ""
echo "Available commands:"
echo "  ./quick-start.sh    - Start application locally with Docker Compose"
echo "  ./deploy.sh         - Deploy to Kubernetes with Ansible"
echo "  ./cleanup.sh        - Remove all Kubernetes resources"
