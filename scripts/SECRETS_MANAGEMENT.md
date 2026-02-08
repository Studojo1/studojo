# Secrets Management Guide

This guide explains how to manage secrets for services in the Studojo platform.

## Overview

Secrets are managed through two mechanisms:
1. **Azure Key Vault**: Centralized secret storage for production
2. **GitHub Secrets**: Repository secrets for CI/CD workflows

## Setting Up Secrets

### Automated Setup

Use the `setup-service-secrets.sh` script to configure secrets for a service:

```bash
export GITHUB_TOKEN="your-github-token"
./scripts/setup-service-secrets.sh <service-name> <key-vault-name> <github-repo>
```

Example:
```bash
./scripts/setup-service-secrets.sh frontend studojo-kv owner/studojo
```

### Manual Setup

#### Azure Key Vault

```bash
az keyvault secret set \
  --vault-name <key-vault-name> \
  --name <service-name>-<secret-name> \
  --value "<secret-value>"
```

#### GitHub Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add secret name and value

## Required Secrets by Service

### Common Secrets (All Services)

- `AZURE_CLIENT_ID`: Azure service principal client ID
- `AZURE_TENANT_ID`: Azure tenant ID
- `AZURE_SUBSCRIPTION_ID`: Azure subscription ID
- `AZURE_CLIENT_SECRET`: Azure service principal secret
- `KUBECONFIG`: Base64-encoded Kubernetes config file
- `DEV_PANEL_WEBHOOK_URL`: (Optional) Dev panel webhook URL for CI/CD status

### Frontend

- `VITE_CONTROL_PLANE_URL`: Control plane API URL (default: https://api.studojo.com)

### Control Plane

- `DATABASE_URL`: PostgreSQL connection string
- `RABBITMQ_URL`: RabbitMQ AMQP URL
- `JWKS_URL`: Frontend JWKS endpoint URL
- `CORS_ORIGINS`: Comma-separated allowed origins
- `RAZORPAY_KEY_ID`: Razorpay API key ID
- `RAZORPAY_KEY_SECRET`: Razorpay API key secret

### Emailer Service

- `DATABASE_URL`: PostgreSQL connection string
- `RABBITMQ_URL`: RabbitMQ AMQP URL
- `AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING`: Azure Email connection string
- `AZURE_EMAIL_SENDER_ADDRESS`: Sender email address
- `FRONTEND_URL`: Frontend URL for email links

### Resume Service

No additional secrets required (stateless service)

### Assignment Gen Worker

- `RABBITMQ_URL`: RabbitMQ AMQP URL
- `RESULTS_EXCHANGE`: Results exchange name (default: cp.results)
- `AZURE_STORAGE_ACCOUNT_NAME`: Blob storage account name
- `AZURE_STORAGE_ACCOUNT_KEY`: Blob storage account key
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `REPHRASY_API_KEY`: Rephrasy API key

### Resume Worker

- `RABBITMQ_URL`: RabbitMQ AMQP URL
- `RESULTS_EXCHANGE`: Results exchange name (default: cp.results)
- `AZURE_STORAGE_ACCOUNT_NAME`: Blob storage account name
- `AZURE_STORAGE_ACCOUNT_KEY`: Blob storage account key
- `RESUME_SERVICE_URL`: Resume service endpoint (default: http://resume-service:8086)

### Humanizer Service

- `REPHRASY_API_KEY`: Rephrasy API key
- `OPENAI_API_KEY`: OpenAI API key
- `AZURE_STORAGE_ACCOUNT_NAME`: Blob storage account name
- `AZURE_STORAGE_ACCOUNT_KEY`: Blob storage account key
- `REDIS_PASSWORD`: Redis password

### Humanizer Worker

- `RABBITMQ_URL`: RabbitMQ AMQP URL
- `RESULTS_EXCHANGE`: Results exchange name (default: cp.results)
- `AZURE_STORAGE_ACCOUNT_NAME`: Blob storage account name
- `AZURE_STORAGE_ACCOUNT_KEY`: Blob storage account key
- `HUMANIZER_SERVICE_URL`: Humanizer service endpoint (default: http://humanizer-svc:8000)

## Retrieving Secrets

### From Azure Key Vault

```bash
az keyvault secret show \
  --vault-name <key-vault-name> \
  --name <service-name>-<secret-name> \
  --query value -o tsv
```

### From GitHub

GitHub secrets are encrypted and cannot be retrieved via API. They must be set manually or through the setup script.

## Best Practices

1. **Never commit secrets to git**: All secrets should be in Key Vault or GitHub Secrets
2. **Use separate Key Vaults**: Use different vaults for dev/staging/production
3. **Rotate secrets regularly**: Update secrets periodically for security
4. **Limit access**: Only grant access to secrets to those who need them
5. **Use managed identities**: Where possible, use Azure Managed Identities instead of secrets

## Troubleshooting

### CI/CD Workflow Fails

- Verify secrets are set in GitHub repository
- Check secret names match exactly (case-sensitive)
- Ensure KUBECONFIG is base64-encoded

### Service Can't Access Secrets

- Verify Key Vault access policies
- Check service principal has "Get" permission on secrets
- Verify secret names match service expectations

