# Branching Strategy

## Overview
This repository uses a three-branch strategy to manage different deployment scenarios and feature development for the Bloom Buddies Interview Automation System.

---

## Branch Structure

### 1. `main` Branch (Production-Ready)
**Purpose**: Stable, production-ready code  
**Use Case**: Deploy to production hosting (Railway, Render, Heroku, etc.)  
**Audience**: Production deployments, client-facing systems

**Characteristics**:
- ✅ Complete, tested features
- ✅ Production-ready configurations
- ✅ Secure authentication (2FA enabled for admin)
- ✅ All integrations working (Airtable, VAPI, n8n)
- ✅ Comprehensive documentation
- ⚠️ Requires proper `.env` configuration for deployment

**Environment Variables Required**:
- Airtable credentials (PAT, Base ID, Table Name)
- VAPI credentials (API Key, Assistant ID)
- n8n webhook URL
- Email/JWT settings

---

### 2. `demo` Branch (Demonstration & Testing)
**Purpose**: Demo-friendly version for presentations and testing  
**Use Case**: Show potential clients, test workflows, training sessions  
**Audience**: Sales demos, client presentations, internal testing

**Characteristics**:
- ✅ All features from `main`
- ✅ Demo-friendly 2FA codes (123456, 000000)
- ✅ Sample data configurations
- ✅ Easy setup for quick demos
- 📝 Clear documentation for demo scenarios
- 📝 Pre-configured test users

**Intended Future Changes** (when ready):
- Add `.env.example.demo` with dummy values
- Include sample Airtable test data
- Add demo-specific README with quick-start instructions
- Configure for localhost testing without production credentials
- Add visual indicators showing "DEMO MODE"

**Demo Test Accounts**:
```
Admin (2FA Required):
- Email: admin@bloombuddies.com
- Password: secure123
- 2FA Code: 123456 or 000000

HR Manager (2FA Optional):
- Email: hr@bloombuddies.com
- Password: hr2024secure!

Interviewer (2FA Optional):
- Email: interviewer@bloombuddies.com
- Password: interviewer2024!
```

---

### 3. `enhanced` Branch (Advanced Features)
**Purpose**: Experimental and production-enhanced features  
**Use Case**: Development of advanced features, production improvements  
**Audience**: Development team, beta testing, advanced deployments

**Characteristics**:
- ✅ All features from `main`
- 🔄 Advanced 2FA options (TOTP, SMS, Email)
- 🔄 Enhanced security features
- 🔄 Performance optimizations
- 🔄 Additional integrations
- 🔄 Advanced analytics

**Intended Future Changes** (when ready):
- Implement Google Authenticator / Authy (TOTP)
- Add SMS-based 2FA via Twilio
- Add Email-based 2FA codes
- Server-side credential management (no client-side secrets)
- Rate limiting and DDoS protection
- Advanced logging and monitoring
- Database migration from Airtable to PostgreSQL/MySQL (optional)
- Role-based access control (RBAC) enhancements
- Audit trail for all actions
- Backup and recovery systems
- Multi-language support
- Advanced reporting dashboard

---

## Branching Workflow

### Development Flow
```
main (stable)
├── demo (demo features)
└── enhanced (experimental features)
```

### Making Changes

#### For Production Fixes (main)
```powershell
git checkout main
git pull origin main
# Make changes
git add .
git commit -m "Fix: description"
git push origin main
```

#### For Demo Features (demo)
```powershell
git checkout demo
git pull origin demo
# Make changes
git add .
git commit -m "Demo: description"
git push origin demo
```

#### For Experimental Features (enhanced)
```powershell
git checkout enhanced
git pull origin enhanced
# Make changes
git add .
git commit -m "Enhanced: description"
git push origin enhanced
```

### Merging Strategy

**Demo → Main** (rare, only stable demo features):
```powershell
git checkout main
git merge demo
git push origin main
```

**Enhanced → Main** (when features are stable):
```powershell
git checkout main
git merge enhanced
# Resolve conflicts
git push origin main
```

**Main → Demo/Enhanced** (sync updates):
```powershell
git checkout demo
git merge main
git push origin demo

git checkout enhanced
git merge main
git push origin enhanced
```

---

## Deployment Guide

### Deploy from `main` (Production)
```powershell
# Railway
railway up

# Render
git push render main:master

# Heroku
heroku git:remote -a your-app-name
git push heroku main
```

### Deploy from `demo` (Testing Environment)
```powershell
# Create separate demo instance
railway up --environment demo
# or
git push demo-heroku demo:master
```

