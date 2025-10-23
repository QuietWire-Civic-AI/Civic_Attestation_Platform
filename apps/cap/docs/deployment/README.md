# Deployment Guide

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Python 3.9+
- Node.js 16+
- MariaDB 10.6+
- Redis 6+
- Nginx
- Supervisor

## Production Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
    python3-pip \
    python3-dev \
    redis-server \
    mariadb-server \
    nginx \
    supervisor

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. MariaDB Configuration

```bash
# Secure MariaDB
sudo mysql_secure_installation

# Configure MariaDB
sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
```

Add:
```ini
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4
```

Restart MariaDB:
```bash
sudo systemctl restart mariadb
```

### 3. Install Frappe Bench

```bash
# Install bench
sudo pip3 install frappe-bench

# Initialize bench
bench init frappe-bench \
    --frappe-branch version-14 \
    --python python3.10

cd frappe-bench
```

### 4. Setup Production Site

```bash
# Create site
bench new-site cap.example.com \
    --mariadb-root-password YOUR_MYSQL_ROOT_PASSWORD \
    --admin-password YOUR_ADMIN_PASSWORD

# Get CAP app
bench get-app https://github.com/YOUR_ORG/cap.git

# Install app
bench --site cap.example.com install-app cap

# Setup production
bench setup production YOUR_USER
```

### 5. SSL Certificate

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo bench setup lets-encrypt cap.example.com
```

### 6. Configure Supervisor

```bash
# Edit supervisor config
sudo nano /etc/supervisor/supervisord.conf
```

Verify configuration:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

### 7. Configure Nginx

Nginx configuration is auto-generated. Verify:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Environment Configuration

### Site Config

Edit `sites/cap.example.com/site_config.json`:

```json
{
  "db_name": "cap_production",
  "db_password": "YOUR_DB_PASSWORD",
  "redis_cache": "redis://localhost:6379/1",
  "redis_queue": "redis://localhost:6379/2",
  "redis_socketio": "redis://localhost:6379/3",
  "socketio_port": 9000,
  "maintenance_mode": 0,
  "pause_scheduler": 0,
  "developer_mode": 0,
  "use_ssl": 1,
  "serve_default_site": 1
}
```

## Redis Configuration

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf
```

Recommended settings:
```
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

Restart Redis:
```bash
sudo systemctl restart redis
```

## Backup Strategy

### Automated Backups

```bash
# Enable automated backups
bench --site cap.example.com set-config \
    backup_limit 3

# Setup cron for daily backups
bench --site cap.example.com set-config \
    enable_scheduler 1
```

### Manual Backup

```bash
# Backup site
bench --site cap.example.com backup \
    --with-files

# Restore from backup
bench --site cap.example.com restore \
    --mariadb-root-password YOUR_PASSWORD \
    /path/to/backup.sql.gz
```

## Monitoring

### Enable Monitoring

Install monitoring tools:

```bash
# Install monitoring
sudo apt install -y prometheus prometheus-node-exporter
```

### Health Checks

```bash
# Check bench status
bench doctor

# Check site health
curl http://cap.example.com/api/method/ping
```

## Performance Tuning

### Workers Configuration

Edit `Procfile`:

```yaml
web: bench serve --port 8000
worker_short: bench worker --queue short
worker_long: bench worker --queue long
worker_default: bench worker --queue default
```

### Database Optimization

```bash
# Optimize tables
bench --site cap.example.com mariadb

USE cap_production;
OPTIMIZE TABLE `tabUser`;
OPTIMIZE TABLE `tabTenant`;
```

## Security Hardening

### Firewall

```bash
# Enable UFW
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Fail2Ban

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
```

## Scaling

### Horizontal Scaling

For multi-server setup:

1. **Load Balancer**: Nginx or HAProxy
2. **Shared Redis**: Central Redis server
3. **Shared Database**: Central MariaDB server
4. **Shared Files**: NFS or S3-compatible storage

### Vertical Scaling

Increase resources:

- **CPU**: More cores for workers
- **RAM**: At least 4GB for production
- **Storage**: SSD recommended

## Troubleshooting

### Check Logs

```bash
# Bench logs
tail -f logs/web.log
tail -f logs/worker.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Supervisor logs
sudo tail -f /var/log/supervisor/supervisord.log
```

### Restart Services

```bash
# Restart bench
sudo supervisorctl restart all

# Restart Nginx
sudo systemctl restart nginx

# Restart Redis
sudo systemctl restart redis
```
