# Spec 001: Migración UI a shadcn/ui + ai-elements

## Resumen

Refactorizar progresivamente la UI de Quiz IA de Tailwind CDN + CSS manual a **shadcn/ui** (componentes base) + **ai-elements de Vercel** (componentes de IA). El diseño visual actual se preserva via un tema custom; la migración es incremental de menor a mayor impacto.

## Motivación

- Los componentes UI actuales son implementaciones manuales con Tailwind CDN y lógica de posicionamiento/portal repetida en múltiples archivos
- No hay un sistema de componentes reutilizables (cada modal, dropdown y tooltip reimplementa las mismas primitivas)
- La UI de chat tutor carece de los patrones estándar de IA (streaming, shimmer, suggestions) que ai-elements provee
- Tailwind CDN no permite tree-shaking ni optimización del bundle de producción

## Objetivo

- Toda la UI usa componentes shadcn/ui con accesibilidad (Radix UI) incluida
- Todos los componentes de IA (chat, mensajes, input, model selector) usan ai-elements
- El tema visual replica exactamente el diseño actual (amber/slate, modo oscuro/claro, bordes redondeados agresivos)
- Cero regresiones funcionales — cada fase es deployable de forma independiente

---

## Librerías

### shadcn/ui
- **Qué es:** Registry de componentes copiados a tu codebase, basados en Radix UI + Tailwind
- **Por qué:** Primitivas accesibles (Dialog, Popover, Command, Sheet, etc.) que eliminan cientos de líneas de lógica de posicionamiento y gestión de focus ya implementadas en cada componente actual
- **Instalación:** `npx shadcn@latest add <componente>` — el código queda en `components/ui/`
- **Docs:** https://ui.shadcn.com

### ai-elements (Vercel)
- **Qué es:** Registry de componentes de IA construido sobre shadcn/ui, copiados a tu codebase
- **Por qué:** Provee los patrones visuales estándar para IA: burbujas de mensaje, input con send button, shimmer de loading, chips de sugerencias, selector de modelo — todos ya integrados con el sistema de tema de shadcn
- **Advertencia:** Está diseñado para Vercel AI SDK (`useChat`). Este proyecto usa `@google/genai` directamente — se requiere adaptador (ver Fase 3)
- **Instalación:** `npx ai-elements@latest add <componente>` — el código queda en `components/ai-elements/`
- **Docs:** https://elements.ai-sdk.dev

---

## Estado Actual del Proyecto

| Aspecto | Estado |
|---|---|
| React | 19.2.4 ✓ |
| Vite | 6.2.0 ✓ |
| TypeScript | 5.8.2 ✓ |
| Tailwind CSS | CDN (no build dep) ✗ |
| postcss.config.js | No existe ✗ |
| tailwind.config.ts | No existe ✗ |
| components.json (shadcn) | No existe ✗ |
| lib/utils.ts (cn) | No existe ✗ |
| lucide-react | 0.564.0 ✓ (requerido por shadcn) |
| @/ alias | Root del proyecto ✓ |

---

## Fases de Implementación

### Fase 0: Infraestructura
**Objetivo:** Migrar build tooling sin cambio visual.

#### 0.1 Tailwind como build dependency

Eliminar de `index.html`:
```html
<!-- ELIMINAR estas líneas: -->
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config = { ... }</script>
<script type="importmap">{ ... }</script>
```

Instalar:
```bash
npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer
```

Crear `tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  darkMode: 'class',
  content: ['./*.{ts,tsx}', './components/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Mantener colores semánticos actuales
        primary: { DEFAULT: '#F59E0B', foreground: '#0F172A' },
      },
      borderRadius: {
        lg: '1rem',    // rounded-lg = 16px (más agresivo que shadcn default)
        md: '0.75rem', // rounded-md = 12px
        sm: '0.5rem',  // rounded-sm = 8px
      },
    },
  },
  plugins: [animate],
} satisfies Config
```

Crear `postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Modificar `vite.config.ts`:
```ts
import tailwindcss from '@tailwindcss/vite'
// ...
plugins: [react(), tailwindcss(), /* plugin existente */]
```

Agregar al inicio de `index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### 0.2 Setup shadcn/ui

Instalar peer deps:
```bash
npm install class-variance-authority clsx tailwind-merge tailwindcss-animate
```

Crear `lib/utils.ts`:
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Crear `components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/src/hooks"
  }
}
```

#### 0.3 Tema custom (CSS variables)

