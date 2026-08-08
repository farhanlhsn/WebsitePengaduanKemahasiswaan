# SSO & Code Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement optional SSO UI and clean up code debt (auth controller error handling, frontend theme, and login state).

**Architecture:** We use environment variable flags to toggle the SSO UI in the frontend. Backend auth routes get refactored for consistent JSON error structures. The frontend theme gets stripped of massive hardcoded shadow arrays.

**Tech Stack:** React, Material UI, Zustand, Node.js, Express

## Global Constraints

- Do not alter the PostgreSQL database schema (vendor spec pending).
- All backend responses must maintain the `{ status: '...', message: '...' }` structure or be standardized to it.
- Keep the `shadows` length in `getTheme` valid for MUI (must provide at least standard MUI shadows or use createTheme defaults).

---

### Task 1: Environment & Store Setup

**Files:**
- Modify: `frontend/.env.example`
- Modify: `frontend/src/stores/authStore.js`

**Interfaces:**
- Produces: `VITE_ENABLE_SSO` in `.env.example`, empty `loginSSO` function in `authStore.js`

- [ ] **Step 1: Add environment variable flag**

```bash
# Add to frontend/.env.example and frontend/.env (if exists)
echo "VITE_ENABLE_SSO=false" >> frontend/.env.example
if [ -f frontend/.env ]; then echo "VITE_ENABLE_SSO=false" >> frontend/.env; fi
```

- [ ] **Step 2: Add placeholder function to authStore.js**

Edit `frontend/src/stores/authStore.js` to add an empty `loginSSO` function to the store state.

```javascript
      loginSSO: async () => {
        // Placeholder for future SSO integration
        set({ loading: true, error: null });
        try {
          // Await future vendor integration
          throw new Error('Fitur SSO sedang dalam pengembangan');
        } catch (error) {
          set({ error: error.response?.data?.message || error.message, loading: false });
          throw error;
        }
      },
```

- [ ] **Step 3: Commit**

```bash
git add frontend/.env.example frontend/src/stores/authStore.js
git commit -m "feat: add SSO environment flag and store placeholder"
```

---

### Task 2: Frontend Theme Cleanup

**Files:**
- Modify: `frontend/src/theme.jsx`

**Interfaces:**
- Consumes: Nothing
- Produces: Cleaner `theme.jsx` without the massive duplicated `shadows` array.

- [ ] **Step 1: Clean up shadows array in theme.jsx**

Edit `frontend/src/theme.jsx` and remove the massive hardcoded `shadows` array entirely, relying on MUI's defaults, or keep only a standard set of 25 shadows if custom ones are strictly needed. The current file has a duplicated section in the array. Replace it with `createTheme`'s default behavior for shadows or a clean array of exactly 25 elements.

- [ ] **Step 2: Verify linter passes on theme.jsx**

Run: `cd frontend && npx eslint src/theme.jsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/theme.jsx
git commit -m "refactor(ui): remove duplicated shadows array in theme"
```

---

### Task 3: Backend Auth Controller Refactor

**Files:**
- Modify: `backend/src/controllers/authControllers.js`

**Interfaces:**
- Consumes: Existing Express route structure
- Produces: Consistent error responses

- [ ] **Step 1: Standardize error responses in authControllers.js**

Edit `backend/src/controllers/authControllers.js`. Find `exports.login` and ensure the catch block returns `{ status: 'error', message: error.message }` instead of `{ error: '...', message: '...' }`. Do the same for `logout` and `refreshToken` functions if they have inconsistent error structures.

```javascript
    res.status(401).json({ status: 'error', message: error.message || 'Login failed' });
```

- [ ] **Step 2: Run backend tests**

Run: `cd backend && npm test`
Expected: PASS (all tests pass)

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/authControllers.js
git commit -m "refactor(api): standardize error response format in auth controllers"
```

---

### Task 4: Frontend Login UX & SSO Button

**Files:**
- Modify: `frontend/src/pages/LoginPage.jsx`

**Interfaces:**
- Consumes: `VITE_ENABLE_SSO` from env, `loginSSO` from `authStore.js`
- Produces: Updated UI with optional SSO button

- [ ] **Step 1: Implement state cleanup and SSO button**

Edit `frontend/src/pages/LoginPage.jsx`. 
1. Import `loginSSO` from `useAuthStore`.
2. Add a `useEffect` to clear errors on component unmount:
```javascript
  React.useEffect(() => {
    return () => clearError();
  }, [clearError]);
```
3. Add the SSO button block after the regular login button, wrapped in the feature flag check:
```javascript
                {import.meta.env.VITE_ENABLE_SSO === 'true' && (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={() => loginSSO().catch(console.error)}
                    sx={{ mb: 3, borderRadius: 3, py: 1.5, fontWeight: 'bold' }}
                  >
                    Login dengan SSO Kampus
                  </Button>
                )}
```

- [ ] **Step 2: Verify linter passes on LoginPage.jsx**

Run: `cd frontend && npx eslint src/pages/LoginPage.jsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.jsx
git commit -m "feat(ui): add optional SSO login button and improve state cleanup"
```
