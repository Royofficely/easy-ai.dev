# EasyAI Landing Page

Beautiful landing page for EasyAI CLI with Clerk authentication, built with Next.js 14 and matching the dashboard design system.

## Features

- 🎨 **Consistent Design**: Matches the EasyAI dashboard design language perfectly
- 🔐 **Clerk Authentication**: Secure user sign-up/sign-in with email verification  
- 📱 **Responsive**: Beautiful on all device sizes
- ⚡ **Fast**: Built with Next.js 14 and optimized for performance
- 🎯 **Conversion Focused**: Clear CTAs and onboarding flow
- 📊 **Analytics Ready**: Easy to add tracking pixels
- 🌐 **SEO Optimized**: Meta tags, OpenGraph, and Twitter cards

## Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure Clerk**:
   - Copy `.env.example` to `.env.local`  
   - Get your Clerk keys from [dashboard.clerk.dev](https://dashboard.clerk.dev)
   - Add them to `.env.local`

3. **Run development server**:
```bash
npm run dev
```

## Design System

The landing page uses the exact same design system as the EasyAI dashboard:

- **Colors**: Pure black & white with subtle grays
- **Typography**: System fonts with careful spacing
- **Components**: Cards, buttons, and forms match dashboard
- **Animations**: Subtle micro-interactions
- **Layout**: Clean, minimal, professional

## User Flow

1. **Landing Page**: Beautiful hero with install command
2. **Sign Up**: Clerk handles authentication
3. **Dashboard**: Shows personalized install command with API key
4. **CLI Usage**: Users copy command and start using EasyAI

## Pages

- `/` - Landing page with features and demo
- `/dashboard` - Post-login dashboard with API key
- Authentication handled by Clerk middleware

## Deployment

Deploy to Vercel, Netlify, or any Node.js host:

```bash
npm run build
npm start
```

Make sure to set environment variables in your deployment platform.

## Customization

- Update colors in `tailwind.config.js` and `globals.css`
- Modify content in `app/page.tsx` 
- Add tracking scripts in `layout.tsx`
- Customize Clerk styling in Clerk dashboard