# [1.0.0-rc8](/compare/v1.0.0-rc6...v1.0.0-rc8) (2024-05-07)


### Bug Fixes

* **do/database-cluster:** fix generator 6a0e01d



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



