if (window.AndroidInterface?.changeOrientation instanceof Function) {
    AndroidInterface.changeOrientation("portrait");
    AndroidInterface.pararTodosAudios();
}

function abrirModal() {
document.getElementById("modalEscolherBlocos").style.display = "flex";
}

function fecharModal(){
document.getElementById("modalEscolherBlocos").style.display = "none";
}

const container = document.getElementById("area-blocos");
let blocosArrastandoGrupo = [];
let blocoArrastando = null;
let modoCopiaAtivo = false;

const blocosComFimMap = {
  "bloco-quandoComecar": "bloco-fimQuandoComecar",
  "bloco-quandoTocado": "bloco-fimQuandoTocado",
  "bloco-quandoTocadoNaTela": "bloco-fimQuandoTocadoNaTela",
  "bloco-quandoForVerdadeiro": "bloco-fimQuandoForVerdadeiro",
  "bloco-quandoCriarClone": "bloco-fimQuandoCriarClone",
  "bloco-se": "bloco-fimSe",
  "bloco-repetirVezes": "bloco-fimRepetirVezes",
  "bloco-repetirAte": "bloco-fimRepetirAte",
  "bloco-repetirSempre": "bloco-fimRepetirSempre"
};

const nomesAmigaveisBlocosFim = {
  quandoComecar: "Fim Quando Começar",
  quandoTocado: "Fim Quando Tocado",
  quandoTocadoNaTela: "Fim Quando Tocado Na Tela",
  quandoForVerdadeiro: "Fim Quando For Verdadeiro",
  quandoCriarClone: "Fim Quando Criar Clone",
  se: "Fim Se",
  repetirVezes: "Fim Repetir Vezes",
  repetirAte: "Fim Repetir Até",
  repetirSempre: "Fim Repetir Sempre"
};

function identificarTipoBloco(bloco) {
  const tipo = Array.from(bloco.classList).find(c => c.startsWith("bloco-"));
  return tipo ? tipo.replace("bloco-", "") : null;
}

function criarGrupoBlocos(todosBlocos, blocoInicial) {
  const tipoClasse = [...blocoInicial.classList].find(c => c.startsWith("bloco-"));
  const fimClasse = blocosComFimMap[tipoClasse];
  if (!fimClasse) return [blocoInicial];

  let profundidade = 1;
  const grupo = [blocoInicial];
  const indexInicio = todosBlocos.indexOf(blocoInicial);

  for (let i = indexInicio + 1; i < todosBlocos.length; i++) {
    const atual = todosBlocos[i];
    if (atual.classList.contains(tipoClasse)) profundidade++;
    if (atual.classList.contains(fimClasse)) profundidade--;
    grupo.push(atual);
    if (profundidade === 0) break;
  }
  return grupo;
}

function configurarBloco(bloco) {
  bloco.classList.add("bloco");
  bloco.draggable = true;

  bloco.addEventListener("dragstart", () => {
  const todosBlocos = Array.from(container.querySelectorAll(".bloco"));
  blocosArrastandoGrupo = criarGrupoBlocos(todosBlocos, bloco);
  blocosArrastandoGrupo.forEach(b => b.classList.add("dragging"));
});

  bloco.addEventListener("dragend", () => {
    blocosArrastandoGrupo.forEach(b => b.classList.remove("dragging"));
    blocoArrastando = null;
    blocosArrastandoGrupo = [];
    salvarBlocos();
  });

  setTimeout(() => {
    bloco.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", salvarBlocos);
    });
    bloco.querySelectorAll(".idElemento").forEach(input => {
      input.setAttribute("list", "listaIdsGlobais");
      input.addEventListener("input", salvarBlocos);
    });
  }, 0);
}

