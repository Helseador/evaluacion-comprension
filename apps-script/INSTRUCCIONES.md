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

## Paso 3 — Crear la hoja de respuestas

1. Arriba, en la lista de funciones, elija **`configurar`**.
2. Pulse **Ejecutar**.
3. Google pedirá autorización:
   - **Revisar permisos** → elija su cuenta.
   - "Google no ha verificado esta aplicación" → **Configuración avanzada** →
     **Ir a … (no seguro)**. Es normal: el script lo escribió usted y solo crea
     una hoja de cálculo.
   - **Permitir**.

Se crea el archivo **"Respuestas — Evaluación de comprensión"** con dos pestañas:

- **Respuestas** — donde caen los envíos.
- **Clave** — para poner la respuesta correcta de cada pregunta (opcional).

El enlace de la hoja queda en **Ver → Registros**.

## Paso 4 — Publicar el receptor

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Complete:
   - **Descripción:** `Receptor evaluación`
   - **Ejecutar como:** `Yo (su correo)`
   - **Quién tiene acceso:** `Cualquier persona`
4. **Implementar** y copie la **URL de la aplicación web**. Termina en `/exec`.

> Si el navegador abre esa URL, debe decir **"Receptor activo"**. Si pide iniciar
> sesión, el acceso quedó mal: vuelva a implementar eligiendo *Cualquier persona*.

## Paso 5 — Pegarla en el formulario

En el repositorio, abra `config.js`, clic en el lápiz ✏️ y pegue la URL:

```js
webhookUrl: "https://script.google.com/macros/s/AKfycb.../exec",
```

**Commit changes**. GitHub Pages publica el cambio en aproximadamente un minuto.

## Paso 6 — Probar

1. Abra el sitio, responda las 5 preguntas y envíe.
2. Revise la hoja: debe aparecer la fila.
3. Borre las filas de prueba cuando termine.

---

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
