#!/usr/bin/env bash
##############################################################################
# setup-master.sh – Run ONLY on the designated master / control-plane EC2
#
# What this does:
#   1. Runs kubeadm init with the pod CIDR Weave CNI expects
#   2. Configures kubectl for the ubuntu user
#   3. Installs Weave Net CNI plugin
#   4. Prints the worker join command
#
# Prerequisites:
#   • setup-node.sh has already been run on this machine
#   • This script is run as root (sudo ./setup-master.sh)
#   • Replace MASTER_IP below with this instance's PRIVATE IP
##############################################################################

set -euo pipefail

# ── Customise these ──────────────────────────────────────────────────────────
MASTER_IP="$(hostname -I | awk '{print $1}')"   # auto-detects private IP
POD_CIDR="10.244.0.0/16"                        # Weave Net default
# ────────────────────────────────────────────────────────────────────────────

echo "──────────────────────────────────────────────"
echo "  Elite.Pay – Master Node Setup"
echo "  Master IP : ${MASTER_IP}"
echo "  Pod CIDR  : ${POD_CIDR}"
echo "──────────────────────────────────────────────"

### 1. kubeadm init ############################################################
echo "[1/4] Running kubeadm init..."
kubeadm init \
  --apiserver-advertise-address="${MASTER_IP}" \
  --pod-network-cidr="${POD_CIDR}" \
  --cri-socket="unix:///var/run/containerd/containerd.sock" \
  --upload-certs

echo "kubeadm init complete."

### 2. Set up kubectl for the ubuntu user ######################################
echo "[2/4] Configuring kubectl for the 'ubuntu' user..."
KUBE_HOME=/home/ubuntu
mkdir -p "${KUBE_HOME}/.kube"
cp -i /etc/kubernetes/admin.conf "${KUBE_HOME}/.kube/config"
chown -R ubuntu:ubuntu "${KUBE_HOME}/.kube"

# Also configure for root (useful during setup)
export KUBECONFIG=/etc/kubernetes/admin.conf
echo "export KUBECONFIG=/etc/kubernetes/admin.conf" >> /root/.bashrc

echo "kubectl configured."

### 3. Install Weave Net CNI ###################################################
echo "[3/4] Installing Weave Net CNI..."
# Weave Net 2.8.x – works with k8s 1.29
kubectl apply -f \
  "https://github.com/weaveworks/weave/releases/download/v2.8.1/weave-daemonset-k8s.yaml"

echo "Weave Net CNI installed."
echo "Waiting 30 s for CNI pods to initialise..."
sleep 30
kubectl -n kube-system get pods -l name=weave-net

### 4. Print the join command ##################################################
echo ""
echo "[4/4] Worker node join command:"
echo "══════════════════════════════════════════════"
JOIN_CMD=$(kubeadm token create --print-join-command)
echo "  ${JOIN_CMD}"
echo "══════════════════════════════════════════════"
echo ""
echo "Copy the line above and run it (with sudo) on each of the 4 worker nodes."
echo ""
echo "After joining, label the worker nodes from the MASTER:"
echo ""
echo "  # List nodes:"
echo "  kubectl get nodes"
echo ""
echo "  # Replace <worker-node-name> with the actual node name from above"
echo "  kubectl label node <worker-node-1> role=mongo"
echo "  kubectl label node <worker-node-2> role=backend"
echo "  kubectl label node <worker-node-3> role=backend"
echo "  kubectl label node <worker-node-4> role=frontend"
echo ""
echo "Then run:  ./deploy.sh"
