#!/bin/bash
set -e

# Navigate to project root
cd "$(dirname "$0")/.."

# Configuration
SERVICE_NAME="golf-app-service"
IMAGE_NAME="golf-app"
CONTAINER_NAME="app"
AWS_REGION="us-east-1"
POWER="nano" # nano, micro, small, medium, large, xlarge
SCALE=1

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment for ${SERVICE_NAME}...${NC}"

# Check requirements
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi
if ! command -v lightsailctl &> /dev/null; then
    echo -e "${RED}❌ lightsailctl is not installed. Please install it first.${NC}"
    exit 1
fi
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed. Please install it first.${NC}"
    exit 1
fi
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ docker is not installed. Please install it first.${NC}"
    exit 1
fi

# 1. Check/Create Service
echo -e "${YELLOW}🔍 Checking service '${SERVICE_NAME}'...${NC}"
SERVICE_EXISTS=$(aws lightsail get-container-services --service-name "$SERVICE_NAME" --region "$AWS_REGION" --output json 2>/dev/null || echo "not_found")

if [[ "$SERVICE_EXISTS" == "not_found" ]]; then
    echo -e "${YELLOW}🏗️ Creating new service '$SERVICE_NAME' (${POWER}, scale: ${SCALE})...${NC}"
    aws lightsail create-container-service --service-name "$SERVICE_NAME" --power "$POWER" --scale "$SCALE" --region "$AWS_REGION"
    
    # Wait for service to be ready (optional, but good practice)
    echo -e "${YELLOW}⏳ Waiting for service to be READY...${NC}"
    sleep 10
    # Provide a loop to check status? For now just proceed.
else
    echo -e "${GREEN}✅ Service '$SERVICE_NAME' already exists.${NC}"
fi

# 2. Build Docker Image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t "$IMAGE_NAME" .

# 3. Push Image
echo -e "${YELLOW}⬆️ Pushing image to Lightsail...${NC}"
PUSH_OUTPUT=$(aws lightsail push-container-image --region "$AWS_REGION" --service-name "$SERVICE_NAME" --label "$IMAGE_NAME" --image "$IMAGE_NAME")
echo "$PUSH_OUTPUT"

# 4. Get Latest Image Tag
echo -e "${YELLOW}🔍 Verifying uploaded image...${NC}"
LATEST_IMAGE=$(aws lightsail get-container-images --service-name "$SERVICE_NAME" --region "$AWS_REGION" --output json | jq -r '.containerImages | sort_by(.createdAt) | reverse | .[0].image')

if [[ -z "$LATEST_IMAGE" || "$LATEST_IMAGE" == "null" ]]; then
    echo -e "${RED}❌ Could not find the uploaded image.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ready to deploy image: $LATEST_IMAGE${NC}"

# 5. Create Deployment Config
# We define the container configuration.
# Note: For environment variables, we recommend adding them via the Lightsail Console for security.
# However, if you want to deploy strictly from CLI including env vars, modify this JSON.

# Construct the containers JSON string safely
CONTAINERS_JSON=$(jq -n \
  --arg name "$CONTAINER_NAME" \
  --arg image "$LATEST_IMAGE" \
  '{
    ($name): {
      image: $image,
      ports: { "3000": "HTTP" },
      environment: {} 
    }
  }')

# Construct public endpoint JSON
PUBLIC_ENDPOINT_JSON=$(jq -n \
  --arg name "$CONTAINER_NAME" \
  '{
    containerName: $name,
    containerPort: 3000,
    healthCheck: {
      path: "/",
      successCodes: "200-499"
    }
  }')

# 6. Deploy
read -p "🚀 Deploy $LATEST_IMAGE to $SERVICE_NAME? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚀 Deploying...${NC}"
    DEPLOY_RESULT=$(aws lightsail create-container-service-deployment \
        --service-name "$SERVICE_NAME" \
        --containers "$CONTAINERS_JSON" \
        --public-endpoint "$PUBLIC_ENDPOINT_JSON" \
        --region "$AWS_REGION")
        
    echo "$DEPLOY_RESULT"
    echo -e "${GREEN}✅ Deployment created! It may take a few minutes to become active.${NC}"
    echo -e "${YELLOW}⚠️  REMINDER: Go to the Lightsail Console to add Environment Variables (DATABASE_URL, NEXTAUTH_SECRET, etc).${NC}"
    echo -e "🔗 Console: https://lightsail.aws.amazon.com/ls/webapp/$AWS_REGION/container-services/$SERVICE_NAME/deployments"
else
    echo "Deployment cancelled."
fi
