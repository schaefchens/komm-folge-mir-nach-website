# Prayer Modal API Setup Guide - Hetzner Hosting

This guide explains how to set up the backend API for the PrayerModal component on Hetzner hosting, using PostgreSQL and PHP.

## Prerequisites

- Hetzner Cloud account with PostgreSQL database
- PHP hosting with the following configuration:
  ```
  '--prefix=/usr/local/php85'
  '--with-config-file-path=/etc/php85/cgi'
  '--enable-fpm'
  '--with-fpm-systemd'
  '--enable-gd'
  '--with-jpeg'
  '--with-freetype'
  '--with-webp'
  '--with-xpm'
  '--with-zip'
  '--with-zlib'
  '--enable-ftp'
  '--with-db4'
  '--with-ldap'
  '--enable-bcmath'
  '--enable-calendar'
  '--with-imap'
  '--with-bz2'
  '--enable-sockets'
  '--with-kerberos'
  '--with-imap-ssl'
  '--with-curl'
  '--with-mhash'
  '--with-gdbm'
  '--with-pgsql'
  '--with-gettext'
  '--with-openssl'
  '--with-pear=/usr/local/lib/php'
  '--enable-exif'
  '--disable-cli'
  '--enable-soap'
  '--enable-mbstring'
  '--with-xsl'
  '--with-mysqli'
  '--with-pdo-mysql=mysqlnd'
  '--with-pdo-pgsql'
  '--enable-sysvshm'
  '--enable-shmop'
  '--enable-pcntl'
  '--enable-htscanner'
  '--with-tidy'
  '--enable-intl'
  '--enable-sysvsem'
  '--enable-sysvmsg'
  '--with-mysql-sock=/var/run/mysqld/mysqld.sock'
  '--with-pdo-odbc=unixODBC,/usr'
  '--with-pdo-dblib'
  '--with-gmp'
  '--with-mcrypt'
  '--with-sodium'
  '--with-password-argon2'
  '--with-readline'
  '--with-pdo-firebird'
  '--enable-timezonedb'
  '--with-avif'
  ```

## Database Setup

### 1. Hetzner PostgreSQL Database

1. Create a new PostgreSQL database in your Hetzner Cloud Console
2. Note down the connection details:
   - Host
   - Port (usually 5432)
   - Database name
   - Username
   - Password

### 2. Create Schema and Tables

Connect to your Hetzner PostgreSQL database and run the schema:

```sql
-- This will create the kfmn schema and all tables for the prayer system
-- Run the contents of database_schema.sql
```

### 3. Run Database Schema

```bash
# From the project root
psql -U prayer_user -d come_follow_me -f database_schema.sql
```

## File Structure and Upload

### 1. Upload Files

Upload the following files to your Hetzner hosting:

```
public/
├── api/
│   ├── auth.php
│   ├── config/
│   │   └── database.php
│   ├── includes/
│   │   └── functions.php
│   ├── prayers.php
│   ├── reactions.php
│   ├── scheduled-calls.php
│   └── verify.php
├── index.html
├── assets/
└── ... (other frontend files)
```

### 2. Database Configuration

The database configuration is already set up with your Hetzner credentials. If you need to change them, edit one of these files:

**Option A: Edit the config file** (Recommended)
```bash
# Edit public/api/config/config.php
$config = [
    'database' => [
        'host' => 'your-hetzner-db-host.hetzner.cloud',
        'port' => '5432',
        'name' => 'your_database_name',
        'user' => 'your_database_user',
        'password' => 'your_database_password',
        'schema' => 'kfmn'
    ]
];
```

**Option B: Edit database.php directly**
```php
// Edit public/api/config/database.php
$host = 'your-hetzner-db-host.hetzner.cloud';
$port = '5432';
$dbname = 'your_database_name';
$user = 'your_database_user';
$password = 'your_database_password';
```

## PHP Configuration

Hetzner hosting already provides PHP with PostgreSQL support as configured. The API files are designed to work without external dependencies or Composer packages.

### Important Notes

- All PHP files are in `public/api/` directory
- No URL rewriting is used (files are accessed directly)
- All database queries use prepared statements for security
- The system uses the `kfmn` schema to avoid conflicts with other applications

## SMS Verification Setup (Optional)

For production SMS verification, integrate with a service like:

### Twilio Setup

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID, Auth Token, and phone number
3. Update the SMS function in `api/verify.php`

### AWS SNS Setup

1. Set up AWS credentials
2. Update the SMS function to use AWS SDK

## Testing the Setup

### 1. Test Database Connection

Create a test file `public/test_db.php`:

```php
<?php
require_once 'api/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "Database connection successful!";
} catch (Exception $e) {
    echo "Database connection failed: " . $e->getMessage();
}
```

Access it at: `https://yourdomain.com/api/test.php`

