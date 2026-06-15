import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================
   FIREBASE
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyASJXlZXSs_bAKj2ZwShovHeKGeNXC0SnY",
  authDomain: "nutricalculo-da1bd.firebaseapp.com",
  projectId: "nutricalculo-da1bd",
  storageBucket: "nutricalculo-da1bd.firebasestorage.app",
  messagingSenderId: "1033405089444",
  appId: "1:1033405089444:web:695832361a23ea2a39c831",
  measurementId: "G-VJZGGHCHVB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

analyticsSupported()
  .then((ok) => {
    if (ok) getAnalytics(app);
  })
  .catch(() => {});

/* =========================
   ESTADO
========================= */
let pacientesCache = [];
let historialCache = [];

/* =========================
   HELPERS
========================= */
function byId(id) {
  return document.getElementById(id);
}

function pageName() {
  const path = window.location.pathname.split("/").pop();
  return path || "index.html";
}

function setTexto(id, texto) {
  const el = byId(id);
  if (el) el.textContent = texto;
}

function setHTML(id, html) {
  const el = byId(id);
  if (el) el.innerHTML = html;
}

function mostrarMensaje(id, mensaje, error = true) {
  const el = byId(id);
  if (!el) return;
  el.textContent = mensaje || "";
  el.style.color = error ? "#fca5a5" : "#86efac";
}

function traducirErrorAuth(code) {
  const mapa = {
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/invalid-email": "El correo no es válido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/network-request-failed": "Error de red. Verifica tu conexión.",
    "auth/operation-not-allowed": "Activa Email/Password en Firebase Authentication."
  };
  return mapa[code] || "Ocurrió un error. Inténtalo de nuevo.";
}

function estadoClase(estado) {
  if (estado.includes("Bajo")) return "estado-bajo";
  if (estado.includes("normal")) return "estado-normal";
  if (estado.includes("Sobrepeso")) return "estado-sobrepeso";
  return "estado-obesidad";
}

function formatearFecha(fecha) {
  if (!fecha) return "-";

  if (typeof fecha === "string") {
    return new Date(fecha).toLocaleString();
  }

  if (fecha.toDate) {
    return fecha.toDate().toLocaleString();
  }

  return "-";
}

function calcularNutricion({ sexo, peso, estaturaCm, edad, actividad }) {
  const alturaM = estaturaCm / 100;

  let bmr = 0;
  if (sexo === "hombre") {
    bmr = 10 * peso + 6.25 * estaturaCm - 5 * edad + 5;
  } else {
    bmr = 10 * peso + 6.25 * estaturaCm - 5 * edad - 161;
  }

  const tdee = bmr * actividad;
  const imc = peso / (alturaM * alturaM);

  let estado = "";
  if (imc < 18.5) {
    estado = "Bajo peso";
  } else if (imc < 25) {
    estado = "Peso normal (saludable)";
  } else if (imc < 30) {
    estado = "Sobrepeso";
  } else {
    estado = "Obesidad";
  }

  const proteinas = peso * 2;
  const grasas = (tdee * 0.25) / 9;
  const carbohidratos = (tdee - (proteinas * 4 + grasas * 9)) / 4;

  return {
    calorias: Number(tdee.toFixed(2)),
    imc: Number(imc.toFixed(2)),
    estado,
    proteinas: Number(proteinas.toFixed(2)),
    grasas: Number(grasas.toFixed(2)),
    carbohidratos: Number(carbohidratos.toFixed(2))
  };
}

function limpiarResultadoInicial() {
  setHTML(
    "resultadoRegistro",
    `<p class="resultado-empty">Aquí aparecerá el resultado inicial del paciente.</p>`
  );
}

function limpiarResultadoPaciente() {
  setHTML(
    "resultadoPaciente",
    `<p class="resultado-empty">Aquí aparecerá el resultado de la evaluación.</p>`
  );
}

function renderResultado(id, nombreCompleto, datos) {
  const clase = estadoClase(datos.estado);

  setHTML(
    id,
    `
    <div><strong>Paciente:</strong> ${nombreCompleto}</div>
    <br>
    <div>🔥 <strong>Calorías recomendadas:</strong> ${datos.calorias} kcal</div>
    <div>⚖️ <strong>IMC:</strong> ${datos.imc}</div>
    <div>📊 <strong>Estado:</strong> <span class="${clase}">${datos.estado}</span></div>
    <br>
    <div>🥩 <strong>Proteínas recomendadas:</strong> ${datos.proteinas} g</div>
    <div>🧈 <strong>Grasas recomendadas:</strong> ${datos.grasas} g</div>
    <div>🍞 <strong>Carbohidratos recomendados:</strong> ${datos.carbohidratos} g</div>
    `
  );
}

