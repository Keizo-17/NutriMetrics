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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =========================
   FIREBASE CONFIG
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

/* Analytics sin romper el entorno local */
analyticsSupported().then((ok) => {
  if (ok) {
    getAnalytics(app);
  }
}).catch(() => {
  /* sin acción */
});

/* =========================
   ESTADO GLOBAL
========================= */
let pacienteCache = [];

/* =========================
   HELPERS
========================= */
function byId(id) {
  return document.getElementById(id);
}

function currentPage() {
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

function mostrarMensaje(id, mensaje, esError = true) {
  const el = byId(id);
  if (!el) return;
  el.textContent = mensaje || "";
  el.style.color = esError ? "#fca5a5" : "#86efac";
}

function estadoClase(estado) {
  if (estado.includes("Bajo")) return "estado-bajo";
  if (estado.includes("normal")) return "estado-normal";
  if (estado.includes("Sobrepeso")) return "estado-sobrepeso";
  return "estado-obesidad";
}

function limpiarResultado() {
  setHTML(
    "resultado",
    `<p class="resultado-empty">Aquí aparecerán los resultados del paciente.</p>`
  );
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
    }, 600);
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

function traducirErrorAuth(code) {
  const mapa = {
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/invalid-email": "El correo no es válido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "Correo o contraseña incorrectos."
  };
  return mapa[code] || "Ocurrió un error. Inténtalo de nuevo.";
}

window.registrar = registrar;
window.login = login;
window.logout = logout;

/* =========================
   SEGURIDAD / NAVEGACIÓN
========================= */
function inicializarRuta() {
  const page = currentPage();

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
      conectarBuscador();
      await cargarPacientes();
    }
  });
}

/* =========================
   PACIENTES
========================= */
function refPacientes(uid) {
  return collection(db, "users", uid, "pacientes");
}

async function guardarPaciente() {
  const user = auth.currentUser;
  if (!user) return;

  const idPaciente = byId("pacienteId").value.trim();
  const nombre = byId("nombrePaciente").value.trim();
  const peso = parseFloat(byId("peso").value);
  const alturaCm = parseFloat(byId("altura").value);
  const edad = parseInt(byId("edad").value);
  const sexo = byId("sexo").value;
  const actividad = parseFloat(byId("actividad").value);

  if (!nombre || !peso || !alturaCm || !edad || !sexo || !actividad) {
    alert("Completa todos los campos del formulario.");
    return;
  }

  const alturaM = alturaCm / 100;

  // BMR - fórmula Mifflin-St Jeor
  let bmr = 0;
  if (sexo === "hombre") {
    bmr = 10 * peso + 6.25 * alturaCm - 5 * edad + 5;
  } else {
    bmr = 10 * peso + 6.25 * alturaCm - 5 * edad - 161;
  }

  const tdee = bmr * actividad;

  // IMC
  const imc = peso / (alturaM * alturaM);

  // Estado IMC
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

  // Macronutrientes recomendados
  const proteinas = peso * 2;                // g/kg
  const grasas = (tdee * 0.25) / 9;          // 25% de kcal
  const carbohidratos = (tdee - (proteinas * 4 + grasas * 9)) / 4;

  const payload = {
    paciente: nombre,
    peso,
    alturaCm,
    edad,
    sexo,
    actividad,
    calorias: Number(tdee.toFixed(2)),
    imc: Number(imc.toFixed(2)),
    estado,
    proteinas: Number(proteinas.toFixed(2)),
    grasas: Number(grasas.toFixed(2)),
    carbohidratos: Number(carbohidratos.toFixed(2)),
    updatedAt: serverTimestamp()
  };

  try {
    if (idPaciente) {
      // Editar
      const ref = doc(db, "users", user.uid, "pacientes", idPaciente);
      await updateDoc(ref, payload);
    } else {
      // Crear
      await addDoc(refPacientes(user.uid), {
        ...payload,
        createdAt: serverTimestamp()
      });
    }

    renderResultado({
      paciente: nombre,
      calorias: payload.calorias,
      imc: payload.imc,
      estado: payload.estado,
      proteinas: payload.proteinas,
      grasas: payload.grasas,
      carbohidratos: payload.carbohidratos
    });

    limpiarFormulario();
    await cargarPacientes();
  } catch (error) {
    console.error(error);
    alert("No se pudo guardar el paciente.");
  }
}

