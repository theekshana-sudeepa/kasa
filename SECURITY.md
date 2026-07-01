# Security Policy — KASA

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x | ✅ Current |

## Reporting a Vulnerability

If you discover a security vulnerability in KASA, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email your report to the maintainer with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. You will receive an acknowledgment within 48 hours
4. A fix will be prioritized and released as soon as possible

### What Qualifies

- Authentication or authorization bypasses
- Data exposure or leakage
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Injection attacks (SQL, NoSQL, command)
- Sensitive data in logs or error messages
- API key exposure

### What Does NOT Qualify

- Denial of service attacks
- Social engineering
- Issues in third-party dependencies (report to the upstream project)
- Theoretical vulnerabilities without proof of concept

## Security Best Practices

### For Deployment

1. **Never commit API keys** — Use environment variables exclusively
2. **Enable HTTPS** — Required for voice input and secure communication
3. **Keep dependencies updated** — Run `npm audit` regularly
4. **Restrict API routes** — Use rate limiting in production
5. **Monitor logs** — Watch for unusual patterns

### Built-in Security

KASA includes several security measures:

- **Security headers** — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- **No `poweredByHeader`** — X-Powered-By header is disabled
- **Input validation** — All API inputs are validated before processing
- **Session TTL** — Server-side sessions expire after 1 hour
- **No persistent storage** — No user data is stored on disk

---

*Security policy maintained by [ThikkaBro](https://github.com/ThikkaBro)*
