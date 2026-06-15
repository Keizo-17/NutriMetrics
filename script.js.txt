let ultimoResultado = null;

function calcular() {

  let peso = parseFloat(document.getElementById("peso").value);
  let altura = parseFloat(document.getElementById("altura").value);
  let edad = parseInt(document.getElementById("edad").value);
  let sexo = document.getElementById("sexo").value;
  let actividad = parseFloat(document.getElementById("actividad").value);

  let bmr;

  if (sexo === "hombre") {
    bmr = 10 * peso + 6.25 * altura - 5 * edad + 5;
  } else {
    bmr = 10 * peso + 6.25 * altura - 5 * edad - 161;
  }

  let tdee = bmr * actividad;

  let proteinas = peso * 2;
  let grasas = (tdee * 0.25) / 9;
  let carbohidratos = (tdee - (proteinas * 4 + grasas * 9)) / 4;

  ultimoResultado = {
    fecha: new Date().toLocaleString(),
    peso,
    calorias: tdee.toFixed(2),
    proteinas: proteinas.toFixed(2),
    grasas: grasas.toFixed(2),
    carbohidratos: carbohidratos.toFixed(2)
  };

  document.getElementById("resultado").innerHTML = `
    <strong>Resultados:</strong><br>
    Calorías: ${tdee.toFixed(2)} kcal<br>
    Proteínas: ${proteinas.toFixed(2)} g<br>
    Grasas: ${grasas.toFixed(2)} g<br>
    Carbohidratos: ${carbohidratos.toFixed(2)} g
  `;
}

function guardar() {
  if (!ultimoResultado) {
    alert("Primero calcula los datos");
    return;
  }

  let historial = JSON.parse(localStorage.getItem("historial")) || [];
  historial.push(ultimoResultado);

  localStorage.setItem("historial", JSON.stringify(historial));

  alert("Datos guardados");
}

function verHistorial() {

  let historial = JSON.parse(localStorage.getItem("historial")) || [];

  let salida = "<strong>Historial:</strong><br>";

  historial.forEach(item => {
    salida += `
      ${item.fecha} - ${item.calorias} kcal<br>
    `;
  });

  document.getElementById("historial").innerHTML = salida;
}