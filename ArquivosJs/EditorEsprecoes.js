// Detecta clique em inputs texto dentro de .bloco para abrir o modal        
document.addEventListener("click", (e) => {        
  const input = e.target;        
  if (        
    input.tagName === "INPUT" &&        
    input.type === "text" &&        
    input.closest(".bloco") &&        
    !input.readOnly &&        
    !input.disabled        
  ) {        
    e.preventDefault();        
    abrirCalculadora(input);        
    input.blur();        
  }        
});        
        
let inputSelecionado = null;        
// Abre o modal da calculadora e inicializa o input        
function abrirCalculadora(input) {        
  inputSelecionado = input;        
        
  const expressaoInput = document.getElementById("inputExpressao");        
  expressaoInput.value = input.value || "";        
  atualizarResultado();        
        
  expressaoInput.oninput = () => {        
    atualizarResultado();        
    const variaveis = coletarSugestoesDosBlocos();        
    ativarAutoCompleteCalculadora(variaveis);        
  };        
        
  document.getElementById("modalCalculadora").style.display = "flex";        
  expressaoInput.focus();        
}        
        
// Fecha o modal e limpa o input selecionado        
function fecharCalculadora() {        
  document.getElementById("modalCalculadora").style.display = "none";        
  inputSelecionado = null;        
}  
  
fecharCalculadora();  
        
