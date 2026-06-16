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
window.mostrarLogin = () => {
  document.getElementById("loginModal").classList.remove("oculto");
}

window.mostrarRegistro = () => {
  document.getElementById("registroModal").classList.remove("oculto");
}

window.cerrar = () => {
  document.getElementById("loginModal").classList.add("oculto");
  document.getElementById("registroModal").classList.add("oculto");
}

/* LOGIN */
window.login = async () => {
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
    window.location.href = "dashboard.html";
  } catch (e) {
    alert("Error: " + e.message);
  }
};

/* REGISTRO ✅ AHORA REGRESA */
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

    // ✅ REGRESA A PORTADA LIMPIO
    cerrar();

  } catch (e) {
    alert("Error: " + e.message);
  }
};

/* CERRAR SESIÓN ✅ */
window.cerrarSesion = async () => {
  await signOut(auth);
  window.location.href = "index.html";
};
