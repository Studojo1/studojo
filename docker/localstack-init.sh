#!/bin/bash
# Initialize LocalStack buckets

set -e

ENDPOINT="http://localhost:4566"
ACCOUNT_NAME="test"
ACCOUNT_KEY="test"

echo "Waiting for LocalStack to be ready..."
until curl -s "${ENDPOINT}/_localstack/health" | grep -q '"s3": "available"'; do
  sleep 2
done

echo "Creating S3 buckets..."

# Create assignments bucket
aws --endpoint-url="${ENDPOINT}" s3 mb s3://assignments 2>/dev/null || echo "Bucket 'assignments' may already exist"

# Create resumes bucket  
aws --endpoint-url="${ENDPOINT}" s3 mb s3://resumes 2>/dev/null || echo "Bucket 'resumes' may already exist"

echo "Buckets created successfully!"
