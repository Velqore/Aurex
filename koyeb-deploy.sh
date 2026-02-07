#!/bin/bash
# IMPORTANT: Before running this script, set up Koyeb secrets for sensitive data
# See: https://www.koyeb.com/docs/secrets
# 
# Required secrets:
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET
# - SMTP_USER
# - SMTP_PASS
# - NEXTAUTH_SECRET
# - ENCRYPTION_KEY
# - FILE_ENCRYPTION_KEY

# Set your Koyeb app name
APP_NAME="aurex-cyber-platform"

# WARNING: Never commit actual credentials to version control
# Use Koyeb secrets or environment variables instead

koyeb app deploy $APP_NAME \
    --git github.com/Velqore/Aurex \
    --git-branch main \
    --git-build-command "npm install && npm run build" \
    --git-run-command "npm start" \
    --instance-type nano \
    --regions fra \
    --ports 3000:http \
    --routes /:3000 \
    --env SMTP_HOST="smtp.gmail.com" \
    --env SMTP_PORT="587" \
    --env NODE_ENV="production" \
    --env RATE_LIMIT_WINDOW_MS="900000" \
    --env RATE_LIMIT_MAX_REQUESTS="100"

# Note: Sensitive environment variables should be set using Koyeb secrets:
# koyeb secret create JWT_SECRET --value "your-secure-secret"
# koyeb secret create DATABASE_URL --value "your-database-url"
# etc.
