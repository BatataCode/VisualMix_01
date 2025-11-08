function obterOrientacaoProjetoAtual() {
  const nome = localStorage.getItem("projetoSelecionado");
  if (!nome) return null;

  try {
    const dados = JSON.parse(AndroidInterface.lerArquivo(nome + ".json"));
    return dados?.projeto?.orientacao || null;
  } catch (e) {
    console.error("Erro ao ler o projeto:", e);
    return null;
  }
}

if (window.AndroidInterface?.changeOrientation instanceof Function) {
    AndroidInterface.changeOrientation(obterOrientacaoProjetoAtual());
}

function reajustarAposRotacao() {
  const larguraAntiga = larguraTela;
  const alturaAntiga = alturaTela;

  setTimeout(() => {
    // Atualiza dimensões da tela
    larguraTela = window.innerWidth;
    alturaTela = window.innerHeight;
    canvas.width = larguraTela;
    canvas.height = alturaTela;

    renderizarTudo();
  }, 300);
}

// ===== Variáveis Globais ===== //
let ctx, canvas;
let larguraTela = window.innerWidth;
let alturaTela = window.innerHeight;
let suavidade = 0.1;
const IdObjetos = new Map();
const IdTextos = new Map();
const Clones = new Map();
const eventosAoClonar = new Map();
const eventosPendentes = new Map();
const variaveis = {};
// ===== CÂMERA INFINITA ===== //
const camera = {
  x: 0,          // posição no mundo (centro em pixels)
  y: 0,
  alvo: null,    // objeto a seguir
  suavidade: 0.1 // velocidade de suavização da câmera
};

// ===== Execuções Paralelas ===== //
const execucoesParalelas = new Set();

async function executarPassoParalelo(iterador) {
  const resultado = await iterador.next();
  if (!resultado.done) {
    execucoesParalelas.add(iterador);
  }
}

function loopExecucoesParalelas() {
  const execs = Array.from(execucoesParalelas);
  execucoesParalelas.clear();
  for (const exec of execs) {
    executarPassoParalelo(exec);
  }
}

// ===== Toques Multitoque ===== //
window.toques = {};
let proximoIndice = 1;
const touchMap = new Map();
const dedosPorObjeto = new Map();

function mundoParaTela(xMundo, yMundo) {
  // Converte posição do mundo (pixels) para posição no canvas (pixels)
  const xTela = xMundo - (camera.x - larguraTela / 2);
  const yTela = yMundo - (camera.y - alturaTela / 2);
  return { x: xTela, y: yTela };
}

function telaParaMundo(xTela, yTela) {
  // Converte posição no canvas (pixels) para posição no mundo (pixels)
  const xMundo = xTela + (camera.x - larguraTela / 2);
  const yMundo = yTela + (camera.y - alturaTela / 2);
  return { x: xMundo, y: yMundo };
}

function registrarToque(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    const xTela = touch.clientX - rect.left;
    const yTela = touch.clientY - rect.top;

    const { x: xMundo, y: yMundo } = telaParaMundo(xTela, yTela);

    const index = proximoIndice++;

    window.toques[index] = { x: xMundo, y: yMundo };
    touchMap.set(touch.identifier, index); // associa pelo identifier
  }
}

function atualizarToque(e) {    
  e.preventDefault();    
  const rect = canvas.getBoundingClientRect();    
    
  for (let i = 0; i < e.touches.length; i++) {    
    const touch = e.touches[i];    
    const index = touchMap.get(touch.identifier);    
    if (index === undefined) continue;    
    
    const xTela = touch.clientX - rect.left;    
    const yTela = touch.clientY - rect.top;    
    const { x: xMundo, y: yMundo } = telaParaMundo(xTela, yTela);    
    
    window.toques[index] = { x: xMundo, y: yMundo };    
  }    
}

// ===== Inicialização ===== //
window.onload = async () => {
  criarCanvasApp();
  inicializarSistemaDeToques();

  // Usando eventos touch
  canvas.addEventListener("touchstart", registrarToque, { passive: false });
  canvas.addEventListener("touchmove", atualizarToque, { passive: false });

  await new Promise(r => requestAnimationFrame(r));

  if (typeof blocos !== "undefined" && Array.isArray(blocos)) {
    await carregarBlocos(blocos, variaveis);
  }

  await carregarProjeto();
};

function criarCanvasApp() {
  canvas = document.getElementById("motorGrafico");
  canvas.width = larguraTela;
  canvas.height = alturaTela;
  canvas.style.display = "block";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.overflow = "hidden";
  ctx = canvas.getContext("2d");

  loopPrincipal();
  mostrarFPS();
}

function reajustarObjetos() {
  for (const obj of IdObjetos.values()) {
    // Agora assumimos que obj.x / obj.y são posições no mundo (pixels).
    // Se for necessário, você pode transformar posições armazenadas de outra forma aqui.
    // Mantemos objetos em seus lugares no mundo.
    // Caso queira reposicionar relativo à tela, faça aqui.
  }
}

// ===== Redimensionamento Da Tela ===== //
let resizeTimeout = null;
window.addEventListener("resize", () => {
  larguraTela = window.innerWidth;
  alturaTela = window.innerHeight;
  canvas.width = larguraTela;
  canvas.height = alturaTela;

  // Debounce para evitar recalcular várias vezes em redim contínuo
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    reajustarAposRotacao();
  }, 120);
});

