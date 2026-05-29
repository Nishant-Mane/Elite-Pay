# Elite.Pay – Complete Kubernetes Deployment Guide

> **Goal:** Self-managed 5-node Kubernetes cluster on AWS EC2 (Ubuntu 22.04),
> provisioned with kubeadm, running the Elite.Pay stack
> (MongoDB, Node/Express backend, React/Vite/Nginx frontend).

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [AWS – Launch 5 EC2 Instances](#2-aws--launch-5-ec2-instances)
3. [Security Group Rules](#3-security-group-rules)
4. [Step 0 – Build & Push Docker Images](#4-step-0--build--push-docker-images)
5. [Step 1 – Bootstrap Every Node](#5-step-1--bootstrap-every-node)
6. [Step 2 – Initialise the Master Node](#6-step-2--initialise-the-master-node)
7. [Step 3 – Join the Worker Nodes](#7-step-3--join-the-worker-nodes)
8. [Step 4 – Label the Worker Nodes](#8-step-4--label-the-worker-nodes)
9. [Step 5 – Populate Secrets](#9-step-5--populate-secrets)
10. [Step 6 – Deploy the Application](#10-step-6--deploy-the-application)
11. [Accessing the App via NodePort](#11-accessing-the-app-via-nodeport)
12. [Verifying the Cluster](#12-verifying-the-cluster)
13. [Troubleshooting](#13-troubleshooting)
14. [Teardown](#14-teardown)

---

## 1. Architecture Overview

```
+------------------------------------------------------------------+
|                    AWS Region (e.g. ap-south-1)                  |
|                                                                   |
|  +---------------+   +----------------------------------------+  |
|  |   MASTER      |   |               WORKERS                  |  |
|  |  (Control     |   |  +----------+   +----------+           |  |
|  |   Plane)      |   |  | worker-1 |   | worker-2 |           |  |
|  |  t3.medium    |   |  | role=    |   | role=    |           |  |
|  |               |   |  | mongo    |   | backend  |           |  |
|  |  kubeadm +    |   |  +----------+   +----------+           |  |
|  |  WeaveNet     |   |  +----------+   +----------+           |  |
|  +---------------+   |  | worker-3 |   | worker-4 |           |  |
|                       |  | role=    |   | role=    |           |  |
|                       |  | backend  |   | frontend |           |  |
|                       |  +----------+   +----------+           |  |
|                       +----------------------------------------+  |
+------------------------------------------------------------------+

NodePort access:
  :30080  -> Frontend (React / Nginx)
  :30300  -> Backend  (Express API)
  :30017  -> MongoDB  (cluster-internal, avoid exposing externally)
```

| Node     | Instance Type | Workload              | k8s Label     |
|----------|---------------|-----------------------|---------------|
| master   | t3.medium     | Control plane only    | —             |
| worker-1 | t3.medium     | MongoDB StatefulSet   | role=mongo    |
| worker-2 | t3.medium     | Backend Deployment    | role=backend  |
| worker-3 | t3.medium     | Backend Deployment    | role=backend  |
| worker-4 | t3.medium     | Frontend Deployment   | role=frontend |

---

## 2. AWS – Launch 5 EC2 Instances

### 2.1 Open the EC2 Console

AWS Console → **EC2** → **Launch Instance**

### 2.2 Settings for EACH instance (repeat 5 times)

| Setting | Value |
|---|---|
| **AMI** | Ubuntu Server 22.04 LTS (HVM), SSD Volume Type |
| **Instance type** | `t3.medium` (2 vCPU, 4 GB RAM) |
| **Key pair** | Create or reuse an existing `.pem` key pair |
| **VPC / Subnet** | Same VPC and same subnet/AZ for all 5 nodes |
| **Auto-assign public IP** | **Enabled** (needed to pull images) |
| **Security Group** | `elite-pay-k8s-sg` — see Section 3 |
| **Root Volume** | 20 GB gp3 SSD |
| **Extra volume (worker-1 only)** | 30 GB gp3 (for MongoDB data) |

> **Name tags:** `elite-pay-master`, `elite-pay-worker-1` … `elite-pay-worker-4`

### 2.3 Note the Private IPs

After launch, open each instance and **record its private IPv4 address**.
You need the master's private IP when running `kubeadm init`.

---

## 3. Security Group Rules

Create **one** security group named `elite-pay-k8s-sg` and attach it to all 5 instances.

### Inbound

| Port / Range  | Protocol | Source            | Purpose                        |
|---------------|----------|-------------------|--------------------------------|
| 22            | TCP      | Your IP           | SSH                            |
| 6443          | TCP      | SG self-reference | Kubernetes API server          |
| 2379-2380     | TCP      | SG self-reference | etcd                           |
| 10250         | TCP      | SG self-reference | kubelet API                    |
| 10251         | TCP      | SG self-reference | kube-scheduler                 |
| 10252         | TCP      | SG self-reference | kube-controller-manager        |
| 6783          | TCP      | SG self-reference | Weave Net control              |
| 6783          | UDP      | SG self-reference | Weave Net data                 |
| 30000-32767   | TCP      | 0.0.0.0/0         | NodePort range (user access)   |
| All traffic   | All      | SG self-reference | Pod-to-pod intra-cluster       |

> **SG self-reference** = select the security group itself as the source, so every instance in the group can communicate freely with every other.

### Outbound
Allow **All traffic** to `0.0.0.0/0`.

---

## 4. Step 0 – Build & Push Docker Images

Run on your **local development machine**.

### 4.1 Create DockerHub repositories (one-time)

Log in to [hub.docker.com](https://hub.docker.com) and create:
- `<your-username>/elite-pay-backend`
- `<your-username>/elite-pay-frontend`

### 4.2 Build and push

```bash
docker login

# --- Backend ---
cd backend/
docker build -t <your-username>/elite-pay-backend:latest .
docker push <your-username>/elite-pay-backend:latest

# --- Frontend ---
cd ../frontend/
docker build \
  --build-arg VITE_API_BASE_URL=/api \
  -t <your-username>/elite-pay-frontend:latest .
docker push <your-username>/elite-pay-frontend:latest
```

### 4.3 Update the k8s manifests

In `k8s/backend-deployment.yaml` replace:
```yaml
image: your-dockerhub-username/elite-pay-backend:latest
```
with your real username. Repeat for `k8s/frontend-deployment.yaml`.

---

## 5. Step 1 – Bootstrap Every Node

Run `setup-node.sh` on **all 5 instances** (master + 4 workers).

```bash
# From your local machine, copy the script to each node:
scp -i your-key.pem setup-node.sh ubuntu@<node-public-ip>:~

# SSH into the node:
ssh -i your-key.pem ubuntu@<node-public-ip>

# Execute:
chmod +x setup-node.sh
sudo ./setup-node.sh
```

**What the script does:**
1. Turns off swap (`swapoff -a` + edits `/etc/fstab`)
2. Loads `overlay` + `br_netfilter` kernel modules permanently
3. Sets `net.ipv4.ip_forward=1`, bridge netfilter sysctl params
4. Installs **containerd** from the Docker apt repo, configures `SystemdCgroup = true`
5. Installs **kubeadm / kubelet / kubectl** v1.29 via the Kubernetes apt repo
6. Pins tool versions with `apt-mark hold`
7. Enables the `kubelet` systemd service

---

## 6. Step 2 – Initialise the Master Node

SSH into **`elite-pay-master`** only:

```bash
scp -i your-key.pem setup-master.sh ubuntu@<master-public-ip>:~
ssh -i your-key.pem ubuntu@<master-public-ip>

chmod +x setup-master.sh
sudo ./setup-master.sh
```

**What the script does:**
1. `kubeadm init --apiserver-advertise-address=<private-ip> --pod-network-cidr=10.244.0.0/16`
2. Copies `/etc/kubernetes/admin.conf` → `~ubuntu/.kube/config`
3. Installs **Weave Net** CNI (`kubectl apply -f weave-daemonset.yaml`)
4. Prints the full `kubeadm join` command — **copy this line**

### Verify

```bash
kubectl get nodes
# NAME                 STATUS   ROLES           AGE   VERSION
# elite-pay-master     Ready    control-plane   2m    v1.29.x
```

> Status may show `NotReady` for up to 60 s while Weave Net initialises — this is normal.

---

## 7. Step 3 – Join the Worker Nodes

SSH into **each of the 4 workers** and paste the join command printed in Step 2:

```bash
ssh -i your-key.pem ubuntu@<worker-N-public-ip>

# Paste the full join command, e.g.:
sudo kubeadm join 10.0.1.10:6443 \
  --token abcdef.0123456789abcdef \
  --discovery-token-ca-cert-hash sha256:xxxxxxxx...
```

After joining all 4, verify from the master:

```bash
kubectl get nodes
# NAME                  STATUS   ROLES           AGE   VERSION
# elite-pay-master      Ready    control-plane   5m    v1.29.x
# elite-pay-worker-1    Ready    <none>          2m    v1.29.x
# elite-pay-worker-2    Ready    <none>          2m    v1.29.x
# elite-pay-worker-3    Ready    <none>          2m    v1.29.x
# elite-pay-worker-4    Ready    <none>          1m    v1.29.x
```

> **Token expired?** On the master: `kubeadm token create --print-join-command`

---

## 8. Step 4 – Label the Worker Nodes

Run from the master (replace node names with real names from `kubectl get nodes`):

```bash
kubectl label node elite-pay-worker-1 role=mongo
kubectl label node elite-pay-worker-2 role=backend
kubectl label node elite-pay-worker-3 role=backend
kubectl label node elite-pay-worker-4 role=frontend

# Verify:
kubectl get nodes --show-labels
```

The Kubernetes `nodeSelector` in each manifest uses these labels to pin workloads to the correct machines.

---

## 9. Step 5 – Populate Secrets

> **Never commit real secrets to Git.** `k8s/secret.yaml` ships with placeholder base64 values.

### Recommended approach – imperative `kubectl create`

Run on the master (replace every placeholder):

```bash
kubectl create secret generic elite-pay-secret \
  --namespace elite-pay \
  --from-literal=PORT=3000 \
  --from-literal=MONGO_URI='mongodb://mongo-0.mongo.elite-pay.svc.cluster.local:27017/elitepay' \
  --from-literal=DEVICE_SECRET='your-real-device-secret' \
  --from-literal=RAZORPAY_KEY_ID='rzp_live_XXXXXXXXXXXXXXXX' \
  --from-literal=RAZORPAY_KEY_SECRET='your-real-razorpay-secret' \
  --from-literal=SUPABASE_JWT_SECRET='your-real-supabase-jwt-secret' \
  --from-literal=RPC_URL='https://rpc-amoy.polygon.technology' \
  --from-literal=DEPLOYER_PRIVATE_KEY='your-real-private-key' \
  --from-literal=CONTRACT_ADDRESS='your-deployed-contract-address' \
  --from-literal=ADMIN_SECRET='your-real-admin-secret' \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Alternative – edit secret.yaml

Encode each value with `echo -n 'value' | base64`, paste into `k8s/secret.yaml`, then:
```bash
kubectl apply -f k8s/secret.yaml
```

---

## 10. Step 6 – Deploy the Application

Copy the project to the master (if not already there):

```bash
# From your local machine:
scp -i your-key.pem -r k8s/ deploy.sh ubuntu@<master-public-ip>:~/elite-pay/
```

On the master:

```bash
cd ~/elite-pay
chmod +x deploy.sh
./deploy.sh
```

The script applies manifests in this order, waiting for each to be Ready:

| Order | Manifest                  | Wait condition            |
|-------|---------------------------|---------------------------|
| 1     | `namespace.yaml`          | immediate                 |
| 2     | `secret.yaml`             | immediate                 |
| 3     | `mongo-statefulset.yaml`  | StatefulSet rollout 1/1   |
| 4     | `backend-deployment.yaml` | Deployment rollout 2/2    |
| 5     | `frontend-deployment.yaml`| Deployment rollout 2/2    |

Sample output:
```
[deploy] Step 1/5 – Applying Namespace...
[deploy] ✔  Namespace 'elite-pay' ready.
[deploy] Step 2/5 – Applying Secret...
[deploy] ✔  Secret applied.
[deploy] Step 3/5 – Deploying MongoDB StatefulSet...
[deploy]   Waiting for MongoDB StatefulSet to have 1/1 ready pod (timeout 300s)...
[deploy] ✔  MongoDB is ready.
[deploy] Step 4/5 – Deploying Backend...
...
[deploy] 🚀  Elite.Pay deployed successfully!
```

---

## 11. Accessing the App via NodePort

After `deploy.sh` completes, get **any worker node's public IP** from the EC2 console.

| Service          | URL                                         | Port  |
|------------------|---------------------------------------------|-------|
| **Frontend**     | `http://<any-worker-ip>:30080`              | 30080 |
| **Backend API**  | `http://<any-worker-ip>:30300/health`       | 30300 |
| **MongoDB**      | `<any-worker-ip>:30017` (internal only)     | 30017 |

```bash
# Quick smoke test:
curl http://<worker-public-ip>:30300/health
# {"status":"ok","service":"Elite.Pay API"}

# Then open in browser:
# http://<worker-public-ip>:30080
```

> kube-proxy routes NodePort traffic across all nodes, so any worker's IP works.

---

## 12. Verifying the Cluster

```bash
# All pods (with node placement)
kubectl get pods -n elite-pay -o wide

# Services and NodePorts
kubectl get svc -n elite-pay

# StatefulSet status
kubectl get statefulset -n elite-pay

# Deployments
kubectl get deployments -n elite-pay

# Real-time logs
kubectl logs -n elite-pay -l app=elite-pay-backend --tail=50 -f
kubectl logs -n elite-pay -l app=elite-pay-frontend --tail=50
kubectl logs -n elite-pay mongo-0 --tail=50

# Detailed events (use for debugging)
kubectl describe pod -n elite-pay <pod-name>
```

---

## 13. Troubleshooting

### Pod stuck in `Pending`
```bash
kubectl describe pod -n elite-pay <pod-name>
# → Look for "Events:" — usually a nodeSelector mismatch
kubectl get nodes --show-labels | grep role

# Fix a label:
kubectl label node <node-name> role=<correct-role> --overwrite
```

### Backend `CrashLoopBackOff`
```bash
kubectl logs -n elite-pay <backend-pod> --previous
# Common causes:
# 1. Wrong MONGO_URI — must be:
#    mongodb://mongo-0.mongo.elite-pay.svc.cluster.local:27017/elitepay
# 2. Bad base64 in secret.yaml — recreate with the imperative command above
```

### Weave Net pods not starting
```bash
kubectl get pods -n kube-system -l name=weave-net
kubectl describe pod -n kube-system weave-net-<hash>
# Ensure TCP+UDP port 6783 is open between nodes in the SG
```

### `kubeadm join` token expired
```bash
# On master:
kubeadm token create --print-join-command
```

### Node shows `NotReady`
```bash
kubectl describe node <node-name>
# On that worker:
sudo systemctl status kubelet
sudo journalctl -u kubelet -n 50 --no-pager
```

### Re-deploy after pushing a new image
```bash
kubectl rollout restart deployment/elite-pay-backend -n elite-pay
kubectl rollout restart deployment/elite-pay-frontend -n elite-pay
kubectl rollout status  deployment/elite-pay-backend -n elite-pay
```

---

## 14. Teardown

```bash
# Delete just the app (keep cluster running)
kubectl delete namespace elite-pay

# Reset a single worker (run ON that worker node)
sudo kubeadm reset -f
sudo rm -rf /etc/cni/net.d /var/lib/kubelet ~/.kube
sudo iptables -F && sudo iptables -t nat -F
# Then from master:
kubectl delete node <worker-node-name>

# Full cluster teardown
# On master AND each worker:
sudo kubeadm reset -f
# Then terminate all 5 EC2 instances from the AWS Console
```

---

## File Reference

```
Elite-Pay-main/
├── backend/
│   └── Dockerfile                # Node.js/Express production image
├── frontend/
│   ├── Dockerfile                # Multi-stage: Vite build -> Nginx
│   └── nginx.conf                # Nginx: SPA serving + /api proxy
├── k8s/
│   ├── namespace.yaml            # Namespace: elite-pay
│   ├── secret.yaml               # All backend env vars (REPLACE VALUES)
│   ├── mongo-statefulset.yaml    # MongoDB + headless svc + NodePort + PVC
│   ├── backend-deployment.yaml   # Backend x2 replicas + NodePort :30300
│   └── frontend-deployment.yaml  # Frontend x2 replicas + NodePort :30080
├── setup-node.sh                 # Run on ALL 5 nodes first
├── setup-master.sh               # Run on master only
├── deploy.sh                     # Apply all manifests in order
└── README-k8s.md                 # This file
```
