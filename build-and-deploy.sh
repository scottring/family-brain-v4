#!/bin/bash

# Build and Deploy Script for Vercel
# This script tests the build locally before pushing to avoid multiple failed deployments

echo "🔍 Testing build locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build succeeded locally!"
    echo ""
    echo "📤 Pushing to GitHub..."
    git add -A
    git commit -m "$1"
    git push origin master
    echo ""
    echo "🚀 Deployment triggered on Vercel!"
else
    echo "❌ Build failed locally. Fix errors before deploying."
    echo ""
    echo "Run 'npm run build' to see detailed errors"
    exit 1
fi