// ===== Funções De Objetos ===== //
function novoObjeto(id, cor = 'gray') {
  const largura = 100, altura = 100;
  // Posição inicial: centro do mundo (na frente da câmera)
  /*const x = camera.x - largura / 2;
  const y = camera.y - altura / 2;*/
  
  // Cria no centro do mundo (fixo no mundo)
  const x = -largura / 2;
  const y = -altura / 2;

  const obj = {
    id,
    cor,
    largura,
    altura,
    x: Math.round(x),
    y: Math.round(y),
    raioBorda: 0,
    camera: false,
    fixo:false,
    direcao: 0,
    camada: 0,
    textura: null,
    usarTextura: false,
    transparencia: 1,
    visivel: true,
    __toqueEm: false,
    canvas: (() => {
      const c = document.createElement("canvas");
      c.width = largura;
      c.height = altura;
      const ctx = c.getContext("2d");
      ctx.fillStyle = cor;
      ctx.fillRect(0, 0, largura, altura);
      return c;
    })()
  };

  IdObjetos.set(id, obj);
  processarEventosPendentes(obj);
}

function novoTexto(id, texto = "Texto", cor = "white", tamanho = 32, fonte = "Arial") {
  // Se já existe, apenas atualiza o conteúdo
  if (IdTextos.has(id)) {
    const txt = IdTextos.get(id);

    txt.texto = texto;
    txt.cor = cor;
    txt.tamanho = tamanho;
    txt.fonte = fonte;

    // Recalcula dimensões e redesenha o canvas interno
    const tempCtx = document.createElement("canvas").getContext("2d");
    tempCtx.font = `${tamanho}px ${fonte}`;
    const largura = Math.ceil(tempCtx.measureText(texto).width);
    const altura = Math.ceil(tamanho * 1.3);

    txt.largura = largura;
    txt.altura = altura;

    txt.canvas.width = largura;
    txt.canvas.height = altura;

    const ctx = txt.canvas.getContext("2d");
    ctx.font = `${tamanho}px ${fonte}`;
    ctx.fillStyle = cor;
    ctx.textBaseline = "top";
    ctx.fillText(texto, 0, 0);

    return txt;
  }

  // Caso não exista, cria um novo
  const tempCtx = document.createElement("canvas").getContext("2d");
  tempCtx.font = `${tamanho}px ${fonte}`;
  const largura = Math.ceil(tempCtx.measureText(texto).width);
  const altura = Math.ceil(tamanho * 1.3);

  const x = -largura / 2;
  const y = -altura / 2;

  const text = {
    id,
    tipo: "texto",
    texto,
    cor,
    tamanho,
    fonte,
    largura,
    altura,
    x: Math.round(x),
    y: Math.round(y),
    fixo: true,
    direcao: 0,
    camada: 0,
    transparencia: 1,
    visivel: true,
    canvas: (() => {
      const c = document.createElement("canvas");
      c.width = largura;
      c.height = altura;
      const ctx = c.getContext("2d");
      ctx.font = `${tamanho}px ${fonte}`;
      ctx.fillStyle = cor;
      ctx.textBaseline = "top";
      ctx.fillText(texto, 0, 0);
      return c;
    })()
  };

  IdTextos.set(id, text);
  return text;
}

function texturaObjeto(id, nomeImagem) {
const obj = IdObjetos.get(id);
if (!obj) return;

const img = new Image();
img.src = carregarImagemPorNome(nomeImagem);

img.onload = () => {
obj.textura = img;
obj.usarTextura = true;  // 🔹 só usa textura daqui pra frente
};

img.onerror = () => {
obj.usarTextura = false;
};
}

function desenharObjeto(obj) {
if (obj.visivel === false) return;

let posX, posY;

if (obj.fixo) {
// Objetos fixos (UI, HUD) usam coordenadas de tela diretas
posX = obj.x + larguraTela / 2;
posY = obj.y + alturaTela / 2;
} else {
// Converte posição do mundo para posição no canvas
const pos = mundoParaTela(obj.x, obj.y);
posX = pos.x;
posY = pos.y;
}

ctx.save();

// Ponto central do objeto
const centroX = posX + obj.largura / 2;
const centroY = posY + obj.altura / 2;
ctx.translate(centroX, centroY);
ctx.rotate((obj.direcao || 0) * Math.PI / 180);

ctx.globalAlpha = obj.transparencia;

if (obj.usarTextura && obj.textura instanceof Image) {
    const img = obj.textura;

    // Calcula escala proporcional
    const escalaX = obj.largura / img.width;
    const escalaY = obj.altura / img.height;
    const escala = Math.min(escalaX, escalaY);

    const larguraFinal = img.width * escala;
    const alturaFinal = img.height * escala;

    // Centraliza a textura
    ctx.drawImage(
        img,
        -larguraFinal / 2,
        -alturaFinal / 2,
        larguraFinal,
        alturaFinal
    );
} else {
// 🎨 Desenha cor padrão
ctx.drawImage(obj.canvas, -obj.largura / 2, -obj.altura / 2, obj.largura, obj.altura);
}

ctx.globalAlpha = 1;
ctx.restore();
}

function texturaObjeto(id, nomeImagem) {
const obj = IdObjetos.get(id);
if (!obj) return;

const img = new Image();
img.src = carregarImagemPorNome(nomeImagem);

img.onload = () => {
obj.textura = img;
obj.usarTextura = true;  // 🔹 só usa textura daqui pra frente
};

img.onerror = () => {
obj.usarTextura = false;
};
}

