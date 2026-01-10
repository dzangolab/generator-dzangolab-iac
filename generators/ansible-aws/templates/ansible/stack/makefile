#!make
ansible-link:
	@printf "\033[0;32m>>> Set up ansible-link\033[0m\n"
	ansible-playbook plays/ansible_link.yml

ansible-link.down:
	@printf "\033[0;32m>>> Down ansible-link\033[0m\n"
	ansible-playbook plays/ansible_link.yml --extra-vars="ansible_link__state=stopped"

install:
	@printf "\033[0;32m>>> Install ansible roles\033[0m\n"
	ansible-galaxy install -r requirements.yml --force

mariadb:
	@printf "\033[0;32m>>> Set up mariadb directories\033[0m\n"
	ansible-playbook plays/mariadb.yml

portainer:
	@printf "\033[0;32m>>> Set up portainer\033[0m\n"
	ansible-playbook plays/portainer.yml

portainer.down:
	@printf "\033[0;32m>>> Set up portainer\033[0m\n"
	ansible-playbook plays/portainer.yml --extra-vars="portainer__state=stopped"

postgres:
	@printf "\033[0;32m>>> Set up postgres\033[0m\n"
	ansible-playbook plays/postgres.yml

ssh-keys:
	@printf "\033[0;32m>>> Update SSH keys\033[0m\n"
	ansible-playbook plays/ssh-keys.yml

sync-playbooks:
	@printf "\033[0;32m>>> Sync ansible-link playbooks\033[0m\n"
	ansible-playbook plays/sync-playbooks.yml

traefik:
	@printf "\033[0;32m>>> Set up traefik\033[0m\n"
	ansible-playbook plays/traefik.yml

traefik.down:
	@printf "\033[0;32m>>> Stop traefik\033[0m\n"
	ansible-playbook plays/traefik.yml --extra-vars="traefik__state=stopped"
