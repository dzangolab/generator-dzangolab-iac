#!make

dirs.minio:
	@printf "\033[0;32m>>> Create minio database directories\033[0m\n"
	ansible-playbook plays/data-dirs.yml --tags minio

dirs.postgres:
	@printf "\033[0;32m>>> Create postgres database directories\033[0m\n"
	ansible-playbook plays/data-dirs.yml --tags postgres

install:
	@printf "\033[0;32m>>> Install ansible roles\033[0m\n"
	ansible-galaxy install -r requirements.yml --force

docker:
	@printf "\033[0;32m>>> Set up docker swarm\033[0m\n"
	ansible-playbook plays/docker.yml

docker.cron:
	@printf "\033[0;32m>>> Set up docker logrotate\033[0m\n"
	ansible-playbook plays/docker.yml --tags "docker-cron"

docker.labels:
	@printf "\033[0;32m>>> Set up docker labels\033[0m\n"
	ansible-playbook plays/docker.yml --tags "docker-labels"

docker.networks:
	@printf "\033[0;32m>>> Set up docker network\033[0m\n"
	ansible-playbook plays/docker.yml --tags "docker-networks"

docker.swarm:
	@printf "\033[0;32m>>> Set up docker swarm\033[0m\n"
	ansible-playbook plays/swarm.yml

portainer:
	@printf "\033[0;32m>>> Set up portainer\033[0m\n"
	ansible-playbook plays/portainer.yml

portainer.down:
	@printf "\033[0;32m>>> Set up portainer\033[0m\n"
	ansible-playbook plays/portainer.yml --extra-vars="portainer__state=stopped"

ssh-keys:
	@printf "\033[0;32m>>> Update SSH keys\033[0m\n"
	ansible-playbook plays/ssh-keys.yml

traefik:
	@printf "\033[0;32m>>> Set up traefik\033[0m\n"
	ansible-playbook plays/traefik.yml

traefik.down:
	@printf "\033[0;32m>>> Stop traefik\033[0m\n"
	ansible-playbook plays/traefik.yml --extra-vars="traefik__state=stopped"