function renderizarTudo() {
    ctx.clearRect(0, 0, larguraTela, alturaTela);

    // Juntamos objetos e textos em um único array
    const tudo = [
        ...Array.from(IdObjetos.values()),
        ...Array.from(IdTextos.values())
    ];

    // Ordena por camada
    tudo.sort((a, b) => (a.camada || 0) - (b.camada || 0));

    // Desenha cada item
    for (const obj of tudo) {
        desenharObjeto(obj);
    }
}

function atualizarCanvasDoObjeto(obj) {
  obj.canvas.width = obj.largura;
  obj.canvas.height = obj.altura;
  const ctxObj = obj.canvas.getContext("2d");
  ctxObj.clearRect(0, 0, obj.largura, obj.altura);

  const raio = Math.min(obj.raioBorda, obj.largura / 2, obj.altura / 2);

  ctxObj.beginPath();
  ctxObj.moveTo(raio, 0);
  ctxObj.lineTo(obj.largura - raio, 0);
  ctxObj.quadraticCurveTo(obj.largura, 0, obj.largura, raio);
  ctxObj.lineTo(obj.largura, obj.altura - raio);
  ctxObj.quadraticCurveTo(obj.largura, obj.altura, obj.largura - raio, obj.altura);
  ctxObj.lineTo(raio, obj.altura);
  ctxObj.quadraticCurveTo(0, obj.altura, 0, obj.altura - raio);
  ctxObj.lineTo(0, raio);
  ctxObj.quadraticCurveTo(0, 0, raio, 0);
  ctxObj.closePath();

  ctxObj.globalAlpha = obj.transparencia;

  ctxObj.fillStyle = obj.cor || "gray";
  ctxObj.fill();

  ctxObj.globalAlpha = 1;
}

function atualizarCamera() {
  if (!camera.alvo) return;

  const alvoX = camera.alvo.x + camera.alvo.largura / 2;
  const alvoY = camera.alvo.y + camera.alvo.altura / 2;

  // Move a câmera suavemente para o centro do alvo (camera.x/y são coordenadas do mundo)
  camera.x += (alvoX - camera.x) * camera.suavidade;
  camera.y += (alvoY - camera.y) * camera.suavidade;
}

function posObjeto(id, posX, posY) {
  const obj = IdObjetos.get(id);
  if (!obj) return;
  
  obj.x = posX - obj.largura / 2;
  obj.y = - posY - obj.altura / 2;
}

function posTexto(id, posX, posY) {
  const text = IdTextos.get(id);
  if (!text) return;
  
  text.x = posX - text.largura / 2;
  text.y = - posY - text.altura / 2;
}

function corObjeto(id, novaCor) {
  const obj = IdObjetos.get(id);
  if (!obj) return;

  obj.cor = novaCor;

  obj.canvas.width = obj.largura;
  obj.canvas.height = obj.altura;

  const ctxObj = obj.canvas.getContext("2d");
  ctxObj.fillStyle = novaCor;
  ctxObj.fillRect(0, 0, obj.largura, obj.altura);
}

function carregarImagemPorNome(nomeImagem) {  
  if (!nomeImagem) return null;  
  return `file:///storage/emulated/0/Download/MeusJogos/imagens/${nomeImagem}`;  
}

// ===== Loop Principal ===== //
function loopPrincipal() {
  atualizarCamera();
  renderizarTudo();
  loopExecucoesParalelas();
  requestAnimationFrame(loopPrincipal);
}

