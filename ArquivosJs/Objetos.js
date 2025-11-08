if (window.AndroidInterface?.changeOrientation instanceof Function) {
    AndroidInterface.changeOrientation("portrait");
    AndroidInterface.pararTodosAudios();
}

let objetoParaEditar = null;
let tempoPressionado = null;

function abrirModal() {
  document.getElementById("modalCriarObjetos").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalCriarObjetos").style.display = "none";
}

function abrirModalEditarObjeto(nomeAntigo) {
  objetoParaEditar = nomeAntigo;
  document.getElementById("inputEditarNomeObjeto").value = nomeAntigo;
  document.getElementById("modalEditarObjeto").style.display = "flex";
}

function fecharModalEditarObjeto() {
  document.getElementById("modalEditarObjeto").style.display = "none";
  objetoParaEditar = null;
}

let projetoNome = localStorage.getItem("projetoSelecionado");
let cenaNome = localStorage.getItem("cenaSelecionada");

let projeto = JSON.parse(AndroidInterface.lerArquivo(projetoNome + ".json"));
  
function salvarProjeto() {
  AndroidInterface.atualizarArquivo(projetoNome + ".json", JSON.stringify(projeto));
}

function confirmarEdicaoObjeto() {
  const novoNome = document.getElementById("inputEditarNomeObjeto").value.trim();
  const erro = document.getElementById("mensagemErroEditarObjeto");

  erro.style.display = "none";

  if (!novoNome) {
    erro.textContent = "Digite um novo nome.";
    erro.style.display = "block";
    return;
  }

  const objetos = projeto.objetos?.[cenaNome] || [];

  if (objetos.some(o => o.nome === novoNome)) {
    erro.textContent = "Já existe um objeto com esse nome.";
    erro.style.display = "block";
    return;
  }

  const objeto = objetos.find(o => o.nome === objetoParaEditar);
  if (objeto) objeto.nome = novoNome;

  if (projeto.blocos?.[cenaNome]?.[objetoParaEditar]) {
    projeto.blocos[cenaNome][novoNome] = projeto.blocos[cenaNome][objetoParaEditar];
    delete projeto.blocos[cenaNome][objetoParaEditar];
  }

  salvarProjeto();

  fecharModalEditarObjeto();
  location.reload();
}

function criarObjeto() {
  const input = document.getElementById("inputNomeObjeto");
  const nome = input.value.trim();
  const erro = document.getElementById("mensagemErro");

  if (!projetoNome || !cenaNome) return;

  const objetos = projeto.objetos?.[cenaNome] || [];

  input.classList.remove("erro");
  erro.style.display = "none";

  if (!nome) {
    input.classList.add("erro");
    erro.textContent = "Digite um nome para o objeto.";
    erro.style.display = "block";
    return;
  }

  if (objetos.some(o => o.nome === nome)) {
    input.classList.add("erro");
    erro.textContent = "Já existe um objeto com esse nome.";
    erro.style.display = "block";
    return;
  }

  // Adicionar
  projeto.objetos[cenaNome] = objetos;
  objetos.push({ nome });

  projeto.blocos[cenaNome] = projeto.blocos[cenaNome] || {};
  projeto.blocos[cenaNome][nome] = [
    { tipo: "quandoComecar" },
    { tipo: "fimQuandoComecar" }
  ];

  salvarProjeto();

  adicionarObjetoNaTela(nome);
  input.value = "";
  fecharModal();
}

function adicionarObjetoNaTela(nome) {
  const lista = document.getElementById("listaObjetos");

  const objeto = document.createElement("div");
  objeto.className = "objeto";

  const conteudoEsquerda = document.createElement("div");
  conteudoEsquerda.className = "objeto-conteudo";

  const imagem = document.createElement("img");
  imagem.src = "https://cdn-icons-png.flaticon.com/512/2620/2620993.png";
  imagem.alt = "Ícone do objeto";
  imagem.className = "icone-objeto";
  imagem.style.borderRadius = "5px";

  const texto = document.createElement("span");
  texto.textContent = nome;
  texto.className = "nome-objeto";
  texto.title = nome;

  conteudoEsquerda.appendChild(imagem);
  conteudoEsquerda.appendChild(texto);

  // Detecção de toque longo
  conteudoEsquerda.addEventListener("mousedown", () => {
    tempoPressionado = setTimeout(() => {
      abrirModalEditarObjeto(nome);
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
      abrirModalEditarObjeto(nome);
      tempoPressionado = null;
    }, 300);
  });

  conteudoEsquerda.addEventListener("touchend", () => {
    clearTimeout(tempoPressionado);
    tempoPressionado = null;
  });

  conteudoEsquerda.addEventListener("click", () => {
    if (!tempoPressionado) {
      localStorage.setItem("objetoSelecionado", nome);
      window.location.href = "Scripts.html";
    }
  });

  const botaoExcluir = document.createElement("button");
  botaoExcluir.textContent = "×";
  botaoExcluir.className = "botao-excluir";
  botaoExcluir.onclick = () => {
    lista.removeChild(objeto);
    removerObjeto(nome);
  };

  objeto.appendChild(conteudoEsquerda);
  objeto.appendChild(botaoExcluir);
  lista.appendChild(objeto);
}

function removerObjeto(nome) {
  if (!projetoNome || !cenaNome) return;
  projeto = JSON.parse(AndroidInterface.lerArquivo(projetoNome + ".json"));

  projeto.objetos[cenaNome] = (projeto.objetos[cenaNome] || []).filter(obj => obj.nome !== nome);

  if (projeto.blocos?.[cenaNome]?.[nome]) {
    delete projeto.blocos[cenaNome][nome];
    salvarProjeto();
  }
}

function carregarObjetosSalvos() {
  const projetoNome = localStorage.getItem("projetoSelecionado");
  const cenaNome = localStorage.getItem("cenaSelecionada");

  if (!projetoNome || !cenaNome) return;

  const projeto = JSON.parse(AndroidInterface.lerArquivo(projetoNome + ".json"));
  const objetos = projeto.objetos?.[cenaNome] || [];

  objetos.forEach(obj => {
    if (obj && typeof obj.nome === "string") {
      adicionarObjetoNaTela(obj.nome);
    }
  });
}

function executarTodos() {
  const projetoNome = localStorage.getItem("projetoSelecionado");
  const cenaNome = localStorage.getItem("cenaSelecionada");

  if (!projetoNome || !cenaNome) return;

  const projeto = JSON.parse(AndroidInterface.lerArquivo(projetoNome + ".json"));
  const blocosCena = projeto.blocos?.[cenaNome] || {};

  localStorage.setItem("blocosParaExecucao", JSON.stringify({
    [projetoNome]: {
      [cenaNome]: blocosCena
    }
  }));

  window.location.href = "ExecutandoJogo.html";
}

document.getElementById("inputNomeObjeto").addEventListener("input", () => {
  const input = document.getElementById("inputNomeObjeto");
  const erro = document.getElementById("mensagemErro");
  input.classList.remove("erro");
  erro.style.display = "none";
});

document.getElementById("inputEditarNomeObjeto").addEventListener("input", () => {
  const input = document.getElementById("inputEditarNomeObjeto");
  const erro = document.getElementById("mensagemErroEditarObjeto");
  input.classList.remove("erro");
  erro.style.display = "none";
});

window.onload = carregarObjetosSalvos;
