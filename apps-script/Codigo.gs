/**
 * ============================================================================
 *  EVALUACIÓN DE COMPRENSIÓN — receptor de respuestas (Google Apps Script)
 * ============================================================================
 *
 *  Recibe lo que envía el formulario publicado en GitHub Pages y lo guarda en
 *  una hoja de cálculo de Google. No requiere servidor ni tarjeta.
 *
 *  MONTAJE (5 minutos):
 *    1. https://script.google.com/home  →  Nuevo proyecto
 *    2. Pegue TODO este archivo en Código.gs y guarde (Ctrl+S)
 *    3. Implementar → Nueva implementación → Aplicación web
 *         · Ejecutar como: Yo
 *         · Quién tiene acceso: Cualquier persona
 *    4. Abra la URL que le dan y añada  ?setup=1
 *         https://script.google.com/macros/s/XXXX/exec?setup=1
 *       Eso crea la hoja de respuestas y le muestra el enlace.
 *    5. Pegue la URL (sin ?setup=1) en config.js del repositorio
 *
 *  Si se le olvida el paso 4, no pasa nada: el primer envío crea la hoja solo.
 *
 *  La hoja queda con dos pestañas:
 *    · Respuestas — una fila por persona (aquí se ven los resultados)
 *    · Clave      — opcional, para calcular aciertos
 *
 *  Comprobaciones útiles (abra la URL en el navegador):
 *    …/exec          → "Receptor activo"
 *    …/exec?diag=1   → estado: hoja configurada, nº de respuestas, clave cargada
 *    …/exec?setup=1  → crea/repara la hoja y muestra el enlace
 * ============================================================================
 */

var CONFIG = {
  titulo: 'Evaluación de comprensión',
  hojaRespuestas: 'Respuestas',
  hojaClave: 'Clave',
  nombreMinimo: 5,
  patronDocumento: '^[0-9A-Za-z]{4,15}$',

  /* Si no hay hoja configurada, el script la crea en el primer envío. */
  autoCrear: true,

  /* Opcional: fije aquí el ID de la hoja (la parte entre /d/ y /edit de su URL)
     si prefiere no depender de las propiedades del script. */
  hojaId: ''
};

/* Preguntas y opciones: se usan para validar y para los encabezados.
   Deben coincidir con el formulario (index.html). */
var PREGUNTAS = [
  { id: 'p1', texto: 'Después de una comida rica en carbohidratos, ¿qué hormona predomina?',
    opciones: ['Glucagón', 'Insulina', 'Cortisol'] },
  { id: 'p2', texto: '¿Qué sucede cuando disminuye la insulina durante el ayuno?',
    opciones: ['Aumenta el almacenamiento de triglicéridos', 'Se favorece la movilización de reservas', 'Se detiene la gluconeogénesis'] },
  { id: 'p3', texto: '¿Qué órgano produce la mayor parte de los cuerpos cetónicos?',
    opciones: ['Cerebro', 'Músculo', 'Hígado'] },
  { id: 'p4', texto: '¿El cerebro deja de utilizar glucosa cuando aumenta la cetosis?',
    opciones: ['Sí, por completo', 'No, aumenta el uso de cetonas pero conserva necesidades de glucosa', 'Solo utiliza lactato'] },
  { id: 'p5', texto: '¿Qué diferencia hay entre beta-oxidación y cetogénesis?',
    opciones: ['Son el mismo proceso', 'La beta-oxidación genera acetil-CoA; la cetogénesis genera cuerpos cetónicos', 'La cetogénesis degrada glucógeno'] }
];

var PROPIEDAD_HOJA = 'HOJA_ID';


