# Multi-Tenancy Practice

A learning project for exploring how to build a **multi-tenant SaaS backend**.
The goal isn't to ship a polished product — it's to build (and compare) the
three common approaches to multi-tenancy in one codebase, using a small
project-management app as the domain to hang them on.

## The three multi-tenancy strategies

Every organization (tenant) picks a `strategy` when it's created, so the same
codebase can demonstrate all three data-isolation models side by side:

| Strategy | Description | Isolation |
|---|---|---|
| `shared` | One database, one set of tables, rows scoped by `tenant_id` and enforced with Postgres **Row-Level Security (RLS)** | Weakest, but backed by RLS policies instead of relying purely on `WHERE tenant_id = ...` in app code |
| `schema` | One database, a separate Postgres **schema** per tenant | Stronger — tenants can't accidentally query each other's tables |
| `database` | A completely separate **database** per tenant | Strongest |

## Domain model

The app is a small **project management system** used as a vehicle for
practicing tenancy patterns:

- **Platform admins** are the operators of the whole system. They log in and
  can create **organizations**.
- **Organizations** are the **tenants**. Each one picks an isolation strategy
  (`shared` / `schema` / `database`).
- **Users** belong to exactly one organization and have a role of either:
  - `org-admin` — can manage users within their own organization
  - `org-user` — a regular member of the organization
- **Projects** live under an organization.
- **Project members** are users who've been added to a specific project.

```
admin
 └── creates organizations (tenants)
       └── organizations have users (org-admin / org-user)
             └── organizations have projects
                   └── projects have members (users added to that project)
```
