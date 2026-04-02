# Quiz IA 🤖📚

**AI-powered interactive quiz generator** with real-time feedback, spaced repetition cards, and an intelligent tutor chatbot. Built with React, Vite, and Google Gemini API.

<div align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Vite-6.2-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square" />
  <img src="https://img.shields.io/badge/Google%20Gemini-API-blueviolet?style=flat-square" />
</div>

---

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Project Structure](#project-structure)
- [Key Features Explained](#key-features-explained)
- [Technology Stack](#technology-stack)
- [API Configuration](#api-configuration)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

---

## ✨ Features

- **🧠 AI-Powered Quiz Generation** - Dynamic quizzes created by Google Gemini based on any topic
- **🎯 Intelligent Refinement** - AI asks clarifying questions to fine-tune quiz difficulty and focus
- **📝 Multiple Question Types** - Single choice, multiple choice, open-ended, and code evaluation
- **🤖 AI Tutor Sidebar** - Real-time chat with an intelligent assistant for concept clarification
- **🎓 Spaced Repetition** - Auto-generate Anki cards from quiz conversations
- **📊 Instant Feedback** - Immediate evaluation with explanations
- **📥 Quiz History** - RxDB-powered persistent storage of all quiz sessions and projects
- **📦 Export Options** - Download quiz results, Anki cards, and chat history
- **🌙 Dark/Light Theme** - System-aware theme switching with Tailwind CSS
- **📱 Responsive Design** - Works seamlessly on desktop and mobile

---

## 📦 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- A **Google Gemini API key** - [Get it here](#obtaining-a-gemini-api-key)

**Verify your installation:**
```bash
node --version  # Should be v18+
npm --version   # Should be v9+
```

---

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/quiz-ia.git
cd quiz-ia
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

### Step 3: Initial Setup

When you first launch the app, you'll see a setup screen where you can enter your Gemini API key directly. This key will be securely encrypted and stored locally in your browser.

> **Note:** The API key is encrypted using AES-GCM and stored in your browser's localStorage. It never leaves your device.

See [Obtaining a Gemini API Key](#obtaining-a-gemini-api-key) for detailed instructions.

### Step 4: Start the Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3002**

---

## 🔑 Obtaining a Gemini API Key

### Option A: Google AI Studio (Quickest - Recommended)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Select **"Create API key in new project"** (or existing project)
4. Copy the generated API key
5. Paste it in your `.env.local` file as `VITE_GEMINI_API_KEY`

> **⚠️ Free tier includes:**
> - 15 RPM (Requests Per Minute)
> - 500,000 TPM (Tokens Per Minute)
> - No credit card required

### Option B: Google Cloud Console (For Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Generative Language API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the key and add it to `.env.local`

---

## 💻 Development

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server on port 3002 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

### Development Workflow

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Make changes** - Hot reload is enabled by default

3. **Test your changes** in http://localhost:3002

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

---

## 📁 Project Structure

```
quiz-ia/
├── App.tsx                          # Main application component & state management
├── index.tsx                        # React entry point
├── index.html                       # HTML template
├── index.css                        # Global styles & CSS variables
│
├── components/                      # Reusable React components
│   ├── ChatSidebar.tsx             # AI tutor interface
│   ├── CodeEditor.tsx              # Monaco code editor for code questions
│   ├── MarkdownRenderer.tsx        # Markdown & diagram rendering
│   ├── Mermaid.tsx                 # Mermaid diagram support
│   ├── ThemeToggle.tsx             # Light/dark theme switcher
│   ├── SetupScreen.tsx            # Initial API key setup (first launch)
│   ├── ApiKeyModal.tsx            # Modal for changing API key
│   ├── history/                    # Quiz history & project management
│   │   ├── QuizBrowserMain.tsx
│   │   ├── HistorySidebar.tsx
│   │   ├── ProjectsSection.tsx
│   │   └── CreateProjectModal.tsx
│   └── [other components...]
│
├── services/                        # External API integrations
│   └── geminiService.ts            # Google Gemini API client
│
├── repositories/                    # Data access layer (Repository pattern)
│   ├── interfaces.ts               # Repository interfaces
│   ├── schemas.ts                  # Zod validation schemas
│   ├── RepositoryContext.tsx       # React context provider
│   └── rxdb/                       # RxDB implementation
│       ├── ProjectRepository.ts
│       └── QuizSessionRepository.ts
│
├── db/                             # Database configuration
│   ├── database.ts                 # RxDB singleton initialization
│   └── schema.ts                 # RxDB JSON schemas
│
├── utils/                          # Utility functions
│   └── crypto.ts                 # AES-GCM encryption for API key
│
├── store/                          # Global state (Zustand)
│   ├── quizStore.ts               # Quiz state management
│   ├── themeStore.ts              # Theme preferences
│   └── configStore.ts            # Encrypted API key storage
│
├── hooks/                          # Custom React hooks
│   ├── useTheme.ts                # Theme hook
│   └── useConfig.ts               # API key configuration hook
│
├── constants/                      # Application constants
│   └── auth.ts                     # User ID constant
│
├── types.ts                        # TypeScript type definitions
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies & scripts
└── .env.example                    # Environment variables template
```

---

## 🎯 Key Features Explained

### Quiz Generation Flow

1. **Topic Input** - User enters a topic and selects question count (3, 5, or 10)
2. **Refinement Stage** - AI generates 3 clarifying questions about difficulty, focus, and scope
3. **Quiz Taking** - Interactive quiz with immediate feedback and explanations
4. **Results** - Score display, Anki card generation, and download options

### Question Types

- **Single Choice** - Select one correct answer
- **Multiple Choice** - Select multiple correct answers
- **Open Ended** - AI evaluates free-text responses
- **Code Questions** - Write and submit code (AI-evaluated with Monaco editor)

### Intelligent Tutor (Chat Sidebar)

- Ask questions about quiz topics
- Get concept explanations
- Request code reviews
- Generate Anki cards from conversation
- Multi-turn conversation with context awareness

### Spaced Repetition (Anki Cards)

- Auto-generated from quiz conversations
- Download as JSON for Anki desktop app
- Front/back format with HTML formatting
- Tags based on quiz topic

### Quiz History

- Stored locally using RxDB (IndexedDB)
- Organize quizzes into projects
- Search and filter by tags
- Full quiz session persistence

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 6.2** - Build tool & dev server
- **Tailwind CSS 4** - Utility-first styling

### State Management
- **Zustand 5** - Global state (quiz, theme)
- **RxJS 7.8** - Reactive streams
- **RxDB 16** - Offline-first database

### AI & APIs
- **Google Gemini API** - AI quiz generation via `@google/genai`

### UI Components
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering
- **Mermaid** - Diagram support
- **Monaco Editor** - Code editor for code questions
- **React Syntax Highlighter** - Code highlighting

### Data & Validation
- **Zod 4** - Schema validation
- **Nanoid** - Unique ID generation
- **Canvas Confetti** - Celebration animations

---

## 🌐 API Configuration

### How the App Uses Gemini API

The application makes API calls for:

1. **Generating Refinement Questions** - `gemini-3-flash-preview`
2. **Creating Quizzes** - `gemini-3-pro-preview`
3. **Evaluating Answers** - `gemini-3-flash-preview`
4. **AI Tutor Chat** - `gemini-3-pro-preview`
5. **Anki Card Generation** - `gemini-3-flash-preview`

### Rate Limits & Quotas

Free tier limits:
- **15 RPM** (Requests Per Minute)
- **500,000 TPM** (Tokens Per Minute)

For higher limits, upgrade to a paid plan in Google Cloud Console.

### Error Handling

The app includes automatic error handling for:
- Rate limit exceeded (429)
- Invalid API key (401)
- Permission denied (403)
- Network errors

Messages are displayed in Spanish (configurable in `geminiService.ts`).

---

## 🔐 Security

### API Key Encryption

Your API key is protected using:

- **AES-GCM 256-bit encryption** - Industry-standard symmetric encryption
- **PBKDF2 key derivation** - 100,000 iterations with SHA-256
- **Unique salt per key** - Each stored key has its own cryptographic salt
- **Browser-only storage** - Key is encrypted/decrypted locally, never sent to any server

### How It Works

1. When you enter your API key, it's encrypted using a key derived from your browser
2. The encrypted key is stored in localStorage
3. When the app needs to use the API, the key is decrypted in memory
4. If you clear your browser data, you'll need to re-enter the API key

### Changing Your API Key

1. Click the 🔑 icon in the navigation header
2. Enter your new API key
3. Test the connection
4. Save

### Important Security Notes

1. **Never share your API key** - Google AI Studio allows you to create multiple keys
2. **Regenerate if exposed** - If your key is compromised, regenerate it in Google AI Studio
3. **Keys are device-specific** - Since keys are stored locally, clearing browser data will remove them

---

## 🐛 Troubleshooting

### Port 3002 Already in Use

```bash
# Change the port in vite.config.ts or use:
npm run dev -- --port 3001
```

### API Key Not Found

When you see the setup screen on first launch, simply enter your Gemini API key and click "Probar conexión" to verify it works.

If you've already configured a key and it's not working:
1. Click the 🔑 icon in the navigation header
2. Re-enter your API key
3. Test the connection again

### Build Fails with Module Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Errors (RxDB)

If you see RxDB initialization errors:

1. Check browser console for specific error
2. Clear IndexedDB: DevTools → Application → IndexedDB → Delete
3. Refresh the page
4. Restart dev server

### Gemini API Rate Limit

```
Error: RESOURCE_EXHAUSTED
```

**Explanation:** Free tier has 15 requests/minute limit.

**Solutions:**
- Wait a minute before making new requests
- Upgrade to a paid plan for higher limits
- Optimize prompts to reduce token usage

---

## 📚 Additional Resources

- [Google Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [RxDB Documentation](https://rxdb.info/)

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

---

## 📞 Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [CLAUDE.md](CLAUDE.md) file for architecture details
3. Check existing GitHub issues
4. Create a new issue with detailed information

---

<div align="center">
  <p>Built with ❤️ using React, Vite, and Google Gemini API</p>
  <p><strong>Made with passion for learning and AI innovation</strong></p>
</div>
