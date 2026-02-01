Humanizer Worker
================

Go worker service that consumes humanizer jobs from RabbitMQ, calls the humanizer-svc, and uploads results to blob storage.

Overview
--------

This worker:
- Consumes jobs from RabbitMQ queue `humanizer.jobs`
- Calls humanizer-svc HTTP API
- Uploads humanized documents to Azure Blob Storage
- Publishes result events to RabbitMQ

Technology
----------

- Go 1.23+
- RabbitMQ
- Azure Blob Storage

Environment Variables
--------------------

- ``RABBITMQ_URL``: RabbitMQ connection URL
- ``RESULTS_EXCHANGE``: Results exchange name (default: cp.results)
- ``HUMANIZER_SERVICE_URL``: Humanizer service URL (default: http://humanizer-svc:8000)
- ``AZURE_STORAGE_ACCOUNT_NAME``: Azure storage account name
- ``AZURE_STORAGE_ACCOUNT_KEY``: Azure storage account key
- ``AZURE_STORAGE_CONTAINER_NAME``: Container name (default: humanizer)
- ``USE_LOCALSTACK``: Use LocalStack for local development (true/false)
- ``LOCALSTACK_ENDPOINT``: LocalStack endpoint URL

