#!/usr/bin/env bash
##############################################################################
# deploy.sh – Apply all Elite.Pay Kubernetes manifests in the correct order,
#             waiting for each workload to become ready before proceeding.
#
# Run from the MASTER node after:
#   1. All worker nodes have joined the cluster
#   2. Nodes have been labelled (role=mongo, role=backend, role=frontend)
#   3. Docker images have been pushed to your registry
#   4. k8s/secret.yaml has been populated with real base64-encoded values
#
# Usage:
#   chmod +x deploy.sh && ./deploy.sh
##############################################################################

set -euo pipefail

K8S_DIR="$(cd "$(dirname "$0")/k8s" && pwd)"
NAMESPACE="elite-pay"

# Timeout (seconds) for each kubectl wait call
WAIT_TIMEOUT=300

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[deploy] $*${NC}"; }
ok()   { echo -e "${GREEN}[deploy] ✔  $*${NC}"; }
fail() { echo -e "${RED}[deploy] ✗  $*${NC}"; exit 1; }

##############################################################################
log "Verifying cluster connectivity..."
kubectl cluster-info > /dev/null 2>&1 || fail "Cannot reach cluster. Check KUBECONFIG."
ok "Cluster reachable."

##############################################################################
log "Step 1/5 – Applying Namespace..."
kubectl apply -f "${K8S_DIR}/namespace.yaml"
ok "Namespace '${NAMESPACE}' ready."

##############################################################################
log "Step 2/5 – Applying Secret..."
kubectl apply -f "${K8S_DIR}/secret.yaml"
ok "Secret applied."

##############################################################################
log "Step 3/5 – Deploying MongoDB StatefulSet..."
kubectl apply -f "${K8S_DIR}/mongo-statefulset.yaml"

log "  Waiting for MongoDB StatefulSet to have 1/1 ready pod (timeout ${WAIT_TIMEOUT}s)..."
kubectl rollout status statefulset/mongo \
  -n "${NAMESPACE}" \
  --timeout="${WAIT_TIMEOUT}s"
ok "MongoDB is ready."

##############################################################################
log "Step 4/5 – Deploying Backend..."
kubectl apply -f "${K8S_DIR}/backend-deployment.yaml"

log "  Waiting for backend Deployment to have 2/2 ready pods (timeout ${WAIT_TIMEOUT}s)..."
kubectl rollout status deployment/elite-pay-backend \
  -n "${NAMESPACE}" \
  --timeout="${WAIT_TIMEOUT}s"
ok "Backend is ready."

##############################################################################
log "Step 5/5 – Deploying Frontend..."
kubectl apply -f "${K8S_DIR}/frontend-deployment.yaml"

log "  Waiting for frontend Deployment to have 2/2 ready pods (timeout ${WAIT_TIMEOUT}s)..."
kubectl rollout status deployment/elite-pay-frontend \
  -n "${NAMESPACE}" \
  --timeout="${WAIT_TIMEOUT}s"
ok "Frontend is ready."

##############################################################################
echo ""
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀  Elite.Pay deployed successfully!        ${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"

echo ""
log "Current pod status:"
kubectl get pods -n "${NAMESPACE}" -o wide

echo ""
log "Services (NodePorts):"
kubectl get svc -n "${NAMESPACE}"

echo ""
# Grab the first worker node's external IP to print the access URL
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[1].status.addresses[?(@.type=="ExternalIP")].address}' 2>/dev/null || echo "<your-worker-node-ip>")
echo -e "${CYAN}Access the app:${NC}"
echo "  Frontend  →  http://${NODE_IP}:30080"
echo "  Backend   →  http://${NODE_IP}:30300/health"
echo "  MongoDB   →  ${NODE_IP}:30017  (internal use only)"
