# Tasks: Migración UI a shadcn/ui + ai-elements

Estado: `[ ]` pendiente · `[x]` completado · `[~]` en progreso · `[!]` bloqueado

---

## Fase 0 — Infraestructura

### 0.1 Tailwind como build dependency
- [ ] `0.1.1` Instalar `tailwindcss @tailwindcss/vite postcss autoprefixer` como devDependencies
- [ ] `0.1.2` Crear `tailwind.config.ts` con colores, borderRadius y plugin animate
- [ ] `0.1.3` Crear `postcss.config.js`
- [ ] `0.1.4` Agregar plugin `@tailwindcss/vite` en `vite.config.ts`
- [ ] `0.1.5` Eliminar `<script src="cdn.tailwindcss.com">` de `index.html`
- [ ] `0.1.6` Eliminar bloque `tailwind.config` inline de `index.html` (líneas 35-77)
- [ ] `0.1.7` Eliminar `<script type="importmap">` de `index.html` (líneas 79-93)
- [ ] `0.1.8` Agregar `@tailwind base/components/utilities` al inicio de `index.css`
- [ ] `0.1.9` Verificar: `npm run dev` — app idéntica visualmente

### 0.2 Setup shadcn/ui
- [ ] `0.2.1` Instalar `class-variance-authority clsx tailwind-merge tailwindcss-animate`
- [ ] `0.2.2` Crear `lib/utils.ts` con función `cn()`
- [ ] `0.2.3` Crear `components.json` (config shadcn, `@/` apunta al root)
- [ ] `0.2.4` Crear directorio `components/ui/`
- [ ] `0.2.5` Verificar: `npx shadcn@latest add button` instala en `components/ui/button.tsx`

### 0.3 Tema custom shadcn
- [ ] `0.3.1` Agregar variables shadcn HSL (`:root`) en `index.css` — tema claro
- [ ] `0.3.2` Agregar variables shadcn HSL (`html.dark`) en `index.css` — tema oscuro
- [ ] `0.3.3` Verificar: `<Button>` shadcn muestra amber `#F59E0B` en ambos modos

---

## Fase 1 — Componentes Hoja

### Setup
- [ ] `1.0.1` Instalar shadcn: `button badge tooltip popover card input textarea select separator`

### Migraciones
- [ ] `1.1.1` Migrar `ThemeToggle.tsx` → `Button` variant="ghost"
- [ ] `1.1.2` Verificar: toggle funciona, iconos correctos, sin regresiones
- [ ] `1.2.1` Migrar `ErrorBoundary.tsx` → `Card` + `Button`
- [ ] `1.2.2` Verificar: pantalla de error muestra correctamente
- [ ] `1.3.1` Migrar `VocabHighlightTooltip.tsx` → `Popover` shadcn
- [ ] `1.3.2` Eliminar posicionamiento `fixed` manual y caret CSS custom
- [ ] `1.3.3` Verificar: tooltip aparece al hacer click en vocab term
- [ ] `1.4.1` Migrar `SelectionTooltip.tsx` → `Popover` + `Button`
- [ ] `1.4.2` Eliminar `getBoundingClientRect` manual
- [ ] `1.4.3` Verificar: tooltip aparece al seleccionar texto en pregunta

---

## Fase 2 — Componentes Medianos

### Setup
- [ ] `2.0.1` Instalar shadcn: `sheet command scroll-area tabs progress alert-dialog dropdown-menu checkbox`

