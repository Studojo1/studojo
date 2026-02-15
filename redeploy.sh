#!/bin/bash
set -e

# Update submodules safely (only init, don't reset)
echo "Initializing submodules..."
git submodule update --init --recursive

# Commit and push submodules (services/control-plane and apps/admin-panel)
for dir in services/control-plane apps/admin-panel; do
    if [ -d "$dir" ]; then
        cd "$dir"
        echo "Processing $dir..."
        
        # Ensure we are on main branch
        git checkout main || git checkout -b main
        
        # Pull latest changes to avoid conflicts (rebase)
        git pull origin main --rebase || true

        if [[ -n $(git status -s) ]]; then
            echo "Committing changes in $dir..."
            git add .
            git commit -m "chore: Auto-update from streamlined deploy script" || true
        fi
        
        # Push changes (even if committed before)
        echo "Pushing $dir..."
        git push origin main
        cd -
    fi
done

# Commit and push root repo
echo "Processing root repo..."
if [[ -n $(git status -s) ]]; then
    echo "Committing root changes..."
    git add .
    git commit -m "chore: Update submodules" || true
fi
git push origin main

# Restart deployments to pick up new images
echo "Restarting deployments..."
kubectl rollout restart deployment/control-plane -n studojo
kubectl rollout restart deployment/admin-panel -n studojo

echo "Deployment refreshed! Please wait a few minutes for GitHub Actions to build the new images."
