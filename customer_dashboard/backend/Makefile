# ============================================================
# FAAZO Backend – Developer Makefile
# Usage: make <command>
# ============================================================

.PHONY: help run migrate makemigrations check shell createsuperuser \
        format lint fix test clean logs

# ── Default ──────────────────────────────────────────────────
help: ## Show this help message
	@echo.
	@echo   FAAZO Backend - Available Commands
	@echo   ===================================
	@echo.
	@echo   Server:
	@echo     make run             Start development server (port 8000)
	@echo     make shell           Open Django interactive shell
	@echo     make createsuperuser Create admin superuser
	@echo.
	@echo   Database:
	@echo     make migrate         Run pending migrations
	@echo     make makemigrations  Generate new migration files
	@echo     make check           Run Django system checks
	@echo.
	@echo   Code Quality:
	@echo     make format          Format code with Black + isort
	@echo     make lint            Run Flake8 linter
	@echo     make fix             Format + Lint (full check)
	@echo.
	@echo   Utilities:
	@echo     make clean           Remove __pycache__ and .pyc files
	@echo     make logs            Tail the app.log file
	@echo.

# ── Server ───────────────────────────────────────────────────
run: ## Start development server
	python manage.py runserver 8000

shell: ## Open Django shell
	python manage.py shell

createsuperuser: ## Create admin superuser
	python manage.py createsuperuser

# ── Database ─────────────────────────────────────────────────
migrate: ## Run database migrations
	python manage.py migrate

makemigrations: ## Generate new migration files
	python manage.py makemigrations

check: ## Run Django system checks
	python manage.py check

# ── Code Quality ─────────────────────────────────────────────
format: ## Format code with Black and isort
	black . --config pyproject.toml
	isort . --settings-path pyproject.toml

lint: ## Run Flake8 linter
	flake8 .

fix: format lint ## Format then lint

# ── Utilities ────────────────────────────────────────────────
clean: ## Remove Python cache files
	@echo Cleaning __pycache__ directories...
	@for /r %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
	@echo Done.

logs: ## Tail the app.log file
	type logs\app.log
