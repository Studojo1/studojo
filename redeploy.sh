#!/bin/bash
set -e

# Update submodules if needed
echo "Updating submodules..."
git submodule update --init --recursive

# Commit and push submodules (services/control-plane and apps/admin-panel)
for dir in services/control-plane apps/admin-panel; do
    if [ -d "$dir" ]; then
        cd "$dir"
        if [[ -n $(git status -s) ]]; then
            echo "Committing changes in $dir..."
            git add .
            git commit -m "chore: Auto-update from streamlined deploy script" || true
            git push origin main
        fi
        cd -
    fi
done

# Commit and push root repo
if [[ -n $(git status -s) ]]; then
    echo "Committing root changes..."
    git add .
    git commit -m "chore: Update submodules" || true
    git push origin main
fi

# Restart deployments to pick up new images (assuming 'latest' tag or just to refresh)
echo "Restarting deployments..."
kubectl rollout restart deployment/control-plane -n studojo
kubectl rollout restart deployment/admin-panel -n studojo

echo "Deployment refreshed!"
