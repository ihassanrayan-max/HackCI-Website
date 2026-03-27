# Deployment

## Git Remotes

This project uses **two** GitHub repos:

| Remote   | Repo                  | Purpose                          |
|----------|------------------------|----------------------------------|
| `origin` | HackCI-Website         | Main source repo                 |
| `vercel` | ci-tech-comp-w2026     | Vercel deployment (CITech site)   |

**Important:** Commits must be pushed to **both** so Vercel deploys the latest code.

`git push origin main` is configured to push to both. For manual control:

```bash
git push origin main
git push vercel main
```
