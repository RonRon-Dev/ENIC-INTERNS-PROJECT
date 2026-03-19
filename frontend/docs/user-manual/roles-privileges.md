# Roles & Privileges

The ENIC MIS uses **role-based access control (RBAC)**. Each page in the system can be restricted to specific roles.

## Available Roles

| Role | Description |
|---|---|
| `guest` | Minimal access — read-only limited pages |
| `operations` | Data Cleaning Tool and operations pages |
| `managers` | Operations access + management views |
| `marketing` | Marketing-specific pages |
| `documentations` | Documentation pages |
| `it` | IT management access |
| `admin` | Full access except superadmin functions |
| `superadmin` | Unrestricted full system access |
| `dev` | Developer access for testing and maintenance |

## Configuring Page Privileges

Admins and superadmins can control which roles can access each page.

1. Go to **Users**
2. Click **Privileges** (or the shield icon in the toolbar)
3. The **Privileges Dialog** opens with two views:

### By Page (default)
- Browse the page tree on the left
- Select a page to edit its allowed roles on the right
- Toggle individual roles on or off
- Click **Save** to apply

### Matrix View
- See all pages and all roles in a grid
- Toggle individual cells to grant/revoke access
- Save the entire matrix at once

::: info
The **Home** page is always accessible to all roles and cannot be restricted.
:::

## Maintenance Mode

Individual pages can be put into **Maintenance Mode** — users without admin access see a maintenance message instead of the page content.

Toggle maintenance mode per page in the Privileges dialog.

::: warning
Maintenance mode affects all non-admin users immediately. Use carefully in production.
:::