### Migraciones
- [ ] `2.1.1` Migrar `CreateProjectModal.tsx` → `Dialog` + `Input` + `Textarea` + `Button`
- [ ] `2.1.2` Verificar: modal crea proyecto, color swatches funcionan
- [ ] `2.2.1` Migrar `ProjectsSection.tsx` → `ScrollArea` + `Button` variant="ghost"
- [ ] `2.2.2` Verificar: CRUD de proyectos funciona, delete on hover
- [ ] `2.3.1` Migrar `HistorySidebar.tsx` → sidebar con shadcn internos
- [ ] `2.3.2` Verificar: sidebar collapsa/expande, ThemeToggle en footer
- [ ] `2.4.1` Migrar `ApiKeyModal.tsx` → `Dialog` + `Input` + `Button` + `Separator`
- [ ] `2.4.2` Verificar: guardar API key, probar conexión, 4 model dropdowns
- [ ] `2.5.1` Migrar `SetupScreen.tsx` → `Card` + `Input` + `Button`
- [ ] `2.5.2` Verificar: setup inicial desde cero funciona
- [ ] `2.6.1` Migrar `QuizBrowserMain.tsx` → `Card` + `Input` + `Badge` + `Progress` + `ScrollArea`
- [ ] `2.6.2` Verificar: búsqueda filtra, tags filtran, abrir quiz existente
- [ ] `2.7.1` Migrar `CodeEditor.tsx` wrapper → `Card` + `DropdownMenu` para language selector
- [ ] `2.7.2` Eliminar dropdown de lenguaje manual (estado + click-outside)
- [ ] `2.7.3` Verificar: Monaco funciona, cambiar lenguaje, reset código

---

## Fase 3 — Componentes IA

### Setup
- [ ] `3.0.1` Instalar ai-elements: `npx ai-elements@latest add conversation message prompt-input code-block shimmer suggestion`
- [ ] `3.0.2` Verificar que los componentes se instalan en `components/ai-elements/`

### Adaptador Gemini
- [ ] `3.1.1` Crear `src/hooks/useGeminiChat.ts`
- [ ] `3.1.2` Implementar wrapper de `createChatSession()` con interfaz `{ messages, sendMessage, isLoading, error }`
- [ ] `3.1.3` Preservar lógica de `responseStyle` prefix (Conciso/Normal/Extenso)
- [ ] `3.1.4` Preservar gestión de sesión de chat por pregunta
- [ ] `3.1.5` Test manual: hook devuelve mensajes correctamente

### Chat Sidebar
- [ ] `3.2.1` Crear directorio `components/chat/`
- [ ] `3.2.2` Extraer `ChatMessages.tsx` con `Message` de ai-elements
- [ ] `3.2.3` Extraer `ChatInput.tsx` con `PromptInput` de ai-elements
- [ ] `3.2.4` Extraer `ChatShimmer.tsx` con `Shimmer` de ai-elements
- [ ] `3.2.5` Extraer `ChatSuggestions.tsx` con `Suggestion` de ai-elements
- [ ] `3.2.6` Extraer `AnkiSuggestionsPanel.tsx` con shadcn `Card` + `Checkbox` + `Button`
- [ ] `3.2.7` Extraer `VocabPanel.tsx` con shadcn `ScrollArea` + `Input` + `Button` + `Badge`
- [ ] `3.2.8` Actualizar `ChatSidebar.tsx` para usar `useGeminiChat` y los sub-componentes
- [ ] `3.2.9` Eliminar `components/ChatSidebar.tsx` (reemplazado por `components/chat/`)
- [ ] `3.2.10` Verificar: chat completo funciona — enviar, recibir, markdown, anki, vocab

### Model Selector
- [ ] `3.3.1` Reescribir `ButtonDropdown.tsx` con `Popover` + `Command` de shadcn
- [ ] `3.3.2` Eliminar `ReactDOM.createPortal` manual y `getBoundingClientRect`
- [ ] `3.3.3` Mantener agrupación por tier (Pro/Flash/Lite) y badges de color
- [ ] `3.3.4` Mantener botón "Probar" con estados loading/success/error
- [ ] `3.3.5` Verificar: dropdown abre, busca modelos, selecciona, prueba conexión

### Markdown Renderer
- [ ] `3.4.1` Evaluar `CodeBlock` de ai-elements vs `react-syntax-highlighter` actual
- [ ] `3.4.2` Integrar `CodeBlock` de ai-elements para bloques de código con copy button
- [ ] `3.4.3` Eliminar `react-syntax-highlighter` si es reemplazado completamente
- [ ] `3.4.4` Verificar: código renderiza con highlighting, copy button funciona, Mermaid intacto

---

## Fase 4 — App.tsx y Componentes Complejos

