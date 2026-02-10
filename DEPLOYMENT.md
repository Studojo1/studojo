# Maverick Blog System Deployment Guide

This guide covers deploying the Maverick blog system and migrating existing blog data.

## Prerequisites

1. **Azure CLI** logged in: `az login`
2. **kubectl** configured for your Kubernetes cluster
3. **Docker** installed and running
4. **Environment variables** set:
   - `DATABASE_URL` - PostgreSQL connection string
   - `AZURE_STORAGE_ACCOUNT_NAME` - Azure Storage account name
   - `AZURE_STORAGE_ACCOUNT_KEY` - Azure Storage account key

## Deployment Steps

### 1. Build and Push Docker Image

```bash
./scripts/build-and-deploy-maverick.sh
```

This script will:
- Build the Maverick Docker image
- Push it to Azure Container Registry (ACR)
- Apply database migrations
- Deploy Maverick to Kubernetes

### 2. Run Database Migration (if not done automatically)

The blog_posts table migration is included in the frontend database migration job. It should run automatically, but you can check:

```bash
kubectl get job frontend-db-push -n studojo
kubectl logs job/frontend-db-push -n studojo
```

If needed, manually apply the migration:

```bash
# Via Kubernetes job
kubectl apply -f k8s/frontend/job-db-push.yaml
kubectl wait --for=condition=complete job/frontend-db-push -n studojo --timeout=300s

# Or directly via psql
psql $DATABASE_URL -f apps/frontend/drizzle/0003_blog_posts.sql
```

### 3. Migrate Blog Posts and Images

**Option A: Run locally (Recommended)**

This is the easiest way since you have the data files locally:

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export AZURE_STORAGE_ACCOUNT_NAME="your-account-name"
export AZURE_STORAGE_ACCOUNT_KEY="your-account-key"
export AZURE_STORAGE_CONTAINER_NAME="blog-images"

./scripts/run-blog-migration.sh
```

**Option B: Run via Kubernetes Job**

First, you'll need to copy the data files into the cluster (via ConfigMap, PVC, or include in image):

```bash
kubectl apply -f k8s/maverick/job-migrate-blogs.yaml
kubectl wait --for=condition=complete job/maverick-migrate-blogs -n studojo --timeout=600s
kubectl logs job/maverick-migrate-blogs -n studojo
```

### 4. Deploy All Applications

If you haven't already, deploy all services:

```bash
cd k8s
./deploy.sh
```

Or deploy individually:

```bash
kubectl apply -f k8s/maverick/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/admin-panel/
kubectl apply -f k8s/ingress/
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n studojo -l app=maverick

# Check services
kubectl get svc -n studojo

# Check ingress
kubectl get ingress -n studojo

# View logs
kubectl logs -n studojo -l app=maverick --tail=50
```

### 6. Set Ops Role for Users

To access Maverick, users need the 'ops' role:

```sql
UPDATE "user" SET role = 'ops' WHERE email = 'your@email.com';
```

Or use the script:

```bash
./scripts/set-admin-user.sh your@email.com ops
```

## Access Points

- **Maverick Blog Editor**: https://maverick.studojo.com
- **Public Blog**: https://studojo.com/blog (or your frontend domain)
- **Admin Panel**: https://admin.studojo.com

## Troubleshooting

### Image Build Fails

```bash
# Check Docker is running
docker ps

# Try building manually
cd apps/maverick
docker build -t maverick:test .
```

### Migration Fails

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check Azure credentials
az storage account show --name $AZURE_STORAGE_ACCOUNT_NAME

# View migration logs
kubectl logs job/maverick-migrate-blogs -n studojo
```

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod -n studojo -l app=maverick

# Check events
kubectl get events -n studojo --sort-by='.lastTimestamp'
```

### DNS Issues

```bash
# Check ingress
kubectl get ingress -n studojo

# Check cert-manager certificates
kubectl get certificates -n studojo

# Check DNS resolution
nslookup maverick.studojo.com
```

## Data Migration Details

The migration script (`scripts/migrate-blogs.ts`) will:

1. **Read blog posts** from `data/studojo.blog_posts.json`
2. **Upload images** from `data/blog-images/` to Azure Blob Storage
3. **Insert posts** into PostgreSQL `blog_posts` table
4. **Skip duplicates** (based on slug)
5. **Preserve metadata** (author, dates, SEO, categories, tags)

Migration statistics:
- Total posts: 71
- Images: ~7 files in `data/blog-images/`

## Rollback

If something goes wrong:

```bash
# Delete deployment
kubectl delete deployment maverick -n studojo

# Delete migration job
kubectl delete job maverick-migrate-blogs -n studojo

# Rollback database (if needed)
# Manually delete migrated posts or restore from backup
```

## Next Steps

After successful deployment:

1. ✅ Verify blog posts are accessible at `/blog`
2. ✅ Test creating/editing posts in Maverick
3. ✅ Verify images are loading correctly
4. ✅ Check SSL certificates are issued
5. ✅ Test authentication and authorization

