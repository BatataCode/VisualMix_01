document.getElementById("btnImportarProjeto").addEventListener("click", () => {
  document.getElementById("inputImportarProjeto").click();
});

document.getElementById("inputImportarProjeto").addEventListener("change", function () {
  const arquivo = this.files[0];
  if (arquivo) importarProjeto(arquivo);
});

function abrirModalExportar() {
  const modal = document.getElementById("modalExportarProjeto");
  const select = document.getElementById("selectProjetoExportar");

  select.innerHTML = "";

  if (window.AndroidInterface && typeof AndroidInterface.listarArquivosDaPasta === "function") {
    const arquivos = AndroidInterface.listarArquivosDaPasta(); // Ex: ["Teste.json", "OutroProjeto.json"]
    let encontrouProjetos = false;

    arquivos.forEach(nomeArquivo => {
      if (nomeArquivo.endsWith(".json")) {
        try {
          const conteudo = AndroidInterface.lerArquivo(nomeArquivo);
          const dados = JSON.parse(conteudo);

          const nomeProjeto = dados?.projeto?.nome;
          if (nomeProjeto) {
            const option = document.createElement("option");
            option.value = nomeProjeto;
            option.textContent = nomeProjeto;
            select.appendChild(option);
            encontrouProjetos = true;
          }
        } catch (e) {
          // Ignora arquivos com erro
        }
      }
    });

    if (!encontrouProjetos) {
      const option = document.createElement("option");
      option.textContent = "Nenhum projeto disponível";
      option.disabled = true;
      option.selected = true;
      select.appendChild(option);
    }

    modal.style.display = "flex";
  } else {
    // Modo navegador (para testes sem AndroidInterface)
    const projetos = JSON.parse(localStorage.getItem("projetos")) || [];
    let encontrouProjetos = false;

    projetos.forEach(p => {
      if (p?.nome) {
        const option = document.createElement("option");
        option.value = p.nome;
        option.textContent = p.nome;
        select.appendChild(option);
        encontrouProjetos = true;
      }
    });

    if (!encontrouProjetos) {
      const option = document.createElement("option");
      option.textContent = "Nenhum projeto disponível";
      option.disabled = true;
      option.selected = true;
      select.appendChild(option);
    }

    modal.style.display = "flex";
  }
}

function confirmarExportacao() {
  const select = document.getElementById("selectProjetoExportar");
  const nomeProjeto = select.value;

  if (!nomeProjeto) return;

  exportarProjeto(nomeProjeto);
  fecharModalExportar();
}

function fecharModalExportar() {
    modal.style.display = "none";
}

function exportarProjeto(nomeProjeto) {
  try {
    const projeto = JSON.parse(AndroidInterface.lerArquivo(nomeProjeto + ".json"));
    if (!projeto?.nome) return;

    const pacote = {
      projeto: {
        nome: projeto.nome,
        orientacao: projeto.orientacao || "portrait"
      },
      cenas: projeto.cenas || [],
      objetos: projeto.objetos || {},
      blocos: projeto.blocos || {},
      imagens: projeto.imagens || {}
    };

    if (AndroidInterface.salvarJsonNaPastaDownloads) {
      AndroidInterface.salvarJsonNaPastaDownloads(JSON.stringify(pacote), nomeProjeto);
    } else {
      const blob = new Blob([JSON.stringify(pacote, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nomeProjeto}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (e) {
    console.error("Erro ao exportar projeto:", e);
  }
}

function importarProjeto(arquivo) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const dados = JSON.parse(e.target.result);
      if (!dados.projeto?.nome) return;

      const projetos = JSON.parse(AndroidInterface.lerArquivo("projetos.json")) || [];

      let nomeOriginal = dados.projeto.nome;
      let nomeFinal = nomeOriginal;
      let contador = 1;

      // Evita sobrescrever projetos existentes
      while (projetos.some(p => p.nome === nomeFinal)) {
        nomeFinal = `${nomeOriginal}_${contador++}`;
      }

      dados.projeto.nome = nomeFinal;

      projetos.push({
        nome: nomeFinal,
        orientacao: dados.projeto.orientacao || "portrait"
      });

      // Cria o novo arquivo do projeto
      AndroidInterface.criarNovoArquivo(nomeFinal + ".json", JSON.stringify(dados));

      location.reload();
    } catch (err) {
      console.error("Erro ao importar projeto:", err);
    }
  };

  reader.readAsText(arquivo);
}
