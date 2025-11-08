AndroidInterface.changeOrientation('portrait');

let nomeProjetoTemp = "";
let projetoParaEditar = null;
let tempoPressionado = null;

function abrirModal() {
  document.getElementById("modalCriarProjetos").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modalCriarProjetos").style.display = "none";
}

function abrirModalExportar() {
  document.getElementById("modalExportarProjeto").style.display = "flex";
}

function fecharModalExportar() {
  document.getElementById("modalExportarProjeto").style.display = "none";
}

function fecharModalOrientacao() {
  document.getElementById("modalOrientacaoDoProjeto").style.display = "none";
  document.getElementById("inputNomeProjeto").value = "";
}

function abrirModalEditarProjeto(nomeAntigo) {
  projetoParaEditar = nomeAntigo;
  document.getElementById("inputEditarNomeProjeto").value = nomeAntigo;
  document.getElementById("modalEditarProjeto").style.display = "flex";
}

function fecharModalEditarProjeto() {
  document.getElementById("modalEditarProjeto").style.display = "none";
  projetoParaEditar = null;
}

function abrirRepositorio() {
    window.location.href = "Repositorio.html";
}

function confirmarEdicaoNome() {
  const novoNome = document.getElementById("inputEditarNomeProjeto").value.trim();
  const erro = document.getElementById("mensagemErroEditar");

  erro.style.display = "none";
  if (!novoNome) {
    erro.textContent = "Digite um novo nome.";
    erro.style.display = "block";
    return;
  }

  const lista = JSON.parse(AndroidInterface.listarArquivosDaPasta());
  if (lista.includes(novoNome + ".json")) {
    erro.textContent = "Já existe um projeto com esse nome.";
    erro.style.display = "block";
    return;
  }

  const conteudo = JSON.parse(AndroidInterface.lerArquivo(projetoParaEditar + ".json"));
if (conteudo.projeto) {
  conteudo.projeto.nome = novoNome;
}

  AndroidInterface.removerArquivo(projetoParaEditar + ".json");
  AndroidInterface.criarNovoArquivo(novoNome + ".json", JSON.stringify(conteudo));

  fecharModalEditarProjeto();
  location.reload();
}

function criarProjeto() {
  const input = document.getElementById("inputNomeProjeto");
  const nome = input.value.trim();
  const erro = document.getElementById("mensagemErro");

  const lista = JSON.parse(AndroidInterface.listarArquivosDaPasta());

  input.classList.remove("erro");
  erro.style.display = "none";

  if (!nome) {
    input.classList.add("erro");
    erro.textContent = "Digite um nome para o projeto.";
    erro.style.display = "block";
    return;
  }

  if (lista.includes(nome + ".json")) {
    input.classList.add("erro");
    erro.textContent = "Já existe um projeto com esse nome.";
    erro.style.display = "block";
    return;
  }

  nomeProjetoTemp = nome;
  fecharModal();
  document.getElementById("modalOrientacaoDoProjeto").style.display = "flex";
}

function confirmarOrientacao() {
  const select = document.getElementById("selectOrientacao");
  const orientacao = select.value;

  if (!nomeProjetoTemp || !orientacao) return;

  adicionarProjetoNaTela(nomeProjetoTemp);

  const projeto = {
    projeto: {
      nome: nomeProjetoTemp,
      orientacao: orientacao
    },
    cenas: [],
    objetos: {},
    blocos: {}
  };

  AndroidInterface.criarNovoArquivo(nomeProjetoTemp + ".json", JSON.stringify(projeto));

  nomeProjetoTemp = "";
  document.getElementById("inputNomeProjeto").value = "";
  fecharModalOrientacao();
}

function adicionarProjetoNaTela(nome) {
  const lista = document.getElementById("listaProjetos");

  const projeto = document.createElement("div");
  projeto.className = "projeto";

  const conteudoEsquerda = document.createElement("div");
  conteudoEsquerda.className = "projeto-conteudo";

  const imagem = document.createElement("img");
  imagem.src = "https://cdn-icons-png.freepik.com/256/12148/12148631.png?semt=ais_hybrid";
  imagem.alt = "Ícone do projeto";
  imagem.className = "icone-projeto";

  const texto = document.createElement("span");
  texto.textContent = nome;
  texto.className = "nome-projeto";
  texto.title = nome;

  conteudoEsquerda.appendChild(imagem);
  conteudoEsquerda.appendChild(texto);

  // Detecção de toque longo (3 segundos)
  conteudoEsquerda.addEventListener("mousedown", (e) => {
    tempoPressionado = setTimeout(() => {
      abrirModalEditarProjeto(nome);
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
      abrirModalEditarProjeto(nome);
      tempoPressionado = null;
    }, 300);
  });

  conteudoEsquerda.addEventListener("touchend", () => {
    clearTimeout(tempoPressionado);
    tempoPressionado = null;
  });

  conteudoEsquerda.addEventListener("click", () => {
    if (!tempoPressionado) {
      localStorage.setItem("projetoSelecionado", nome);
      window.location.href = "Cenas.html";
    }
  });

  const botaoExcluir = document.createElement("button");
  botaoExcluir.textContent = "×";
  botaoExcluir.className = "botao-excluir";
  botaoExcluir.onclick = () => {
    lista.removeChild(projeto);
    AndroidInterface.removerArquivo(nome + ".json");
  };

  projeto.appendChild(conteudoEsquerda);
  projeto.appendChild(botaoExcluir);
  lista.appendChild(projeto);
}

function carregarProjetosSalvos() {
  try {
    const arquivos = JSON.parse(AndroidInterface.listarArquivosDaPasta());
    arquivos.forEach(nomeArquivo => {
      if (nomeArquivo.endsWith(".json")) {
        const nome = nomeArquivo.replace(".json", "");
        adicionarProjetoNaTela(nome);
      }
    });
  } catch (e) {
    console.error("Erro ao carregar projetos:", e);
  }
}

document.getElementById("inputNomeProjeto").addEventListener("input", () => {
  const input = document.getElementById("inputNomeProjeto");
  const erro = document.getElementById("mensagemErro");
  input.classList.remove("erro");
  erro.style.display = "none";
});

document.getElementById("inputEditarNomeProjeto").addEventListener("input", () => {
  const input = document.getElementById("inputEditarNomeProjeto");
  const erro = document.getElementById("mensagemErroEditar");
  input.classList.remove("erro");
  erro.style.display = "none";
});

window.onload = carregarProjetosSalvos;
