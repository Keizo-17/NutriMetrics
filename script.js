/* =========================
   UTILIDADES DE STORAGE
========================= */
function obtenerUsuarios() {
  return JSON.parse(localStorage.getItem("usuarios")) || [];
}

function guardarUsuarios(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function obtenerUsuarioActivo() {
  return localStorage.getItem("usuarioActivo");
}

function guardarUsuarioActivo(usuario) {
  localStorage.setItem("usuarioActivo", usuario);
}

function limpiarUsuarioActivo() {
  localStorage.removeItem("usuarioActivo");
}

function obtenerDatosUsuario(usuario) {
  return JSON.parse(localStorage.getItem(`datos_${usuario}`)) || [];
}

function guardarDatosUsuario(usuario, datos) {
  localStorage.setItem(`datos_${usuario}`, JSON.stringify(datos));
}

/* =========================
   INICIALIZACIÓN
========================= */
document.addEventListener("DOMContentLoaded", function () {
  const pagina = window.location.pathname.split("/").pop();

  if (pagina === "dashboard.html") {
    protegerDashboard();
    mostrarUsuarioActivo();
    mostrarPacientes();
  }
});

/* =========================
   MODALES
========================= */
function mostrarLogin() {
  document.getElementById("overlay").classList.remove("oculto");
  document.getElementById("loginBox").classList.remove("oculto");
  document.getElementById("registroBox").classList.add("oculto");
}

function mostrarRegistro() {
  document.getElementById("overlay").classList.remove("oculto");
  document.getElementById("registroBox").classList.remove("oculto");
  document.getElementById("loginBox").classList.add("oculto");
}

function cerrar() {
  const overlay = document.getElementById("overlay");
  const loginBox = document.getElementById("loginBox");
  const registroBox = document.getElementById("registroBox");

  if (overlay) overlay.classList.add("oculto");
  if (loginBox) loginBox.classList.add("oculto");
  if (registroBox) registroBox.classList.add("oculto");
}

/* =========================
   LOGIN / REGISTRO
========================= */
function registrar() {
  const user = document.getElementById("nuevoUsuario").value.trim();
  const pass = document.getElementById("nuevoPassword").value.trim();

  if (!user || !pass) {
    alert("Completa usuario y contraseña.");
    return;
  }

  const usuarios = obtenerUsuarios();
  const existe = usuarios.some(u => u.user === user);

  if (existe) {
    alert("Ese usuario ya existe.");
    return;
  }

  usuarios.push({ user, pass });
  guardarUsuarios(usuarios);

  alert("Usuario registrado correctamente.");
  cerrar();
}

function login() {
  const user = document.getElementById("usuario").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (!user || !pass) {
    alert("Completa usuario y contraseña.");
    return;
  }

  const usuarios = obtenerUsuarios();
  const encontrado = usuarios.find(u => u.user === user && u.pass === pass);

  if (!encontrado) {
    alert("Usuario o contraseña incorrectos.");
    return;
  }

  guardarUsuarioActivo(user);
  window.location.href = "dashboard.html";
}

function logout() {
  limpiarUsuarioActivo();
  window.location.href = "index.html";
}

/* =========================
   SEGURIDAD BÁSICA
========================= */
function protegerDashboard() {
  const usuario = obtenerUsuarioActivo();

  if (!usuario) {
    window.location.href = "index.html";
  }
}

function mostrarUsuarioActivo() {
  const usuario = obtenerUsuarioActivo();
  const elemento = document.getElementById("usuarioActivoTexto");

  if (elemento) {
    elemento.textContent = usuario || "-";
  }
}

/* =========================
   CÁLCULO NUTRICIONAL
========================= */
function calcular() {
  const nombre = document.getElementById("nombrePaciente").value.trim();
  const peso = parseFloat(document.getElementById("peso").value);
