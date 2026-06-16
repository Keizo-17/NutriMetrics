import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
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

analyticsSupported()
  .then((ok) => {
    if (ok) {
      getAnalytics(app);
    }
  })
  .catch(() => {
    /* no action */
  });

/* =========================
   HELPERS
========================= */
function byId(id) {
  return document.getElementById(id);
}

function setMensaje(id, texto, error = true) {
  const el = byId(id);
  if (!el) return;
  el.textContent = texto || "";
  el.style.color = error ? "#fca5a5" : "#86efac";
}

function limpiarMensajes() {
  setMensaje("loginMensaje", "");
  setMensaje("registerMensaje", "");
}

function traducirError(code) {
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

/* =========================
   UI MODALS
========================= */
function mostrarLogin() {
  byId("overlay")?.classList.remove("hidden");
  byId("loginModal")?.classList.remove("hidden");
  byId("registroModal")?.classList.add("hidden");
  limpiarMensajes();
}

function mostrarRegistro() {
  byId("overlay")?.classList.remove("hidden");
  byId("registroModal")?.classList.remove("hidden");
  byId("loginModal")?.classList.add("hidden");
  limpiarMensajes();
}

function cerrarModales() {
  byId("overlay")?.classList.add("hidden");
  byId("loginModal")?.classList.add("hidden");
  byId("registroModal")?.classList.add("hidden");
  limpiarMensajes();
}

window.mostrarLogin = mostrarLogin;
window.mostrarRegistro = mostrarRegistro;
window.cerrarModales = cerrarModales;

/* =========================
   AUTH
========================= */
async function registrar() {
  const username = byId("registerUser")?.value.trim();
  const email = byId("registerEmail")?.value.trim();
  const password = byId("registerPassword")?.value.trim();

  if (!username || !email || !password) {
    setMensaje("registerMensaje", "Completa nombre de usuario, correo y contraseña.");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "usuarios", cred.user.uid), {
      username,
      email,
      creadoEn: new Date().toISOString()
    });

    localStorage.setItem("nutri_username", username);
    localStorage.setItem("nutri_email", email);

    setMensaje("registerMensaje", "Cuenta creada correctamente.", false);

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 700);
  } catch (error) {
    setMensaje("registerMensaje", traducirError(error.code));
  }
}

async function login() {
  const email = byId("loginEmail")?.value.trim();
  const password = byId("loginPassword")?.value.trim();

  if (!email || !password) {
    setMensaje("loginMensaje", "Completa correo y contraseña.");
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    const perfilRef = doc(db, "usuarios", cred.user.uid);
    const snap = await getDoc(perfilRef);

    if (snap.exists()) {
      const data = snap.data();
      localStorage.setItem("nutri_username", data.username || "");
      localStorage.setItem("nutri_email", data.email || email);
    } else {
      localStorage.setItem("nutri_email", email);
    }

    setMensaje("loginMensaje", "Ingreso correcto.", false);

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 500);
  } catch (error) {
    setMensaje("loginMensaje", traducirError(error.code));
  }
}

window.registrar = registrar;
window.login = login;

/* =========================
   REDIRECCIÓN SI YA HAY SESIÓN
========================= */
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    const page = window.location.pathname.split("/").pop() || "index.html";

    if (page === "index.html" && user) {
      window.location.href = "dashboard.html";
    }
  });
});
