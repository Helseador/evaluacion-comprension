/* ==========================================================================
   Evaluación de comprensión — lógica del formulario
   No hace falta editar este archivo: la configuración está en config.js
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.EVALUACION || {};
  var TOTAL = 5;

  var form     = document.getElementById("form");
  var nombre   = document.getElementById("nombre");
  var doc      = document.getElementById("documento");
  var contador = document.getElementById("contador");
  var barraI   = document.getElementById("barra-i");
  var barraP   = document.getElementById("barra-p");
  var boton    = document.getElementById("btn-enviar");
  var estado   = document.getElementById("estado");
  var avisoErr = document.getElementById("aviso-error");
  var avisoCfg = document.getElementById("aviso-config");
  var zonaForm = document.getElementById("zona-form");
  var pantalla = document.getElementById("pantalla-ok");
  var barraEnv = document.getElementById("barra-envio");
  var iframe   = document.getElementById("destino-envio");

  var enviando = false;
  var temporizador = null;

  /* ---------- textos configurables ---------- */
  if (CFG.titulo) {
    document.getElementById("titulo").textContent = CFG.titulo;
    document.title = CFG.titulo;
  }
  if (CFG.subtitulo) {
    var p = document.querySelector(".head p");
    if (p) p.textContent = CFG.subtitulo;
  }

  /* ---------- ¿está conectado? ---------- */
  var conectado = !!(CFG.webhookUrl && CFG.webhookUrl.indexOf("http") === 0);
  if (!conectado) {
    avisoCfg.classList.add("on");
    if (boton) { boton.disabled = true; boton.textContent = "Sin conexión"; }
    if (estado) estado.textContent = "Falta configurar config.js";
  }

  /* ---------- progreso ---------- */
  function respondidas() {
    var n = 0;
    for (var i = 1; i <= TOTAL; i++) {
      if (form.querySelector('input[name="p' + i + '"]:checked')) n++;
    }
    return n;
  }

  function datosOk() {
    return nombre.value.trim().length >= 5 && /^[0-9A-Za-z]{4,15}$/.test(doc.value.trim());
  }

  function actualizar() {
    var n = respondidas();
    contador.textContent = n + " de " + TOTAL + " respondidas";
    barraI.style.width = (n / TOTAL * 100) + "%";
    barraP.setAttribute("aria-valuenow", String(n));

    var listo = conectado && n === TOTAL && datosOk() && !enviando;
    boton.disabled = !listo;

    if (!conectado) return;
    if (enviando) { estado.textContent = "Enviando…"; return; }
    if (n < TOTAL) {
      estado.innerHTML = "Faltan <b>" + (TOTAL - n) + "</b> pregunta(s)";
    } else if (!datosOk()) {
      estado.innerHTML = "Complete <b>nombre y documento</b>";
    } else {
      estado.innerHTML = "Todo listo para enviar";
    }
  }

  form.addEventListener("change", actualizar);
  form.addEventListener("input", actualizar);
  actualizar();

  /* ---------- errores ---------- */
  function marcarError(campo, idErr, on) {
    campo.classList.toggle("err", on);
    document.getElementById(idErr).classList.toggle("on", on);
  }

  function mostrarError(texto) {
    avisoErr.innerHTML = texto;
    avisoErr.classList.add("on");
  }
  function limpiarError() {
    avisoErr.classList.remove("on");
    avisoErr.innerHTML = "";
  }

  function validar() {
    var ok = true;
    if (nombre.value.trim().length < 5) { marcarError(nombre, "err-nombre", true); ok = false; }
    else marcarError(nombre, "err-nombre", false);

    if (!/^[0-9A-Za-z]{4,15}$/.test(doc.value.trim())) {
      marcarError(doc, "err-documento", true); ok = false;
    } else marcarError(doc, "err-documento", false);

    if (!ok) {
      mostrarError("Revise los campos marcados en rojo.");
      var primero = document.querySelector(".err");
      if (primero) { primero.focus(); primero.scrollIntoView({ behavior: "smooth", block: "center" }); }
      return false;
    }

    if (respondidas() < TOTAL) {
      mostrarError("Debe responder las " + TOTAL + " preguntas.");
      return false;
    }
    if (!conectado) {
      mostrarError("El formulario aún no está conectado. Falta la dirección del Web App en <code>config.js</code>.");
      return false;
    }
    limpiarError();
    return true;
  }

  /* ---------- envío (form POST clásico a un iframe oculto) ---------- */
  function recolectar() {
    var datos = {
      nombre: nombre.value.trim(),
      documento: doc.value.trim().replace(/[^0-9A-Za-z]/g, ""),
      origen: (location.origin + location.pathname),
      fecha_cliente: new Date().toISOString()
    };
    for (var i = 1; i <= TOTAL; i++) {
      var el = form.querySelector('input[name="p' + i + '"]:checked');
      datos["p" + i] = el ? el.value : "";
    }
    return datos;
  }

  function enviar(datos) {
    var f = document.createElement("form");
    f.method = "POST";
    f.action = CFG.webhookUrl;
    f.target = "destino-envio";
    f.style.display = "none";

    Object.keys(datos).forEach(function (k) {
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = datos[k];
      f.appendChild(input);
    });

    document.body.appendChild(f);
    f.submit();
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1500);
  }

  function mostrarExito(datos) {
    document.getElementById("ok-nombre").textContent = datos.nombre;
    document.getElementById("ok-doc").textContent = datos.documento;
    document.getElementById("ok-hora").textContent =
      new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

    zonaForm.classList.add("oculto");
    var head = document.querySelector("header.head");
    if (head) head.classList.add("oculto");
    var prog = document.querySelector(".progreso");
    if (prog) prog.classList.add("oculto");
    pantalla.classList.add("on");
    barraEnv.classList.add("oculto");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fallar(mensaje) {
    enviando = false;
    boton.textContent = "Enviar respuestas";
    actualizar();
    mostrarError(mensaje);
  }

  /* El iframe avisa cuando el Web App terminó de responder */
  iframe.addEventListener("load", function () {
    if (!enviando) return;
    clearTimeout(temporizador);
    enviando = false;
    mostrarExito(window.__datosEnviados || {});
  });

  function procesarEnvio(ev) {
    if (ev) ev.preventDefault();
    if (enviando) return;
    if (!validar()) return;

    var datos = recolectar();
    window.__datosEnviados = datos;

    enviando = true;
    limpiarError();
    boton.disabled = true;
    boton.textContent = "Enviando…";
    estado.textContent = "Enviando…";

    enviar(datos);

    temporizador = setTimeout(function () {
      if (!enviando) return;
      fallar("No se pudo confirmar el envío. Revise su conexión e intente de nuevo; " +
             "si el problema continúa, avise al administrador.");
    }, 30000);
  }

  boton.addEventListener("click", procesarEnvio);
  form.addEventListener("submit", procesarEnvio);

  doc.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9A-Za-z]/g, "");
  });
})();
