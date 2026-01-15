# 🎬 DramaBox - Streaming Platform

A modern streaming platform for Thai-dubbed drama series built with React, TypeScript, and Vite.

## 🚀 Features

- **Browse Dramas**: Explore recommended, trending, and VIP content
- **Search**: Find your favorite dramas by keyword  
- **Watch**: Stream episodes with a native video player
- **Responsive**: Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Radix UI
- **State**: TanStack Query (React Query)
- **Routing**: React Router DOM

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd dramabox

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# API URL (your backend API endpoint)
VITE_API_URL=https://your-api-url.vercel.app

# Vercel Share Token (if using protected deployments)
VITE_API_TOKEN=_vercel_share=your_token_here
```

### Development

In development mode, the app uses a Vite proxy to bypass CORS:

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### Production Build

```bash
npm run build
```

Output will be in the `dist/` directory.

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel Dashboard:
   - `VITE_API_URL`: Your API URL
   - `VITE_API_TOKEN`: Your share token (if needed)
4. Deploy!

The `vercel.json` file is already configured for SPA routing.

### Deploy to other platforms

The built `dist/` folder is a static site that can be deployed to:
- Netlify
- GitHub Pages
- Cloudflare Pages
- Any static hosting

## 📁 Project Structure

```
dramabox/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components (routes)
│   ├── lib/            # Utilities and API functions
│   └── hooks/          # Custom React hooks
├── public/             # Static assets
├── dist/               # Production build output
└── vercel.json         # Vercel deployment config
```

## 📝 API Endpoints

The app connects to:
- `/api/home` - Home page content
- `/api/recommend` - Recommended dramas
- `/api/vip` - VIP exclusive content  
- `/api/search?keyword=` - Search dramas
- `/api/detail/:id` - Drama details
- `/api/chapters/:id` - Episode list
- `/api/video/:chapterId` - Video stream URL

## 📄 License

MIT License
