#!make
awscli:
	@printf "\033[0;3ansible/2m>>> Set up awscli\033[0m\n"
	ansible-playbook plays/awscli.yml --tags "awscli"

install:
	@printf "\033[0;32m>>> Install ansible roles\033[0m\n"
	ansible-galaxy install -r requirements.yml --force

docker:
	@printf "\033[0;3ansible/2m>>> Set up docker swarm\033[0m\n"
	ansible-playbook plays/docker.yml
docker.cron:
	@printf "\033[0;3ansible/2m>>> Set up docker logrotate\033[0m\n"
	ansible-playbook plays/docker.yml --tags "cron"

docker.labels:
	@printf "\033[0;3ansible/2m>>> Set up docker labels\033[0m\n"
	ansible-playbook plays/docker.yml --tags "labels"

docker.logrotate:
	@printf "\033[0;3ansible/2m\>>> Set up docker logrotate\033[0m\n"
	ansible-playbook plays/docker.yml --tags "logrotate"

docker.networks:
	@printf "\033[0;3ansible/2m>>> Set up docker networks\033[0m\n"
	ansible-playbook plays/docker.yml --tags "networks"

docker.swarm:
	@printf "\033[0;3ansible/2m>>> Set up docker swarm\033[0m\n"
	ansible-playbook plays/swarm.yml"

mariadb:
	@printf "\033[0;3ansible/2m>>> Set up mariadb data folders\033[0m\n"
	ansible-playbook plays/mariadb.yml

portainer:
	@printf "\033[0;3ansible/2m>>> Set up portainer\033[0m\n"
	ansible-playbook plays/portainer.yml

portainer.down:
	@printf "\033[0;32m>>> Set up portainer\033[0m\n"
	ansible-playbook plays/portainer.yml --extra-vars="portainer__state=stopped"

postgres:
	@printf "\033[0;3ansible/2m>>> Set up postgres data folders\033[0m\n"
	ansible-playbook plays/postgres.yml

ssh-keys:
	@printf "\033[0;3ansible/2m>>> Update SSH keys\033[0m\n"
	ansible-playbook plays/ssh-keys.yml

traefik:
	@printf "\033[0;3ansible/2m>>> Set up traefik\033[0m\n"
	ansible-playbook plays/traefik.yml

traefik.down:
	@printf "\033[0;32m>>> Stop traefik\033[0m\n"
	ansible-playbook plays/traefik.yml --extra-vars="traefik__state=stopped"
