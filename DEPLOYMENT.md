# CyberSecChat Production Deployment Guide

## Prerequisites

### Required Services

- **PostgreSQL Database** (v13+)
- **Redis Server** (v6+)
- **SMTP Email Service** (Gmail, SendGrid, AWS SES)
- **File Storage** (AWS S3, Google Cloud Storage, or local)

### Environment Setup

1. **Copy environment template:**

   ```bash
   cp .env.example .env.local
   ```

2. **Configure environment variables:**

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/cybersecchat"
   REDIS_URL="redis://localhost:6379"

   # Authentication
   JWT_SECRET="your-256-bit-secret-key-here"
   JWT_EXPIRES_IN="7d"
   BCRYPT_ROUNDS=12

   # Email Service
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"

   # File Storage
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   AWS_S3_BUCKET="cybersecchat-files"

   # Security
   ENCRYPTION_KEY="32-character-encryption-key"
   FILE_ENCRYPTION_KEY="another-32-char-key"
   ```

## Database Setup

### PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'free',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    department VARCHAR(100),
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}',
    statistics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat rooms table
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'private',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    encrypted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Files table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    user_id UUID REFERENCES users(id),
    encrypted BOOLEAN DEFAULT true,
    scan_status VARCHAR(20) DEFAULT 'pending',
    scan_result JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP codes table
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Threat intelligence table
CREATE TABLE threat_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    source VARCHAR(100),
    indicators JSONB DEFAULT '[]',
    mitigation TEXT,
    tags TEXT[],
    tlp VARCHAR(20) DEFAULT 'white',
    submitted_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_otp_codes_email ON otp_codes(email);
CREATE INDEX idx_threat_intelligence_severity ON threat_intelligence(severity);
CREATE INDEX idx_threat_intelligence_category ON threat_intelligence(category);
```

## Installation & Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Application

```bash
npm run build
```

### 3. Start Production Server

```bash
npm start
```

### 4. Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start npm --name "cybersecchat" -- start
pm2 save
pm2 startup
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.local
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: cybersecchat
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Security Checklist

### SSL/TLS

- [ ] Configure HTTPS certificates
- [ ] Set up HSTS headers
- [ ] Use secure cookies

### Environment

- [ ] Change all default secrets
- [ ] Use strong encryption keys
- [ ] Enable database encryption at rest
- [ ] Configure firewall rules

### Application

- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up CSP headers
- [ ] Enable audit logging

### Monitoring

- [ ] Set up application monitoring
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation

## Performance Optimization

### Database

- Enable connection pooling
- Set up read replicas if needed
- Configure proper indexes
- Regular database maintenance

### Application

- Enable Redis caching
- Configure CDN for static assets
- Implement image optimization
- Use compression middleware

### Monitoring

```bash
# Monitor application performance
pm2 monit

# Check logs
pm2 logs cybersecchat

# Restart if needed
pm2 restart cybersecchat
```

## Backup Strategy

### Database Backup

```bash
# Daily automated backup
pg_dump cybersecchat > backup_$(date +%Y%m%d).sql
```

### File Storage Backup

- Configure automated S3 backups
- Set up cross-region replication
- Test restore procedures regularly

## External Service Integration

### Email Service (SendGrid Example)

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

### Threat Intelligence APIs

- VirusTotal API
- AlienVault OTX
- IBM X-Force Exchange
- MISP feeds

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review security logs weekly
- Database maintenance weekly
- SSL certificate renewal

### Emergency Procedures

- Incident response playbook
- Rollback procedures
- Emergency contacts
- Backup restoration steps

## Troubleshooting

### Common Issues

1. **Database connection errors**: Check DATABASE_URL and network connectivity
2. **Email not sending**: Verify SMTP credentials and firewall rules
3. **File upload failures**: Check disk space and permissions
4. **High CPU usage**: Monitor for potential DDoS or inefficient queries

### Logs Location

- Application logs: `/var/log/cybersecchat/`
- PM2 logs: `~/.pm2/logs/`
- System logs: `/var/log/syslog`

## Support

For production support and enterprise features, contact the development team.
