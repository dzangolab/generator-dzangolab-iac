## 1.0.0-rc21 (2025-03-29)

* feat(pulumi-s3-backend): fix stack config template and docs (#86) 5a15325, closes #86



## 1.0.0-rc20 (2025-03-29)

* fix(pulumi-s3-backend): fix project name in generated stack config (#84) c52b761, closes #84



## 1.0.0-rc19 (2025-03-29)

* fix(PulumiGenerator): update template prompting code 3727da3



## 1.0.0-rc18 (2025-03-29)

* feat: add mariadb playbook (#58) ca62248, closes #58
* feat: add support for versions (#81) b37732b, closes #81
* feat(aws/credentials): add support for password-specific constraints (#61) c4d7d86, closes #61
* fix: ansible generator nfs and swarm (#53) c78b9e3, closes #53
* fix: ansible traefik playbook (#55) 94f0e47, closes #55
* fix: fix order options and props (#76) 89d7201, closes #76
* fix: fix swarm playbook (#62) 924d5c5, closes #62
* fix: fixing firewall (#49) 5826a78, closes #49
* fix: leader groups in cloud config (#54) 1f79bee, closes #54
* fix(pulumi-s3-backend): add support for passphrase secrets provider (#51) 4c14af8, closes #51
* fix(pulumi-s3-backend): fix output c75cbb6
* Do ansible (#60) 24ccf27, closes #60
* Do nfs postgres (#56) b634ff1, closes #56
* DO swarm Create new combined generator (#33) ae1509e, closes #33 #47
* chore: adding useNfs variable to swarm leader (#52) 983825b, closes #52



## 1.0.0-rc17 (2025-02-23)

* chore: branch fixing update-do-swarm-workers (#45) d848ce8, closes #45
* chore: update dependencies 619875d
* chore: updated README (#48) 23adf0a, closes #48
* fix(do): fix @pulumi.digitalocean version 2f1a997
* fix(do): fix @pulumi.digitalocean version d26ea65
* fix(do/swarm-workers): fix default count var 5b73f77
* fix(do/swarm-workers): fix default count var dd793f1
* Update do-swarm-leader generator (#43) d21f863, closes #43
* feat: update dependencies 06fcc0d



## 1.0.0-rc16 (2025-02-09)

* chore: changed swarm init move from cloud-config to swarm.yml play (#30) 9ed23cf, closes #30
* chore: update ansible-do generator playbook to use dzangolab ansible collection (#27) 661ec40, closes #27
* chore(do/nfs-server): clean up code (#41) a60f815, closes #41
* docs(do/nfs-server): fix typo d1bf08f
* Do droplet (#35) 95c025d, closes #35
* Do nfs server (#36) fde35e2, closes #36
* Do nfs server (#40) 94f424d, closes #40
* Update pulumi-s3-backend generator to include permissions for other AWS accounts (#32) d1bcfd6, closes #32
* Update README.md 5ff5ec0
* feat: added do-swarm-workers generator (#28) dc99480, closes #28
* feat(do/droplet): add do-droplet generator (#34) cbb8935, closes #34
* feat(do/droplet): add support for packages (#39) f5b3edf, closes #39
* feat(do/nfs-server): add firewall (#37) 9e2293f, closes #37
* fix(aws/swarm-nodes): fix folder name and typo in package.json f0ace6b
* fix(do/nfs-server): fix firewall droplets (#38) 226a63c, closes #38



## 1.0.0-rc15 (2024-09-30)

* fix(ansible/aws): fix ansible aws generator 9a42b06



## 1.0.0-rc14 (2024-09-30)

* fix(ansible/aws): fix ansible aws generator ddf9245



## 1.0.0-rc13 (2024-09-30)

* fix(aws/ansible): fix aws ansible generator 966ebcc



## 1.0.0-rc12 (2024-09-30)

* feat: update dependencies verion 3224784
* feat(aws/ansible): update playbooks 076fa4a
* feat(aws/swarm-leader): update docker config d39f13e
* feat(aws/swarm-leader): update docker config 56a3531
* feat(aws/swarm-nodes): add generator for docker swarm nodes on aws 56cd01e
* fix: misc fixes 0c9162b
* fix(aws/security-group): fix typo bf5e2bd
* fix(aws/vpc): fix config 0e667f1



## 1.0.0-rc11 (2024-09-19)

* chore: fixed code style e63bfac



## 1.0.0-rc10 (2024-09-19)

* chore: fix makefile 7e66780
* fix: fix aws-ecr generator 4c027fd
* fix: fix generators da4fc1b
* fix: fix husky config e80276f
* fix(aws-swarm-leader): fix user data 3ea0b73
* feat: add pulumi-s3-backend generator 8742cba



# [1.0.0-rc9](/compare/v1.0.0-rc7...v1.0.0-rc9) (2024-06-13)


### Bug Fixes

* **aws/eip:** fix name in AWS EIP generator 9393bbc
* **aws/eip:** fix name in AWS EIP generator 34c6a1a
* **aws/security-group:** fix name in AWS security group generator 38045fa
* **aws/swarm-leader:** cleanup code c0160ba
* **aws/swarm-leader:** fix code 5a58f59
* **aws/vpc:** fix AWS VPC generator 774d461
* **cloudflare-dns:** fix generator 0e7bfba
* fix boolean prompts 8a54d0c
* minor fixes 9f215ce



# [1.0.0-rc7](/compare/v1.0.0-rc6...v1.0.0-rc7) (2024-05-07)


### Bug Fixes

* **aws/instance-profile:** fix generator 30bf8f3
* fix generators 6de1235
* fix generators 3f3c45a
* fix generators 4124cf0
* fix generators e2a2b85
* fix generators fd23f90
* fix generators b4b2ee6
* fix generators 08c364d
* fix generators bccfd0f
* fix name stackconfig setting 7f3afc2
* fix name stackconfig setting c1079c3



# [1.0.0-rc6](/compare/v1.0.0-rc5...v1.0.0-rc6) (2024-05-06)


### Bug Fixes

* **aws/ebs:** allow custom name a1437f1
* **aws/s3:** fix s3 generator 90284b3
* **aws/s3:** fixaws security group generator 0b18689
* **aws/s3:** refactor AWS S3 generator a2ea04b
* **aws/s3:** refactor AWS S3 generator 1e849a3
* **aws/ssh-keypairs:** fix typo ee829b8
* **aws/swarm-leader:** allow custom name 32ba922
* **aws/swarm-leader:** fix AWS swarm leader generator 7c08a9a
* **aws/vpc:** update docs for aws vpc generator 9acab6a
* fix aws generators f09535d
* misc minor updates and fixes 39727b3


### Features

* allow prefixed to be ignored for folder names 11e48aa
* **aws/s3:** add aws s3 generator a19b9da
* **aws/ses:** add aws ses generator d95304e
* **gitlab:** add aws-gitlab generator 7364f4f
* **prefix:** convert unsupported characters 683fdae



# [1.0.0-rc5](/compare/v1.0.0-rc4...v1.0.0-rc5) (2024-04-28)


### Bug Fixes

* **ansible/do:** fix GROUP group var 8327082
* **cloudflare-dns:** rename prod stack to production d17c373
* fix misc issues 18ae6f4


### Features

* convert action (select) toresources (checkbox) a6636e9



# [1.0.0-rc4](/compare/1.0.0-rc2...1.0.0-rc4) (2024-04-25)


### Features

* update ansible generators eb90773



# [1.0.0-rc3](/compare/1.0.0-rc2...1.0.0-rc3) (2024-04-25)


### Features

* update ansible generators eb90773



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