function refPacientes(uid) {
  return collection(db, "users", uid, "pacientes");
}

function refHistorial(uid, pacienteId) {
  return collection(db, "users", uid, "pacientes", pacienteId, "historial");
}

/* =========================
   MODALES
========================= */
function mostrarLogin() {
  byId("overlay")?.classList.remove("hidden");
  byId("loginModal")?.classList.remove("hidden");
  byId("registroModal")?.classList.add("hidden");
  mostrarMensaje("loginMensaje", "");
  mostrarMensaje("registerMensaje", "");
}

function mostrarRegistro() {
  byId("overlay")?.classList.remove("hidden");
  byId("registroModal")?.classList.remove("hidden");
  byId("loginModal")?.classList.add("hidden");
  mostrarMensaje("loginMensaje", "");
  mostrarMensaje("registerMensaje", "");
}

function cerrarModales() {
  byId("overlay")?.classList.add("hidden");
  byId("loginModal")?.classList.add("hidden");
  byId("registroModal")?.classList.add("hidden");
}

window.mostrarLogin = mostrarLogin;
window.mostrarRegistro = mostrarRegistro;
window.cerrarModales = cerrarModales;

/* =========================
   AUTH
========================= */
async function registrar() {
  const email = byId("registerEmail")?.value.trim();
  const password = byId("registerPassword")?.value.trim();

  if (!email || !password) {
    mostrarMensaje("registerMensaje", "Completa correo y contraseña.");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    mostrarMensaje("registerMensaje", "Cuenta creada correctamente.", false);
    setTimeout(() => {
      cerrarModales();
      window.location.href = "dashboard.html";
    }, 700);
  } catch (error) {
    mostrarMensaje("registerMensaje", traducirErrorAuth(error.code));
  }
}

