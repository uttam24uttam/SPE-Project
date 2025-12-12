set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Doctor Appointment Application - Cleanup${NC}"
echo ""

# Confirm deletion
read -p "Are you sure you want to delete all resources? (yes/no): " confirmation
if [ "$confirmation" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo -e "${YELLOW}Deleting namespace and all resources...${NC}"
kubectl delete namespace doctor-appointment --ignore-not-found=true

echo -e "${GREEN}✓ Cleanup completed${NC}"

# Verify deletion
echo -e "${YELLOW}Verifying deletion...${NC}"
if kubectl get namespace doctor-appointment 2>/dev/null; then
    echo -e "${RED}Namespace still exists. Waiting...${NC}"
    sleep 5
else
    echo -e "${GREEN}✓ All resources successfully deleted${NC}"
fi
