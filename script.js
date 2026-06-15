import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASJXlZXSs_bAKj2ZwShovHeKGeNXC0SnY",
  authDomain: "nutricalculo-da1bd.firebaseapp.com",
  projectId: "nutricalculo-da1bd",
  storageBucket: "nutricalculo-da1bd.firebasestorage.app",
  messagingSenderId: "1033405089444",
  appId: "1:1033405089444:web:695832361a23ea2a39c831"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.mostrarLogin = () => login.classList.remove("oculto");
window.mostrarRegistro = () => registro.classList.remove("oculto");

// ✅ LOGIN
window.login = async () => {
  await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
  window.location.href = "dashboard.html";
};

// ✅ REGISTRO
window.registrar = async () => {
  await createUserWithEmailAndPassword(auth, registerEmail.value, registerPassword.value);
  alert("Usuario creado");
};

// ✅ LOGOUT
window.logout = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};

// UI
window.mostrarFormulario = () => formulario.classList.toggle("oculto");
window.mostrarLista = () => cargarPacientes();

// ✅ GUARDAR PACIENTE
window.guardarPaciente = async () => {

  let user = auth.currentUser;

  let p = await addDoc(collection(db, "users", user.uid, "pacientes"), {
    nombre: nombre.value,
    apellido: apellido.value
  });

  await addDoc(collection(db, "users", user.uid, "pacientes", p.id, "historial"), {
    edad: edad.value,
    peso: peso.value,
    fecha: new Date()
  });

  alert("Guardado ✅");
};

// ✅ LISTAR
async function cargarPacientes() {

  let user = auth.currentUser;
  let data = await getDocs(collection(db, "users", user.uid, "pacientes"));

  lista.innerHTML = "";

  data.forEach(d => {
    let p = d.data();

    lista.innerHTML += `
      <li onclick="verPaciente('${d.id}')">
        ${p.nombre} ${p.apellido}
      </li>
    `;
  });
}

// ✅ VER PACIENTE
window.verPaciente = id => {
  window.location.href = "paciente.html?id=" + id;
};

// ✅ DETALLE
async function cargarDetalle() {

  let id = new URLSearchParams(location.search).get("id");
  if (!id) return;

  let user = auth.currentUser;

  let ref = doc(db, "users", user.uid, "pacientes", id);
  let data = await getDoc(ref);

  datos.innerHTML = JSON.stringify(data.data());
}

if (location.pathname.includes("paciente")) {
  setTimeout(cargarDetalle, 1000);
}