async function login() {
  const email = byId("loginEmail")?.value.trim();
  const password = byId("loginPassword")?.value.trim();

  if (!email || !password) {
    mostrarMensaje("loginMensaje", "Completa correo y contraseña.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    mostrarMensaje("loginMensaje", "Ingreso correcto.", false);
    setTimeout(() => {
      cerrarModales();
      window.location.href = "dashboard.html";
    }, 500);
  } catch (error) {
    mostrarMensaje("loginMensaje", traducirErrorAuth(error.code));
  }
}

async function logout() {
  await signOut(auth);
  window.location.href = "index.html";
}

window.registrar = registrar;
window.login = login;
window.logout = logout;

/* =========================
   DASHBOARD UI
========================= */
function mostrarFormularioPaciente() {
  byId("panelFormulario")?.classList.remove("hidden");
  byId("panelBusqueda")?.classList.add("hidden");
  byId("panelBienvenida")?.classList.add("hidden");
}

function mostrarBuscadorPacientes() {
  byId("panelBusqueda")?.classList.remove("hidden");
  byId("panelFormulario")?.classList.add("hidden");
  byId("panelBienvenida")?.classList.add("hidden");
  cargarPacientes();
}

function limpiarFormularioNuevoPaciente() {
  byId("nombre").value = "";
  byId("apellido").value = "";
  byId("sexoPersonal").value = "";
  byId("telefono").value = "";
  byId("correo").value = "";
  byId("direccion").value = "";

  byId("edad").value = "";
  byId("peso").value = "";
  byId("estatura").value = "";
  byId("actividad").value = "";

  limpiarResultadoInicial();
}

window.mostrarFormularioPaciente = mostrarFormularioPaciente;
window.mostrarBuscadorPacientes = mostrarBuscadorPacientes;
window.limpiarFormularioNuevoPaciente = limpiarFormularioNuevoPaciente;

/* =========================
   NUEVO PACIENTE
========================= */
async function guardarNuevoPaciente() {
  const user = auth.currentUser;
  if (!user) return;

  const nombre = byId("nombre").value.trim();
  const apellido = byId("apellido").value.trim();
  const sexo = byId("sexoPersonal").value;
  const telefono = byId("telefono").value.trim();
  const correo = byId("correo").value.trim();
  const direccion = byId("direccion").value.trim();

  const edad = parseInt(byId("edad").value);
  const peso = parseFloat(byId("peso").value);
  const estaturaCm = parseFloat(byId("estatura").value);
  const actividad = parseFloat(byId("actividad").value);

  if (!nombre || !apellido || !sexo || !telefono || !correo || !direccion || !edad || !peso || !estaturaCm || !actividad) {
    alert("Completa todos los campos del paciente.");
    return;
  }

  const calculo = calcularNutricion({
    sexo,
    peso,
    estaturaCm,
    edad,
    actividad
  });

  try {
    const docRef = await addDoc(refPacientes(user.uid), {
      nombre,
      apellido,
      sexo,
      telefono,
      correo,
      direccion,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await addDoc(refHistorial(user.uid, docRef.id), {
      edad,
      peso,
      estaturaCm,
      actividad,
      fechaRegistro: new Date().toISOString(),
      ...calculo
    });

    renderResultado(
      "resultadoRegistro",
      `${nombre} ${apellido}`,
      calculo
    );

    await cargarPacientes();
  } catch (error) {
    console.error(error);
    alert("No se pudo guardar el paciente.");
  }
}

window.guardarNuevoPaciente = guardarNuevoPaciente;

/* =========================
   BUSCAR / TABLA PACIENTES
========================= */
async function cargarPacientes() {
  const user = auth.currentUser;
  if (!user) return;

  pacientesCache = [];
  const tbody = document.querySelector("#tablaPacientes tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  try {
    const snapshot = await getDocs(refPacientes(user.uid));

    for (const item of snapshot.docs) {
      const data = item.data();
      pacientesCache.push({
        id: item.id,
        ...data
      });
    }

    renderTablaPacientes(pacientesCache);
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `
      <tr>
        <td colspan="5">No se pudieron cargar los pacientes.</td>
      </tr>
    `;
  }
}

function renderTablaPacientes(lista) {
  const tbody = document.querySelector("#tablaPacientes tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">No hay pacientes registrados.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((p) => {
    tbody.innerHTML += `
      <tr>
        <td>${p.nombre} ${p.apellido}</td>
        <td>${p.telefono ?? "-"}</td>
        <td>${p.correo ?? "-"}</td>
        <td>${formatearFecha(p.updatedAt)}</td>
        <td>
          <button type="button" class="btn btn-secondary" onclick="abrirPaciente('${p.id}')">
            Ver paciente
          </button>
        </td>
      </tr>
    `;
  });
}

function conectarBuscadorDashboard() {
  const buscador = byId("buscadorPacientes");
  if (!buscador) return;

  buscador.addEventListener("input", () => {
    const valor = buscador.value.trim().toLowerCase();

    if (!valor) {
      renderTablaPacientes(pacientesCache);
      return;
    }

    const filtrados = pacientesCache.filter((p) => {
      const texto = `${p.nombre || ""} ${p.apellido || ""}`.toLowerCase();
      return texto.includes(valor);
    });

    renderTablaPacientes(filtrados);
  });
}

function abrirPaciente(id) {
  window.location.href = `paciente.html?id=${id}`;
}

window.abrirPaciente = abrirPaciente;

/* =========================
   PACIENTE DETALLE
========================= */
async function cargarPacienteDetalle() {
  const user = auth.currentUser;
  if (!user) return;

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    window.location.href = "dashboard.html";
    return;
  }

  byId("pacienteId").value = id;

  try {
    const ref = doc(db, "users", user.uid, "pacientes", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("El paciente no existe.");
      window.location.href = "dashboard.html";
      return;
    }

    const p = snap.data();

    byId("editNombre").value = p.nombre || "";
    byId("editApellido").value = p.apellido || "";
    byId("editSexoPersonal").value = p.sexo || "";
    byId("editTelefono").value = p.telefono || "";
    byId("editCorreo").value = p.correo || "";
    byId("editDireccion").value = p.direccion || "";

    setTexto(
      "infoActualizacionPaciente",
      `Última modificación: ${formatearFecha(p.updatedAt)}`
    );

    await cargarHistorialPaciente(id);
  } catch (error) {
    console.error(error);
    alert("No se pudo cargar el paciente.");
  }
}

async function actualizarDatosPaciente() {
  const user = auth.currentUser;
  if (!user) return;

  const id = byId("pacienteId").value;
  if (!id) return;

  const payload = {
    nombre: byId("editNombre").value.trim(),
    apellido: byId("editApellido").value.trim(),
    sexo: byId("editSexoPersonal").value,
    telefono: byId("editTelefono").value.trim(),
    correo: byId("editCorreo").value.trim(),
    direccion: byId("editDireccion").value.trim(),
    updatedAt: serverTimestamp()
  };

  try {
    const ref = doc(db, "users", user.uid, "pacientes", id);
    await updateDoc(ref, payload);
    setTexto(
      "infoActualizacionPaciente",
      `Última modificación: ${new Date().toLocaleString()}`
    );
    alert("Datos personales actualizados.");
  } catch (error) {
    console.error(error);
    alert("No se pudieron actualizar los datos personales.");
  }
}

async function guardarNuevaEvaluacion() {
  const user = auth.currentUser;
  if (!user) return;

  const pacienteId = byId("pacienteId").value;
  if (!pacienteId) return;

  // Sexo se toma del perfil personal
  const sexo = byId("editSexoPersonal").value;

  const edad = parseInt(byId("evalEdad").value);
  const peso = parseFloat(byId("evalPeso").value);
  const estaturaCm = parseFloat(byId("evalEstatura").value);
  const actividad = parseFloat(byId("evalActividad").value);

  if (!sexo || !edad || !peso || !estaturaCm || !actividad) {
    alert("Completa todos los campos de la evaluación.");
    return;
  }

  const nombreCompleto = `${byId("editNombre").value.trim()} ${byId("editApellido").value.trim()}`;
  const calculo = calcularNutricion({
    sexo,
    peso,
    estaturaCm,
    edad,
    actividad
  });

  try {
    await addDoc(refHistorial(user.uid, pacienteId), {
      edad,
      peso,
      estaturaCm,
      actividad,
      fechaRegistro: new Date().toISOString(),
      ...calculo
    });

    const refPaciente = doc(db, "users", user.uid, "pacientes", pacienteId);
    await updateDoc(refPaciente, {
      updatedAt: serverTimestamp()
    });

    renderResultado("resultadoPaciente", nombreCompleto, calculo);

    await cargarHistorialPaciente(pacienteId);

    setTexto(
      "infoActualizacionPaciente",
      `Última modificación: ${new Date().toLocaleString()}`
    );

    byId("evalEdad").value = "";
    byId("evalPeso").value = "";
    byId("evalEstatura").value = "";
    byId("evalActividad").value = "";
  } catch (error) {
    console.error(error);
    alert("No se pudo guardar la evaluación.");
  }
}

async function cargarHistorialPaciente(pacienteId) {
  const user = auth.currentUser;
  if (!user) return;

  historialCache = [];
  const tbody = document.querySelector("#tablaHistorial tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  try {
    const snapshot = await getDocs(refHistorial(user.uid, pacienteId));

    snapshot.forEach((item) => {
      historialCache.push({
        id: item.id,
        ...item.data()
      });
    });

    historialCache.sort((a, b) => {
      return new Date(b.fechaRegistro) - new Date(a.fechaRegistro);
    });

    renderTablaHistorial(historialCache);
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `
      <tr>
        <td colspan="11">No se pudo cargar el historial.</td>
      </tr>
    `;
  }
}

function renderTablaHistorial(lista) {
  const tbody = document.querySelector("#tablaHistorial tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11">Todavía no hay evaluaciones registradas.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((h) => {
    const clase = estadoClase(h.estado || "");

    tbody.innerHTML += `
      <tr>
        <td>${formatearFecha(h.fechaRegistro)}</td>
        <td>${h.edad ?? "-"}</td>
        <td>${h.peso ?? "-"}</td>
        <td>${h.estaturaCm ?? "-"}</td>
        <td>${h.actividad ?? "-"}</td>
        <td>${h.calorias ?? "-"}</td>
        <td>${h.imc ?? "-"}</td>
        <td class="${clase}">${h.estado ?? "-"}</td>
        <td>${h.proteinas ?? "-"}</td>
        <td>${h.grasas ?? "-"}</td>
        <td>${h.carbohidratos ?? "-"}</td>
      </tr>
    `;
  });
}

function volverDashboard() {
  window.location.href = "dashboard.html";
}

window.actualizarDatosPaciente = actualizarDatosPaciente;
window.guardarNuevaEvaluacion = guardarNuevaEvaluacion;
window.volverDashboard = volverDashboard;

/* =========================
   INICIALIZACIÓN POR RUTA
========================= */
function inicializarRutas() {
  const page = pageName();

  onAuthStateChanged(auth, async (user) => {
    if (page === "index.html") {
      if (user) {
        window.location.href = "dashboard.html";
      }
      return;
    }

    if (page === "dashboard.html") {
      if (!user) {
        window.location.href = "index.html";
        return;
      }

      setTexto("usuarioActivoTexto", user.email || user.uid);
      conectarBuscadorDashboard();
      return;
    }

    if (page === "paciente.html") {
      if (!user) {
        window.location.href = "index.html";
        return;
      }

      await cargarPacienteDetalle();
      return;
    }
  });
}

/* =========================
   START
========================= */
document.addEventListener("DOMContentLoaded", () => {
  inicializarRutas();
});