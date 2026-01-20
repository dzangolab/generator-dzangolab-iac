# AWS Infrastructure Deployment (WIP)

This repository contains multiple **Pulumi projects** used to provision and manage AWS resources for a Docker Swarm environment.  
Each subproject is responsible for a specific part of the infrastructure.

---

## Projects

| Project | Description |
|----------|--------------|
| `ansible-aws` | Ansible configuration and inventory for AWS instances |
| `aws-bastion` | Optional bastion host for secure SSH access |
| `aws-credentials` | Stores and manages AWS credentials for other stacks |
| `aws-ebs` | Manages Elastic Block Storage (EBS) volumes |
| `aws-eip` / `aws-load-balancer-eip` | Allocates Elastic IPs (EIPs) or EIPs for load balancers |
| `aws-load-balancer` | Provisions the AWS Load Balancer (if used) |
| `aws-resources` | Defines shared AWS resources used across stacks |
| `aws-security-groups` | Manages all required security groups |
| `aws-swarm-leader` | Provisions the initial Swarm leader node |
| `aws-swarm-managers` | Provisions additional Swarm manager nodes |
| `aws-swarm-workers` | Provisions Swarm worker nodes |
| `aws-swarm-tokens` | Stores Docker Swarm join tokens as Pulumi secrets |
| `aws-vpc` | Creates the Virtual Private Cloud (VPC) and networking components |
| `manager-instance-profile` | IAM profile for Swarm manager instances |
| `nfs-instance-profile` | IAM profile for NFS instances (if used) |
| `worker-instance-profile` | IAM profile for Swarm worker instances |

---

## 🚀 Deployment Order (Pulumi Up)

To correctly deploy the full infrastructure, follow the order below.

### 1️⃣ Initial Setup (any order)
- `aws-ebs`
- `aws-eip`
- `aws-resources`
- `aws-vpc`
- `manager-instance-profile`
- `worker-instance-profile`
- `nfs-instance-profile` *(only if using NFS)*

### 2️⃣ Network & Security (any order)
- `aws-credentials`
- `aws-load-balancer` *(only if using Load Balancer)*
- `aws-security-groups`

### 3️⃣ Core Swarm Setup (specific order)
1. `aws-bastion` *(only if using Bastion)*
2. `aws-nfs-server` *(only if using Nfs)*
3. `aws-swarm-leader`
4. `aws-swarm-tokens`
5. `aws-swarm-managers`

### 4️⃣ Cleanup Step
Run:
```bash
pulumi destroy aws-swarm-leader
```

### 5️⃣ Worker Nodes
Deploy the Swarm worker nodes:

```bash
pulumi up aws-swarm-workers
```

### 6️⃣ Final Step

Update your Ansible inventory and variables to reflect the newly created infrastructure.