### Extracción App.tsx
- [ ] `4.1.1` Crear directorio `components/quiz/`
- [ ] `4.1.2` Extraer `QuizHeader.tsx` (sticky header, progress bar, botones)
- [ ] `4.1.3` Extraer `QuizSetupForm.tsx` (topic textarea, count buttons, type cards)
- [ ] `4.1.4` Extraer `QuizRefinement.tsx` (refinement questions + textareas)
- [ ] `4.1.5` Extraer `QuizQuestion.tsx` (question view + answer options)
- [ ] `4.1.6` Extraer `QuizResults.tsx` (score, anki cards grid, action buttons)
- [ ] `4.1.7` Extraer `QuizFooterNav.tsx` (dots pagination + prev/next)
- [ ] `4.1.8` Extraer `QuizStudyList.tsx` (modal lista de estudio)
- [ ] `4.1.9` Extraer `QuizExitDialog.tsx` (confirmación de salida)
- [ ] `4.1.10` Extraer `QuizImportDialog.tsx` (importar quiz)
- [ ] `4.1.11` Verificar: App.tsx orchestrates sub-componentes, quiz flow completo funciona

### Aplicar shadcn a sub-componentes quiz
- [ ] `4.2.1` `QuizHeader.tsx` → `Progress` + `Button`
- [ ] `4.2.2` `QuizSetupForm.tsx` → `Textarea` + `Button` + `Card` + `Badge` + `Checkbox`
- [ ] `4.2.3` `QuizRefinement.tsx` → `Card` + `Textarea` + `Button`
- [ ] `4.2.4` `QuizQuestion.tsx` → `Card` + `Badge` + `Button`
- [ ] `4.2.5` `QuizResults.tsx` → `Card` + `Button` + `Badge`
- [ ] `4.2.6` `QuizFooterNav.tsx` → `Button` + dots custom
- [ ] `4.2.7` `QuizStudyList.tsx` → `Dialog` + `ScrollArea` + `Card` + `Input`
- [ ] `4.2.8` `QuizExitDialog.tsx` → `AlertDialog`
- [ ] `4.2.9` `QuizImportDialog.tsx` → `Dialog` + `Input` + `Button`
- [ ] `4.2.10` Verificar: quiz flow completo, confetti en >80%, import/export

### Componentes restantes
- [ ] `4.3.1` Migrar `Mermaid.tsx` → `Dialog` + `Tabs` + `Button`
- [ ] `4.3.2` Verificar: diagramas renderizan, expand modal, zoom, toggle código
- [ ] `4.4.1` Revisar `HighlightedText.tsx` y `MarkdownWithHighlights.tsx` — aplicar shadcn donde aplique
- [ ] `4.4.2` Verificar: highlights en texto de quiz funcionan, tooltip al click

---

## Fase 5 — Limpieza Final

- [ ] `5.1.1` Eliminar bloque de overrides `!important` de `index.css` (líneas 78-145)
- [ ] `5.1.2` Verificar que ningún componente depende de las clases `slate-*` hardcoded
- [ ] `5.2.1` Migrar refs a tokens custom (`--bg-primary`, `--ink-1`, etc.) a tokens shadcn
- [ ] `5.2.2` Eliminar tokens custom de `index.css` tras la migración
- [ ] `5.3.1` Eliminar `components/ModelPicker.tsx` (sin imports activos)
- [ ] `5.4.1` Audit visual dark mode — recorrer todas las vistas
- [ ] `5.4.2` Audit visual light mode — recorrer todas las vistas
- [ ] `5.4.3` Verificar z-index layering: tooltips > modals > sidebar > header
- [ ] `5.4.4` Verificar border-radius consistente en toda la app
- [ ] `5.5.1` `npm run build` — sin errores ni warnings de TypeScript
- [ ] `5.5.2` Criterios de aceptación de [spec.md](./spec.md#criterios-de-aceptación) — todos en verde

---

## Resumen de progreso

| Fase | Total | Completadas | % |
|---|---|---|---|
| 0 — Infraestructura | 15 | 0 | 0% |
| 1 — Componentes hoja | 12 | 0 | 0% |
| 2 — Componentes medianos | 21 | 0 | 0% |
| 3 — Componentes IA | 23 | 0 | 0% |
| 4 — App.tsx y complejos | 22 | 0 | 0% |
| 5 — Limpieza | 12 | 0 | 0% |
| **Total** | **105** | **0** | **0%** |