This comprehensive test checks:
- PHP extensions are loaded
- Database connection works
- kfmn schema exists
- All required tables are present
- API files are accessible

### 2. Test API Endpoints

```bash
# Test prayer endpoint
curl -X GET https://yourdomain.com/api/prayers.php

# Test auth endpoint
curl -X POST https://yourdomain.com/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"action":"register","username":"testuser","password":"testpass"}'
```

## Security Considerations

### 1. HTTPS Only

Always serve the API over HTTPS in production:

```bash
# Using certbot for Let's Encrypt
sudo certbot --apache -d yourdomain.com
```

### 2. Password Security

The implementation uses `password_hash()` with `PASSWORD_ARGON2ID` for secure password storage.

### 3. Session Security

- Sessions expire after 30 days
- Session tokens are cryptographically secure
- Automatic cleanup of expired sessions

### 4. Input Validation

All inputs are validated and sanitized:
- SQL injection prevention via prepared statements
- XSS prevention via `htmlspecialchars()`
- Input length limits

## API Endpoints

All endpoints are accessed directly via their PHP files in the `public/api/` directory:

### Authentication
- `POST /api/auth.php` - Register/Login
- `DELETE /api/auth.php` - Logout

### Prayers
- `GET /api/prayers.php` - Get prayers with filtering
- `POST /api/prayers.php` - Create new prayer

### Reactions
- `POST /api/reactions.php` - Add reaction/comment
- `DELETE /api/reactions.php` - Remove reaction/comment

### Scheduled Calls
- `GET /api/scheduled-calls.php` - Get upcoming prayer call

### Verification
- `POST /api/verify.php` - Send/verify SMS code

### Request Format

All API endpoints expect JSON data in the request body for POST requests:

```javascript
fetch('/api/auth.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'register',
    username: 'testuser',
    password: 'password123',
    // ... other fields
  })
})
```

## Monitoring and Maintenance

### Database Maintenance

```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Clean up old sessions (runs automatically)
SELECT cleanup_expired_sessions();
```

### Log Monitoring

Check PHP error logs:
```bash
tail -f /var/log/apache2/error.log
# or
tail -f /var/log/nginx/error.log
```

Check application logs in the `api/` directory.

## Troubleshooting

### Common Issues

1. **Database connection fails**
   - Check database credentials in `public/api/config/config.php`
   - Verify Hetzner PostgreSQL credentials are correct
   - Ensure the `kfmn` schema was created
   - Test connection at `https://yourdomain.com/api/debug.php`

2. **API returns 500 error**
   - Check PHP error logs in your Hetzner control panel
   - Run `https://yourdomain.com/api/debug.php` to diagnose issues
   - Verify all PHP files were uploaded correctly
   - Check file permissions (should be 644 for files, 755 for directories)

3. **".env file does not exist" error**
   - The system uses hardcoded database credentials
   - No .env file is required - configuration is in `config.php` or `database.php`
   - If you see this error, it's likely from a different part of your application

4. **CORS errors**
   - The API includes CORS headers for local development
   - For production, ensure your domain is allowed

5. **Session issues**
   - Check if cookies are enabled in the browser
   - Verify session token storage in localStorage
   - Sessions expire after 30 days automatically

## Production Deployment on Hetzner

1. **SSL Certificate**: Hetzner provides free Let's Encrypt certificates
2. **Database Backups**: Set up automated backups in Hetzner Cloud Console
3. **Monitoring**: Use Hetzner's built-in monitoring tools
4. **Rate Limiting**: Can be implemented at the application level if needed
5. **File Permissions**: Ensure API files have correct permissions
6. **Environment Variables**: Set database credentials securely

### Security Checklist

- [ ] Database credentials are set in environment variables
- [ ] SSL certificate is active
- [ ] Database backups are scheduled
- [ ] File permissions are secure (644 for files, 755 for directories)
- [ ] No sensitive information in PHP files
- [ ] Regular security updates applied

## Support

For issues with this Hetzner setup, check:
1. Hetzner hosting control panel error logs
2. Run `/api/test.php` to diagnose issues
3. Browser developer console for frontend errors
4. Network tab for API request/response details
5. Hetzner PostgreSQL database status

## File Structure Summary

```
public/
├── api/
│   ├── auth.php                 # User authentication (register/login/logout)
│   ├── prayers.php              # Prayer CRUD operations
│   ├── reactions.php            # Emoji reactions and comments
│   ├── scheduled-calls.php      # Live prayer call management
│   ├── verify.php               # SMS verification (stub)
│   ├── test.php                 # Deployment diagnostic tool
│   ├── config/
│   │   └── database.php         # Database connection and utilities
│   └── includes/
│       └── functions.php        # Shared utility functions
├── index.html                   # Main application
└── ...                          # Other frontend files
```

All API endpoints are accessed directly (no URL rewriting needed on Hetzner).