// ===== Utilitários ===== //
function retangulosColidem(x1, y1, w1, h1, x2, y2, w2, h2) {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

function aguardarSegundos(segundos) {
  return new Promise(r => setTimeout(r, segundos * 1000));
}

function aguardarCondicao(condicao, intervalo = 50) {
  return new Promise(resolve => {
    const checar = setInterval(() => {
      try {
        if (condicao()) {
          clearInterval(checar);
          resolve();
        }
      } catch (e) {
     
      }
    }, intervalo);
  });
}

const cacheFuncoes = new Map();

function avaliarValores(texto, vars, id = null) {  
  if (typeof texto !== "string") return texto;  
  
  let substituido = texto  
    
    .replace(/toqueEm\s*\(\s*([^)]+?)\s*\)/g, (_, idRaw) => {  
      const idInterno = avaliarValores(idRaw.trim(), vars);  
      return IdObjetos.get(idInterno)?.__toqueEm ? "true" : "false";  
    })  
    .replace(/\$[a-zA-Z_][a-zA-Z0-9_]*/g, m => {  
      const nome = m.slice(1);  
      return vars[nome] ?? 0;  
    })  
    .replace(/\b([A-Za-z_]\w*)\b/g, (m) => {  
      if (IdObjetos.has(m)) return `"${m}"`;  
      return m;  
    })
  
  // 🔹 Usa cache para evitar recriar a mesma função  
  if (!cacheFuncoes.has(substituido)) {  
    const codigoFunc = `  
      "use strict";  
  
      // 🖐️ Funções utilitárias  
      const ultimoToque = () => {  
        const keys = Object.keys(window.toques);  
        return keys.length ? Number(keys[keys.length -1]) : -1;  
      };  
      const proximoToque = () => proximoIndice;  
  
      const toqueX = (i) => {  
        if (i === undefined || i === null) i = ultimoToque();  
        const toque = window.toques[i];  
        if (!toque) return 0;  
        const { x } = mundoParaTela(toque.x, toque.y);  
        return x - larguraTela / 2;  
      };  
  
      const toqueY = (i) => {  
        if (i === undefined || i === null) i = ultimoToque();  
        const toque = window.toques[i];  
        if (!toque) return 0;  
        const { y } = mundoParaTela(toque.x, toque.y);  
        return -(y - alturaTela / 2);  
      };  
  
      const toqueNaTela = (i) => {  
        if (i === undefined || i === null) i = ultimoToque();  
        return window.toques[i] !== undefined;  
      };  
  
      const posicaoX = (id) => {  
        const obj = IdObjetos.get(id);  
        return obj ? obj.x + obj.largura / 2 : 0;  
      };  
  
      const posicaoY = (id) => {  
        const obj = IdObjetos.get(id);  
        return obj ? -(obj.y + obj.altura / 2) : 0;  
      };  
  
      const comprimento = (conteudo) => {  
        if (typeof conteudo === "string" || Array.isArray(conteudo)) return conteudo.length;  
        return 0;  
      };
      
      const juntar = (...partes) => {
        return partes.map(v => v === null || v === undefined ? "" : String(v)).join("");
      };
  
      const aleatorio = (min, max) => {  
        min = Number(min) || 0;  
        max = Number(max) || 1;  
        return Math.floor(Math.random() * (max - min + 1)) + min;  
      };  
  
      const apontarPara = (idOrigem, idAlvo) => {  
        const a = IdObjetos.get(idOrigem);  
        const b = IdObjetos.get(idAlvo);  
        if (!a || !b) return 0;  
        const ax = a.x + a.largura / 2;  
        const ay = a.y + a.altura / 2;  
        const bx = b.x + b.largura / 2;  
        const by = b.y + b.altura / 2;  
        return Math.atan2(by - ay, bx - ax) * 180 / Math.PI;  
      };  
  
      const direcao = (id) => IdObjetos.get(id)?.direcao || 0;  
  
      const colisao = (id1, id2) => {  
        const a = IdObjetos.get(id1);  
        const b = IdObjetos.get(id2);  
        if (!a || !b) return false;  
        return (  
          a.x < b.x + b.largura &&  
          a.x + a.largura > b.x &&  
          a.y < b.y + b.altura &&  
          a.y + a.altura > b.y  
        );  
      };  
  
      const apontarParaToque = () => {  
        const a = IdObjetos.get(id);  
        if (!a) return 0;  
        const idx = ultimoToque();  
        if (idx === -1) return a.direcao ?? 0;  
        const toque = window.toques[idx];  
        if (!toque) return a.direcao ?? 0;  
        const ax = a.x + a.largura / 2;  
        const ay = a.y + a.altura / 2;  
        const bx = toque.x;  
        const by = toque.y;  
        return Math.atan2(by - ay, bx - ax) * 180 / Math.PI;  
      };  
  
      const idClone = (idOrigem, i) => {  
        if (!idOrigem) return null;  
        const lista = Clones.get(idOrigem);  
        if (!lista || lista.length === 0) return null;  
        if (i === undefined || i === null) return lista[lista.length - 1];  
        if (i < 1 || i > lista.length) return null;  
        return lista[i - 1];  
      };  
  
      const ultimoClone = (idOrigem) => {  
        if (!idOrigem) return null;  
        const lista = Clones.get(idOrigem);  
        return lista?.[lista.length - 1] || null;  
      };  
  
      // 🔹 Expressão final  
      return (${substituido});  
    `;  
  
    cacheFuncoes.set(substituido, Function("id", codigoFunc));  
  }  
  
  try {  
    return cacheFuncoes.get(substituido)(id);  
  } catch (e) {  
    // Caso seja um número puro ou texto literal  
    const num = Number(substituido);  
    return isNaN(num) ? substituido : num;  
  }  
}

