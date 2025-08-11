#!/bin/bash
koyeb app deploy aurex-cyber-platform \
    --git github.com/Velqore/Aurex \
    --git-branch main \
    --git-build-command "npm install && npm run build" \
    --git-run-command "npm start" \
    --instance-type nano \
    --regions fra \
    --ports 3000:http \
    --routes /:3000 \

    --env REDIS_URL= "redis://default:AXHSAAIncDExYjdhZWQzN2U1OTI0NTI0YjlhYjU4YTNiMDQ3NTU1NXAxMA@reliable-bass-51310.upstash.io:6379" --env DATABASE_URL="postgresql://postgres.fhwkqtxkkvjrjcrwwbjd:Aurex213454@aws-0-ap-south-1.pooler.supabase.com:5432/postgres" --env JWT_SECRET="ACPAr/iMRwfpLa7udOURK5Rbj/eXtw19NNkj5MG4gQc=" --env SMTP_HOST="smtp.gmail.com" --env SMTP_PORT="587" --env SMTP_USER="aurex.app@gmail.com" --env SMTP_PASS="egwc xfuj uphv ascg" --env NEXTAUTH_SECRET="1facf02501598489fb5b9bcb3b88c18a4dca3b32f5e040530a8b0fa9a599ac2b" --env NEXTAUTH_URL="https://aurex-main.koyeb.app" --env API_SECRET_KEY="2b5e8f1a4d7c0f3a6e9b2c5f8a1d4e7b" --env NODE_ENV="development" --env VIRUSTOTAL_API_KEY="1facf02501598489fb5b9bcb3b88c18a4dca3b32f5e040530a8b0fa9a599ac2b" --env THREAT_INTEL_API_KEY="1facf02501598489fb5b9bcb3b88c18a4dca3b32f5e040530a8b0fa9a599ac2b" --env ENCRYPTION_KEY="7f3e9d2a8c5b1e4f6a9c8e2b5d7f0a3c" --env FILE_ENCRYPTION_KEY="2b5e8f1a4d7c0f3a6e9b2c5f8a1d4e7b" --env RATE_LIMIT_WINDOW_MS="900000" --env RATE_LIMIT_MAX_REQUESTS="100"
