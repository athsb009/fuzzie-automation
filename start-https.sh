#!/bin/bash

# Kill any existing processes on the ports
echo "Checking for existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3443 | xargs kill -9 2>/dev/null || true

# Start Next.js dev server in background
echo "Starting Next.js dev server on http://localhost:3000..."
npm run dev &

# Wait a moment for the server to start
sleep 3

# Start HTTPS proxy
echo "Starting HTTPS proxy on https://localhost:3443..."
npm run dev:https 