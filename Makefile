.PHONY: install dev backend frontend clean docker-up docker-down docker-build test test-backend test-frontend

# Install dependencies for both backend and frontend
install:
	@echo "Installing backend dependencies..."
	cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && source ~/.nvm/nvm.sh && npm install

# Run both backend and frontend concurrently using npx concurrently
dev:
	@echo "Starting ContextWeaver Pipeline..."
	source ~/.nvm/nvm.sh && npx concurrently "make backend" "make frontend" --names "API,WEB" -c "bgBlue.bold,bgGreen.bold"

# Run backend only
backend:
	cd backend && source venv/bin/activate && python main.py

# Run frontend only
frontend:
	cd frontend && source ~/.nvm/nvm.sh && npm run dev

# Run tests for both backend and frontend
test: test-backend test-frontend

# Run backend unit tests with coverage
test-backend:
	@echo "Running backend tests..."
	cd backend && source venv/bin/activate && PYTHONPATH=. pytest --cov=api --cov=core

# Run frontend unit tests with coverage
test-frontend:
	@echo "Running frontend tests..."
	cd frontend && source ~/.nvm/nvm.sh && npm run test:coverage

# Clean up environments
clean:
	rm -rf backend/venv
	rm -rf frontend/node_modules
	rm -rf frontend/.next

# --- Docker Commands ---

# Run the complete stack via Docker Compose
docker-up:
	@echo "Starting ContextWeaver with Docker Compose..."
	docker compose up

# Build and run the complete stack via Docker Compose
docker-build:
	@echo "Building and starting ContextWeaver with Docker Compose..."
	docker compose up --build

# Tear down the complete stack
docker-down:
	@echo "Stopping ContextWeaver Docker Compose..."
	docker compose down
