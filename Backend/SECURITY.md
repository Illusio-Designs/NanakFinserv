# Security — secret rotation & history purge

The code no longer contains any hardcoded secrets (all env-driven, with a
production fail-fast if `JWT_SECRET` is unset). However, the **old values were
committed in earlier history and must be treated as compromised**. Rotate them
on the source services and scrub history.

## 1. Rotate the leaked credentials (on their services)
| Secret | Where it lived | Rotate at |
|--------|----------------|-----------|
| JWT signing secret | `app/config/authConfig.js` | generate a new one (below) and set `JWT_SECRET` |
| DB password | `app/config/db.config.js` (deleted) | your MySQL server — change the user's password, update `PASSWORD` |
| Gmail app password | `app/config/authConfig.js` | Google Account → App passwords → revoke old, create new → `SMTP_PASS` |
| MSG91 auth key | frontend widget config | MSG91 dashboard → regenerate → set `MSG91_AUTH_KEY` |

Generate a strong JWT secret:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Rotating `JWT_SECRET` invalidates existing tokens — users simply log in again.

## 2. Purge the secrets from git history
Removing them from the latest commit is **not** enough; they remain in old
commits. Use git-filter-repo (preferred) on a fresh clone, then force-push.

```bash
pip install git-filter-repo
git clone <repo> repo-clean && cd repo-clean

# Strip the files that ever held secrets from ALL history:
git filter-repo --invert-paths \
  --path Backend/app/config/db.config.js \
  --path Backend/app/config/database.js \
  --path Backend/.env

# And/or replace specific leaked literals everywhere:
cat > /tmp/replacements.txt <<'EOF'
DKM3M9879qw8erAszKHmSJEjD0mfd78s==>***REMOVED***
jqnd ukhd jvmb zzhk==>***REMOVED***
zymr@123==>***REMOVED***
EOF
git filter-repo --replace-text /tmp/replacements.txt

git push --force --all && git push --force --tags
```
> ⚠️ History rewrite is destructive and changes commit SHAs. Coordinate with
> everyone working on the repo (they must re-clone). Rotation in step 1 is what
> actually protects you — do it regardless of the purge.

## 3. After rotating
- Set the new values as environment variables in the deploy environment
  (see `DEPLOY.md` / `.env.example`). Never commit real `.env`.
- Confirm `git ls-files | grep -i env` shows only `.env.example`.
