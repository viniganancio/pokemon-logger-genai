# 🎮 Pokemon Logger - Pokemon Trainer Collection Manager

A full-stack Pokemon collection manager built with React, TypeScript, Express, and SQLite. Features AI-powered Pokemon identification and custom Pokemon character creation using AWS Bedrock.

![Pokemon Logger Demo](https://img.shields.io/badge/Status-Ready%20to%20Play-brightgreen)
![Backend](https://img.shields.io/badge/Backend-Express%20+%20TypeScript-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20+%20Vite-purple)
![Database](https://img.shields.io/badge/Database-SQLite-orange)
![AI](https://img.shields.io/badge/AI-AWS%20Bedrock-yellow)

## 🌟 Features

### Core Functionality
- 🔐 **User Authentication** - Secure JWT-based auth with bcrypt password hashing
- 🔍 **Pokemon Search** - Search Pokemon by name/ID with complete stats and info
- 📱 **Collection Management** - Add Pokemon to categories (Caught, Want to Catch, Favorites)
- 📊 **Collection Statistics** - Track your progress with detailed stats dashboard
- 🎯 **Discovery Mode** - Discover random Pokemon or browse by generation
- 📄 **Pagination & Filtering** - Efficient browsing with category filters

### AI-Powered Features
- 📸 **Pokemon Image Recognition** - Upload Pokemon images for AI identification
- 🎨 **Pokemon Character Creator** - Transform people into custom Pokemon characters
- 🖼️ **AI Image Generation** - Generate Pokemon artwork using Stable Diffusion
- 🧠 **Smart Analysis** - Claude AI analyzes photos to create unique Pokemon

### Technical Features
- 🚀 **Real-time Updates** - Instant collection synchronization
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🔒 **Secure File Upload** - AWS S3 integration with signed URLs
- ⚡ **Performance Optimized** - Fast loading and smooth interactions

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite3 (local file-based)
- **Authentication**: JWT + bcryptjs
- **File Storage**: AWS S3
- **AI Services**: AWS Bedrock (Claude 4 Sonnet + Stable Diffusion XL)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: React Context + useState
- **Routing**: React Router v6
- **HTTP Client**: Fetch API
- **Icons**: Lucide React

### External APIs
- **PokeAPI**: Pokemon data (names, types, stats, images)
- **AWS Bedrock**: AI-powered Pokemon identification and generation
- **AWS S3**: Secure image storage with presigned URLs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- AWS account (for AI features)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pokemon-logger-genai
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration (see Configuration section)

# Start development server
npm run dev
```
Backend will run on `http://localhost:3001`

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start development server
npm run dev
```
Frontend will run on `http://localhost:8000`

### 4. Access the Application
- Open `http://localhost:8000` in your browser
- Create a new account or login
- Start collecting Pokemon! 🎉

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here

# AWS Configuration (required for AI features)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SESSION_TOKEN=your-session-token  # If using temporary credentials
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Database (optional - defaults to local SQLite file)
DATABASE_PATH=./pokemon_logger.db
```

### AWS Setup

To enable AI features, you need:

1. **AWS Account** with access to:
   - Amazon Bedrock (Claude 4 Sonnet model)
   - Amazon Bedrock (Stable Diffusion XL model)
   - Amazon S3 (for image storage)

2. **S3 Bucket** for image uploads:
   ```bash
   aws s3 mb s3://your-pokemon-bucket-name
   ```

3. **Bedrock Model Access**:
   - Request access to Claude 4 Sonnet in AWS Console
   - Request access to Stable Diffusion XL in AWS Console

## 🎮 How to Use

### 1. Create Account & Login
- Navigate to the app and click "Sign Up"
- Fill in your trainer name, email, and password
- Login with your credentials

### 2. Search Pokemon
- Go to "Search Pokemon" tab
- Type a Pokemon name (e.g., "pikachu", "charizard")
- View detailed stats, types, and image
- Add to your collection with custom notes

### 3. Manage Collection
- Visit "My Collection" tab
- Filter by categories: All, Caught, Want to Catch, Favorites
- Edit notes or change categories
- Remove Pokemon from collection

### 4. Discover New Pokemon
- Use "Discover" tab to find random Pokemon
- Browse by generation (Gen 1-9)
- Set discovery mode: Random or Sequential
- Pagination for easy browsing

### 5. AI Pokemon Recognition
- Go to "Camera" tab
- Upload an image of a Pokemon
- AI will identify the Pokemon automatically
- Add identified Pokemon to your collection

### 6. Create Custom Pokemon
- Visit "Creator" tab
- Upload a photo of yourself or someone else
- AI analyzes the person and creates a unique Pokemon character
- View generated stats, abilities, and artwork
- Save your custom Pokemon to favorites

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Hot reload with ts-node-dev
```

### Frontend Development
```bash
cd frontend
npm run dev  # Hot reload with Vite
```

### Building for Production
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [PokeAPI](https://pokeapi.co/) - Pokemon data and images
- [AWS Bedrock](https://aws.amazon.com/bedrock/) - AI-powered features
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

**Happy Pokemon Training! Gotta collect 'em all! 🎮⚡**

Made with ❤️ by Pokemon enthusiasts for Pokemon enthusiasts.