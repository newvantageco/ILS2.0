#!/bin/bash
# Create platform admin on Railway

echo "Creating platform admin on Railway..."

# Method 1: Try with railway connect
cat create-admin.sql | railway connect Postgres

echo "Done! Check output above for confirmation."
