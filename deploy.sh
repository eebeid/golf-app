#!/bin/bash
# =============================================================
# PinPlaced — AWS Lightsail Deployment Script
# Usage: ./deploy.sh
# =============================================================

set -e  # Exit on any error

# ── Colors ────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Config ────────────────────────────────────────────────────
SERVICE_NAME="pinplaced-service"
REGION="us-east-1"
CONTAINER_NAME="pinplaced"
IMAGE_LABEL="pinplaced"
PORT=3000

# ── Helpers ───────────────────────────────────────────────────
info()    { echo -e "${CYAN}${BOLD}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}${BOLD}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}${BOLD}[WARN]${NC} $1"; }
error()   { echo -e "${RED}${BOLD}[ERR]${NC}  $1"; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}══════════════════════════════════════${NC}"; echo -e "${BOLD}  $1${NC}"; echo -e "${BOLD}${CYAN}══════════════════════════════════════${NC}"; }

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ██████╗ ██╗███╗   ██╗██████╗ ██╗      █████╗  ██████╗███████╗██████╗ "
echo "  ██╔══██╗██║████╗  ██║██╔══██╗██║     ██╔══██╗██╔════╝██╔════╝██╔══██╗"
echo "  ██████╔╝██║██╔██╗ ██║██████╔╝██║     ███████║██║     █████╗  ██║  ██║"
echo "  ██╔═══╝ ██║██║╚██╗██║██╔═══╝ ██║     ██╔══██║██║     ██╔══╝  ██║  ██║"
echo "  ██║     ██║██║ ╚████║██║     ███████╗██║  ██║╚██████╗███████╗██████╔╝"
echo "  ╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝     ╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚═════╝ "
echo -e "${NC}"
echo -e "  ${YELLOW}⛳ Production Deployment → AWS Lightsail${NC}"
echo ""

# ─────────────────────────────────────────────────────────────
step "Step 1/5: Checking Prerequisites"

# Check Docker
if ! command -v docker &> /dev/null; then
    error "Docker is not installed or not running. Please start Docker Desktop."
fi
success "Docker is available"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    error "AWS CLI is not installed. Run: brew install awscli"
fi
success "AWS CLI is available"

# Check AWS credentials
if ! aws sts get-caller-identity --region $REGION &> /dev/null; then
    error "AWS credentials not configured. Run: aws configure"
fi
success "AWS credentials are valid"

# ─────────────────────────────────────────────────────────────
step "Step 2/5: Pushing Database Schema"

# Source environment variables for Prisma
if [ -f .env.prod ]; then
    info "Loading environment variables from .env.prod..."
    set -a
    source .env.prod
    set +a
elif [ -f .env ]; then
    info "Loading environment variables from .env..."
    set -a
    source .env
    set +a
fi

info "Running prisma db push to sync schema..."
if npx prisma db push 2>&1; then
    success "Database schema is up to date"
else
    warn "prisma db push had issues — trying to clear cache and retry..."
    rm -rf ~/.cache/prisma 2>/dev/null || true
    if npx prisma db push 2>&1; then
        success "Database schema synced after cache clear"
    else
        error "Database push failed. Check your DATABASE_URL and try manually: npx prisma db push"
    fi
fi

# ─────────────────────────────────────────────────────────────
step "Step 3/5: Building Docker Image"

info "Building Docker image: ${IMAGE_LABEL}:latest"
info "This may take 5–10 minutes on first build..."

if docker build -t ${IMAGE_LABEL}:latest . ; then
    success "Docker image built successfully"
else
    error "Docker build failed. Check the output above for errors."
fi

# ─────────────────────────────────────────────────────────────
step "Step 4/5: Pushing Image to AWS Lightsail"

info "Pushing image to Lightsail service: ${SERVICE_NAME}"
PUSH_OUTPUT=$(aws lightsail push-container-image \
    --region $REGION \
    --service-name $SERVICE_NAME \
    --label $IMAGE_LABEL \
    --image ${IMAGE_LABEL}:latest 2>&1)

echo "$PUSH_OUTPUT"

# Extract the image tag from output (e.g., ":pinplaced.pinplaced.5")
IMAGE_TAG=$(echo "$PUSH_OUTPUT" | grep -o ":${SERVICE_NAME}\.[a-zA-Z0-9._-]*" | tail -1)

if [ -z "$IMAGE_TAG" ]; then
    error "Could not extract image tag from push output. Check the output above."
fi

success "Image pushed with tag: ${IMAGE_TAG}"

# ─────────────────────────────────────────────────────────────
step "Step 5/5: Deploying to Lightsail"

info "Deploying container with image tag: ${IMAGE_TAG}"

# Read local .env.prod or .env and inject it directly into Lightsail
info "Building container payload with variables from local .env file..."
CONTAINERS_JSON=$(python3 -c "
import json, os

env_file = '.env.prod' if os.path.exists('.env.prod') else '.env'
current_env = {}

try:
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                val = val.strip()
                # Strip quotes if present
                if (val.startswith('\"') and val.endswith('\"')) or (val.startswith(\"'\") and val.endswith(\"'\")):
                    val = val[1:-1]
                current_env[key.strip()] = val
except Exception as e:
    print('Error reading env file:', e)

current_env['NODE_ENV'] = 'production'
current_env['PORT'] = '$PORT'

payload = {
    '$CONTAINER_NAME': {
        'image': '$IMAGE_TAG',
        'ports': { '$PORT': 'HTTP' },
        'environment': current_env
    }
}
print(json.dumps(payload))
")

PUBLIC_ENDPOINT_JSON=$(cat <<EOF
{
  "containerName": "${CONTAINER_NAME}",
  "containerPort": ${PORT},
  "healthCheck": {
    "healthyThreshold": 2,
    "unhealthyThreshold": 5,
    "timeoutSeconds": 10,
    "intervalSeconds": 60,
    "path": "/",
    "successCodes": "200-499"
  }
}
EOF
)

aws lightsail create-container-service-deployment \
    --region $REGION \
    --service-name $SERVICE_NAME \
    --containers "$CONTAINERS_JSON" \
    --public-endpoint "$PUBLIC_ENDPOINT_JSON" \
    --output text > /dev/null

success "Deployment triggered!"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ⛳ Deployment Complete!${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}Image Tag:${NC}  ${IMAGE_TAG}"
echo -e "  ${CYAN}Service:${NC}    ${SERVICE_NAME}"
echo -e "  ${CYAN}Region:${NC}     ${REGION}"
echo ""
echo -e "  ${YELLOW}📋 Monitor deployment progress:${NC}"
echo -e "  https://lightsail.aws.amazon.com/ls/webapp/us-east-1/container-services/${SERVICE_NAME}/deployments"
echo ""
echo -e "  ${YELLOW}⏳ Your site will be live in ~3-5 minutes at:${NC}"
echo -e "  ${BOLD}https://pinplaced.com${NC}"
echo ""