function adicionarBloco(tipo, adicionarFimAutomatico = true) {
  fecharModal();
  const bloco = document.createElement("div");
  configurarBloco(bloco);
  bloco.classList.add(`bloco-${tipo}`);

  if (!tipo.startsWith("fim")) {
    bloco.innerHTML += `<button class="fechar" onclick="removerBloco(this)">x</button>`;
  }

  if (tipo === "quandoComecar") {
 // CATEGORIA: Eventos -->
    bloco.innerHTML += `
    <h3>Quando Começar</h3>
    `;
  } else if (tipo === "fimQuandoComecar") {
    bloco.innerHTML += `
    <h3>Fim Quando Começar</h3>
    `;
  } else if (tipo === "quandoTocado") {
      bloco.innerHTML += `
      <h3>Quando Tocado</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
    `;
  } else if (tipo === "fimQuandoTocado") {
    bloco.innerHTML += `
    <h3>Fim Quando Tocado</h3>
    `;
  } else if (tipo === "quandoTocadoNaTela") {
      bloco.innerHTML += `
      <h3>Quando Tocado Na Tela</h3>
    `;
  } else if (tipo === "fimQuandoTocadoNaTela") {
    bloco.innerHTML += `
    <h3>Fim Quando Tocado Na Tela</h3>
    `;
  } else if (tipo === "quandoForVerdadeiro") {
    bloco.innerHTML += `
    <h3>Quando For Verdadeiro</h3>
    <input type="text" placeholder="Condição (ex: 1 > 2)" class="condicao" />
    `;
  } else if (tipo === "fimQuandoForVerdadeiro") {
    bloco.innerHTML += `
    <h3>Fim Quando For Verdadeiro</h3>
    `;
  } else if (tipo === "quandoCriarClone") {
    bloco.innerHTML += `
    <h3>Quando Criar Clone</h3>
    <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
    `;
  } else if (tipo === "fimQuandoCriarClone") {
    bloco.innerHTML += `
    <h3>Fim Quando Criar Clone</h3>
    `;
  } else if (tipo === "se") {
 // CATEGORIA: Controle de Fluxo -->
    bloco.innerHTML += `
    <h3>Se é Verdadeiro</h3>
    <input type="text" placeholder="Condição (ex: 1 > 2)" class="condicao" />
    `;
  } else if (tipo === "fimSe") {
    bloco.innerHTML += `
    <h3>Fim Se</h3>
    `;
  } else if (tipo === "repetirVezes") {
    bloco.innerHTML += `
      <h3>Repetir Vezes</h3>
      <input type="text" placeholder="Vezes (ex: 10)" class="vezes" />
    `;
  } else if (tipo === "fimRepetirVezes") {
    bloco.innerHTML += `
    <h3>Fim Repetir Vezes</h3>
    `;
  } else if (tipo === "repetirAte") {
    bloco.innerHTML += `
      <h3>Repetir Até</h3>
      <input type="text" placeholder="Condição (ex: 1 > 2)" class="condicao" />
    `;
  } else if (tipo === "fimRepetirAte") {
    bloco.innerHTML += `
    <h3>Fim Repetir Até</h3>
    `;
  } else if (tipo === "repetirSempre") {
    bloco.innerHTML += `
      <h3>Repetir Sempre</h3>
    `;
  } else if (tipo === "fimRepetirSempre") {
    bloco.innerHTML += `
    <h3>Fim Repetir Sempre</h3>
    `;
  } else if (tipo === "aguardarSegundos") {
      bloco.innerHTML += `
      <h3>Aguardar Segundos</h3>
      <input type="text" placeholder="Segundos (ex: 2)" class="segundos" />
    `;
  } else if (tipo === "aguardarSerVerdadeiro") {
      bloco.innerHTML += `
      <h3>Aguardar Ser Verdadeiro</h3>
      <input type="text" placeholder="Condicao (ex: 1 > 2)" class="condicao" />
    `;
  } else if (tipo === "mudarDeCena") {
      bloco.innerHTML += `
      <h3>Ir Para Cena</h3>
      <input type="text" placeholder="Cena (ex: cena1)" class="cena" />
    `;
  } else if (tipo === "definirOrientacao") {
      bloco.innerHTML += `
      <h3>Definir Orientação</h3>
      <input type="text" placeholder="Orientação (ex: paisagem)" class="orientacao" />
    `;
  } else if (tipo === "novoObjeto") {
 // CATEGORIA: Criação e Clonagem -->
    bloco.innerHTML += `
      <h3>Novo Objeto</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
      <input type="text" placeholder="Cor (ex: green)" class="cor" />
    `;
  } else if (tipo === "clonarObjeto") {
    bloco.innerHTML += `
      <h3>Clonar Objeto</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
    `;
  } else if (tipo === "definirPosicaoDoObjeto") {
 // CATEGORIA: Movimento e Física -->
      bloco.innerHTML += `
      <h3>Posição Do Objeto</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
      <input type="text" placeholder="Posição X (ex: 100)" class="x" />
      <input type="text" placeholder="Posição Y (ex: 100)" class="y" />
    `;
  } else if (tipo === "moverObjeto") {
      bloco.innerHTML += `
      <h3>Mover Objeto</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
      <input type="text" placeholder="Passos (ex: 5)" class="passos" />
    `;
  } else if (tipo === "definirDirecao") {
      bloco.innerHTML += `
      <h3>Definir Direção</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
      <input type="text" placeholder="Direção (ex: 90)" class="angulo" />
    `;
  } else if (tipo === "definirCor") {
 // CATEGORIA: Aparência e Estilo -->
      bloco.innerHTML += `
      <h3>Cor Do Objeto</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
      <input type="text" placeholder="Cor (ex: blue)" class="cor" />
    `;
  } else if (tipo === "bordaDoObjeto") {
      bloco.innerHTML += `
      <h3>Borda Do Objeto</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
      <input type="text" placeholder="Borda (ex: 25)" class="raio" />
    `;
  } else if (tipo === "definirTamanho") {
      bloco.innerHTML += `
      <h3>Definir Tamanho</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
      <input type="text" placeholder="Tamanho (ex: 150)" class="tamanho" />
    `;
  } else if (tipo === "larguraEaltura") {
      bloco.innerHTML += `
      <h3>Definir Largura E Altura</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
      <input type="text" placeholder="Largura (ex: 100)" class="largura" />
      <input type="text" placeholder="Altura (ex: 100)" class="altura" />
    `;
  } else if (tipo === "definirSprite") {
      bloco.innerHTML += `
      <h3>Definir Sprite</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
      <input type="text" placeholder="Textura (ex: imagem1)" class="textura" />
    `;
  } else if (tipo === "definirCamada") {
      bloco.innerHTML += `
      <h3>Definir Camada</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
      <input type="text" placeholder="Camada (ex: 2)" class="camada" />
    `;
  } else if (tipo === "definirTransparencia") {
      bloco.innerHTML += `
      <h3>Definir Transparencia</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
      <input type="text" placeholder="Transparência (ex: 75)" class="valor" />
    `;
  } else if (tipo === "esconder") {
      bloco.innerHTML += `
      <h3>Esconder Objeto</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
    `;
  } else if (tipo === "mostrar") {
      bloco.innerHTML += `
      <h3>Mostrar Objeto</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
    `;
  } else if (tipo === "remover") {
      bloco.innerHTML += `
      <h3>Excluir Objeto</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
    `;
  } else if (tipo === "tocarAudio") {
 // CATEGORIA: CATEGORIA: Áudio -->
      bloco.innerHTML += `
      <h3>Tocar Audio</h3>
      <input type="text" placeholder="Audio (ex: musica1)" class="idAudio" />
    `;
  } else if (tipo === "pausarAudio") {
      bloco.innerHTML += `
      <h3>Pausar Audio</h3>
      <input type="text" placeholder="Audio (ex: musica1)" class="idAudio" />
    `;
  } else if (tipo === "continuarAudio") {
      bloco.innerHTML += `
      <h3>Continuar Audio</h3>
      <input type="text" placeholder="Audio (ex: musica1)" class="idAudio" />
    `;
  } else if (tipo === "pararAudio") {
      bloco.innerHTML += `
      <h3>Parar Audio</h3>
      <input type="text" placeholder="Audio (ex: musica1)" class="idAudio" />
    `;
  } else if (tipo === "volumeAudio") {
      bloco.innerHTML += `
      <h3>Definir Volume</h3>
      <input type="text" placeholder="Audio (ex: musica1)" class="idAudio" />
      <input type="text" placeholder="Volume (ex: 30)" class="volume" />
    `;
  } else if (tipo === "novoTexto") {
 // CATEGORIA: CATEGORIA: Texto -->
      bloco.innerHTML += `
      <h3>Novo Texto</h3>
      <input type="text" placeholder="Elemento (ex: texto1)" class="idTexto" />
      <input type="text" placeholder="Conteúdo (ex: hola mundo!)" class="conteudo" />
    `;
  } else if (tipo === "definirPosicaoDoTexto") {
      bloco.innerHTML += `
      <h3>Posição Do Texto</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idTexto" />
      <input type="text" placeholder="Posição X (ex: 100)" class="x" />
      <input type="text" placeholder="Posição Y (ex: 100)" class="y" />
    `;
  } else if (tipo === "definirVariavel") {
 //CATEGORIA: Variáveis e Listas -->
      bloco.innerHTML += `
      <h3>Definir Variavel</h3>
      <input type="text" placeholder="Variavel (ex: variavel1)" class="idVariavel" />
      <input type="text" placeholder="Valor (ex: 140)" class="valor" />
    `;
  } else if (tipo === "alterarVariavel") {
      bloco.innerHTML += `
      <h3>Alterar Variavel</h3>
      <input type="text" placeholder="Id da Variavel (ex: variavel1)" class="idVariavel" />
      <input type="text" placeholder="Valor (ex: 60)" class="valor" />
    `;
  } else if (tipo === "addCamera") {
 // CATEGORIA: Câmera -->
      bloco.innerHTML += `
      <h3>Adicionar Camera</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
    `;
  } else if (tipo === "velocidadeDaCamera") {
      bloco.innerHTML += `
      <h3>Velocidade Da Camera</h3>
      <input type="text" placeholder="Velocidade (ex: 0.5)" class="velocidade" />
    `;
  } else if (tipo === "fixarNaCamera") {
      bloco.innerHTML += `
      <h3>Fixar Na Camera</h3>
      <input type="text" placeholder="Elemento (ex: objeto1)" class="idElemento" />
    `;
  } else if (tipo === "configurarUnity") {
      bloco.innerHTML += `
      <h3>Configurar Unity Ads</h3>
      <input type="text" placeholder="ID Unity (ex: 536357)" class="idUnity" />
      <input type="text" placeholder="Anúncio Real (ex: true / false)" class="adsReal" />
    `;
  } else if (tipo === "exibirAnuncio") {
      bloco.innerHTML += `
      <h3>Exibir Anuncio</h3>
    `;
  }
  
   container.appendChild(bloco);
   
  if (adicionarFimAutomatico && nomesAmigaveisBlocosFim[tipo]) {
    const tipoFimClasse = `bloco-fim${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}`;
    const blocoFim = document.createElement("div");
    configurarBloco(blocoFim);
    blocoFim.classList.add(tipoFimClasse);

    const nomeAmigavel = nomesAmigaveisBlocosFim[tipo];
    blocoFim.innerHTML += `<h3>${nomeAmigavel}</h3>`;

    container.appendChild(blocoFim);
  }

  salvarBlocos();
  const variaveis = coletarSugestoesDosBlocos();
  ativarAutoCompleteCalculadora(variaveis);
}