### Deploy from `enhanced` (Beta/Staging)
```powershell
# Create staging environment
railway up --environment staging
# or
git push staging-heroku enhanced:master
```

---

## Branch Protection Rules (Recommended)

### On GitHub:
1. Go to **Settings** → **Branches**
2. Add branch protection rule for `main`:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

3. Add branch protection rule for `enhanced`:
   - ✅ Require pull request reviews before merging

4. Leave `demo` unprotected for quick iterations

---

## Current Status

| Branch | Status | Last Updated | Commits | Purpose |
|--------|--------|--------------|---------|---------|
| `main` | ✅ Stable | Nov 13, 2025 | e2214d0 | Production deployment |
| `demo` | 🆕 New | Nov 13, 2025 | e2214d0 | Demo/testing (matches main) |
| `enhanced` | 🆕 New | Nov 13, 2025 | e2214d0 | Future enhancements (matches main) |

---

## Feature Matrix

| Feature | main | demo | enhanced |
|---------|------|------|----------|
| Token Validation | ✅ | ✅ | ✅ |
| VAPI Integration | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| 2FA (Demo Codes) | ✅ | ✅ | 🔄 Upgrade |
| CV Integration | ✅ | ✅ | ✅ |
| Airtable DB | ✅ | ✅ | 🔄 Optional migration |
| TOTP (Google Auth) | ❌ | ❌ | 🔄 Planned |
| SMS 2FA | ❌ | ❌ | 🔄 Planned |
| Email 2FA | ❌ | ❌ | 🔄 Planned |
| Rate Limiting | ❌ | ❌ | 🔄 Planned |
| Advanced Analytics | ❌ | ❌ | 🔄 Planned |
| Multi-language | ❌ | ❌ | 🔄 Planned |

---

## Quick Reference

### View All Branches
```powershell
cd "J:\My Drive\AI\Clients\Patrick Aipoh\pages\WebCallTest\server"
git branch -a
```

### Switch Branches
```powershell
git checkout main      # Production
git checkout demo      # Demo mode
git checkout enhanced  # Advanced features
```

### Check Current Branch
```powershell
git branch --show-current
```

### Sync Local with Remote
```powershell
git fetch origin
git pull origin main
git pull origin demo
git pull origin enhanced
```

---

## Troubleshooting

### Conflict Between Branches
```powershell
# When merging causes conflicts
git merge main
# Fix conflicts in files
git add .
git commit -m "Merge: resolved conflicts"
git push
```

### Accidentally Committed to Wrong Branch
```powershell
# Undo last commit (keep changes)
git reset --soft HEAD~1
# Switch to correct branch
git checkout correct-branch
# Commit again
git add .
git commit -m "Your message"
git push
```

### Want to Copy File from Another Branch
```powershell
# Copy specific file from demo to current branch
git checkout demo -- path/to/file
git add path/to/file
git commit -m "Copied file from demo branch"
```

---

## Best Practices

### ✅ DO:
- Keep `main` stable and deployable at all times
- Test features in `enhanced` before merging to `main`
- Use `demo` for client presentations
- Commit frequently with clear messages
- Pull before pushing to avoid conflicts
- Use descriptive commit messages

### ❌ DON'T:
- Commit directly to `main` without testing
- Force push to shared branches (`git push -f`)
- Leave unfinished features in `main`
- Mix demo-specific configs into `main`
- Push sensitive credentials to any branch

---

## Environment-Specific Configs

### Main Branch (.env)
```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
# ... production credentials
```

### Demo Branch (.env.demo)
```env
NODE_ENV=demo
FRONTEND_URL=http://localhost:3000
# ... demo/test credentials
```

### Enhanced Branch (.env.enhanced)
```env
NODE_ENV=staging
FRONTEND_URL=https://staging.your-domain.com
# ... staging credentials with advanced features
```

---

## Release Process

### Version 1.0 Release Checklist
- [ ] All features tested in `enhanced`
- [ ] Merge stable features to `main`
- [ ] Update version in `package.json`
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Deploy to production
- [ ] Create GitHub release with changelog

---

## Support & Questions

**For Branch Strategy Questions:**
- Review this document
- Check git documentation: https://git-scm.com/doc
- Contact development team

**For Deployment Issues:**
- See `SETUP_GUIDE.md`
- Check branch-specific README files
- Review deployment platform docs

---

**Document Version**: 1.0  
**Last Updated**: November 13, 2025  
**Maintained By**: Development Team
