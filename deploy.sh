#!/bin/bash

# Deploy to Kubernetes using Ansible

set -e

echo "=================================="
echo "Doctor Appointment Application"
echo "Kubernetes Deployment Script"
echo "=================================="


RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' 


echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v ansible &> /dev/null; then
    echo -e "${RED}Ansible is not installed. Installing...${NC}"
    pip install ansible
fi

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl is not installed. Please install kubectl first.${NC}"
    exit 1
fi


echo -e "${YELLOW}Verifying Kubernetes cluster...${NC}"
if kubectl cluster-info > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Kubernetes cluster is accessible${NC}"
else
    echo -e "${RED}✗ Kubernetes cluster is not accessible${NC}"
    exit 1
fi


if command -v minikube &> /dev/null; then
    if ! minikube status > /dev/null 2>&1; then
        echo -e "${YELLOW}Starting minikube...${NC}"
        minikube start
        echo -e "${GREEN}✓ minikube started${NC}"
    fi
fi


read -p "Do you want to build Docker images before deployment? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Building Docker images...${NC}"
    
    # Build backend
    docker build -t yourhub/backend:latest backend/
    echo -e "${GREEN}✓ Backend image built${NC}"
    
    # Build frontend
    docker build -t yourhub/frontend:latest frontend/
    echo -e "${GREEN}✓ Frontend image built${NC}"
    
    # For local testing with minikube
    if command -v minikube &> /dev/null; then
        echo -e "${YELLOW}Pushing images to minikube...${NC}"
        minikube image load yourhub/backend:latest
        minikube image load yourhub/frontend:latest
        echo -e "${GREEN}✓ Images loaded into minikube${NC}"
    fi
fi

# Run Ansible playbook
echo -e "${YELLOW}Running Ansible deployment playbook...${NC}"
ansible-playbook -i Deployment/inventory Deployment/deploy.yml -v

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Ansible playbook executed successfully${NC}"
else
    echo -e "${RED}✗ Ansible playbook failed${NC}"
    exit 1
fi

# Wait for deployments
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s \
    deployment/backend-deployment -n doctor-appointment 2>/dev/null || true
kubectl wait --for=condition=available --timeout=300s \
    deployment/frontend-deployment -n doctor-appointment 2>/dev/null || true

# Display deployment status
echo ""
echo -e "${GREEN}=================================="
echo "Deployment Status"
echo "==================================${NC}"
echo ""

echo -e "${YELLOW}Deployments:${NC}"
kubectl get deployments -n doctor-appointment

echo ""
echo -e "${YELLOW}Services:${NC}"
kubectl get services -n doctor-appointment

echo ""
echo -e "${YELLOW}Pods:${NC}"
kubectl get pods -n doctor-appointment

echo ""
echo -e "${YELLOW}HPA Status:${NC}"
kubectl get hpa -n doctor-appointment

echo ""
echo -e "${GREEN}=================================="
echo "Accessing the Application"
echo "==================================${NC}"
echo ""

if command -v minikube &> /dev/null; then
    MINIKUBE_IP=$(minikube ip)
    echo -e "${YELLOW}Frontend:${NC}    http://${MINIKUBE_IP}:30080"
    echo -e "${YELLOW}Prometheus:${NC}  http://${MINIKUBE_IP}:30090"
else
    echo -e "${YELLOW}Frontend:${NC}    Use kubectl port-forward"
    echo -e "${YELLOW}Prometheus:${NC}  Use kubectl port-forward"
fi

echo ""
echo -e "${YELLOW}Port forwarding (if needed):${NC}"
echo "  kubectl port-forward -n doctor-appointment svc/frontend-service 8080:80"
echo "  kubectl port-forward -n doctor-appointment svc/prometheus-service 9090:9090"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo "  kubectl logs -n doctor-appointment -l app=backend -f"
echo "  kubectl logs -n doctor-appointment -l app=frontend -f"
echo ""
