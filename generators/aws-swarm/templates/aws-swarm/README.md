WIP:

Projects:
"ansible-aws",
"aws-bastion",
"aws-credentials",
"aws-ebs",
"aws-eip", or if LB used: "aws-load-balancer-eip",
"nfs-instance-profile",
"aws-load-balancer",
"manager-instance-profile",
"worker-instance-profile",
"aws-resources",
"aws-security-groups",
"aws-swarm-leader",
"aws-swarm-managers",
"aws-swarm-workers",
"aws-swarm-tokens",
"aws-vpc",

pulumi up order:

1) any order:
aws-vpc
aws-ressources
manager-instance-profile
worker-instance-profile
if use nfs: nfs-instance-profile
aws-ebs
aws-eip

2) any order:
aws-credentials
aws-security-groups
if use Lb: aws-load-balancer

3) specific order:
if use bastion: aws-bastion
aws-swarm-leader
aws-swarm-tokens
aws-swarm-managers

4) pulumi destroy aws-swarm-leader

5) 
aws-swarm-workers

6) update aws-ansible inventory and variables