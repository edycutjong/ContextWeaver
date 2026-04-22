.PHONY: install dev backend frontend clean

# Install dependencies for both backend and frontend
install:
	@echo "Installing backend dependencies..."
	cd backend && python3 -m venv venv && source venv/bin/activate && pip install fastapi uvicorn chromadb sentence-transformers langchain-text-splitters pydantic
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Run both backend and frontend concurrently using npx concurrently
dev:
	@echo "Starting ContextWeaver Pipeline..."
	npx concurrently "make backend" "make frontend" --names "API,WEB" -c "bgBlue.bold,bgGreen.bold"

# Run backend only
backend:
	cd backend && source venv/bin/activate && python main.py

# Run frontend only
frontend:
	cd frontend && npm run dev

# Clean up environments
clean:
	rm -rf backend/venv
	rm -rf frontend/node_modules
	rm -rf frontend/.next