/* ==========================================================================
   PUNTO DE ENTRADA — el formulario hace POST aquí
   ========================================================================== */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var p = (e && e.parameter) || {};
    var nombre = String(p.nombre || '').replace(/\s+/g, ' ').trim();
    var documento = String(p.documento || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();

    if (nombre.length < CONFIG.nombreMinimo) {
      return respuesta_('Datos incompletos', 'Falta el nombre completo.', false);
    }
    if (!new RegExp(CONFIG.patronDocumento).test(documento)) {
      return respuesta_('Datos incompletos', 'El número de documento no es válido.', false);
    }

    var elegidas = [];
    for (var i = 0; i < PREGUNTAS.length; i++) {
      var q = PREGUNTAS[i];
      var valor = String(p[q.id] || '').trim();
      if (q.opciones.indexOf(valor) === -1) {
        return respuesta_('Datos incompletos',
          'La pregunta ' + (i + 1) + ' quedó sin responder o con un valor no válido.', false);
      }
      elegidas.push(valor);
    }

    var hoja = hojaRespuestas_();
    var envios = contarEnvios_(hoja, documento) + 1;
    var aciertos = calcularAciertos_(elegidas);

    hoja.appendRow([
      new Date(),
      nombre,
      documento
    ].concat(elegidas).concat([
      aciertos === null ? '' : aciertos,
      envios,
      String(p.origen || ''),
      String(p.fecha_cliente || '')
    ]));

    return respuesta_('¡Listo!', 'Sus respuestas quedaron registradas.', true);

  } catch (err) {
    console.error(err);
    var detalle = String((err && err.message) || err);
    return respuesta_('No se pudo registrar', 'No se pudo guardar. Detalle técnico: ' + detalle, false);
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}


function doGet(e) {
  var q = (e && e.parameter) || {};
  if (q.diag) return diagnostico_();
  if (q.setup) return setup_();

  var html =
    '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">' +
    '<title>Receptor activo</title>' +
    '<style>body{font-family:system-ui,Segoe UI,sans-serif;background:#eef2f7;color:#13232f;' +
    'display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}' +
    '.c{background:#fff;border:1px solid #dbe4ec;border-radius:14px;padding:36px 34px;max-width:520px;' +
    'box-shadow:0 10px 30px rgba(16,40,60,.08)}h1{margin:0 0 10px;font-size:20px;color:#0d7a6f}' +
    'p{margin:0 0 8px;color:#5f7485;font-size:14.5px;line-height:1.5}code{background:#eef2f7;' +
    'padding:2px 6px;border-radius:4px;font-size:13px}a{color:#0d7a6f}</style></head><body><div class="c">' +
    '<h1>✓ Receptor activo</h1>' +
    '<p>Este enlace está recibiendo las respuestas de la evaluación.</p>' +
    '<p><a href="?setup=1">Crear o reparar la hoja de respuestas</a> · ' +
    '<a href="?diag=1">Ver estado</a></p>' +
    '</div></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setTitle('Receptor activo')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/* ==========================================================================
   INSTALACIÓN
   ========================================================================== */

/** Crea o repara la hoja de respuestas. Es seguro ejecutarla varias veces. */
function configurar() {
  var ss = obtenerHoja_();
  inicializar_(ss);
  var url = ss.getUrl();
  console.log('Hoja de respuestas: ' + url);
  console.log('ID de la hoja: ' + ss.getId());
  return url;
}


/** Muestra la dirección del Web App ya desplegado. */
function desplegar() {
  var url = ScriptApp.getService().getUrl();
  console.log('URL para config.js: ' + url);
  return url;
}


/** Escribe una fila de prueba para verificar que todo funciona. */
function probar() {
  var hoja = hojaRespuestas_();
  var correctas = [
    'Insulina', 'Se favorece la movilización de reservas', 'Hígado',
    'No, aumenta el uso de cetonas pero conserva necesidades de glucosa',
    'La beta-oxidación genera acetil-CoA; la cetogénesis genera cuerpos cetónicos'
  ];
  hoja.appendRow([new Date(), 'PRUEBA (borrar)', '000000']
    .concat(correctas)
    .concat([calcularAciertos_(correctas) || '', 1, 'prueba', new Date().toISOString()]));
  console.log('Fila de prueba agregada. Bórrela antes de compartir el formulario.');
}


/* ==========================================================================
   INTERNO
   ========================================================================== */

function idHoja_() {
  var fijo = CONFIG.hojaId && String(CONFIG.hojaId).trim();
  if (fijo) return fijo;
  return PropertiesService.getScriptProperties().getProperty(PROPIEDAD_HOJA) || '';
}

/** Abre la hoja configurada o, si no existe, la crea. */
function obtenerHoja_() {
  var id = idHoja_();

  if (id) {
    try {
      var ss = SpreadsheetApp.openById(id);
      if (ss) return ss;
    } catch (e) {
      if (!CONFIG.autoCrear) {
        throw new Error('No se pudo abrir la hoja configurada. ' + e.message);
      }
    }
  }

  if (!CONFIG.autoCrear) {
    throw new Error('Falta ejecutar configurar() una vez.');
  }

  var nueva = SpreadsheetApp.create('Respuestas — ' + CONFIG.titulo);
  PropertiesService.getScriptProperties().setProperty(PROPIEDAD_HOJA, nueva.getId());
  inicializar_(nueva);
  return nueva;
}

function hojaRespuestas_() {
  var ss = obtenerHoja_();
  var hoja = ss.getSheetByName(CONFIG.hojaRespuestas);
  if (!hoja) throw new Error('No existe la pestaña ' + CONFIG.hojaRespuestas);
  return hoja;
}

/** Deja la hoja con encabezados y la pestaña de clave. Idempotente. */
function inicializar_(ss) {
  var hoja = ss.getSheetByName(CONFIG.hojaRespuestas) || ss.insertSheet(CONFIG.hojaRespuestas, 0);
  var encabezados = ['Marca temporal', 'Nombre completo', 'Documento de identidad']
    .concat(PREGUNTAS.map(function (q, i) { return 'P' + (i + 1); }))
    .concat(['Aciertos', 'Envíos', 'Origen', 'Fecha del equipo']);

  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  }
  hoja.getRange(1, 1, 1, encabezados.length)
    .setFontWeight('bold')
    .setBackground('#0d7a6f')
    .setFontColor('#ffffff');
  hoja.setFrozenRows(1);
  hoja.setColumnWidth(1, 150);
  hoja.setColumnWidth(2, 220);
  hoja.setColumnWidth(3, 130);

  var clave = ss.getSheetByName(CONFIG.hojaClave);
  if (!clave) {
    clave = ss.insertSheet(CONFIG.hojaClave);
    clave.getRange(1, 1, 1, 2).setValues([['Pregunta', 'Opción correcta (llene la columna B)']]);
    clave.getRange(1, 1, 1, 2)
      .setFontWeight('bold')
      .setBackground('#e6f4f1')
      .setFontColor('#08564e');
    var filas = PREGUNTAS.map(function (q, i) { return ['P' + (i + 1) + '. ' + q.texto, '']; });
    clave.getRange(2, 1, filas.length, 2).setValues(filas);
    clave.setColumnWidth(1, 520);
    clave.setColumnWidth(2, 300);
    for (var i = 0; i < PREGUNTAS.length; i++) {
      var regla = SpreadsheetApp.newDataValidation()
        .requireValueInList(PREGUNTAS[i].opciones, true)
        .setAllowInvalid(false)
        .build();
      clave.getRange(i + 2, 2).setDataValidation(regla);
    }
    clave.setFrozenRows(1);
  }

  // Borra la pestaña vacía que Sheets crea por defecto
  var hojas = ss.getSheets();
  if (hojas.length > 2) {
    var primera = hojas[0];
    if (primera.getLastRow() === 0 &&
        primera.getName() !== CONFIG.hojaRespuestas &&
        primera.getName() !== CONFIG.hojaClave) {
      ss.deleteSheet(primera);
    }
  }
  return ss;
}

