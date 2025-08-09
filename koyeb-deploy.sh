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
    --env REDIS_URL="redis://default:AXHSAAIncDExYjdhZWQzN2U1OTI0NTI0YjlhYjU4YTNiMDQ3NTU1NXAxMA@reliable-bass-51310.upstash.io:6379" --env DATABASE_URL="postgresql://postgres.fhwkqtxkkvjrjcrwwbjd:Aurex213454@aws-0-ap-south-1.pooler.supabase.com:5432/postgres" --env JWT_SECRET="aurex_super_secret_jwt_key_2024_cyber_security_platform" --env EMAIL_HOST="smtp.gmail.com" --env EMAIL_PORT="587" --env EMAIL_USER="ayushtyagi2213@gmail.com" --env EMAIL_PASS="Aurex213454" --env NEXTAUTH_SECRET="aurex_nextauth_secret_key_for_authentication" --env NEXTAUTH_URL="https://your-app-name.koyeb.app" --env API_SECRET_KEY="aurex_api_secret_2024" --env NODE_ENV="production"