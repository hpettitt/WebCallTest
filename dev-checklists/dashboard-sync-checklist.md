# Dashboard Sync & Code Hygiene Checklist

Use this checklist before merging, deploying, or making major changes to dashboard-related files. This helps prevent issues with duplicate files, out-of-sync code, and accidental production errors.

## 1. File Location & Duplication
- [ ] Confirm there is only one production version of each dashboard file (HTML, JS, CSS)
- [ ] Remove or clearly mark any demo/dev copies (e.g., dashboard-demo/)
- [ ] All production files are in `server/public/dashboard/`

## 2. Code Consistency
- [ ] All recent changes are present in both dev and production dashboard folders (if both exist)
- [ ] No feature or bugfix is present in only one location
- [ ] All references to authentication/token usage are consistent (e.g., `auth.currentUser.secureToken`)

## 3. Sensitive Data
- [ ] No sensitive files (tokens, secrets) are present in dashboard folders
- [ ] `.gitignore` is up to date and covers all sensitive/irrelevant files

## 4. Testing
- [ ] All dashboard features tested locally before pushing to production
- [ ] Users, delete, and other admin features tested with real data
- [ ] Hard refresh performed to verify latest code is loaded

## 5. Documentation
- [ ] Each dashboard folder contains a short README explaining its purpose
- [ ] Any non-production files are clearly marked as such

## 6. Deployment
- [ ] All changes committed and pushed to the correct branch
- [ ] Production deployment tested after push

---

_Review this checklist before every major dashboard update or deployment!_