// ===== Executar Blocos Como Async Generator ===== //
async function* executarBlocosGenerator(blocos, variaveis) {
  let i = 0;

  while (i < blocos.length) {
    const bloco = blocos[i];
    const tipo = bloco.tipo;
    const id = avaliarValores(bloco.idElemento, variaveis);

    switch (tipo) {
      case 'novoObjeto':
        novoObjeto(id, avaliarValores(bloco.cor, variaveis) || 'gray');
        break;
        
        case 'novoTexto': {
  novoTexto(
    avaliarValores(bloco.idTexto, variaveis) || "Teste",
    avaliarValores(bloco.conteudo, variaveis));
  break;
}
      case 'definirCor':
        corObjeto(id, avaliarValores(bloco.cor, variaveis) || 'gray');
        break;

      case 'definirPosicaoDoObjeto':
        posObjeto(
          id,
          Number(avaliarValores(bloco.x, variaveis, id)) || 0,
          Number(avaliarValores(bloco.y, variaveis, id)) || 0
        );
        break;
        
        case 'definirPosicaoDoTexto':
        posTexto(
          avaliarValores(bloco.idTexto, variaveis),
          Number(avaliarValores(bloco.x, variaveis)) || 0,
          Number(avaliarValores(bloco.y, variaveis)) || 0
        );
        break;

      case 'definirSprite': {
        texturaObjeto(id, avaliarValores(bloco.textura, variaveis));
        break;
      }

      case 'moverObjeto': {
        const obj = IdObjetos.get(id);
        if (obj) {
          const passos = Number(avaliarValores(bloco.passos, variaveis)) || 0;
          const anguloRad = (obj.direcao ?? 0) * Math.PI / 180;

          obj.x += passos * Math.cos(anguloRad);
          obj.y += passos * Math.sin(anguloRad);
        }
        break;
      }

      case 'definirDirecao': {
        const obj = IdObjetos.get(id);
        if (obj) {
          obj.direcao = Number(avaliarValores(bloco.angulo, variaveis, id));
          atualizarCanvasDoObjeto(obj);
        }
        break;
      }

      case 'definirCamada': {
        const obj = IdObjetos.get(id);
        if (obj) {
            obj.camada = Number(avaliarValores(bloco.camada, variaveis)) || 0;
        }
        break;
      }

      case 'larguraEaltura': {
        const obj = IdObjetos.get(id);
        if (obj) {
          // Calcula o centro atual
          const centroX = obj.x + obj.largura / 2;
          const centroY = obj.y + obj.altura / 2;

          // Atualiza largura e altura
          const novaLargura = Number(avaliarValores(bloco.largura, variaveis)) || obj.largura;
          const novaAltura = Number(avaliarValores(bloco.altura, variaveis)) || obj.altura;
          obj.largura = novaLargura;
          obj.altura = novaAltura;

          // Reposiciona para manter o centro
          obj.x = centroX - obj.largura / 2;
          obj.y = centroY - obj.altura / 2;

          atualizarCanvasDoObjeto(obj);
        }
        break;
      }

      case 'definirTamanho': {
        const obj = IdObjetos.get(id);
        if (obj) {
          const fator = Number(avaliarValores(bloco.tamanho, variaveis)) || 100;

          // Mantém o centro do objeto
          const centroX = obj.x + obj.largura / 2;
          const centroY = obj.y + obj.altura / 2;

          obj.largura = fator;
          obj.altura = fator;

          obj.x = centroX - obj.largura / 2;
          obj.y = centroY - obj.altura / 2;

          atualizarCanvasDoObjeto(obj);
        }
        break;
      }

      case 'definirTransparencia': {
        const obj = IdObjetos.get(id);
        if (obj) {
          let valor = Number(avaliarValores(bloco.valor, variaveis)) || 100;
          valor = Math.max(0, Math.min(100, valor));
          obj.transparencia = valor / 100;
          atualizarCanvasDoObjeto(obj);
        }
        break;
      }

      case 'esconder': {
        const obj = IdObjetos.get(id);
        if (obj) {
          obj.visivel = false;
        }
        break;
      }

      case 'mostrar': {
        const obj = IdObjetos.get(id);
        if (obj) {
          obj.visivel = true;
        }
        break;
      }

      case 'remover': {
        if (IdObjetos.has(id)) {
          IdObjetos.delete(id);
        }
        break;
      }

      case 'definirVariavel': {
        const nome = avaliarValores(bloco.idVariavel, variaveis);
        const valorRaw = avaliarValores(bloco.valor, variaveis);
        variaveis[nome] = isNaN(valorRaw) ? valorRaw : Number(valorRaw);
        break;
      }

      case 'alterarVariavel': {
        const nome = avaliarValores(bloco.idVariavel, variaveis);
        const valor = Number(avaliarValores(bloco.valor, variaveis));

        if (!variaveis.hasOwnProperty(nome)) variaveis[nome] = 0;
        if (typeof variaveis[nome] === 'number' && !isNaN(valor)) {
          variaveis[nome] += valor;
        }
        break;
      }

      case 'addGravidade': {
        const obj = IdObjetos.get(id);
        if (obj) {
          obj.gravidade = Number(avaliarValores(bloco.gravidade, variaveis)) || 0.5;
        }
        break;
      }

      case 'addColisao': {
        const obj = IdObjetos.get(id);
        if (obj) obj.colisao = true;
        break;
      }

      case 'pular': {
        const obj = IdObjetos.get(id);
        if (obj) {
          obj.velocidadeY = -Math.abs(Number(avaliarValores(bloco.forca, variaveis)) || 5);
        }
        break;
      }

      case 'bordaDoObjeto': {
        const obj = IdObjetos.get(id);
        if (obj) {
          obj.raioBorda = Math.min(Number(avaliarValores(bloco.raio, variaveis)) || 0, obj.largura / 2, obj.altura / 2);
          atualizarCanvasDoObjeto(obj);
        }
        break;
      }

      case 'clonarObjeto': {
        await clonarObjetoComBaseNoOriginal(avaliarValores(bloco.idElemento, variaveis, id));
        break;
      }

      case 'addCamera': {
        const obj = IdObjetos.get(id);
        if (obj) {
          for (const o of IdObjetos.values()) o.camera = false;
          obj.camera = true;
          camera.alvo = obj;
        }
        break;
      }

      case 'velocidadeDaCamera': {
        suavidade = avaliarValores(bloco.velocidade, variaveis);
        camera.suavidade = suavidade;
        break;
      }

      case 'fixarNaCamera': {
        const obj = IdObjetos.get(id);
        if (obj) {
          obj.fixo = true;
        }
        break;
      }
      
      case 'configurarUnity': {
      const idUnity = avaliarValores(bloco.idUnity, variaveis);
      const adsReal = avaliarValores(bloco.adsReal, variaveis);
       AndroidInterface.configurarUnityAds(idUnity, adsReal);
      }
      
      case 'exibirAnuncio': {
       AndroidInterface.mostrarAnuncio();
      }

      case 'se': {
        const condicao = avaliarValores(bloco.condicao, variaveis); // avalia a condição
        const filhos = extrairBlocosFilhos(blocos, i, 'se', 'fimSe');
        i += filhos.length + 1;

        if (condicao) {
            // Executa os blocos filhos apenas se for verdadeiro
            yield* executarBlocosGenerator(filhos, variaveis);
        }

        continue; // continua para o próximo bloco fora do se
      }

      // Controle de repetição
      case 'repetirVezes': {
        const vezes = Number(avaliarValores(bloco.vezes, variaveis));
        const filhos = extrairBlocosFilhos(blocos, i, 'repetirVezes', 'fimRepetirVezes');
        i += filhos.length + 1;

        for (let c = 0; c < vezes; c++) {
          yield* executarBlocosGenerator(filhos, variaveis);
        }
        continue;
      }

      case 'repetirAte': {
        const filhos = extrairBlocosFilhos(blocos, i, 'repetirAte', 'fimRepetirAte');
        i += filhos.length + 1;

        while (true) {
          if (avaliarValores(bloco.condicao, variaveis)) break;
          yield* executarBlocosGenerator(filhos, variaveis);
        }
        continue;
      }

      case 'repetirSempre': {
        const filhos = extrairBlocosFilhos(blocos, i, 'repetirSempre', 'fimRepetirSempre');
        i += filhos.length + 1;

        while (true) {
            yield* executarBlocosGenerator(filhos, variaveis);
        }
        continue;
      }

      case 'aguardarSegundos': {
          await aguardarSegundos(Number(avaliarValores(bloco.segundos, variaveis)));
          break;
      }
      
      case 'aguardarSerVerdadeiro': {
  await aguardarCondicao(() => avaliarValores(bloco.condicao, variaveis));
  break;
      }

      case 'mudarDeCena': {
        const novaCena = avaliarValores(bloco.cena, variaveis);
        const projeto = localStorage.getItem("projetoSelecionado");
        if (!projeto || !novaCena) break;

        try {
          const dadosProjeto = JSON.parse(AndroidInterface.lerArquivo(projeto + ".json"));
          const dadosDaCena = dadosProjeto.blocos?.[novaCena];
          if (!dadosDaCena) break;

          // Marca que houve mudança de cena
          window.mudouCena = true;

          // Salva no localStorage apenas a cena nova
          localStorage.setItem("blocosParaExecucao", JSON.stringify({
            [projeto]: {
              [novaCena]: dadosDaCena
            }
          }));

          // Recarrega a página de execução
          window.location.href = "ExecutandoJogo.html";
          return; // interrompe a execução atual
        } catch (e) {
          
        }
        break;
      }

      case 'definirOrientacao': {
        const modo = (avaliarValores(bloco.orientacao, variaveis) || "").toString().toLowerCase();

        if ((modo === 'paisagem' || modo === 'retrato') &&
            window.AndroidInterface?.changeOrientation instanceof Function) {

          const orientacao = modo === 'paisagem' ? 'landscape' : 'portrait';
          AndroidInterface.changeOrientation(orientacao);

          reajustarAposRotacao();
        }
        break;
      }

      case 'tocarAudio': {
        const idAudio = avaliarValores(bloco.idAudio, variaveis);

        if (window.AndroidInterface && typeof AndroidInterface.tocarAudio === "function") {
          AndroidInterface.tocarAudio(idAudio);
        } else {
          
        }
        break;
      }
      
      case 'pausarAudio': {
        const idAudio = avaliarValores(bloco.idAudio, variaveis);

        if (window.AndroidInterface && typeof AndroidInterface.pausarAudio === "function") {
          AndroidInterface.pausarAudio(idAudio);
        } else {
          
        }
        break;
      }
      
      case 'continuarAudio': {
        const idAudio = avaliarValores(bloco.idAudio, variaveis);

        if (window.AndroidInterface && typeof AndroidInterface.continuarAudio === "function") {
          AndroidInterface.continuarAudio(idAudio);
        } else {
          
        }
        break;
      }
      
      case 'pararAudio': {
        const idAudio = avaliarValores(bloco.idAudio, variaveis);

        if (window.AndroidInterface && typeof AndroidInterface.pararAudio === "function") {
          AndroidInterface.pararAudio(idAudio);
        } else {
          
        }
        break;
      }
      
      case 'volumeAudio': {
        const idAudio = avaliarValores(bloco.idAudio, variaveis);
        const volume = avaliarValores(bloco.volume, variaveis) / 100 || 1;

        if (window.AndroidInterface && typeof AndroidInterface.ajustarVolumeAudio === "function") {
          AndroidInterface.ajustarVolumeAudio(idAudio, volume);
        } else {
          
        }
        break;
      }

      default:
        break;
    }

    i++;
    yield;
  }
}