Agregar al bloque `:root` de `index.css` (después de los tokens existentes):
```css
/* shadcn/ui tokens — tema claro */
:root {
  --background: 210 40% 98%;          /* #F8FAFC */
  --foreground: 222.2 84% 4.9%;       /* #0F172A */
  --card: 0 0% 100%;                  /* #FFFFFF */
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 43 96% 56%;              /* #F59E0B amber */
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 210 40% 94%;           /* #F1F5F9 */
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 94%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 94%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;      /* #EF4444 */
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 88%;         /* #E2E8F0 */
  --input: 214.3 31.8% 88%;
  --ring: 224.3 76.3% 48%;           /* #3B82F6 */
  --radius: 1rem;
}

/* shadcn/ui tokens — tema oscuro */
html.dark {
  --background: 222.2 84% 4.9%;      /* #0A0F1F */
  --foreground: 210 40% 98%;         /* #E2E8F0 */
  --card: 217.2 32.6% 17.5%;        /* #1E293B */
  --card-foreground: 210 40% 98%;
  --popover: 217.2 32.6% 17.5%;
  --popover-foreground: 210 40% 98%;
  --primary: 43 96% 56%;             /* #F59E0B amber */
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 217.2 32.6% 22%;     /* #253347 */
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 22%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 22%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 25%;        /* #334155 */
  --input: 217.2 32.6% 25%;
  --ring: 224.3 76.3% 48%;
}
```

**Nota:** Los overrides `!important` de clases `slate-*` (líneas 78-145 de `index.css`) se mantienen durante toda la migración. Se eliminan únicamente en Fase 5 cuando todos los componentes ya usen tokens shadcn.

---

### Fase 1: Componentes Hoja

Componentes shadcn a instalar:
```bash
npx shadcn@latest add button badge tooltip dialog card input textarea select separator
```

| Componente | Archivo | shadcn usado | Notas |
|---|---|---|---|
| ThemeToggle | `components/ThemeToggle.tsx` | `Button` variant="ghost" | Mantener lógica 3 opciones |
| ErrorBoundary | `components/ErrorBoundary.tsx` | `Card`, `Button` | Recovery screen |
| VocabHighlightTooltip | `components/VocabHighlightTooltip.tsx` | `Popover` | Eliminar posicionamiento fixed + caret CSS |
| SelectionTooltip | `components/SelectionTooltip.tsx` | `Popover`, `Button` | Eliminar `getBoundingClientRect` manual |

---

### Fase 2: Componentes Medianos

Componentes shadcn a instalar:
```bash
npx shadcn@latest add sheet popover command scroll-area tabs progress alert-dialog dropdown-menu checkbox
```

| Componente | Archivo | shadcn usado |
|---|---|---|
| CreateProjectModal | `components/history/CreateProjectModal.tsx` | `Dialog`, `Input`, `Textarea`, `Button` |
| HistorySidebar | `components/history/HistorySidebar.tsx` | `Sheet` o sidebar custom con shadcn internos |
| ProjectsSection | `components/history/ProjectsSection.tsx` | `ScrollArea`, `Button`, `Badge` |
| ApiKeyModal | `components/ApiKeyModal.tsx` | `Dialog`, `Input`, `Button`, `Separator` |
| SetupScreen | `components/SetupScreen.tsx` | `Card`, `Input`, `Button` |
| QuizBrowserMain | `components/history/QuizBrowserMain.tsx` | `Card`, `Input`, `Badge`, `Progress`, `ScrollArea` |
| CodeEditor | `components/CodeEditor.tsx` | `Card`, `DropdownMenu` (wrapper Monaco) |

---

### Fase 3: Componentes IA

#### Componentes ai-elements a instalar:
```bash
npx ai-elements@latest add conversation message prompt-input code-block shimmer suggestion
```

Los componentes se instalan en `components/ai-elements/`.

#### Adaptador Gemini → ai-elements

Crear `src/hooks/useGeminiChat.ts`:

```ts
// Wrappea createChatSession() de geminiService para exponer
// una interfaz compatible con los componentes ai-elements
interface GeminiChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface UseGeminiChatOptions {
  question: Question
  questionResult?: QuestionState
  explanation: string
  modelId: GeminiModelId
  responseStyle: ResponseStyle
}

export function useGeminiChat(options: UseGeminiChatOptions) {
  // ...wrappea la lógica existente de ChatSidebar
  return {
    messages,          // GeminiChatMessage[]
    sendMessage,       // (text: string) => void
    isLoading,         // boolean
    error,             // Error | null
    clearMessages,     // () => void
  }
}
```

#### Migración ChatSidebar.tsx → `components/chat/`

El archivo de 652 líneas se divide en:

```
components/chat/
├── ChatSidebar.tsx          # Contenedor principal (Sheet/panel)
├── ChatMessages.tsx         # Lista de mensajes con ai-elements Message
├── ChatInput.tsx            # Input con ai-elements PromptInput
├── ChatShimmer.tsx          # Loading con ai-elements Shimmer
├── ChatSuggestions.tsx      # Chips con ai-elements Suggestion
├── AnkiSuggestionsPanel.tsx # Panel de sugerencias Anki (shadcn Card/Checkbox)
└── VocabPanel.tsx           # Panel de vocabulario (shadcn ScrollArea/Input/Badge)
```

#### ModelSelector: ButtonDropdown.tsx

Reemplazar lógica manual de portal + `getBoundingClientRect` con `Popover` + `Command` de shadcn:
- `Popover` maneja posicionamiento automático
- `Command` provee búsqueda + lista de items
- Mantener agrupación por tier (Pro/Flash/Lite) y badges custom

