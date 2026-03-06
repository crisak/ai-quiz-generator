# Guia para dark mode

### La Paleta Sugerida: **"Energía Nocturna"**

Esta paleta se basa en un fondo oscuro y relajante, acentos que aportan claridad y un color vibrante para las acciones y la gamificación.

#### 1. Fondo Principal: Azul Noche Profundo
*   **Color:** `#0A0F1F` o `#0B1120`
*   **Uso:** Fondo principal de la interfaz (body, contenedores principales). Es un negro con un sutil tono azul, que es menos agresivo que un negro puro y transmite confianza y seriedad (asociado a la inteligencia y el conocimiento).
*   **Por qué:** Crea un "lienzo" perfecto para que los demás colores resalten sin forzar la vista.

#### 2. Superficies y Tarjetas: Azul Pizarra Suave
*   **Color:** `#1E293B` o `#1F2A40`
*   **Uso:** Fondos de tarjetas (cards), paneles laterales, inputs de formularios.
*   **Por qué:** Crea una jerarquía visual clara. Separa las diferentes secciones (como las tarjetas de preguntas del quiz) del fondo principal sin un contraste demasiado alto que pueda resultar molesto.

#### 3. Texto Principal: Gris Claro Nítido
*   **Color:** `#E2E8F0`
*   **Uso:** Texto principal, párrafos largos, instrucciones de ejercicios.
*   **Por qué:** Proporciona un alto contraste (ratio de accesibilidad AA/AAA) para una lectura cómoda sin el resplandor del blanco puro (`#FFFFFF`), que puede ser demasiado agresivo en modo oscuro.

#### 4. Texto Secundario: Gris Lavanda
*   **Color:** `#94A3B8`
*   **Uso:** Texto de ayuda, fechas, metadatos (ej. "Pregunta 5 de 10"), etiquetas secundarias.
*   **Por qué:** Permite que la información principal destaque, guiando la mirada del usuario de manera natural.

#### 5. Color de Acento Principal (Energía y Acción): Naranja Quemado / Ámbar
*   **Color:** `#F59E0B` o `#FB8B24`
*   **Uso:** Botones principales (Comenzar quiz, Siguiente pregunta, Enviar respuesta), íconos de logros, barra de progreso, enlaces importantes.
*   **Por qué:** El naranja/ámbar es un color cálido que destaca muy bien sobre los azules fríos del fondo. Está asociado con la energía, el entusiasmo y la toma de acción, perfecto para motivar al usuario a "ponerse a prueba". Es menos agresivo que un rojo puro y más divertido que un azul corporativo.

#### 6. Color de Acento Secundario (Retroalimentación): Verde Menta y Rojo Suave
*   **Verde (Correcto):** `#10B981` (Verde esmeralda). Se usa para marcar respuestas correctas, éxito al completar una lección.
*   **Rojo (Incorrecto):** `#EF4444` (Rojo tomate). Se usa para marcar respuestas incorrectas, alertas. Al ser sobre fondo oscuro, no resulta tan alarmante como en fondo blanco, pero sigue siendo claro.
*   **Azul (Informativo):** `#3B82F6` (Azul brillante). Para enlaces o información neutra.

---

### Ejemplo Visual de la Paleta

Puedes imaginarlo así:

*   **Fondo de pantalla:** `#0A0F1F`
*   **Una tarjeta de pregunta:**
    *   Fondo de la tarjeta: `#1E293B`
    *   Texto de la pregunta: `#E2E8F0`
    *   Texto de "Pregunta 3/10": `#94A3B8`
    *   Bordes de las opciones sin seleccionar: `#334155` (un tono intermedio)
    *   Botón "Siguiente": Fondo `#F59E0B` con texto en `#0A0F1F` para contraste.
*   **Resultado del quiz:**
    *   Aciertos: Icono y número en `#10B981`
    *   Fallos: Icono y número en `#EF4444`

### Consejos Extra para tu Plataforma