function contarEnvios_(hoja, documento) {
  var ultima = hoja.getLastRow();
  if (ultima < 2) return 0;
  var docs = hoja.getRange(2, 3, ultima - 1, 1).getValues();
  var n = 0;
  for (var i = 0; i < docs.length; i++) {
    if (String(docs[i][0]).trim() === documento) n++;
  }
  return n;
}

/** Devuelve el número de aciertos, o null si no hay clave configurada. */
function calcularAciertos_(elegidas) {
  var ss, clave;
  try {
    ss = obtenerHoja_();
    clave = ss.getSheetByName(CONFIG.hojaClave);
  } catch (e) {
    return null;
  }
  if (!clave) return null;

  var filas = Math.max(0, clave.getLastRow() - 1);
  if (filas < PREGUNTAS.length) return null;

  var valores = clave.getRange(2, 2, PREGUNTAS.length, 1).getValues();
  var hayClave = false;
  for (var i = 0; i < valores.length; i++) {
    if (String(valores[i][0]).trim() !== '') hayClave = true;
  }
  if (!hayClave) return null;

  var aciertos = 0;
  for (var j = 0; j < PREGUNTAS.length; j++) {
    var correcta = String(valores[j][0] || '').trim();
    if (correcta && correcta === elegidas[j]) aciertos++;
  }
  return aciertos;
}