// ===== Carregamento e eventos paralelos ===== //  
async function carregarBlocos(blocos, variaveis) {
  let i = 0;

  while (i < blocos.length) {
    const bloco = blocos[i];

    // Quando começar
    if (bloco.tipo === 'quandoComecar') {
      const filhos = extrairBlocosFilhos(blocos, i, 'quandoComecar', 'fimQuandoComecar');
      i += filhos.length + 1;

      const execucao = executarBlocosGenerator(filhos, variaveis);
      executarPassoParalelo(execucao);
      continue;
    }

    // Ao tocar em objeto
    if (bloco.tipo === 'quandoTocado') {
  const id = avaliarValores(bloco.idElemento, variaveis);
  const filhos = extrairBlocosFilhos(blocos, i, 'quandoTocado', 'fimQuandoTocado');
  i += filhos.length + 1;

  const objeto = IdObjetos.get(id);

  if (objeto) {
    registrarEventoToque(objeto, filhos);
  } else {
    if (!eventosPendentes.has(id)) eventosPendentes.set(id, []);
    eventosPendentes.get(id).push(filhos);
  }

  // 🔹 (opcional, mas recomendado) salva como evento base para clones
  if (!eventosAoClonar.has(id)) eventosAoClonar.set(id, []);
  eventosAoClonar.get(id).push(...filhos);

  continue;
}

    // Ao tocar na tela (bloco global)
    if (bloco.tipo === 'quandoTocadoNaTela') {
      const filhos = extrairBlocosFilhos(blocos, i, 'quandoTocadoNaTela', 'fimQuandoTocadoNaTela');
      i += filhos.length + 1;

      if (!canvas._eventoToqueNaTelaRegistrado) {
        canvas.addEventListener('pointerdown', (e) => {
          const rect = canvas.getBoundingClientRect();
          const xTela = e.clientX - rect.left;
          const yTela = e.clientY - rect.top;
          const { x: xMundo, y: yMundo } = telaParaMundo(xTela, yTela);

          // Inject world coordinates as touches for the generator environment
          const exec = executarBlocosGenerator(filhos, variaveis);
          executarPassoParalelo(exec);
        });
        canvas._eventoToqueNaTelaRegistrado = true;
      }

      continue;
    }

    // Quando for verdadeiro
    if (bloco.tipo === 'quandoForVerdadeiro') {
      const filhos = extrairBlocosFilhos(blocos, i, 'quandoForVerdadeiro', 'fimQuandoForVerdadeiro');
      i += filhos.length + 1;

      async function* execQuandoForVerdadeiro() {
        let condicaoAnterior = false;

        while (true) {
          const condicaoAtual = avaliarValores(bloco.condicao, variaveis);

          if (condicaoAtual && !condicaoAnterior) {
            yield* executarBlocosGenerator(filhos, variaveis);
          }

          condicaoAnterior = condicaoAtual;
          await new Promise(r => requestAnimationFrame(r));
          yield;
        }
      }

      execucoesParalelas.add(execQuandoForVerdadeiro());
      continue;
    }

    // Ao criar clone
    if (bloco.tipo === 'quandoCriarClone') {
      const id = avaliarValores(bloco.idElemento, variaveis);
      const filhos = extrairBlocosFilhos(blocos, i, 'quandoCriarClone', 'fimQuandoCriarClone');
      i += filhos.length + 1;

      eventosAoClonar.set(id, filhos);
      continue;
    }

    i++;
  }
}

