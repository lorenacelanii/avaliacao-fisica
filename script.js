const aplicarMascaraData = (val) => {
  const nums = val.replace(/[^0-9]/g, "").slice(0, 8);
  if (nums.length <= 2) return nums;
  if (nums.length <= 4) return nums.replace(/(\d{2})(\d{1,2})/, "$1/$2");
  return nums.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
};

const calcularIdade = (str) => {
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [_, d, mo, a] = m.map(Number);
  const nasc = new Date(a, mo - 1, d);
  if (isNaN(nasc)) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const diff = hoje.getMonth() - nasc.getMonth();
  if (diff < 0 || (diff === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
};

const dobras = [],
  perims = [];
const nascInput = document.getElementById("nascimento");
const idadeInput = document.getElementById("idade");
const listaDobras = document.getElementById("listaDobras");
const listaPerims = document.getElementById("listaPerimetros");
const selectDobra = document.getElementById("dobra");
const selectPerim = document.getElementById("perimetro");

nascInput.addEventListener("input", () => {
  nascInput.value = aplicarMascaraData(nascInput.value);
  idadeInput.value = calcularIdade(nascInput.value) ?? "";
  calcularGordura();
});

document.getElementById("formDobras").addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = selectDobra.value;
  const medidacm = parseFloat(document.getElementById("medida").value);
  if (!nome || isNaN(medidacm)) return;
  const medida = medidacm * 10;
  dobras.push({ nome, medida });
  removerOpcao(selectDobra, nome);
  atualizarListaDobras();
  calcularGordura();
  e.target.reset();
});

document.getElementById("formPerimetros").addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = selectPerim.value;
  const medida = parseFloat(document.getElementById("medidaPerimetro").value);
  if (!nome || isNaN(medida)) return;
  perims.push({ nome, medida });
  removerOpcao(selectPerim, nome);
  atualizarListaPerims();
  e.target.reset();
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("editBtn")) {
    const tipo = e.target.dataset.tipo;
    const idx = parseInt(e.target.dataset.idx);
    const arr = tipo === "dobra" ? dobras : perims;
    const valorAntigo = arr[idx].medida;
    const unidade = tipo === "dobra" ? "mm" : "cm";
    const novoValor = prompt(
      `Editar ${arr[idx].nome} (${unidade})`,
      valorAntigo
    );
    if (novoValor === null) return;
    const num = parseFloat(novoValor);
    if (isNaN(num)) return alert("Valor inválido");
    arr[idx].medida = num;
    tipo === "dobra"
      ? (atualizarListaDobras(), calcularGordura())
      : atualizarListaPerims();
  }
});

function removerOpcao(sel, texto) {
  [...sel.options].forEach((o, i) => {
    if (o.text === texto) sel.remove(i);
  });
  sel.selectedIndex = 0;
}

function atualizarListaDobras() {
  listaDobras.innerHTML = "";
  dobras.forEach((d, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${d.nome}: ${d.medida} mm`;
    const btn = document.createElement("button");
    btn.textContent = "Editar";
    btn.className = "editBtn";
    btn.dataset.tipo = "dobra";
    btn.dataset.idx = i;
    li.appendChild(btn);
    listaDobras.appendChild(li);
  });
}

function atualizarListaPerims() {
  listaPerims.innerHTML = "";
  perims.forEach((p, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${p.nome}: ${p.medida} cm`;
    const btn = document.createElement("button");
    btn.textContent = "Editar";
    btn.className = "editBtn";
    btn.dataset.tipo = "perim";
    btn.dataset.idx = i;
    li.appendChild(btn);
    listaPerims.appendChild(li);
  });
}

function calcularGordura() {
  const obrig = [
    "Peitoral",
    "Axilar média",
    "Tríceps",
    "Subescapular",
    "Abdominal",
    "Coxa medial",
    "Supra-ilíaca",
  ];
  if (!obrig.every((n) => dobras.some((d) => d.nome === n))) return;
  const soma = dobras
    .filter((d) => obrig.includes(d.nome))
    .reduce((acc, d) => acc + d.medida, 0);
  const idade = parseInt(idadeInput.value);
  const sexo = document.getElementById("sexo").value;
  if (!idade || !sexo) return;
  const dens =
    sexo === "masculino"
      ? 1.112 - 0.00043499 * soma + 0.00000055 * soma ** 2 - 0.00028826 * idade
      : 1.097 - 0.00046971 * soma + 0.00000056 * soma ** 2 - 0.00012828 * idade;
  const perc = 495 / dens - 450;
  document.getElementById(
    "percentualGordura"
  ).textContent = `% de Gordura Corporal: ${perc.toFixed(2)}%`;
}

// PDF e Imagem
let imagemBase64 = null;

document
  .getElementById("imagemUpload")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      imagemBase64 = evt.target.result;
      const img = document.createElement("img");
      img.src = imagemBase64;
      document.getElementById("previewImagens").innerHTML = "";
      document.getElementById("previewImagens").appendChild(img);
    };
    reader.readAsDataURL(file);
  });

document.getElementById("btnExportar").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  function addText(label, value) {
    doc.text(`${label}: ${value}`, 10, y);
    y += 8;
  }

  addText("Nome", document.getElementById("nome").value);
  addText("Nascimento", document.getElementById("nascimento").value);
  addText("Idade", document.getElementById("idade").value);
  addText("Peso (kg)", document.getElementById("peso").value);
  addText("Altura (cm)", document.getElementById("altura").value);
  addText("Sexo", document.getElementById("sexo").value);

  y += 5;
  doc.text("Dobras Cutâneas:", 10, y);
  y += 5;
  dobras.forEach((d, i) => {
    doc.text(`${i + 1}. ${d.nome}: ${d.medida} mm`, 12, y);
    y += 6;
  });

  y += 5;
  doc.text("Perímetros:", 10, y);
  y += 5;
  perims.forEach((p, i) => {
    doc.text(`${i + 1}. ${p.nome}: ${p.medida} cm`, 12, y);
    y += 6;
  });

  y += 5;
  const percText = document.getElementById("percentualGordura").textContent;
  addText("Resultado", percText);

  y += 5;
  doc.text("Avaliação Cardiorrespiratória:", 10, y);
  y += 6;

  
  addText('Teste Realizado', document.getElementById('testeCardio').value);
  addText('Resultado do Teste', document.getElementById('resultadoCardio').value);


  if (imagemBase64) {
    y += 10;
    const imgProps = doc.getImageProperties(imagemBase64);
    const pdfWidth = doc.internal.pageSize.getWidth() - 20;
    const ratio = imgProps.width / imgProps.height;
    const imgHeight = pdfWidth / ratio;
    doc.addImage(imagemBase64, "JPEG", 10, y, pdfWidth, imgHeight);
  }

  doc.save("avaliacao-antropometrica.pdf");
});
