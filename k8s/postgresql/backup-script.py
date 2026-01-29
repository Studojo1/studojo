#!/usr/bin/env python3
"""
PostgreSQL backup script that uploads to Azure Blob Storage.
Uses pg_dump and azure-storage-blob library.
"""

import os
import sys
import subprocess
import gzip
from datetime import datetime, timedelta
from azure.storage.blob import BlobServiceClient

def main():
    # Get environment variables
    postgres_host = os.getenv("POSTGRES_HOST", "postgres.studojo.svc.cluster.local")
    postgres_port = os.getenv("POSTGRES_PORT", "5432")
    postgres_user = os.getenv("POSTGRES_USER", "studojo")
    postgres_db = os.getenv("POSTGRES_DB", "postgres")
    postgres_password = os.getenv("POSTGRES_PASSWORD")
    
    storage_account_name = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
    storage_account_key = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")
    container_name = "postgres-backups"
    
    # Validate required env vars
    if not postgres_password:
        print("ERROR: POSTGRES_PASSWORD not set", file=sys.stderr)
        sys.exit(1)
    if not storage_account_name or not storage_account_key:
        print("ERROR: Azure Storage credentials not set", file=sys.stderr)
        sys.exit(1)
    
    # Create backup file
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_filename = f"postgres-backup-{timestamp}.sql.gz"
    backup_path = f"/tmp/{backup_filename}"
    
    print(f"Starting PostgreSQL backup...")
    print(f"Host: {postgres_host}:{postgres_port}")
    print(f"Database: {postgres_db}")
    
    # Dump database
    print("Dumping database...")
    env = os.environ.copy()
    env["PGPASSWORD"] = postgres_password
    
    try:
        with open(backup_path.replace('.gz', ''), 'wb') as f:
            dump_process = subprocess.Popen(
                [
                    "pg_dump",
                    "-h", postgres_host,
                    "-p", postgres_port,
                    "-U", postgres_user,
                    "-d", postgres_db,
                    "--no-owner",
                    "--no-acl"
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env
            )
            
            stdout, stderr = dump_process.communicate()
            
            if dump_process.returncode != 0:
                print(f"ERROR: pg_dump failed: {stderr.decode()}", file=sys.stderr)
                sys.exit(1)
            
            f.write(stdout)
        
        # Compress backup
        print("Compressing backup...")
        with open(backup_path.replace('.gz', ''), 'rb') as f_in:
            with gzip.open(backup_path, 'wb') as f_out:
                f_out.writelines(f_in)
        
        # Get file size
        file_size = os.path.getsize(backup_path)
        print(f"Backup created: {backup_filename} ({file_size / 1024 / 1024:.2f} MB)")
        
        # Upload to Azure Blob Storage
        print("Uploading to Azure Blob Storage...")
        blob_service_client = BlobServiceClient(
            account_url=f"https://{storage_account_name}.blob.core.windows.net",
            credential=storage_account_key
        )
        
        # Create container if it doesn't exist
        container_client = blob_service_client.get_container_client(container_name)
        try:
            container_client.create_container()
            print(f"Created container: {container_name}")
        except Exception as e:
            if "ContainerAlreadyExists" not in str(e):
                raise
        
        # Upload blob
        blob_client = blob_service_client.get_blob_client(
            container=container_name,
            blob=backup_filename
        )
        
        with open(backup_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)
        
        print(f"Backup uploaded successfully: {backup_filename}")
        
        # Clean up old backups (keep last 30 days)
        print("Cleaning up old backups (keeping last 30 days)...")
        cutoff_date = datetime.now() - timedelta(days=30)
        
        blobs = container_client.list_blobs()
        deleted_count = 0
        for blob in blobs:
            if blob.last_modified.replace(tzinfo=None) < cutoff_date:
                blob_client = blob_service_client.get_blob_client(
                    container=container_name,
                    blob=blob.name
                )
                blob_client.delete_blob()
                print(f"Deleted old backup: {blob.name}")
                deleted_count += 1
        
        if deleted_count > 0:
            print(f"Cleaned up {deleted_count} old backup(s)")
        else:
            print("No old backups to clean up")
        
        # Clean up local file
        os.remove(backup_path)
        os.remove(backup_path.replace('.gz', ''))
        
        print("Backup completed successfully!")
        
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

