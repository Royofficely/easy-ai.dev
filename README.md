# Easy AI Dev

A modern landing page for Easy AI Dev with Clerk authentication integration.

## Features

- 🎨 Modern, responsive design with Tailwind CSS
- 🔐 Secure authentication with Clerk
- ⚡ Built with Next.js 14 and TypeScript
- 📊 Analytics dashboard
- 📝 Prompt management system
- ⚙️ Settings configuration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Clerk account for authentication

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Royofficely/easy-ai.dev.git
cd easy-ai.dev
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
easy-ai.dev/
├── app/              # Next.js app directory
├── components/       # React components
├── public/          # Static assets
├── package.json     # Dependencies
└── README.md        # This file
```

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Royofficely/easy-ai.dev)

## License

MIT