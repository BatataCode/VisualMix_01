if (window.AndroidInterface?.changeOrientation instanceof Function) {
    AndroidInterface.changeOrientation("portrait");
    AndroidInterface.pararTodosAudios();
}

let cenaParaEditar = null;
let tempoPressionado = null;
let nomeProjeto = localStorage.getItem("projetoSelecionado");
let dadosProjeto = JSON.parse(AndroidInterface.lerArquivo(nomeProjeto + ".json") || '{"cenas":[],"objetos":{},"blocos":{}}');

function salvarProjeto() {
  AndroidInterface.atualizarArquivo(nomeProjeto + ".json", JSON.stringify(dadosProjeto));
}

function abrirModal() {
  document.getElementById("modalCriarCenas").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalCriarCenas").style.display = "none";
}

function abrirModalEditarCena(nomeAntigo) {
  cenaParaEditar = nomeAntigo;
  document.getElementById("inputEditarNomeCena").value = nomeAntigo;
  document.getElementById("modalEditarCena").style.display = "flex";
}

function fecharModalEditarCena() {
  document.getElementById("modalEditarCena").style.display = "none";
  cenaParaEditar = null;
}

function confirmarEdicaoCena() {
  const novoNome = document.getElementById("inputEditarNomeCena").value.trim();
  const erro = document.getElementById("mensagemErroEditarCena");
  erro.style.display = "none";

  if (!novoNome) {
    erro.textContent = "Digite um novo nome.";
    erro.style.display = "block";
    return;
  }

  const cenas = dadosProjeto.cenas || [];
  if (cenas.some(c => c.nome === novoNome)) {
    erro.textContent = "Já existe uma cena com esse nome.";
    erro.style.display = "block";
    return;
  }

  const index = cenas.findIndex(c => c.nome === cenaParaEditar);
  if (index !== -1) {
    cenas[index].nome = novoNome;

    if (dadosProjeto.objetos[cenaParaEditar]) {
      dadosProjeto.objetos[novoNome] = dadosProjeto.objetos[cenaParaEditar];
      delete dadosProjeto.objetos[cenaParaEditar];
    }

    if (dadosProjeto.blocos[cenaParaEditar]) {
      dadosProjeto.blocos[novoNome] = dadosProjeto.blocos[cenaParaEditar];
      delete dadosProjeto.blocos[cenaParaEditar];
    }

    salvarProjeto();
    fecharModalEditarCena();
    location.reload();
  }
}

function criarCena() {
  const input = document.getElementById("inputNomeCena");
  const nome = input.value.trim();
  const erro = document.getElementById("mensagemErro");

  const cenas = dadosProjeto.cenas || [];

  input.classList.remove("erro");
  erro.style.display = "none";

  if (!nome) {
    input.classList.add("erro");
    erro.textContent = "Digite um nome para a cena.";
    erro.style.display = "block";
    return;
  }

  if (cenas.some(c => c.nome === nome)) {
    input.classList.add("erro");
    erro.textContent = "Já existe uma cena com esse nome.";
    erro.style.display = "block";
    return;
  }

  dadosProjeto.cenas.push({ nome });
  dadosProjeto.objetos[nome] = [];
  dadosProjeto.blocos[nome] = {};

  salvarProjeto();
  adicionarCenaNaTela(nome);
  input.value = "";
  fecharModal();
}

function adicionarCenaNaTela(nome) {
  const lista = document.getElementById("listaCenas");

  const cena = document.createElement("div");
  cena.className = "cena";

  const conteudoEsquerda = document.createElement("div");
  conteudoEsquerda.className = "cena-conteudo";

  const imagem = document.createElement("img");
  imagem.src = "https://i.ibb.co/mrjDhnSN/1750551944048.png";
  imagem.alt = "Ícone da cena";
  imagem.className = "icone-cena";
  imagem.style.borderRadius = "5px";

  const texto = document.createElement("span");
  texto.textContent = nome;
  texto.className = "nome-cena";
  texto.title = nome;

  conteudoEsquerda.appendChild(imagem);
  conteudoEsquerda.appendChild(texto);

  conteudoEsquerda.addEventListener("mousedown", () => {
    tempoPressionado = setTimeout(() => {
      abrirModalEditarCena(nome);
      tempoPressionado = null;
    }, 300);
  });

  conteudoEsquerda.addEventListener("mouseup", () => {
    clearTimeout(tempoPressionado);
    tempoPressionado = null;
  });

  conteudoEsquerda.addEventListener("mouseleave", () => {
    clearTimeout(tempoPressionado);
    tempoPressionado = null;
  });

  conteudoEsquerda.addEventListener("touchstart", () => {
    tempoPressionado = setTimeout(() => {
      abrirModalEditarCena(nome);
      tempoPressionado = null;
    }, 300);
  });

  conteudoEsquerda.addEventListener("touchend", () => {
    clearTimeout(tempoPressionado);
    tempoPressionado = null;
  });

  conteudoEsquerda.addEventListener("click", () => {
    if (!tempoPressionado) {
      localStorage.setItem("cenaSelecionada", nome);
      window.location.href = "Objetos.html";
    }
  });

  const botaoExcluir = document.createElement("button");
  botaoExcluir.textContent = "×";
  botaoExcluir.className = "botao-excluir";
  botaoExcluir.onclick = () => {
    lista.removeChild(cena);
    removerCena(nome);
  };

  cena.appendChild(conteudoEsquerda);
  cena.appendChild(botaoExcluir);
  lista.appendChild(cena);
}

function removerCena(nome) {
  const index = dadosProjeto.cenas.findIndex(c => c.nome === nome);
  if (index !== -1) {
    dadosProjeto.cenas.splice(index, 1);
    delete dadosProjeto.objetos[nome];
    delete dadosProjeto.blocos[nome];
    salvarProjeto();
  }
}

function carregarCenasSalvas() {
  (dadosProjeto.cenas || []).forEach(cena => adicionarCenaNaTela(cena.nome));
}

function executarTodos() {
  const primeira = dadosProjeto.cenas?.[0]?.nome;
  if (!primeira) return;

  const blocos = dadosProjeto.blocos?.[primeira] || {};

  localStorage.setItem("cenaSelecionada", primeira);
  localStorage.setItem("blocosParaExecucao", JSON.stringify({
    [nomeProjeto]: {
      [primeira]: blocos
    }
  }));

  window.location.href = "ExecutandoJogo.html";
}

document.getElementById("inputNomeCena").addEventListener("input", () => {
  const input = document.getElementById("inputNomeCena");
  const erro = document.getElementById("mensagemErro");
  input.classList.remove("erro");
  erro.style.display = "none";
});

document.getElementById("inputEditarNomeCena").addEventListener("input", () => {
  const input = document.getElementById("inputEditarNomeCena");
  const erro = document.getElementById("mensagemErroEditarCena");
  input.classList.remove("erro");
  erro.style.display = "none";
});

window.onload = carregarCenasSalvas;
