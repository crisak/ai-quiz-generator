# Plan: Migración UI a shadcn/ui + ai-elements

## Contexto

Quiz IA usa React 19 + Vite + Tailwind CDN. Se migra progresivamente a **shadcn/ui** (todos los componentes UI) + **ai-elements** (componentes de IA). El diseño visual actual se preserva via un tema custom.

Referencia completa: [spec.md](./spec.md)

---

## Fase 0 — Infraestructura (impacto visual: cero)

### 0.1 Migrar Tailwind de CDN a build dependency

1. Instalar: `npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer`
2. Crear `tailwind.config.ts` con los tokens del CDN actual (`index.html` líneas 36-77), `borderRadius` agresivo (`lg: 1rem`) y plugin `tailwindcss-animate`
3. Crear `postcss.config.js`
4. Modificar `vite.config.ts`: agregar plugin `@tailwindcss/vite`
5. Modificar `index.html`: eliminar `<script src="cdn.tailwindcss.com">`, bloque `tailwind.config`, y el `<script type="importmap">`
6. Modificar `index.css`: agregar `@tailwind base/components/utilities` al inicio

**Checkpoint:** `npm run dev` sirve la app con estilos idénticos.

### 0.2 Setup shadcn/ui

1. Instalar: `npm install class-variance-authority clsx tailwind-merge tailwindcss-animate`
2. Crear `lib/utils.ts` con función `cn()`
3. Crear `components.json` apuntando `@/` al root del proyecto
4. Crear `components/ui/` (directorio donde shadcn instalará componentes)

**Checkpoint:** `npx shadcn@latest add button` instala correctamente en `components/ui/button.tsx`.

### 0.3 Tema custom shadcn

