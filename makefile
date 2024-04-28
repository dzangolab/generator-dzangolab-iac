tag = 0
version = 0.1

install:
	@printf "\033[0;32m>>> Installing dependencies\033[0m\n"
	npm install

lint:
	@printf "\033[0;32m>>> Lint code\033[0m\n"
	npm lint

lint.fix:
	@printf "\033[0;32m>>> Lint code\033[0m\n"
	npm lint:fix

outdated:
	@printf "\033[0;32m>>> Check for outdated dependencies\033[0m\n"
	npm outdated

publish:
	@printf "\033[0;32m>>> Publish packages\033[0m\n"
	shipjs trigger

release:
	@printf "\033[0;32m>>> Prepare packages for release\033[0m\n"
	shipjs prepare

sort-package:
	@printf "\033[0;32m>>> Format package.json\033[0m\n"
	npm sort-package

typecheck:
	@printf "\033[0;32m>>> Running Type check\033[0m\n"
	npm typecheck