1.  **Jerarquía Clara:** El color de acento (naranja) debe usarse con moderación. Si todo es naranja, nada lo es. Úsalo para los elementos con los que el usuario debe interactuar *ahora*.
2.  **Accesibilidad (WCAG):** Asegúrate de que el texto gris claro (`#E2E8F0`) sobre el fondo azul noche (`#0A0F1F`) y el texto oscuro sobre el naranja tengan una relación de contraste suficiente (idealmente 4.5:1 para texto normal). Esta paleta está pensada para cumplirlo.
3.  **Coherencia:** Asigna un significado fijo a los colores. Por ejemplo: Naranja = Interacción principal. Verde = Logro/Correcto. Rojo = Error/Incorrecto. El cerebro del usuario lo agradecerá y aprenderá a navegar más rápido.
4.  **Modo Claro:** Siempre es buena práctica ofrecer un modo claro. Puedes crear el inverso de esta paleta: fondo blanco roto (`#F8FAFC`), texto oscuro (`#0F172A`), y mantener el mismo naranja como acento para mantener la identidad de marca.

# Guia para light mode

Para mantener una identidad de marca coherente y una experiencia de usuario fluida, lo ideal es que tu **modo claro (light mode)** sea el "negativo" del modo oscuro. Esto significa usar los mismos colores de acento (naranja, verde, rojo) pero invirtiendo los fondos y el texto.

La clave para un buen modo claro es evitar el blanco puro y el negro puro, ya que crean un contraste demasiado alto que cansa la vista. En su lugar, usamos blancos rotos y grises suaves.

Aquí tienes la paleta **"Luz Diaria"**, complementaria perfecta de la anterior "Energía Nocturna":

### La Paleta Sugerida: **"Luz Diaria"**

#### 1. Fondo Principal: Blanco Roto Cálido
*   **Color:** `#F8FAFC` o `#F1F5F9`
*   **Uso:** Fondo principal de la interfaz (body).
*   **Por qué:** Es un blanco con un matiz muy sutil que es mucho más fácil de mirar durante horas que el blanco puro (#FFFFFF). Disminuye el resplandor y la fatiga visual. Al tener un tono ligeramente cálido, también hace que el naranja de acento se vea más armonioso.

#### 2. Superficies y Tarjetas: Blanco Puro
*   **Color:** `#FFFFFF`
*   **Uso:** Fondos de tarjetas (cards), paneles laterales, inputs de formulario.
*   **Por qué:** Al poner blanco puro sobre el fondo ligeramente roto, las tarjetas "resaltan" visualmente, creando una jerarquía limpia y profesional que recuerda a una tarjeta física o una ficha de estudio.

#### 3. Texto Principal: Gris Oscuro Suave
*   **Color:** `#0F172A` o `#1E293B`
*   **Uso:** Texto principal, títulos, preguntas de los quizzes.
*   **Por qué:** Es el equivalente al fondo principal del modo oscuro. No es un negro absoluto (#000000), lo que evita el "vibración" visual y hace la lectura más relajada.

#### 4. Texto Secundario: Gris Medio
*   **Color:** `#475569` o `#64748B`
*   **Uso:** Texto de ayuda, fechas, metadatos (ej. "Pregunta 5 de 10"), etiquetas.
*   **Por qué:** Aporta contraste suficiente para ser legible, pero se mantiene en un segundo plano para que lo importante (el texto principal) domine.

#### 5. Color de Acento Principal (Energía y Acción): Naranja Quemado / Ámbar
*   **Color:** **`#F59E0B`** (¡El mismo que en el modo oscuro!)
*   **Uso:** Botones principales (Comenzar quiz, Siguiente), íconos de logros, barra de progreso.
*   **Por qué:** Mantener el color de acción **idéntico** es crucial para la identidad de marca. El usuario asociará instantáneamente ese naranja con "interactuar" o "empezar algo", tanto de día como de noche.

#### 6. Color de Acento Secundario (Retroalimentación): Verde Menta y Rojo Suave
*   **Verde (Correcto):** **`#10B981`** (El mismo).
*   **Rojo (Incorrecto):** **`#EF4444`** (El mismo).
*   **Azul (Informativo):** **`#3B82F6`** (El mismo).
*   **Por qué:** La retroalimentación (correcto/incorrecto) debe ser inmediata y reconocible. Cambiar estos colores crearía confusión. Al mantenerlos, el cerebro del usuario no tiene que reaprender qué significa cada color al cambiar de tema.