function renderResultado(data) {
  const clase = estadoClase(data.estado);

  setHTML(
    "resultado",
    `
    <div><strong>Paciente:</strong> ${data.paciente}</div>
    <br>
    <div>🔥 <strong>Calorías recomendadas:</strong> ${data.calorias} kcal</div>
    <div>⚖️ <strong>IMC:</strong> ${data.imc}</div>
    <div>📊 <strong>Estado:</strong> <span class="${clase}">${data.estado}</span></div>
    <br>
    <div>🥩 <strong>Proteínas recomendadas:</strong> ${data.proteinas} g</div>
    <div>🧈 <strong>Grasas recomendadas:</strong> ${data.grasas} g</div>
    <div>🍞 <strong>Carbohidratos recomendados:</strong> ${data.carbohidratos} g</div>
    `
  );
}

async function cargarPacientes() {
  const user = auth.currentUser;
  if (!user) return;

  const tbody = document.querySelector("#tablaPacientes tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  pacienteCache = [];

  try {
    const snapshot = await getDocs(refPacientes(user.uid));

    snapshot.forEach((item) => {
      pacienteCache.push({
        id: item.id,
        ...item.data()
      });
    });

    renderTabla(pacienteCache);
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `
      <tr>
        <td colspan="9">No se pudieron cargar los pacientes.</td>
      </tr>
    `;
  }
}

function renderTabla(lista) {
  const tbody = document.querySelector("#tablaPacientes tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">No hay pacientes registrados todavía.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((p) => {
    const claseEstado = estadoClase(p.estado);
    const fecha =
      p.createdAt?.toDate?.().toLocaleString?.() ||
      p.updatedAt?.toDate?.().toLocaleString?.() ||
      "-";

    tbody.innerHTML += `
      <tr>
        <td>${p.paciente ?? "-"}</td>
        <td>${p.calorias ?? "-"}</td>
        <td>${p.imc ?? "-"}</td>
        <td class="${claseEstado}">${p.estado ?? "-"}</td>
        <td>${p.proteinas ?? "-"}</td>
        <td>${p.grasas ?? "-"}</td>
        <td>${p.carbohidratos ?? "-"}</td>
        <td>${fecha}</td>
        <td>
          <div class="acciones">
            <button type="button" class="btn btn-secondary" onclick="editarPaciente('${p.id}')">Editar</button>
            <button type="button" class="btn btn-danger" onclick="eliminarPaciente('${p.id}')">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function editarPaciente(id) {
  const paciente = pacienteCache.find((p) => p.id === id);
  if (!paciente) return;

  byId("pacienteId").value = paciente.id || "";
  byId("nombrePaciente").value = paciente.paciente || "";
  byId("peso").value = paciente.peso || "";
  byId("altura").value = paciente.alturaCm || "";
  byId("edad").value = paciente.edad || "";
  byId("sexo").value = paciente.sexo || "";
  byId("actividad").value = paciente.actividad || "";

  renderResultado({
    paciente: paciente.paciente,
    calorias: paciente.calorias,
    imc: paciente.imc,
    estado: paciente.estado,
    proteinas: paciente.proteinas,
    grasas: paciente.grasas,
    carbohidratos: paciente.carbohidratos
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function eliminarPaciente(id) {
  const user = auth.currentUser;
  if (!user) return;

  const confirmar = confirm("¿Deseas eliminar este paciente?");
  if (!confirmar) return;

  try {
    const ref = doc(db, "users", user.uid, "pacientes", id);
    await deleteDoc(ref);
    await cargarPacientes();
    limpiarFormulario();
    limpiarResultado();
  } catch (error) {
    console.error(error);
    alert("No se pudo eliminar el paciente.");
  }
}

function limpiarFormulario() {
  byId("pacienteId").value = "";
  byId("nombrePaciente").value = "";
  byId("peso").value = "";
  byId("altura").value = "";
  byId("edad").value = "";
  byId("sexo").value = "";
  byId("actividad").value = "";
}

function conectarBuscador() {
  const buscador = byId("buscador");
  if (!buscador) return;

  buscador.addEventListener("input", buscarPaciente);
}

function buscarPaciente() {
  const valor = byId("buscador")?.value.trim().toLowerCase() || "";

  if (!valor) {
    renderTabla(pacienteCache);
    return;
  }

  const filtrados = pacienteCache.filter((p) =>
    (p.paciente || "").toLowerCase().includes(valor)
  );

  renderTabla(filtrados);
}

window.guardarPaciente = guardarPaciente;
window.limpiarFormulario = limpiarFormulario;
window.buscarPaciente = buscarPaciente;
window.editarPaciente = editarPaciente;
window.eliminarPaciente = eliminarPaciente;

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  inicializarRuta();
});