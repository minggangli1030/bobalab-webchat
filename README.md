# Rating Platform

A Yelp-like posting, rating, and commenting platform for internal data collection. Built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- **User Authentication**: Students can create accounts with email and student ID
- **Post Creation**: Create posts with text content, images, and hashtags
- **Social Interactions**: Like posts and add comments
- **Feed View**: Browse all posts in chronological order
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd rating-platform
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/          # Main app pages
│   │   ├── feed/
│   │   ├── create-post/
│   │   └── post/[id]/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   ├── posts/           # Post-related components
│   └── shared/          # Shared components
├── lib/
│   ├── auth.ts          # Authentication utilities
│   ├── types.ts         # TypeScript interfaces
│   └── utils.ts         # Utility functions
└── contexts/
    └── AuthContext.tsx  # Authentication context
```

## Usage

### Creating an Account

1. Navigate to the signup page
2. Enter your email, student ID, formal name, and preferred name
3. Click "Create Account"

### Logging In

1. Use your email address as username
2. Use your student ID as password
3. Click "Sign In"

### Creating Posts

1. Click "Create Post" in the navigation
2. Write your post content
3. Optionally upload images and add hashtags
4. Click "Create Post"

### Interacting with Posts

- **Like**: Click the heart icon on any post
- **Comment**: Click on a post to view details and add comments
- **View Feed**: Browse all posts on the main feed page

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

The project is configured for Vercel deployment with the included `vercel.json` file.

## Future Enhancements

- Firebase Authentication integration
- Firebase Firestore for data persistence
- Firebase Storage for images
- Category filtering system
- Email verification
- Enhanced security features
- Real-time updates
- User profiles
- Search functionality

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Components

This project uses shadcn/ui for components. To add new components:

```bash
npx shadcn@latest add [component-name]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is for internal use only.
