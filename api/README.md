# Contact Form API

Lightweight Node.js API for handling contact form submissions with email notifications.

## Features

- ✅ Express REST API
- ✅ Email sending via SMTP (Nodemailer)
- ✅ IP-based rate limiting (5 requests per 15 minutes)
- ✅ Email-based rate limiting (3 submissions per hour)
- ✅ Honeypot bot detection
- ✅ Spam keyword filtering
- ✅ Input length validation
- ✅ CORS protection
- ✅ Input validation
- ✅ Auto-reply to customers (optional)
- ✅ Security headers (Helmet)
- ✅ HTML formatted emails
- ✅ PM2 process management with persistent logs

## Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
nano .env
```

**Important:** Configure your SMTP settings:

#### Using Gmail:
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password (not your regular password)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=noreply@qcgrant.com
CONTACT_EMAIL=support@qcgrant.com
```

#### Other SMTP Providers:
- **SendGrid**: smtp.sendgrid.net
- **Mailgun**: smtp.mailgun.org  
- **Amazon SES**: email-smtp.us-east-1.amazonaws.com

### 3. Start the Server

**Development:**
```bash
npm run dev
```

**Production (with PM2):**
```bash
pm2 start ecosystem.config.js
pm2 save
```

Server runs on: `http://localhost:3001`

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-21T05:41:57.556Z"
}
```

### POST /api/contact

Submit contact form.

**Request Body:**
```json
{
  "name": "John Doe",
  "company": "Acme Corp",
  "email": "john@example.com",
  "phone": "+1 767 123 4567",
  "service": "cybersecurity",
  "message": "I need help with security assessment",
  "requestCallback": true,
  "marketingConsent": false,
  "honeypot": ""
}
```

**Note:** All fields except `name`, `email`, and `message` are optional. The `requestCallback` and `marketingConsent` fields are booleans. The `honeypot` field is a hidden field for bot detection and should always be empty.

**Response (Success):**
```json
{
  "success": true,
  "message": "Your message has been sent successfully."
}
```

**Response (Error):**
```json
{
  "error": "Missing required fields"
}
```

### GET /health

Health check endpoint.

## Security Features

- **IP-based Rate Limiting**: 5 requests per 15 minutes per IP address
- **Email-based Rate Limiting**: 3 submissions per hour per email address
- **Honeypot Detection**: Hidden field to catch automated bots
- **Spam Filtering**: Blocks submissions containing spam keywords (viagra, casino, lottery, crypto wallet, bitcoin)
- **Input Length Validation**: 
  - Name/Email: Max 100 characters
  - Message: Max 5000 characters
- **CORS**: Configured for specific origins only
- **Helmet**: Security headers enabled
- **Input Validation**: Email format and required fields
- **No data storage**: Emails sent immediately, no database

## Production Deployment

### Current Setup: PM2 Process Manager

The API is configured to run with PM2 for production deployment.

**Initial Setup:**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the API server
cd /home/hugo/qcgrant-website-build/api
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Configure PM2 to start on boot
pm2 startup
# Follow the command it provides (will use systemd)
```

**PM2 Configuration (`ecosystem.config.js`):**
```javascript
module.exports = {
  apps: [{
    name: 'qcgrant-api',
    script: 'server.js',
    cwd: '/home/hugo/qcgrant-website-build/api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};
```

**PM2 Management Commands:**
```bash
pm2 status              # View process status
pm2 logs qcgrant-api    # Live log streaming
pm2 logs qcgrant-api --lines 50  # View last 50 lines
pm2 restart qcgrant-api # Restart the API
pm2 stop qcgrant-api    # Stop the API
pm2 start qcgrant-api   # Start the API
pm2 delete qcgrant-api  # Remove from PM2
pm2 monit               # Real-time monitoring dashboard
pm2 flush               # Clear all logs
```

**Log Files:**
- Logs are persisted to `./logs/` directory
- `out.log` - Standard output and server messages
- `error.log` - Errors and exceptions
- PM2 automatically rotates logs to prevent disk space issues

**Benefits:**
- ✅ Automatic restart on crashes
- ✅ Memory-based restart (>200MB)
- ✅ Auto-start on system boot via systemd
- ✅ Persistent, rotated logs
- ✅ Process monitoring and management
- ✅ Zero-downtime restarts

## Nginx Reverse Proxy

Add to your Nginx config:

```nginx
location /api/ {
    proxy_pass http://localhost:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

## Caddy Reverse Proxy (Development Setup)

For development, you can use Caddy as a reverse proxy. Create a `Caddyfile` with the following configuration:

```caddy
:8080 {
  # API reverse proxy
  handle /api/* {
    reverse_proxy localhost:3001
  }
  
  # Static files
  handle {
    root * /home/hugo/qcgrant-website-build/public
    file_server
  }
}
```

Start Caddy:
```bash
caddy run --config Caddyfile
```

## Troubleshooting

**Email not sending?**
- Check SMTP credentials in `.env`
- For Gmail, ensure App Password is used (not regular password)
- Check firewall allows outbound SMTP (port 587)
- Review server logs: `pm2 logs qcgrant-api`

**CORS errors?**
- Add your domain to `ALLOWED_ORIGINS` in `.env`
- Multiple origins should be comma-separated
- Restart the server: `pm2 restart qcgrant-api`

**Port conflicts?**
- Default port is 3001
- Change with `PORT=3002` in `.env`
- Check if port is in use: `lsof -i :3001`

**Rate limit hit?**
- IP-based: 5 requests per 15 minutes per IP
- Email-based: 3 submissions per hour per email
- Adjust in `server.js` if needed

**Form submission blocked?**
- Check if honeypot field is being filled (bot detection)
- Verify message doesn't contain spam keywords
- Ensure input lengths are within limits (name/email: 100 chars, message: 5000 chars)
- Check PM2 logs for specific error: `pm2 logs qcgrant-api --err`

**PM2 process not starting?**
- Check PM2 status: `pm2 status`
- View error logs: `pm2 logs qcgrant-api --err --lines 50`
- Restart PM2: `pm2 restart qcgrant-api`
- Delete and re-add: `pm2 delete qcgrant-api && pm2 start ecosystem.config.js`

## Monitoring

Check server status:
```bash
curl http://localhost:3001/health
```

View PM2 status:
```bash
pm2 status
pm2 logs qcgrant-api
pm2 monit  # Real-time monitoring
```

**Health Check Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-21T06:25:18.435Z"
}
```

## License

MIT