function extrairBlocosFilhos(blocos, startIndex, tipoInicio, tipoFim) {
  const filhos = [];
  let profundidade = 1;
  let i = startIndex + 1;
  while (i < blocos.length && profundidade > 0) {
    const b = blocos[i];
    if (b.tipo === tipoInicio) profundidade++;
    else if (b.tipo === tipoFim) profundidade--;
    if (profundidade > 0) filhos.push(b);
    i++;
  }
  return filhos;
}

function registrarEventoToque(obj, filhos) {
  if (!obj.eventosToque) obj.eventosToque = [];
  obj.eventosToque.push(filhos);
}

function inicializarSistemaDeToques() {
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function handleTouchStart(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    const xTela = touch.clientX - rect.left;
    const yTela = touch.clientY - rect.top;

    const { x: xMundo, y: yMundo } = telaParaMundo(xTela, yTela);

    const objetos = [...IdObjetos.values()]
      .sort((a, b) => (a.camada || 0) - (b.camada || 0))
      .reverse();

    for (const o of objetos) {
      let centroX, centroY;
      let largura = o.largura;
      let altura = o.altura;

      // 🔹 Calcula área real se usar textura
      if (o.usarTextura && o.textura instanceof Image) {
        const img = o.textura;
        const escalaX = o.largura / img.width;
        const escalaY = o.altura / img.height;
        const escala = Math.min(escalaX, escalaY);
        largura = img.width * escala;
        altura = img.height * escala;
      }

      if (o.fixo) {
        centroX = o.x + largura / 2 + larguraTela / 2;
        centroY = o.y + altura / 2 + alturaTela / 2;
      } else {
        const pos = mundoParaTela(o.x, o.y);
        centroX = pos.x + largura / 2;
        centroY = pos.y + altura / 2;
      }

      // 🔹 Corrige rotação
      const dx = xTela - centroX;
      const dy = yTela - centroY;
      const ang = -(o.direcao ?? 0) * Math.PI / 180;
      const xRot = dx * Math.cos(ang) - dy * Math.sin(ang);
      const yRot = dx * Math.sin(ang) + dy * Math.cos(ang);

      // 🔹 Verifica toque dentro da textura real
      if (
        xRot >= -largura / 2 && xRot <= largura / 2 &&
        yRot >= -altura / 2 && yRot <= altura / 2
      ) {
        if (!dedosPorObjeto.has(o.id)) dedosPorObjeto.set(o.id, new Set());
        dedosPorObjeto.get(o.id).add(touch.identifier);

        o.__toqueEm = true;

        if (o.eventosToque) {
          for (const filhosBlocos of o.eventosToque) {
            const exec = executarBlocosGenerator(filhosBlocos, variaveis);
            executarPassoParalelo(exec);
          }
        }
        break;
      }
    }
  }
}

function handleTouchEnd(e) {
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    for (const [id, set] of dedosPorObjeto.entries()) {
      set.delete(touch.identifier);
      if (set.size === 0) {
        const obj = IdObjetos.get(id);
        if (obj) obj.__toqueEm = false;
        dedosPorObjeto.delete(id);
      }
    }
  }
}

function processarEventosPendentes(obj) {
  if (eventosPendentes.has(obj.id)) {
    for (const filhos of eventosPendentes.get(obj.id)) {
      registrarEventoToque(obj, filhos);
    }
    eventosPendentes.delete(obj.id);
  }
}

