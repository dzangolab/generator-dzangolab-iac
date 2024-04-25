# 1.0.0-rc2 (2024-04-25)


### Bug Fixes

* add consistent 'ip' output for do reserved ip and aws eip b50719b
* **ansible:** update ssh-keys playbook 7b53650
* **aws/ebs:** fix aws ebs generator 46633b6
* **aws/ebs:** fix aws ebs generator default config 2c0cbc0
* **aws/ebs:** fix output for aws/ebs generator 7fc9605
* **aws/route53:** fix AWS route 53 generator b12a110
* **aws/swarm-leader:** fix aws swarm leader generator a5e766a
* **aws/swarm-leader:** fix aws swarm leader generator 368e778
* **aws/swarm-leader:** update default stack configs 8ca2037
* **aws/vpc:** fix vpc dns attributes a49857a


### Features

* **aws/ebs:** add aws ebs generator 68978e4
* **aws/ebs:** add aws ebs generator 2889d44
* **aws/route53:** add aws route53 generator 6a974b2
* update ansible generators bec35cc



# 1.0.0-rc1 (2024-04-15)


### Bug Fixes

* **ansible:** add gitignore for ansible generator fcfddd7
* **aws-credentials:** store do database cluster passwords in aws secrets 6cc4b8b
* **aws-ecr:** fix default stack config e4f0664
* **aws-ecr:** remove dotenv 455e8b7
* **aws/ecr:** add gitignore and .env.example to aws ecr generator ca3ab02
* **aws/swarm-leader:** fi dependencies for AWS Docker swarm leader generator d2fa991
* **digitalocean/do-swarm-leader:** add support for custom path to ssh keys folder c88d3a5
* **digitalocean/ssh-keys:** update ssh keys  generator b070718
* **do-resources:** export vpc ip range 58d7003
* **do-resources:** fix do-resources generator 483933e
* **do-swarm-leader:** update generator to output droplet name 02a7fbc
* fix digitalocean generators 0250e36
* fix misc typos b271877
* update do ssh-keys generator default stack config ecc3ace


### Features

* add aws instance profile generator 2ae9f69
* add aws-gitub-identity-provider generator 5e2c972
* add cloudflare-dns generator e7c0567
* add do-ssh-keys generator 2f54102
* add do-swarm-leader generator cca19ee
* add logic to run the selected generator ea84fdc
* add ssh-key folder generator d6a71b8
* **ansible:** add ansible generator ec78acd
* **aws-credentials:** add aws-credentials generator df5f7ec
* **aws-ecr:** add aws-ecr generator 440b385
* **aws-resources:** add aws-resources generator 95c5bc1
* **aws/docker-swarm-leader:** add AWS Docker swarm leader generator bc28c9b
* **aws/instasnce-profile:** add aws instance profile generator 225fa69
* **aws/swrm-leader:** add cloud config template for aws swarm leader generator 22213c4
* **aws:** add aws-eip generator 2b4aa95
* **do-database-cluster:** add do-database-cluster generator e89f611
* **do-swarm-leader:**  init docker swarm 79508bb
* update main generator f63782d



