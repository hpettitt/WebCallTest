# Git Branching Workflow (Best Practices)

Follow this workflow to keep your codebase stable and organized:

## 1. Main Branch
- `main` always contains production-ready code
- Only merge tested, reviewed code into `main`
- Deployments should come from `main`

## 2. Feature Branches
- Create a new branch for each feature or bugfix:  
  `git checkout -b feature/your-feature-name`
- Work and commit on your feature branch
- Keep feature branches focused and small if possible

## 3. Pull Requests (PRs)
- When your feature is ready, open a PR to merge into `main`
- Review code (self or with team), test, and resolve conflicts
- Only merge after all checks pass

## 4. Merging
- Use `git merge` or PR merge button to bring changes into `main`
- Delete feature branch after merge to keep repo clean

## 5. Hotfixes
- For urgent production fixes, create a branch from `main` (e.g., `hotfix/issue-name`)
- Merge back into `main` after testing

## 6. Syncing
- Regularly pull from `main` to keep your feature branch up to date:
  `git pull origin main`
- Resolve any conflicts early

---

**Diagram:**

```
main ──────────────●─────────────●─────────────●─────────▶
                   │             │             │
feature/foo  ──────●───●───●─────┘
feature/bar      ──●───●───●─────────┘
hotfix/urgent    ──●───●────┘
```

- Circles = commits
- Arrows = merges

---

_Stick to this workflow for a clean, reliable codebase!_
