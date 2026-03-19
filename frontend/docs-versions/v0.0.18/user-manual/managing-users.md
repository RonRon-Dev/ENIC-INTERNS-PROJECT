# Managing Users

Navigate to **Users** from the sidebar. This section is only visible to `admin` and `superadmin` roles.

## User Statuses

| Status | Meaning |
|---|---|
| `active` | Can log in and use the system |
| `pending` | Registered but not yet approved |
| `deactivated` | Account disabled — cannot log in |
| `locked` | Too many failed login attempts |

## Approving a New User

When someone registers, their account is `pending` until an admin approves it.

1. Go to **Users**
2. Find the user in the **Requests** tab
3. Select a **role** to assign them
4. Click **Approve**

The user receives a temporary password and can log in immediately.

## Creating a User Directly

Admins can create user accounts without waiting for self-registration:

1. Click **Create User**
2. Enter the user's full name, username, and assign a role
3. A temporary password is generated automatically
4. Share the temporary password with the user — they must change it on first login

## Deactivating a User

1. Find the user in the table
2. Click the action menu (⋯) on their row
3. Select **Deactivate**

Deactivated users cannot log in but their data is preserved.

## Reactivating a User

1. Find the deactivated user
2. Click the action menu → **Activate**
3. Confirm by typing their username

## Unlocking a Locked Account

1. Find the locked user
2. Click the action menu → **Unlock**

## Resetting a Password

Admins can reset any user's password:

1. Click the action menu → **Reset Password**
2. A new temporary password is generated
3. Share it with the user

Users can also request a password reset themselves via the **Forgot Password** flow — this creates a request that an admin must approve.

→ [Roles & Privileges](/user-manual/roles-privileges)
