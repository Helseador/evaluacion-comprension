# Conectar el formulario con Google Sheets

Guía corta para dejar el receptor funcionando. Son unos 5 minutos y se hace una sola vez.

---

## Paso 1 — Crear el proyecto

1. Entre a <https://script.google.com/home> con la cuenta de Google de la empresa.
2. Clic en **Nuevo proyecto**.

## Paso 2 — Pegar el código

1. En el editor verá `Código.gs` con `function myFunction() {}`.
2. Seleccione todo (`Ctrl+A`) y bórrelo.
3. Copie **todo** el contenido de [`Codigo.gs`](Codigo.gs) y péguelo.
4. Guarde con `Ctrl+S`.

## Paso 3 — Publicar el receptor

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Complete:
   - **Descripción:** `Receptor evaluación`
   - **Ejecutar como:** `Yo (su correo)`
   - **Quién tiene acceso:** `Cualquier persona`
4. **Implementar** → autorice los permisos si los pide.
5. Copie la **URL de la aplicación web**. Termina en `/exec`.

> **Importante:** "Cualquier persona" ≠ "Cualquier persona con una cuenta de Google".
> Si elige la segunda, quien responda tendrá que iniciar sesión y el formulario no cargará.

## Paso 4 — Crear la hoja de respuestas

En el navegador, a la URL que copió agréguele `?setup=1` y ábrala:

```
https://script.google.com/macros/s/AKfycb.../exec?setup=1
```

Debe aparecer una página **"✓ Hoja creada"** con un botón que abre la hoja
**"Respuestas — Evaluación de comprensión"** con dos pestañas:

- **Respuestas** — donde caen los envíos (este es el panel de resultados).
- **Clave** — opcional, para calcular aciertos.

> Si se salta este paso no pasa nada: el primer envío crea la hoja solo.
> Puede volver a abrirlo cuando quiera; es seguro ejecutarlo varias veces.

## Paso 5 — Conectarla al formulario

En el repositorio, abra `config.js`, clic en el lápiz ✏️ y pegue la URL
**sin** `?setup=1`:

```js
webhookUrl: "https://script.google.com/macros/s/AKfycb.../exec",
```

**Commit changes**. GitHub Pages publica el cambio en aproximadamente un minuto.

## Paso 6 — Probar

1. Abra el sitio, responda las 5 preguntas y envíe.
2. Revise la hoja: debe aparecer la fila.
3. Borre las filas de prueba cuando termine.

---

## Comprobar que todo está bien

Agregue al final de la URL `/exec`:

| Parámetro | Qué muestra |
|---|---|
| `?diag=1` | `Hoja configurada: SI/NO`, cuántas respuestas lleva, si la clave está cargada |
| `?setup=1` | Crea o repara la hoja y da el enlace directo |
| *(nada)* | Página "Receptor activo" |

Si el formulario dice **"No se pudo confirmar el registro"**, el mensaje técnico
aparece en la página de resultado del envío y en **Ejecuciones** del editor.

## Puntaje (opcional)

En la pestaña **Clave**, columna B, elija la opción correcta de cada pregunta
(lista desplegable). A partir del siguiente envío la columna **Aciertos** se llena sola.

Si prefiere no calificar, deje la columna B vacía: *Aciertos* queda en blanco.

## Si cambia el código después

Apps Script **no** actualiza solo. Después de editar `Codigo.gs` hay que publicar una
versión nueva:

**Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar**

La URL no cambia.

## Permisos que pide el script

| Permiso | Para qué |
|---|---|
| Hojas de cálculo | crear y escribir la hoja de respuestas |
| Apps Script / servicio de ejecución | publicarse como aplicación web |

No accede a Gmail, Drive completo ni a ningún otro archivo.

## Si se pierde la hoja

Vuelva a abrir `…/exec?setup=1`: el script ya tiene guardado el ID y le devuelve el
enlace. Si por algún motivo la hoja se borró, crea una nueva automáticamente.
