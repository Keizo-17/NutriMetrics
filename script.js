import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASJXlZXSs_bAKj2ZwShovHeKGeNXC0SnY",
  authDomain: "nutricalculo-da1bd.firebaseapp.com",
  projectId: "nutricalculo-da1bd",
  appId: "1:1033405089444:web:695832361a23ea2a39c831"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* UI */
window.mostrarLogin = () => loginModal.classList.remove("oculto");
window.mostrarRegistro = () => registroModal.classList.remove("oculto");
window.cerrar = () => {
  loginModal.classList.add("oculto");
  registroModal.classList.add("oculto");
};

/* LOGIN */
window.login = async () => {
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
    window.location.href = "dashboard.html";
  } catch (e) {
    alert(e.message);
  }
};

/* REGISTRO */
window.registrar = async () => {
  try {
    let user = await createUserWithEmailAndPassword(
      auth,
      registerEmail.value,
      registerPassword.value
    );

    await setDoc(doc(db, "usuarios", user.user.uid), {
      nombre: registerUser.value,
      email: registerEmail.value
    });

    alert("Cuenta creada ✅");

    cerrar(); // ✅ vuelve a inicio

  } catch (e) {
    alert(e.message);
  }
};

/* LOGOUT */
window.cerrarSesion = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};