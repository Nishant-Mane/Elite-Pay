#!/usr/bin/env bash
##############################################################################
# setup-node.sh – Run on EVERY EC2 Ubuntu 22.04 instance (worker AND master)
#
# What this does:
#   1. Disables swap (k8s requirement)
#   2. Loads required kernel modules (overlay, br_netfilter)
#   3. Sets sysctl params for pod networking
#   4. Installs containerd as the container runtime
#   5. Installs kubeadm, kubelet, kubectl (pinned to 1.29)
#   6. Enables and starts kubelet
#
# Usage:
#   chmod +x setup-node.sh && sudo ./setup-node.sh
##############################################################################

set -euo pipefail

K8S_VERSION="1.29"
KUBE_TOOLS_VERSION="1.29.0-1.1"   # adjust to latest patch if needed

echo "──────────────────────────────────────────────"
echo "  Elite.Pay – Node Bootstrap"
echo "  Kubernetes ${K8S_VERSION} | containerd"
echo "──────────────────────────────────────────────"

### 1. Disable swap ############################################################
echo "[1/6] Disabling swap..."
swapoff -a
# Comment out any swap lines in /etc/fstab so it stays off after reboot
sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
echo "Swap disabled."

### 2. Load kernel modules #####################################################
echo "[2/6] Loading kernel modules..."
cat <<EOF | tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter
echo "Kernel modules loaded."

### 3. Sysctl params ###########################################################
echo "[3/6] Applying sysctl params..."
cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sysctl --system
echo "Sysctl params applied."

### 4. Install containerd ######################################################
echo "[4/6] Installing containerd..."
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release

# Docker's official GPG key (containerd packages live here)
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker apt repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y containerd.io

# Configure containerd to use systemd cgroup driver
mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml > /dev/null
# Switch cgroup driver from cgroupfs → systemd (required by kubeadm)
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml

systemctl restart containerd
systemctl enable containerd
echo "containerd installed and configured."

### 5. Install kubeadm, kubelet, kubectl #######################################
echo "[5/6] Installing kubeadm, kubelet, kubectl (v${K8S_VERSION})..."
apt-get install -y apt-transport-https

# Kubernetes apt repository (v1.29)
curl -fsSL "https://pkgs.k8s.io/core:/stable:/v${K8S_VERSION}/deb/Release.key" \
  | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \
  https://pkgs.k8s.io/core:/stable:/v${K8S_VERSION}/deb/ /" \
  | tee /etc/apt/sources.list.d/kubernetes.list

apt-get update -y
apt-get install -y \
  "kubelet=${KUBE_TOOLS_VERSION}" \
  "kubeadm=${KUBE_TOOLS_VERSION}" \
  "kubectl=${KUBE_TOOLS_VERSION}"

# Pin versions so apt upgrade doesn't break the cluster
apt-mark hold kubelet kubeadm kubectl
echo "kubeadm / kubelet / kubectl installed."

### 6. Enable kubelet ##########################################################
echo "[6/6] Enabling kubelet..."
systemctl enable --now kubelet
echo "kubelet enabled."

echo ""
echo "══════════════════════════════════════════════"
echo "  Node bootstrap complete!"
echo "  → On the MASTER node, run: sudo ./setup-master.sh"
echo "  → On WORKER nodes, run the kubeadm join command"
echo "    printed by setup-master.sh"
echo "══════════════════════════════════════════════"