/** …/exec?setup=1 — crea la hoja desde el navegador y muestra el enlace. */
function setup_() {
  var creada = false;
  var idAntes = idHoja_();
  var ss = obtenerHoja_();
  if (!idAntes || ss.getId() !== idAntes) creada = true;

  inicializar_(ss);

  var url = ss.getUrl();
  var id = ss.getId();

  var html =
    '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Hoja lista</title>' +
    '<style>body{font-family:system-ui,Segoe UI,sans-serif;background:#eef2f7;color:#13232f;' +
    'display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}' +
    '.c{background:#fff;border:1px solid #dbe4ec;border-radius:14px;padding:34px;max-width:600px;' +
    'box-shadow:0 10px 30px rgba(16,40,60,.08)}h1{margin:0 0 8px;font-size:20px;color:#0d7a6f}' +
    'p{color:#5f7485;font-size:14.5px;line-height:1.55;margin:0 0 10px}' +
    'a.btn{display:inline-block;background:#0d7a6f;color:#fff;text-decoration:none;' +
    'padding:11px 20px;border-radius:9px;font-weight:600;margin-top:8px}' +
    'code{background:#eef2f7;padding:2px 6px;border-radius:4px;font-size:13px;word-break:break-all}' +
    '</style></head><body><div class="c">' +
    '<h1>✓ ' + (creada ? 'Hoja creada' : 'Hoja ya estaba lista') + '</h1>' +
    '<p>Allí caen las respuestas de la evaluación. Ábrala y déjela en favoritos:</p>' +
    '<p><a class="btn" href="' + url + '" target="_blank">Abrir la hoja de respuestas</a></p>' +
    '<p style="margin-top:18px">ID de la hoja:<br><code>' + id + '</code></p>' +
    '<p>Comprobación del receptor: <a href="?diag=1">?diag=1</a></p>' +
    '</div></body></html>';

  console.log('setup: ' + (creada ? 'hoja creada ' : 'hoja existente ') + url);
  return HtmlService.createHtmlOutput(html)
    .setTitle('Hoja lista')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** …/exec?diag=1 */
function diagnostico_() {
  var lineas = ['Receptor: OK'];
  var id = idHoja_();
  lineas.push('Hoja configurada: ' + (id ? 'SI' : 'NO — abra ?setup=1'));

  if (id) {
    try {
      var ss = SpreadsheetApp.openById(id);
      var hoja = ss.getSheetByName(CONFIG.hojaRespuestas);
      lineas.push('Pestaña ' + CONFIG.hojaRespuestas + ': ' +
        (hoja ? 'OK (' + Math.max(0, hoja.getLastRow() - 1) + ' respuestas)' : 'FALTA'));
      var clave = ss.getSheetByName(CONFIG.hojaClave);
      lineas.push('Pestaña ' + CONFIG.hojaClave + ': ' + (clave ? 'OK' : 'FALTA'));
      if (clave && clave.getLastRow() >= 2) {
        var filas = Math.min(PREGUNTAS.length, clave.getLastRow() - 1);
        var v = clave.getRange(2, 2, filas, 1).getValues();
        var llenas = 0;
        for (var i = 0; i < v.length; i++) {
          if (String(v[i][0]).trim() !== '') llenas++;
        }
        lineas.push('Clave cargada: ' + llenas + ' de ' + PREGUNTAS.length);
      }
    } catch (err) {
      lineas.push('Error abriendo la hoja: ' + ((err && err.message) || err));
    }
  }

  return ContentService.createTextOutput(lineas.join('\n'))
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Página que se carga dentro del iframe oculto del formulario.
 * Avisa al formulario (postMessage) si el registro quedó bien o no.
 */
function respuesta_(titulo, mensaje, ok) {
  var estado = ok ? 'ok' : 'error';
  var html =
    '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">' +
    '<title>' + titulo + '</title></head><body>' +
    '<h1>' + titulo + '</h1><p>' + mensaje + '</p>' +
    '<script>' +
    'try{parent.postMessage({evaluacion:"' + estado + '",mensaje:' +
    JSON.stringify(mensaje) + '},"*");}catch(e){}' +
    '</script>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setTitle(titulo)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