1. Agregar variables CSS HSL al bloque `:root` y `html.dark` de `index.css`
   - Mapeo: `--bg-primary` → `--background`, `--action` (#F59E0B) → `--primary`, `--bg-surface` → `--card`, etc.
   - Ver tabla completa en [spec.md](./spec.md#03-tema-custom-css-variables)
2. Mantener tokens custom (`--bg-primary`, `--ink-1`, etc.) y overrides `!important` intactos durante toda la migración

**Checkpoint:** Un `<Button>` shadcn instalado muestra el amber correcto en dark/light mode.

---

## Fase 1 — Componentes Hoja (impacto: bajo)

```bash
npx shadcn@latest add button badge tooltip popover card input textarea select separator
```

**Orden de migración:**

1. `ThemeToggle.tsx` → `Button` variant="ghost" (45 líneas → ~35)
2. `ErrorBoundary.tsx` → `Card` + `Button` (65 líneas → ~45)
3. `VocabHighlightTooltip.tsx` → `Popover` shadcn, eliminar posicionamiento fixed manual (75 líneas → ~45)
4. `SelectionTooltip.tsx` → `Popover` + `Button`, eliminar `getBoundingClientRect` (130 líneas → ~70)

**Checkpoint:** Tooltips funcionan en dark/light. No hay regresiones en el quiz flow.

---

## Fase 2 — Componentes Medianos (impacto: medio)

```bash
npx shadcn@latest add sheet command scroll-area tabs progress alert-dialog dropdown-menu checkbox
```

**Orden de migración:**

1. `components/history/CreateProjectModal.tsx` → `Dialog` + `Input` + `Textarea`
2. `components/history/ProjectsSection.tsx` → `ScrollArea` + `Button` variant="ghost"
3. `components/history/HistorySidebar.tsx` → sidebar custom con internos shadcn (`Button`, `ScrollArea`)
4. `components/ApiKeyModal.tsx` → `Dialog` + `Input` + `Button` + `Separator`
5. `components/SetupScreen.tsx` → `Card` + `Input` + `Button`
6. `components/history/QuizBrowserMain.tsx` → `Card` + `Input` + `Badge` + `Progress` + `ScrollArea`
7. `components/CodeEditor.tsx` → `Card` wrapper + `DropdownMenu` para language selector

**Checkpoint:** Modales abren/cierran. Sidebar collapsa. QuizBrowser busca y filtra. CodeEditor funciona.

---

## Fase 3 — Componentes IA con ai-elements (impacto: alto)

```bash
npx ai-elements@latest add conversation message prompt-input code-block shimmer suggestion
```

**Paso 3.1 — Adaptador Gemini**

Crear `src/hooks/useGeminiChat.ts` que wrappea `createChatSession()` de `services/geminiService.ts` y expone:
```ts
{ messages, sendMessage, isLoading, error, clearMessages }
```
Ver interfaz completa en [spec.md](./spec.md#adaptador-gemini--ai-elements).

**Paso 3.2 — Dividir ChatSidebar.tsx en `components/chat/`**

| Archivo nuevo | Componente ai-elements usado |
|---|---|
| `ChatMessages.tsx` | `Message` de ai-elements |
| `ChatInput.tsx` | `PromptInput` de ai-elements |
| `ChatShimmer.tsx` | `Shimmer` de ai-elements |
| `ChatSuggestions.tsx` | `Suggestion` de ai-elements |
| `AnkiSuggestionsPanel.tsx` | shadcn: `Card`, `Checkbox`, `Button` |
| `VocabPanel.tsx` | shadcn: `ScrollArea`, `Input`, `Button`, `Badge` |
| `ChatSidebar.tsx` | Contenedor orquestador |

**Paso 3.3 — ButtonDropdown.tsx → Popover + Command**

Reemplazar portal manual + `getBoundingClientRect` con `Popover` + `Command` de shadcn. Mantener agrupación por tier (Pro/Flash/Lite).

**Paso 3.4 — MarkdownRenderer.tsx**

Evaluar `CodeBlock` de ai-elements para reemplazar `react-syntax-highlighter`. Mantener `react-markdown` + `remark-gfm` como parser.

**Checkpoint:** Chat tutor: enviar mensaje → respuesta → markdown. Anki funciona. Model selector muestra tiers.

---

## Fase 4 — App.tsx y Componentes Complejos (impacto: máximo)

**Paso 4.1 — Extraer sub-componentes de App.tsx (sin cambiar diseño aún)**

Crear `components/quiz/`:
- `QuizHeader.tsx` — sticky header con progress bar
- `QuizSetupForm.tsx` — formulario topic/count/type
- `QuizRefinement.tsx` — pantalla de refinamiento
- `QuizQuestion.tsx` — pregunta activa + opciones
- `QuizResults.tsx` — resultados + anki cards
- `QuizFooterNav.tsx` — dots pagination + prev/next
- `QuizStudyList.tsx` — modal lista de estudio
- `QuizExitDialog.tsx` — confirmación de salida
- `QuizImportDialog.tsx` — importar quiz

**Paso 4.2 — Aplicar shadcn a cada sub-componente**

Ver tabla de mapeo en [spec.md](./spec.md#42--aplicar-shadcn-a-cada-sub-componente).

**Paso 4.3 — Mermaid.tsx**

- `Dialog` shadcn para modal fullscreen
- `Tabs` para toggle Vista/Código
- `Button` para controles de zoom

**Checkpoint:** Quiz flow completo. Import/Export funciona. Chat tutor en cada pregunta.

---

## Fase 5 — Limpieza Final

1. Eliminar overrides `!important` de `index.css` (líneas 78-145)
2. Migrar refs a `--bg-primary`/`--ink-*` a tokens shadcn, luego eliminar tokens custom
3. Eliminar `components/ModelPicker.tsx` (no tiene imports activos)
4. Audit: dark/light mode, z-index, border-radius consistente en toda la app

**Checkpoint final:** `npm run build` sin errores. Audit visual dark/light. Todos los criterios de aceptación de [spec.md](./spec.md#criterios-de-aceptación) en verde.