function removerBloco(botao) {
  modoCopiaAtivo = false;
  document.getElementById("botaoCopiarBloco").classList.remove("ativo");

  const bloco = botao.parentElement;
  const todosBlocos = Array.from(container.querySelectorAll(".bloco"));
  const grupo = criarGrupoBlocos(todosBlocos, bloco);

  grupo.forEach(b => b.remove());
  salvarBlocos();

  const variaveis = coletarSugestoesDosBlocos();
  ativarAutoCompleteCalculadora(variaveis);
}

container.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (!blocosArrastandoGrupo.length) return;

  const afterElement = getDragAfterElement(container, e.clientY);
  if (!afterElement) {
    blocosArrastandoGrupo.forEach(b => container.appendChild(b));
  } else {
    blocosArrastandoGrupo.forEach(b => container.insertBefore(b, afterElement));
  }

  const rect = container.getBoundingClientRect();
  const limite = 100;
  const velocidade = 10;
  const y = e.clientY;

  if (y < rect.top + limite) container.scrollTop -= velocidade;
  else if (y > rect.bottom - limite) container.scrollTop += velocidade;
});

function getDragAfterElement(container, y) {
  const elementos = [...container.querySelectorAll(".bloco:not(.dragging)")];
  return elementos.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (isTouchDevice) {
  console.log("📱 Modo toque ativado para arrastar blocos (natural).");

  let blocoTocando = null;
  let grupoTocando = [];
  let grupoTocandoOriginais = [];
  let posInicialY = 0;
  let posInicialX = 0;
  let deslocY = 0;
  let arrastando = false;
  let tempoSegurando = null;
  let arrasteAtivo = false; // bloqueia múltiplos arrastes
  const limiteMovimento = 10; // tolerância de movimento para considerar "segurando"

  container.addEventListener("touchstart", e => {
    if (arrasteAtivo) return; // já existe arraste ativo

    const bloco = e.target.closest(".bloco");
    if (!bloco) return;

    blocoTocando = bloco;
    posInicialY = e.touches[0].clientY;
    posInicialX = e.touches[0].clientX;
    deslocY = 0;
    arrastando = false;

    tempoSegurando = setTimeout(() => {
      arrastando = true;
      arrasteAtivo = true; // bloqueia novos arrastes

      const todosBlocos = Array.from(container.querySelectorAll(".bloco"));
      grupoTocando = criarGrupoBlocos(todosBlocos, blocoTocando);
      grupoTocandoOriginais = [...grupoTocando]; // guarda os originais

      // deixa o grupo invisível
      grupoTocando.forEach(b => {
        b.style.opacity = "0";
        b.style.pointerEvents = "none";
        b.classList.add("dragging");
      });
    }, 300);
  });

  container.addEventListener("touchmove", e => {
    if (!blocoTocando) return;

    const y = e.touches[0].clientY;
    const x = e.touches[0].clientX;
    deslocY = y - posInicialY;

    // Se mover muito antes de 2 segundos → cancela arraste e permite rolagem
    if (!arrastando && (Math.abs(y - posInicialY) > limiteMovimento || Math.abs(x - posInicialX) > limiteMovimento)) {
      clearTimeout(tempoSegurando);
      tempoSegurando = null;
      blocoTocando = null;
      return;
    }

    if (!arrastando) return; // ainda aguardando o tempo

    e.preventDefault(); // impede rolagem

    grupoTocando.forEach(b => b.style.transform = `translateY(${deslocY}px)`);

    const afterElement = getDragAfterElement(container, y);
    if (afterElement) {
      grupoTocando.forEach(b => container.insertBefore(b, afterElement));
    } else {
      grupoTocando.forEach(b => container.appendChild(b));
    }

    // Rolagem automática enquanto arrasta
    const rect = container.getBoundingClientRect();
    const limite = 80;
    const velocidade = 10;
    if (y < rect.top + limite) container.scrollTop -= velocidade;
    else if (y > rect.bottom - limite) container.scrollTop += velocidade;
  });

  container.addEventListener("touchend", () => {
    if (tempoSegurando) {
      clearTimeout(tempoSegurando);
      tempoSegurando = null;
    }

    if (arrastando) {
      // restaura blocos originais
      grupoTocando.forEach(b => {
        b.classList.remove("dragging");
        b.style.transform = "";
      });

      grupoTocandoOriginais.forEach(b => {
        b.style.opacity = "1";
        b.style.pointerEvents = "auto";
      });

      salvarBlocos();
    }

    blocoTocando = null;
    grupoTocando = [];
    grupoTocandoOriginais = [];
    arrastando = false;
    arrasteAtivo = false; // libera novo arraste
  });
}

document.getElementById("botaoCopiarBloco").addEventListener("click", () => {
  modoCopiaAtivo = !modoCopiaAtivo;
  const botaoCopiar = document.getElementById("botaoCopiarBloco");
  document.body.style.cursor = modoCopiaAtivo ? "copy" : "default";
  botaoCopiar.classList.toggle("ativo", modoCopiaAtivo);
});

document.addEventListener("click", (e) => {
  if (!modoCopiaAtivo) return;

  const blocoSelecionado = e.target.closest(".bloco");
  if (!blocoSelecionado) return;

  const tipoClasse = [...blocoSelecionado.classList].find(c => c.startsWith("bloco-"));
  if (tipoClasse?.startsWith("bloco-fim")) {
    modoCopiaAtivo = false;
    document.body.style.cursor = "default";
    document.getElementById("botaoCopiarBloco").classList.remove("ativo");
    return;
  }

  const todosBlocos = Array.from(container.querySelectorAll(".bloco"));
  const grupoParaCopiar = criarGrupoBlocos(todosBlocos, blocoSelecionado);

  const clones = grupoParaCopiar.map(bloco => {
    const clone = bloco.cloneNode(true);
    clone.classList.remove("dragging");
    configurarBloco(clone);
    return clone;
  });

  const blocoFinal = grupoParaCopiar[grupoParaCopiar.length - 1];
  const proximoBloco = blocoFinal.nextElementSibling;

  clones.forEach(clone => {
    if (proximoBloco) {
      container.insertBefore(clone, proximoBloco);
    } else {
      container.appendChild(clone);
    }
  });

  salvarBlocos();
  modoCopiaAtivo = false;
  document.body.style.cursor = "default";
  document.getElementById("botaoCopiarBloco").classList.remove("ativo");
});

function salvarBlocos() {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");
  const objeto = localStorage.getItem("objetoSelecionado");
  if (!projeto || !cena || !objeto) return;

  const blocos = container.querySelectorAll(".bloco");
  const dados = Array.from(blocos).map(bloco => {
    const tipo = identificarTipoBloco(bloco);
    return extrairDadosDoBloco(bloco, tipo);
  });

  try {
    const projetoJson = JSON.parse(AndroidInterface.lerArquivo(`${projeto}.json`)) || {};
    projetoJson.blocos = projetoJson.blocos || {};
    projetoJson.blocos[cena] = projetoJson.blocos[cena] || {};
    projetoJson.blocos[cena][objeto] = dados;

    AndroidInterface.atualizarArquivo(`${projeto}.json`, JSON.stringify(projetoJson));
  } catch (e) {
    console.error("Erro ao salvar blocos:", e);
  }
}

function extrairDadosDoBloco(bloco, tipo) {
  const dados = { tipo };

  bloco.querySelectorAll("input").forEach(input => {
    const classe = input.classList[0];
    if (classe) {
      const nomeCampo = classe.replace(/-(.)/g, (_, c) => c.toUpperCase());
      dados[nomeCampo] = input.value;
    }
  });

  // Comentário oculto
  if (bloco.classList.contains("comentario-oculto") || bloco.querySelector(".toggle-visibilidade")?.innerText === "oculto") {
    dados.comentarioOculto = true;
  }

  return dados;
}

function carregarBlocos() {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");
  const objeto = localStorage.getItem("objetoSelecionado");
  if (!projeto || !cena || !objeto) return;

  try {
    const projetoJson = JSON.parse(AndroidInterface.lerArquivo(`${projeto}.json`));
    const dados = projetoJson?.blocos?.[cena]?.[objeto];
    if (!dados) return;

    container.innerHTML = "";

    dados.forEach(dado => {
      adicionarBloco(dado.tipo, false);
      const ultimoBloco = container.querySelector(".bloco:last-child");
      if (ultimoBloco) preencherCamposDoBloco(ultimoBloco, dado);
    });

    salvarBlocos();
    aplicarVisibilidadeOcultaNosComentarios();
  } catch (e) {
    console.error("Erro ao carregar blocos:", e);
  }
}

function preencherCamposDoBloco(bloco, dado) {
  bloco.querySelectorAll("input").forEach(input => {
    const classe = input.classList[0];
    if (classe) {
      const nomeCampo = classe.replace(/-(.)/g, (_, c) => c.toUpperCase());
      if (dado[nomeCampo] !== undefined) {
        input.value = dado[nomeCampo];
      }
    }
  });
}

function atualizarNomeObjetoSelecionado() {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");
  const nome = localStorage.getItem("objetoSelecionado");
  if (!projeto || !cena || !nome) return;

  const div = document.getElementById("ID");
  if (!div) return;

  try {
    const dados = JSON.parse(AndroidInterface.lerArquivo(`${projeto}.json`));
    const objetos = dados.objetos?.[cena] || [];
    if (!objetos.some(o => o.nome === nome)) return;
    div.textContent = "ID: " + nome;
  } catch (e) {
    
  }
}

window.addEventListener("load", () => {
  const cena = localStorage.getItem("cenaSelecionada");
  const objeto = localStorage.getItem("objetoSelecionado");

  if (!cena || !objeto) {
    window.location.href = "Cenas.html";
    return;
  }

  carregarBlocos();
  atualizarNomeObjetoSelecionado();

  const scrollSalvo = localStorage.getItem("scrollBlocos");
  if (scrollSalvo !== null) {
    requestAnimationFrame(() => {
      container.scrollTop = parseInt(scrollSalvo, 10);
      localStorage.removeItem("scrollBlocos");
    });
  }
});

function executarTodos() {
  const projeto = localStorage.getItem("projetoSelecionado");
  const cena = localStorage.getItem("cenaSelecionada");

  if (!projeto || !cena) return;

  // Lê o arquivo do projeto
  const projetoJson = JSON.parse(AndroidInterface.lerArquivo(projeto + ".json"));

  // Recupera os blocos da cena atual
  const blocosDaCena = projetoJson?.blocos?.[cena] || {};

  // Prepara os dados para execução
  const dadosParaExecucao = {
    [projeto]: {
      [cena]: {}
    }
  };

  for (const nomeObjeto in blocosDaCena) {
    dadosParaExecucao[projeto][cena][nomeObjeto] = blocosDaCena[nomeObjeto];
  }

  // Salva os dados para execução em um arquivo temporário
  localStorage.setItem("blocosParaExecucao", JSON.stringify(dadosParaExecucao));

  // Salva a posição de rolagem da área de blocos (opcional)
  const area = document.getElementById("area-blocos");
  if (area) {
    localStorage.setItem("scrollBlocos", area.scrollTop.toString());
  }

  // Redireciona para execução do jogo
  window.location.href = "ExecutandoJogo.html";
}