// Avalia a expressão digitada (atenção: uso de Function pode ser perigoso)        
function avaliarExpressao(expr) {        
  expr = expr.trim();        
        
  // Permite apenas caracteres válidos de expressão numérica básica        
  if (/^[\d\s+\-*/().]+$/.test(expr) === false) {        
    if (!/^["'].*["']$/.test(expr)) {        
      expr = `'${expr.replace(/'/g, "\\'")}'`;        
    }        
  }        
        
  return Function("return " + expr)();        
}        
        
// Atualiza a área de resultado com o valor avaliado ou erro        
function atualizarResultado() {        
  const input = document.getElementById("inputExpressao");        
  const resultadoEl = document.getElementById("resultadoExpressao");        
        
  try {        
    const resultado = avaliarExpressao(input.value);        
    resultadoEl.textContent = "= " + resultado;        
  } catch {        
    resultadoEl.textContent = "= erro";        
  }        
}        
        
// Função para tratar cliques nos botões da calculadora        
function clicarBotao(simbolo) {        
  const input = document.getElementById("inputExpressao");        
        
  if (simbolo === "←") {        
    const start = input.selectionStart;        
    const end = input.selectionEnd;        
        
    if (start === end && start > 0) {        
      input.value = input.value.slice(0, start - 1) + input.value.slice(end);        
      input.selectionStart = input.selectionEnd = start - 1;        
    } else {        
      input.value = input.value.slice(0, start) + input.value.slice(end);        
      input.selectionStart = input.selectionEnd = start;        
    }        
  } else if (simbolo === "C") {        
    input.value = "";        
  } else {        
    inserirNoCursor(input, simbolo);        
  }        
        
  input.focus();        
  atualizarResultado();        
}        
        
// Insere texto no cursor do input na posição atual        
function inserirNoCursor(input, texto) {        
  const start = input.selectionStart;        
  const end = input.selectionEnd;        
  const valorAtual = input.value;        
        
  input.value = valorAtual.slice(0, start) + texto + valorAtual.slice(end);        
  const novaPosicao = start + texto.length;        
  input.selectionStart = input.selectionEnd = novaPosicao;        
}        
        
// Aplica o resultado avaliado no input original e fecha o modal        
function aplicarResultado() {
  const input = document.getElementById("inputExpressao");

  // ← Aqui salvamos o TEXTO original, sem avaliar
  const textoDigitado = input.value;

  if (inputSelecionado) {
    inputSelecionado.value = textoDigitado;
    inputSelecionado.dispatchEvent(new Event("input"));
  }

  fecharCalculadora();
}
        
// Coleta sugestões de variáveis, listas e elementos para autocomplete        
function coletarSugestoesDosBlocos() {        
  const sugestoes = new Set();        
        
  document.querySelectorAll(".bloco").forEach((bloco) => {        
    const idElemento = bloco.querySelector(".idElemento");        
    const nomeVariavel = bloco.querySelector(".nomeVariavel");        
    const nomeLista = bloco.querySelector(".nomeLista");        
        
    if (idElemento && idElemento.value.trim()) {        
      sugestoes.add(idElemento.value.trim());        
    }        
    if (nomeVariavel && nomeVariavel.value.trim()) {        
      sugestoes.add(nomeVariavel.value.trim());        
    }        
    if (nomeLista && nomeLista.value.trim()) {        
      sugestoes.add(nomeLista.value.trim());        
    }        
  });        
        
  // Sugestões extras fixas        
  sugestoes.add("aleatorio(1, 10)");        
  sugestoes.add("colisao(objeto1, objeto2)");        
  sugestoes.add("toqueX()");        
  sugestoes.add("toqueY()");        
  sugestoes.add("toqueEm(objeto1)");  
  sugestoes.add("toqueNaTela()");  
  sugestoes.add("ultimoToque()");      
  sugestoes.add("proximoToque()");       
  sugestoes.add("posicaoX(objeto1)");        
  sugestoes.add("posicaoY(objeto1)");  
  sugestoes.add("comprimento()");        
  sugestoes.add("direcao(objeto1)");        
  sugestoes.add("apontarPara(objeto1, objeto2)");  
  sugestoes.add("apontarParaToque()");  
  sugestoes.add("idClone(objeto1)");  
  sugestoes.add("ultimoClone(objeto1)");  
  sugestoes.add("paisagem");  
  sugestoes.add("retrato");  
        
  return sugestoes;        
}        
        
let monitorandoPosicao = false;        
        
function ativarAutoCompleteCalculadora(variaveis) {        
  const input = document.getElementById("inputExpressao");        
  const sugestoes = document.getElementById("sugestoesCalculadora");        
  if (!sugestoes) return;        
        
  sugestoes.innerHTML = "";        
  const termo = input.value.trim().split(/[^a-zA-Z0-9_]/).pop();        
  if (!termo || termo.length < 1) {        
    sugestoes.style.display = "none";        
    return;        
  }        
        
  const filtradas = Array.from(variaveis).filter((nome) =>        
    nome.startsWith(termo)        
  );        
        
  if (filtradas.length === 0 || (filtradas.length === 1 && filtradas[0] === termo)) {        
    sugestoes.style.display = "none";        
    return;        
  }        
        
  filtradas.forEach((nome) => {        
    const item = document.createElement("div");        
    item.textContent = nome;        
    item.style.padding = "6px 8px";        
    item.style.cursor = "pointer";        
    item.onmousedown = () => {        
      input.value = input.value.replace(new RegExp(termo + "$"), nome);        
      sugestoes.style.display = "none";        
      input.focus();        
      atualizarResultado();        
    };        
    sugestoes.appendChild(item);        
  });        
        
  // Exibe sugestões e inicia monitoramento de posição        
  sugestoes.style.display = "block";        
  monitorarPosicaoDoInput(input, sugestoes);        
}        
        
function monitorarPosicaoDoInput(input, sugestoes) {        
  if (monitorandoPosicao) return;        
        
  monitorandoPosicao = true;        
  const atualiza = () => {        
    const rect = input.getBoundingClientRect();        
    sugestoes.style.position = "fixed";        
    sugestoes.style.left = rect.left + "px";        
    sugestoes.style.top = rect.bottom +20 + "px";        
    sugestoes.style.width = rect.width + "px";        
        
    if (sugestoes.style.display === "none") {        
      monitorandoPosicao = false;        
    } else {        
      requestAnimationFrame(atualiza);        
    }        
  };        
  requestAnimationFrame(atualiza);        
}        
        
// Fecha sugestões ao clicar fora        
document.addEventListener("click", (e) => {        
  const input = document.getElementById("inputExpressao");        
  const sugestoes = document.getElementById("sugestoesCalculadora");        
        
  if (!sugestoes) return;        
        
  if (e.target !== input) {        
    sugestoes.style.display = "none";        
    if (input) input.focus();        
  }        
});        
  
function abrirModalRecursos() {  
  document.getElementById('modalRecursos').style.display = 'flex';  
}  
  
// 🔹 Fecha o modal  
function fecharModalRecursos() {  
  document.getElementById('modalRecursos').style.display = 'none';  
}  
  
function abrirModalImagensSalvas(aoSelecionar) {        
  window._callbackImagemSelecionada = aoSelecionar;        
        
  const modal = document.getElementById("modalImagens");        
  const container = document.getElementById("listaImagens");        
  container.innerHTML = "";        
        
  let imagens = [];        
  if (window.AndroidInterface && typeof AndroidInterface.listarImagens === "function") {        
    try {        
      imagens = JSON.parse(AndroidInterface.listarImagens()) || [];        
    } catch {        
      imagens = [];        
    }        
  }        
        
  imagens.forEach((nome) => {        
    const wrapper = document.createElement("div");        
    wrapper.className = "imagemWrapper";        
        
    const img = document.createElement("img");        
    const caminho = `file:///storage/emulated/0/Download/MeusJogos/imagens/${nome}`;        
    img.src = caminho;        
    img.title = nome;        
    img.className = "imagemMiniatura";        
        
    img.addEventListener("click", () => {        
  navigator.clipboard.writeText(nome).then(() => {        
  }).catch(() => {        
   // erro silencioso        
  });        
  fecharModalImagens();        
});        
        
    img.onmouseover = () => img.style.border = "2px solid #4caf50";        
    img.onmouseout = () => img.style.border = "2px solid transparent";        
        
    const botaoExcluir = document.createElement("button");        
    botaoExcluir.textContent = "✖";        
    botaoExcluir.className = "botaoExcluirImagem";        
    botaoExcluir.onclick = (e) => {        
      e.stopPropagation();        
      excluirImagem(nome);        
    };        
        
    wrapper.appendChild(img);        
    wrapper.appendChild(botaoExcluir);        
    container.appendChild(wrapper);        
  });        
        
  modal.style.display = "flex";  
}        
        
function fecharModalImagens() {        
  document.getElementById("modalImagens").style.display = "none";        
  window._callbackImagemSelecionada = null;        
}        
        
function excluirImagem(nomeImagem) {        
  if (window.AndroidInterface && typeof AndroidInterface.removerImagem === "function") {        
    AndroidInterface.removerImagem(nomeImagem);        
    abrirModalImagensSalvas(window._callbackImagemSelecionada);        
  }        
}        
        
function salvarNovaImagem(event) {  
  const arquivos = Array.from(event.target.files);  
  if (!arquivos.length) return;  
  
  const callbackAntigo = window._callbackImagemSelecionada;  
  
  let arquivosRestantes = arquivos.length;  
  
  arquivos.forEach((file) => {  
    if (!file.type.startsWith("image/")) return;  
  
    const reader = new FileReader();  
    reader.onload = function (e) {  
      const base64 = e.target.result.split(',')[1];  
  
      if (window.AndroidInterface && typeof AndroidInterface.importarImagem === "function") {  
        AndroidInterface.importarImagem(file.name, base64);  
      }  
  
      arquivosRestantes--;  
      if (arquivosRestantes === 0) {  
        abrirModalImagensSalvas(callbackAntigo);  
      }  
    };  
  
    reader.readAsDataURL(file);  
  });  
}  
        
function abrirSeletorDeImagens() {        
  abrirModalImagensSalvas((imagemSelecionada) => {        
    if (inputSelecionado) {        
      inputSelecionado.value = imagemSelecionada;        
      inputSelecionado.dispatchEvent(new Event("input"));        
    }        
  });        
}        
        
const botoes = document.getElementById('AreaTodosBotoes');        
const toggle = document.getElementById('toggleBotoes');        
        
toggle.addEventListener('click', () => {        
  botoes.classList.toggle('escondido');        
});
