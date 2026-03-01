#!/bin/bash
set -e

# Navigate to project root
cd "$(dirname "$0")/.."

# ============================================================
# Configuration — edit these if needed
# ============================================================
SERVICE_NAME="golf-app-service"
IMAGE_NAME="golf-app"
CONTAINER_NAME="app"
AWS_REGION="us-east-1"
POWER="nano"   # nano=$7/mo | micro=$10/mo | small=$25/mo
SCALE=1
PORT=3000
ENV_FILE=".env.production"
# ============================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}========================================"
echo -e "  🏌️  GolfApp — Lightsail Deploy"
echo -e "========================================${NC}"
echo ""

# ---- Prerequisite checks -----------------------------------
for cmd in aws lightsailctl docker jq; do
  if ! command -v $cmd &> /dev/null; then
    echo -e "${RED}❌ '$cmd' is not installed. See the deployment guide for setup instructions.${NC}"
    exit 1
  fi
done

# ---- Check .env.production exists --------------------------
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ $ENV_FILE not found."
  echo -e "   Copy .env to .env.production and update NEXTAUTH_URL to your Lightsail domain.${NC}"
  exit 1
fi

# Warn if NEXTAUTH_URL still points to localhost
if grep -q 'NEXTAUTH_URL.*localhost' "$ENV_FILE"; then
  echo -e "${RED}❌ NEXTAUTH_URL in $ENV_FILE still points to localhost."
  echo -e "   Update it to your Lightsail public URL before deploying.${NC}"
  exit 1
fi

# ---- 1. Check/Create Service --------------------------------
echo -e "${YELLOW}[1/5] Checking Lightsail service '${SERVICE_NAME}'...${NC}"
SERVICE_EXISTS=$(aws lightsail get-container-services \
  --service-name "$SERVICE_NAME" \
  --region "$AWS_REGION" \
  --output text 2>/dev/null && echo "found" || echo "not_found")

if [[ "$SERVICE_EXISTS" == *"not_found"* ]]; then
  echo -e "${YELLOW}      Creating new service (${POWER}, scale: ${SCALE}) — this takes ~2 minutes...${NC}"
  aws lightsail create-container-service \
    --service-name "$SERVICE_NAME" \
    --power "$POWER" \
    --scale "$SCALE" \
    --region "$AWS_REGION" > /dev/null
  echo -e "${YELLOW}      Waiting for service to be ready...${NC}"
  while true; do
    STATUS=$(aws lightsail get-container-services \
      --service-name "$SERVICE_NAME" \
      --region "$AWS_REGION" \
      --query 'containerServices[0].state' \
      --output text)
    echo "      Status: $STATUS"
    [[ "$STATUS" == "READY" ]] && break
    sleep 10
  done
  echo -e "${GREEN}      ✅ Service created and ready.${NC}"
else
  echo -e "${GREEN}      ✅ Service already exists.${NC}"
fi
echo ""

# ---- 2. Build Docker Image ----------------------------------
echo -e "${YELLOW}[2/5] Building Docker image...${NC}"
docker build -t "$IMAGE_NAME" .
echo -e "${GREEN}      ✅ Image built: $IMAGE_NAME${NC}"
echo ""

# ---- 3. Push Image to Lightsail registry -------------------
echo -e "${YELLOW}[3/5] Pushing image to Lightsail registry...${NC}"
aws lightsail push-container-image \
  --region "$AWS_REGION" \
  --service-name "$SERVICE_NAME" \
  --label "$IMAGE_NAME" \
  --image "$IMAGE_NAME"

LATEST_IMAGE=$(aws lightsail get-container-images \
  --service-name "$SERVICE_NAME" \
  --region "$AWS_REGION" \
  --output json | jq -r '.containerImages | sort_by(.createdAt) | reverse | .[0].image')

if [[ -z "$LATEST_IMAGE" || "$LATEST_IMAGE" == "null" ]]; then
  echo -e "${RED}❌ Could not find the uploaded image. Aborting.${NC}"
  exit 1
fi
echo -e "${GREEN}      ✅ Pushed as: $LATEST_IMAGE${NC}"
echo ""

# ---- 4. Parse environment variables -------------------------
echo -e "${YELLOW}[4/5] Loading environment variables from $ENV_FILE...${NC}"
ENV_JSON=$(
  grep -v '^\s*#' "$ENV_FILE" | grep '=' | while IFS='=' read -r key rest; do
    key=$(echo "$key" | xargs)
    value=$(echo "$rest" | xargs | sed 's/^"//;s/"$//')
    [[ -n "$key" ]] && printf '"%s": "%s",' "$key" "$value"
  done | sed 's/,$//'
)
ENV_JSON="{${ENV_JSON}}"
echo -e "${GREEN}      ✅ Loaded env vars.${NC}"
echo ""

# ---- 5. Deploy ----------------------------------------------
echo -e "${YELLOW}[5/5] Ready to deploy:${NC}"
echo "      Image   : $LATEST_IMAGE"
echo "      Service : $SERVICE_NAME ($AWS_REGION)"
echo ""
read -p "      🚀 Proceed with deployment? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  CONTAINERS_JSON=$(jq -n \
    --arg name "$CONTAINER_NAME" \
    --arg image "$LATEST_IMAGE" \
    --argjson env "$ENV_JSON" \
    '{
      ($name): {
        image: $image,
        ports: { "3000": "HTTP" },
        environment: $env
      }
    }')

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

  aws lightsail create-container-service-deployment \
    --service-name "$SERVICE_NAME" \
    --containers "$CONTAINERS_JSON" \
    --public-endpoint "$PUBLIC_ENDPOINT_JSON" \
    --region "$AWS_REGION" > /dev/null

  echo ""
  echo -e "${GREEN}✅ Deployment triggered! It takes 3–5 minutes to go live.${NC}"
  echo ""
  echo -e "${YELLOW}🔍 Monitor status:${NC}"
  echo "   aws lightsail get-container-service-deployments --service-name $SERVICE_NAME --region $AWS_REGION"
  echo ""
  echo -e "${YELLOW}🌐 Your app URL:${NC}"
  APP_URL=$(aws lightsail get-container-services \
    --region "$AWS_REGION" \
    --service-name "$SERVICE_NAME" \
    --query 'containerServices[0].url' \
    --output text 2>/dev/null)
  echo "   $APP_URL"
  echo ""
  echo -e "${YELLOW}⚠️  Don't forget:${NC}"
  echo "   1. Update NEXTAUTH_URL in .env.production to: $APP_URL"
  echo "   2. Add $APP_URL to Google OAuth authorized redirect URIs"
  echo "      → https://console.cloud.google.com/apis/credentials"
  echo ""
else
  echo "Deployment cancelled."
fi
