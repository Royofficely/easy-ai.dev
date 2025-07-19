# Clerk Setup Instructions

## 1. Create Clerk Account
- Go to https://clerk.com/
- Sign up or sign in
- Create a new application called "EasyAI"

## 2. Get API Keys
- Go to API Keys section
- Copy the Publishable Key (starts with `pk_`)
- Copy the Secret Key (starts with `sk_`)

## 3. Update Environment Variables

### For Dashboard (.env):
```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### For Server (.env):
```
CLERK_SECRET_KEY=sk_live_...
```

## 4. Configure Domains
- Add your domain to allowed origins
- Set redirect URLs:
  - Sign-in: `http://localhost:4000/dashboard`
  - Sign-up: `http://localhost:4000/dashboard`
  - After sign-in: `/dashboard`
  - After sign-up: `/dashboard`

## 5. Publish to NPM
After testing locally, publish with:
```bash
npm version patch
npm publish
```

## Current Status
✅ Clerk integration complete
✅ Black/white theme applied
✅ CLI mode preserved (API key auth)
✅ Web mode shows Clerk signin
⏳ Need real Clerk API keys for production