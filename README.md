# Evaluación de comprensión — formulario en línea

Formulario de selección múltiple con **nombre** y **documento obligatorios**, publicado
en GitHub Pages y con las respuestas guardadas en una **hoja de Google**. Sin servidor,
sin tarjeta y sin mantenimiento.

> Plantilla reutilizable: cambie las preguntas en `index.html` y `apps-script/Codigo.gs`,
> y tiene una evaluación nueva en 10 minutos.

**Sitio publicado:** https://helseador.github.io/evaluacion-comprension/

---

## Cómo funciona

```
┌─────────────────────┐        POST (form)        ┌──────────────────────┐
│  GitHub Pages       │ ────────────────────────► │  Google Apps Script  │
│  index.html + js    │                           │  doPost()            │
│  (el formulario)    │ ◄──────────────────────── │  valida y guarda     │
└─────────────────────┘      página "gracias"     └──────────┬───────────┘
                                                             │
                                                  ┌──────────▼───────────┐
                                                  │  Google Sheets       │
                                                  │  pestaña Respuestas  │
                                                  └──────────────────────┘
```

- El formulario es **estático**: no hay backend propio, no hay nada que se caiga.
- El envío va por un `<form>` POST a un iframe oculto, así no hay problemas de CORS
  ni de contenido mixto, y funciona igual en celular.
- Apps Script valida en el servidor (nombre, documento y que las 5 respuestas sean
  opciones válidas) antes de escribir.

## Montaje (5 minutos, una sola vez)

### 1. Crear el receptor en Google

1. Abra <https://script.google.com/home> → **Nuevo proyecto**.
2. Pegue el contenido de [`apps-script/Codigo.gs`](apps-script/Codigo.gs) en `Código.gs`.
3. Guarde y ejecute la función **`configurar`** → autorice los permisos.
   Se crea la hoja de respuestas (el enlace queda en el registro de ejecución).
4. **Implementar → Nueva implementación → Aplicación web**
   - *Ejecutar como:* **Yo**
   - *Quién tiene acceso:* **Cualquier persona**
5. Copie la URL, que termina en `/exec`.

### 2. Conectarla al formulario

Abra `config.js` y pegue la URL:

```js
window.EVALUACION = {
  webhookUrl: "https://script.google.com/macros/s/AKfycb.../exec",
  titulo: "Evaluación de comprensión",
  subtitulo: ""
};
```

Sirve editarlo aquí en GitHub (lápiz ✏️ → *Commit changes*); Pages se actualiza solo
en un minuto. También puede pedirle a quien mantiene el repo que lo haga.

### 3. Probar

Abra el sitio, responda y verifique que la fila aparece en la hoja. La URL del
Web App abierta directamente en el navegador debe decir **"Receptor activo"**.

## Ver los resultados

Todo está en la hoja **"Respuestas — Evaluación de comprensión"**:

| Marca temporal | Nombre completo | Documento | P1 | P2 | P3 | P4 | P5 | Aciertos | Envíos | Origen |
|---|---|---|---|---|---|---|---|---|---|---|

- **Aciertos**: vacío si no configuró la clave (ver abajo).
- **Envíos**: cuántas veces ha enviado esa persona. Se guarda el historial completo;
  si alguien corrige, gana la fila más reciente.
- Para descargar: *Archivo → Descargar → Microsoft Excel* o *Valores separados por comas*.

### Puntaje (opcional)

Abra la pestaña **Clave** y elija en la columna B la opción correcta de cada pregunta
(hay lista desplegable). Desde el siguiente envío, la columna *Aciertos* se calcula sola.

## Personalizar

| Qué | Dónde |
|---|---|
| Preguntas y opciones | `index.html` (bloques `<section class="card q">`) **y** `PREGUNTAS` en `apps-script/Codigo.gs` |
| Título y subtítulo | `config.js` |
| Colores y tipografía | Variables al inicio de `styles.css` |
| Texto de la pantalla final | `index.html`, sección `#pantalla-ok` |
| Columna *Aciertos* | Pestaña **Clave** de la hoja |

Si cambia las preguntas, actualice los dos archivos: el formulario para mostrarlas y
el script para validarlas y encabezar las columnas.

## Estructura

```
index.html              formulario (GitHub Pages sirve este archivo)
styles.css              estilos
app.js                  validación, progreso y envío
config.js               ← lo único que se edita para conectar
apps-script/Codigo.gs   receptor + hoja de cálculo
apps-script/INSTRUCCIONES.md
```

## Problemas comunes

**"Falta conectar el formulario"** → `config.js` no tiene la URL o no empieza por `https`.

**El iframe se queda en "Enviando…"** → la implementación no está como *Cualquier
persona*, o se cambió el código y no se volvió a implementar (*Implementar → Gestionar
implementaciones → Editar*).

**No aparecen las respuestas en la hoja** → revise la pestaña correcta y que
`PropertiesService` tenga el ID; volver a ejecutar `configurar` es seguro (no borra datos).

**Cambié el código y no pasa nada** → Apps Script no actualiza solo: hay que crear una
**nueva versión** de la implementación.

## Privacidad

El formulario pide nombre y número de documento. La hoja queda en la cuenta de Google
de quien ejecutó `configurar`; el formulario no envía nada a terceros. Conviene:

- no hacer público el enlace de la hoja (el del formulario sí es público),
- borrar las filas de prueba antes de compartir,
- definir con la empresa cuánto tiempo se conservan los datos.

## Licencia

MIT — use, copie y adapte libremente.