#### MarkdownRenderer.tsx

- Evaluar `CodeBlock` de ai-elements para reemplazar bloque de código con syntax highlighting + copy button
- Mantener `react-markdown` + `remark-gfm` como parser base
- Mantener `Mermaid` component intacto (migrado en Fase 4)

---

### Fase 4: App.tsx y Componentes Complejos

#### Extracción de sub-componentes de App.tsx

Sin cambiar el diseño, extraer:

```
components/quiz/
├── QuizHeader.tsx       # Sticky header + progress bar
├── QuizSetupForm.tsx    # Formulario de creación (topic, count, type)
├── QuizRefinement.tsx   # Pantalla refinement questions
├── QuizQuestion.tsx     # Vista pregunta + opciones
├── QuizResults.tsx      # Resultados + anki cards
├── QuizFooterNav.tsx    # Dots pagination + prev/next
├── QuizStudyList.tsx    # Modal lista de estudio
├── QuizExitDialog.tsx   # Alert dialog de salida
└── QuizImportDialog.tsx # Dialog importar quiz
```

#### Componentes shadcn por sub-componente

| Sub-componente | shadcn |
|---|---|
| QuizHeader | `Progress`, `Button` |
| QuizSetupForm | `Textarea`, `Button`, `Card`, `Badge`, `Checkbox` |
| QuizRefinement | `Card`, `Textarea`, `Button` |
| QuizQuestion | `Card`, `Badge`, `Button` |
| QuizResults | `Card`, `Button`, `Badge` |
| QuizFooterNav | `Button` + dots custom |
| QuizStudyList | `Dialog`, `ScrollArea`, `Card`, `Input` |
| QuizExitDialog | `AlertDialog` |
| QuizImportDialog | `Dialog`, `Input`, `Button` |

#### Mermaid.tsx

- `Dialog` shadcn para modal fullscreen (reemplaza portal manual)
- `Tabs` para toggle Vista/Código
- `Button` para controles de zoom

---

### Fase 5: Limpieza Final

1. **Eliminar overrides CSS:** Quitar bloque `!important` de `index.css` (líneas 78-145)
2. **Consolidar tokens:** Migrar refs a `--bg-primary`, `--ink-1`, etc. a tokens shadcn equivalentes, luego eliminar tokens custom
3. **Eliminar ModelPicker.tsx:** No se usa en ningún import
4. **Audit final:** dark/light mode en todos los componentes, z-index layering, border-radius consistente

---

## Restricciones y Decisiones

| Decisión | Razón |
|---|---|
| NO instalar Vercel AI SDK | El proyecto usa `@google/genai` directamente; instalar ai-sdk crearía una dependencia innecesaria |
| Adaptador en lugar de reescritura | `createChatSession()` de geminiService funciona bien; solo necesitamos mapear la interfaz |
| `@/` apunta a root, no a `src/` | La estructura del proyecto no tiene directorio `src/` para componentes; shadcn se configura para respetar esto |
| Mantener tokens custom durante migración | Los overrides `!important` garantizan que componentes legacy y nuevos shadcn coexistan sin conflictos visuales |
| Bordes más agresivos en tailwind.config | `rounded-lg: 1rem` en vez del default `0.5rem` para mantener el estilo visual actual |
| Mantener `react-markdown` | `CodeBlock` de ai-elements complementa pero no reemplaza el parser de markdown |

---

## Archivos Críticos

| Archivo | Modificación |
|---|---|
| `index.html` | Eliminar CDN Tailwind + importmap |
| `index.css` | Agregar directivas Tailwind + tokens shadcn HSL |
| `vite.config.ts` | Agregar plugin `@tailwindcss/vite` |
| `tailwind.config.ts` | Crear nuevo |
| `postcss.config.js` | Crear nuevo |
| `components.json` | Crear nuevo (config shadcn) |
| `lib/utils.ts` | Crear nuevo (función `cn()`) |
| `src/hooks/useGeminiChat.ts` | Crear nuevo (adaptador) |
| `components/ChatSidebar.tsx` | Dividir en `components/chat/` |
| `App.tsx` | Dividir en `components/quiz/` |

---

## Criterios de Aceptación

- [ ] `npm run build` completa sin errores en cada fase
- [ ] `npm run dev` sirve la app en localhost:3002
- [ ] Dark/Light mode funciona correctamente en todos los componentes
- [ ] Flow completo: API key setup → Home → Crear quiz → Refinement → Quiz → Results
- [ ] Chat tutor: enviar mensaje → recibir respuesta → markdown renderizado
- [ ] Anki: sugerir → seleccionar → guardar → descargar JSON
- [ ] Quiz browser: buscar, filtrar por tags, resumir quiz existente
- [ ] Import/Export quiz funciona
- [ ] No hay llamadas a `getBoundingClientRect` manuales para posicionamiento (lo hace Radix)
- [ ] No hay `ReactDOM.createPortal` manuales (lo hacen los componentes shadcn)
- [ ] Los overrides `!important` de `slate-*` eliminados al final de Fase 5
