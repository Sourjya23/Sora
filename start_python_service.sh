#!/bin/bash
echo "🚀 Initializing Python Microservice environment..."

cd python-microservice

# Check if venv exists, if not create it
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Starting FastAPI Server with Uvicorn..."
# Run the FastAPI app on port 8001 to avoid conflicts
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
