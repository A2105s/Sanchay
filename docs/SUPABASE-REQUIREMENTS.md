# Supabase Migration — Outstanding Requirements

Status of the Firebase → Supabase migration (commit `Migrate persistence and auth from Firebase to Supabase`).
The code migration is complete; the items below are the operational and security steps that are
still required before the app can be considered production-ready.

| # | Requirement | Owner | Status |
|---|-------------|-------|--------|
| 1 | Apply `supabase/schema.sql` to the Supabase project | Project admin | Not started |
| 2 | Decide and configure email-confirmation behaviour | Project admin | Not started |
| 3 | Finish MCP / tooling setup (Supabase MCP auth, optional skills) | Developer | Not started |
| 4 | Migrate existing Firestore data (optional, no export in repo) | Project admin | Not started |
| 5 | Tighten RLS policies for real users | Developer | Not started |
| 6 | Revoke leaked credentials and purge them from git history | Project admin | In progress |

---

## 1. Apply the database schema

`supabase/schema.sql` is the single source of truth for tables, indexes, RLS policies, the realtime
publication and the transfer RPCs. It has **not** been executed against the project yet, so the
tables do not exist.

1. Open the Supabase dashboard for the project in `NEXT_PUBLIC_SUPABASE_URL`.
2. Go to **SQL Editor → New query**, paste the full contents of `supabase/schema.sql`, and run it.
3. Verify with:

   ```sql
   select table_name from information_schema.tables
   where table_schema = 'public' order by table_name;
   ```

   All 10 tables (`space_users`, `spaces`, `bookings`, `space_requests`, `asset_passports`,
   `vehicles`, `audit_logs`, `automobile_station_accounts`, `station_fleet`,
   `automobile_transfer_requests`) should be listed.

4. Confirm the app sees the database: `GET /api/health/supabase` must return `200`, not `503`.
5. Until this runs, every data screen renders empty and realtime channels never receive events.

> Why it could not be applied automatically: the database host
> `db.<project-ref>.supabase.co` is IPv6-only and the development machine has no IPv6 route; the
> project was also not reachable on any pooler region.

## 2. Configure email confirmation

The project currently has `mailer_autoconfirm: false`, so Supabase sends a confirmation email and
new accounts cannot sign in until the link is clicked.

- **Keep it on** for a real deployment: configure SMTP under **Authentication → Emails** so the
  confirmation mail is delivered reliably, and keep the site URL / redirect URLs correct.
- **Turn it off** (**Authentication → Providers → Email → Confirm email**) if signup must log the
  user in immediately (demo/staging only).

## 3. Tooling setup

- Run `opencode mcp auth supabase` once to complete the OAuth flow for the Supabase MCP server
  configured in `.opencode/opencode.json`. The server URL is project-scoped; no secret is stored in
  the repo.
- `npx skills add supabase/agent-skills` is optional and unvetted. Install only if the team wants
  Supabase-specific agent guidance; it is not required by the app.

## 4. Migrate existing Firestore data (optional)

No Firestore export exists in the repository, so no data was migrated. If the old data matters:

1. Export the collections from the Firebase project (`bookings`, `asset_passports`, `audit_logs`,
   and anything under `space_users`).
2. Map documents to the Supabase columns defined in `supabase/schema.sql`
   (`src/lib/supabase-mappers.ts` documents the field mapping).
3. Import with the Supabase dashboard CSV importer or a one-off script, then spot-check counts.
4. Drop the Firebase project once the data is verified.

If the old data is disposable, skip this item.

## 5. Harden RLS before real use

The policies in `supabase/schema.sql` are intentionally permissive so the demo works without a full
identity model. Before handling real users:

- Scope reads/writes to `auth.uid()` or to a role claim instead of `using (true)`.
- Restrict booking approval, transfer approval and audit writes to ministry/admin roles.
- Keep the `SECURITY DEFINER` transfer functions executable only by authenticated roles and pin
  `search_path`.
- Re-test each screen with an anonymous session, a normal user and an admin.

## 6. Secret remediation (required)

Real credentials were committed in earlier history and are flagged by the Gitleaks workflow
(`.github/workflows/secret-scan.yml`). Removing them from the current tree is not enough — they
remain readable in git history and must be treated as compromised.

### 6.1 Rotate every exposed credential

| Credential | Where it leaked | Action |
|---|---|---|
| Context7 API key (`ctx7sk-…`) | `.vscode/mcp.json`, `docs/CONTEXT7_INTEGRATION.md` | Revoke the key in the Context7 dashboard, create a new one, put it in `.env.local` only |
| Firebase service-account private key | `service-account.json`, `setup-env.md` | Delete the key in Google Cloud IAM → Service Accounts → Keys (project `nationtrack-6b36e`) |
| Firebase Web API key (`AIza…`) | `src/lib/firebase.ts`, setup docs | Regenerate / restrict the key in Google Cloud Console, or delete the unused Firebase project |
| Legacy `JWT_SECRET` | `setup-env.md` | Never reuse it; generate a fresh value for any environment that used it |

Project-local secret values belong in `.env.local` (git-ignored). Only placeholder values belong in
`.env.example` and documentation.

### 6.2 Purge history and force-push

The repo history was rewritten with `git filter-repo` to drop `service-account.json` and the setup
documents that embedded keys, and to replace the remaining key strings. Because rewriting changes
commit IDs, the cleaned branches must be force-pushed:

```bash
git push --force-with-lease sanchay main
git push --force-with-lease origin main
git push --force-with-lease origin Vaibhav
```

Any other clone of the repository must be re-cloned (or hard-reset to the new history); do not merge
old history back in.

### 6.3 Verify and close alerts

1. Run a full-history scan: `gitleaks git . --log-opts="--all"` must report no leaks.
2. In GitHub → **Security → Secret scanning**, close the existing alerts once the keys above are
   revoked. Purged commits disappear from the network graph but GitHub keeps the historical alerts
   until they are dismissed.
3. Keep the Gitleaks workflow green; `.gitleaks.toml` only allowlists the documented fake values
   used in the code-review instructions and the env template, never real keys.