// ===== Clonar Objeto ===== //
function IdClone(indice, idOrigem = null) {
  if (!idOrigem) {
    const chaves = Array.from(Clones.keys());
    if (chaves.length === 0) return null;
    idOrigem = chaves[chaves.length - 1];
  }

  const lista = Clones.get(idOrigem);
  if (!lista || indice < 1 || indice > lista.length) return null;
  return lista[indice - 1];
}

/*async function clonarObjetoComBaseNoOriginal(idOrigem) {
  const origem = IdObjetos.get(idOrigem);
  if (!origem) return false;

  let contador = 1;
  let novoId;
  do {
    novoId = `${idOrigem}_clone${contador++}`;
  } while (IdObjetos.has(novoId));

  // Clona visualmente o canvas
  const canvasClone = document.createElement("canvas");
  canvasClone.width = origem.largura;
  canvasClone.height = origem.altura;
  const ctxClone = canvasClone.getContext("2d");
  ctxClone.drawImage(origem.canvas, 0, 0);

  // Cria o objeto clone
  const { canvas, ...resto } = origem;
  const objClone = {
    ...resto,
    id: novoId,
    canvas: canvasClone,
    __toqueEm: true,
    eventosToque: [], // os eventos serão clonados abaixo
  };

  // Registra o clone
  IdObjetos.set(novoId, objClone);
  if (!Clones.has(idOrigem)) Clones.set(idOrigem, []);
  Clones.get(idOrigem).push(novoId);

  // === 🧩 Herda todos os eventos do original (igual ao Pocket Code) ===
  if (origem.eventosToque) {
    for (const filhos of origem.eventosToque) {
      const filhosClonados = filhos.map(b => {
        // copia os blocos, trocando o idElemento pelo id do clone
        if (b.idElemento === idOrigem) {
          return { ...b, idElemento: novoId };
        }
        return { ...b };
      });
      registrarEventoToque(objClone, filhosClonados);
    }
  }

  // === 🧠 Executa o evento "Quando Criar Clone" ===
  if (eventosAoClonar.has(idOrigem)) {
    const novosVars = { ...variaveis, idClone: novoId };
    const exec = executarBlocosGenerator(eventosAoClonar.get(idOrigem), novosVars);
    executarPassoParalelo(exec);
  }

  // === 🚀 Executa automaticamente os blocos "Quando Começar" do original (como o Pocket Code faz nos clones) ===
  if (window.blocos) {
    for (const bloco of blocos) {
      if (bloco.tipo === "quandoComecar" && bloco.idElemento === idOrigem) {
        const filhos = extrairBlocosFilhos(blocos, blocos.indexOf(bloco), "quandoComecar", "fimQuandoComecar");
        const exec = executarBlocosGenerator(filhos, variaveis);
        // muda o idElemento internamente pro id do clone
        filhos.forEach(b => { if (b.idElemento === idOrigem) b.idElemento = novoId; });
        executarPassoParalelo(exec);
      }
    }
  }

  return novoId;
}*/

// ===== Mostrar FPS ===== //
function mostrarFPS() {
  const fpsDiv = document.createElement('div');
  fpsDiv.style.position = 'fixed';
  fpsDiv.style.left = '15px';
  fpsDiv.style.top = '15px';
  fpsDiv.style.padding = '4px 10px';
  fpsDiv.style.fontFamily = 'Consolas, monospace';
  fpsDiv.style.fontSize = '14px';
  fpsDiv.style.fontWeight = '500';
  fpsDiv.style.color = '#FFFFFF';
  fpsDiv.style.background = 'rgba(0,0,0,0.4)'; // leve contraste
  fpsDiv.style.borderRadius = '5px';
  fpsDiv.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  fpsDiv.style.backdropFilter = 'blur(4px)'; // efeito profissional
  fpsDiv.style.zIndex = '9999';
  fpsDiv.style.transition = 'color 0.3s ease, background 0.3s ease'; // suaviza mudanças
  document.body.appendChild(fpsDiv);

  let frames = 0;
  let lastTime = performance.now();
  fpsDiv.textContent = `FPS:`;
  fpsDiv.style.color = '#FF4500';

  function loop() {
    frames++;
    const now = performance.now();

    if (now - lastTime >= 1000) {
      const fps = frames;
      frames = 0;
      lastTime = now;

      fpsDiv.textContent = `FPS: ${fps}`;

      // cor dinâmica profissional: verde alto (>50), amarelo médio, vermelho baixo
      if (fps >= 50) fpsDiv.style.color = '#00FF7F';
      else if (fps >= 30) fpsDiv.style.color = '#FFD700';
      else fpsDiv.style.color = '#FF4500';
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

// Função Para Carregar Blocos Do Projeto //
async function carregarProjeto() {
  const dados = JSON.parse(localStorage.getItem("blocosParaExecucao")) || {};
  const projeto = localStorage.getItem("projetoSelecionado");
  if (!projeto || !dados[projeto]) return;

  const cenas = Object.keys(dados[projeto]);
  if (cenas.length === 0) return;

  const cenaParaExecutar = cenas[0];
  const objetosDaCena = dados[projeto][cenaParaExecutar];

  for (const objeto in objetosDaCena) {
    const blocosDoObjeto = objetosDaCena[objeto];
    if (Array.isArray(blocosDoObjeto)) {
      await carregarBlocos(blocosDoObjeto, variaveis);
    }
  }
}
