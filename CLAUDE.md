# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Quiz IA** is a React + Vite web application that generates dynamic, AI-powered quizzes using Google Gemini API. It features an interactive tutor chatbot, spaced repetition learning via Anki card generation, and markdown/Mermaid diagram rendering.

## Development Commands

```bash
# Install dependencies
npm install

# Development server (runs on port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Environment Setup

1. Create a `.env.local` file in the root directory
2. Add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## Architecture Overview

### Quiz Flow (4 Stages)
The main component (`App.tsx`) manages a multi-stage quiz progression:

1. **Topic Selection**: User enters topic and selects question count (3, 5, or 10)
2. **Refinement Stage**: AI generates 3 clarifying questions about the topic/difficulty/focus
3. **Quiz Taking**: Interactive quiz with immediate feedback on answers
4. **Results**: Score calculation, Anki card review, and download options

### Key State Management (App.tsx)
- `quiz`: Main quiz state (topic, questions, current index, results)
- `refinementQuestions` / `refinementAnswers`: Topic refinement stage
- `globalAnkiCards`: Spaced repetition cards accumulated during quiz
- `showChat`: Toggle for AI tutor sidebar

### AI Integration (services/geminiService.ts)
- **generateRefinementQuestions**: Asks 3 clarifying questions about the quiz topic (gemini-3-flash)
- **generateQuiz**: Creates full quiz with structured JSON output, enforces markdown formatting rules (gemini-3-pro)
- **createChatSession**: Establishes multi-turn chat with AI tutor (gemini-3-pro)
- **analyzeConversationForAnki**: Extracts study concepts from chat history (gemini-3-flash)
- **generateAnkiCardsFromSuggestions**: Converts concepts into Anki cards with HTML formatting (gemini-3-flash)

All Gemini API calls use structured output with explicit `responseSchema` and `responseMimeType: "application/json"` to enforce valid JSON returns.

### Components
- **App.tsx**: Main orchestrator, manages all quiz stages and state
- **ChatSidebar.tsx**: AI tutor interface with multi-turn conversations
- **MarkdownRenderer.tsx**: Renders markdown content with safe HTML handling
- **Mermaid.tsx**: Renders Mermaid diagrams (graphs, flowcharts, etc.)

### Data Types (types.ts)
- `Question`: Quiz question with options, correct index, explanation
- `QuizState`: Current quiz session (topic, questions, progress, results)
- `QuestionState`: Per-question tracking (attempts, correctness, chat history)
- `AnkiCard`: Spaced repetition card (front/back/tags)
- `ChatMessage`: User/model messages in tutor chats
- `RefinementQuestion`: AI-generated clarifying questions

## Important Notes

### Styling
- Tailwind CSS with dark theme (slate-950 background)
- No custom CSS file; all styling is inline via className
- Primary color: `#3b82f6` (blue)
- Animations via Tailwind (animate-*, transition-*)

### API Patterns
- All Gemini calls use Google's TypeScript SDK (`@google/genai`)
- Structured output is critical: all content generation endpoints use JSON schemas
- Model selection: `gemini-3-pro-preview` for quiz generation, `gemini-3-flash-preview` for lighter tasks
- Error handling: Basic try/catch with user-facing Spanish error messages

### Content Formatting Rules
- Quiz questions must include code in markdown blocks (``` ``` `) if referenced, never using single backticks for multiline code
- Chat system instruction uses Mermaid for diagrams
- Anki card backs use HTML formatting (`<b>`, `<br>`, `<code>`)

### Browser Storage
- No persistent storage; all state is in-memory during quiz session
- Anki cards can be downloaded as JSON file for external use

## Common Tasks

**Generate a new quiz:**
1. Topic input → `requestRefinement()` → Refinement questions → `startQuiz()` → Quiz flow

**Add to Anki during quiz:**
- ChatSidebar calls `analyzeConversationForAnki()` when user requests card creation
- Results in `globalAnkiCards` array update

**Export Anki cards:**
- `downloadAllAnki()` generates JSON file compatible with Anki import format
