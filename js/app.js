const gramatica = {
    'S': [['a','A'], ['b','B']],
    'A': [['c','C'], ['d','D'], ['b','A']],
    'B': [['c','S'], ['d','D','A']],
    'C': [['a','S'], []],
    'D': [['c','C','b']]
};

function obterNaoTerminais() { return Object.keys(gramatica); }

function ehNaoTerminal(simbolo) { return obterNaoTerminais().includes(simbolo); }

function firstDeSequencia(seq, F) {
    const resultado = new Set();
    let todosEps = true;
    for (const sym of seq) {
        if (!ehNaoTerminal(sym)) { resultado.add(sym); todosEps = false; break; }
        let temEps = false;
        for (const e of F[sym]) { if (e === 'ε') temEps = true; else resultado.add(e); }
        if (!temEps) { todosEps = false; break; }
    }
    if (todosEps) resultado.add('ε');
    return resultado;
}

function calcularFirst() {
    const F = {};
    for (const nt of obterNaoTerminais()) F[nt] = new Set();
    let houveMudanca = true;
    while (houveMudanca) {
        houveMudanca = false;
        for (const nt of obterNaoTerminais()) {
            for (const p of gramatica[nt]) {
                const fp = p.length === 0 ? new Set(['ε']) : firstDeSequencia(p, F);
                for (const e of fp) {
                    if (!F[nt].has(e)) { F[nt].add(e); houveMudanca = true; }
                }
            }
        }
    }
    return F;
}

function calcularFollow() {
    const F  = calcularFirst();
    const Fo = {};
    for (const nt of obterNaoTerminais()) Fo[nt] = new Set();
    Fo['S'].add('$');

    let houveMudanca = true;
    while (houveMudanca) {
        houveMudanca = false;
        for (const lhs in gramatica) {
            for (const p of gramatica[lhs]) {
                for (let i = 0; i < p.length; i++) {
                    const sym = p[i];
                    if (!ehNaoTerminal(sym)) continue;
                    const resto      = p.slice(i + 1);
                    const firstResto = resto.length === 0 ? new Set(['ε']) : firstDeSequencia(resto, F);
                    const antes      = Fo[sym].size;
                    for (const e of firstResto) if (e !== 'ε') Fo[sym].add(e);
                    if (firstResto.has('ε') || resto.length === 0) for (const e of Fo[lhs]) Fo[sym].add(e);
                    if (Fo[sym].size > antes) houveMudanca = true;
                }
            }
        }
    }
    return Fo;
}

function gerarTabelaParsing() {
    const F        = calcularFirst();
    const Fo       = calcularFollow();
    const tabela   = {};
    const terminais = ['a','b','c','d','$'];

    for (const nt of obterNaoTerminais()) {
        tabela[nt] = {};
        for (const t of terminais) tabela[nt][t] = '-';
    }

    for (const lhs in gramatica) {
        for (const p of gramatica[lhs]) {
            const ld     = p.length === 0 ? 'ε' : p.join('');
            const entrada = `${lhs} → ${ld}`;
            const firstP  = p.length === 0 ? new Set(['ε']) : firstDeSequencia(p, F);

            for (const t of firstP) {
                if (t !== 'ε') tabela[lhs][t] = entrada;
            }
            if (firstP.has('ε')) {
                for (const t of Fo[lhs]) tabela[lhs][t] = entrada;
            }
        }
    }
    return tabela;
}

const tabelaParsing = gerarTabelaParsing();

function criarAnalisador(sentenca) {
    let pilha      = ['$', 'S'];
    let entrada    = [...sentenca, '$'];
    let iteracao   = 0;
    let finalizado = false;

    function executarPasso() {
        if (finalizado) return null;
        iteracao++;

        const topo            = pilha[pilha.length - 1];
        const simboloAtual    = entrada[0];
        const pilhaAntes      = [...pilha].join(' ');
        const entradaAntes    = entrada.join(' ');
        let acao              = '';
        let ntDestacado       = null;
        let terminalDestacado = null;

        if (topo === '$' && simboloAtual === '$') {
            acao       = `Aceito em ${iteracao} iterações`;
            finalizado = true;
        } else if (topo === simboloAtual && topo !== '$') {
            pilha.pop();
            entrada.shift();
            acao = `Lê ${simboloAtual}`;
        } else if (ehNaoTerminal(topo)) {
            const producao = tabelaParsing[topo]?.[simboloAtual];
            if (!producao || producao === '-') {
                acao       = `Erro em ${iteracao} iterações`;
                finalizado = true;
            } else {
                pilha.pop();
                const ld = producao.split('→')[1].trim();
                if (ld !== 'ε') {
                    const simbolos = [];
                    for (const ch of ld) simbolos.push(ch);
                    pilha.push(...simbolos.reverse());
                }
                acao              = producao;
                ntDestacado       = topo;
                terminalDestacado = simboloAtual;
            }
        } else {
            acao       = `Erro em ${iteracao} iterações`;
            finalizado = true;
        }

        return { iteracao, pilha: pilhaAntes, entrada: entradaAntes, acao, finalizado, ntDestacado, terminalDestacado };
    }

    return { executarPasso, get finalizado() { return finalizado; } };
}

const tamanhoMaximo = 14;

function encontrarProximoNT(sentenca) {
    for (const s of sentenca) if (ehNaoTerminal(s)) return s;
    return null;
}

function substituirNT(sentenca, nt, producao) {
    const idx = sentenca.indexOf(nt);
    if (idx === -1) return sentenca;
    return [...sentenca.slice(0, idx), ...producao, ...sentenca.slice(idx + 1)];
}

function derivar(nt, sentenca, prof) {
    if (prof > 25) return null;
    const producoes = gramatica[nt];
    const termAtual = sentenca.filter(s => !ehNaoTerminal(s)).length;
    const candidatos = termAtual < 7
        ? producoes.filter(p => p.length > 0).concat(producoes)
        : producoes;
    const escolhida = candidatos[Math.floor(Math.random() * candidatos.length)];
    let nova = substituirNT(sentenca, nt, escolhida);
    if (nova.filter(s => !ehNaoTerminal(s)).length > tamanhoMaximo) return null;
    const prox = encontrarProximoNT(nova);
    if (prox) return derivar(prox, nova, prof + 1);
    return nova;
}

function gerarSentencaValida() {
    let resultado = null;
    let tentativas = 0;
    while ((!resultado || resultado.length === 0) && tentativas < 150) {
        resultado = derivar('S', ['S'], 0);
        tentativas++;
    }
    return resultado || ['a','c'];
}

function gerarSentencaAleatoria() {
    const base = gerarSentencaValida();
    const simbolos = ['a','b','c','d'];
    const chars = [...base];
    const mudancas = Math.max(1, Math.floor(chars.length * 0.3));
    for (let i = 0; i < mudancas; i++) {
        chars[Math.floor(Math.random() * chars.length)] =
            simbolos[Math.floor(Math.random() * simbolos.length)];
    }
    return chars;
}

let analisadorAtual = null;
let linhasResultado = [];
let naoTerminalDest = null;
let terminalDest    = null;

function tokenizar(str) {
    const validos = ['a','b','c','d'];
    const resultado = [];
    for (const ch of str.replace(/\s+/g, '')) {
        if (!validos.includes(ch)) return null;
        resultado.push(ch);
    }
    return resultado;
}

function iniciarAnalise() {
    const texto  = document.getElementById('inp').value.trim();
    const tokens = tokenizar(texto);
    if (!tokens || tokens.length === 0) {
        mostrarBanner('erro', '✗', 'Sentença inválida — use apenas: a, b, c, d');
        return false;
    }
    analisadorAtual = criarAnalisador(tokens);
    linhasResultado = [];
    naoTerminalDest = null;
    terminalDest    = null;
    limparTabelaReconhecimento();
    esconderBanner();
    document.getElementById('stepControls').style.display = 'flex';
    return true;
}

function analisar() {
    if (!iniciarAnalise()) return;
    while (analisadorAtual && !analisadorAtual.finalizado) {
        const r = analisadorAtual.executarPasso();
        if (r) linhasResultado.push(r);
    }
    renderizarLinhas(linhasResultado);
    mostrarResultado();
    atualizarContador();
}

function proximoPasso() {
    if (!analisadorAtual) { if (!iniciarAnalise()) return; }
    if (analisadorAtual.finalizado) return;
    const r = analisadorAtual.executarPasso();
    if (r) {
        linhasResultado.push(r);
        renderizarLinha(r);
        naoTerminalDest = r.ntDestacado;
        terminalDest    = r.terminalDestacado;
        destacarCelula(naoTerminalDest, terminalDest);
        if (r.finalizado) mostrarResultado();
        atualizarContador();
    }
}

function executarTudo() {
    if (!analisadorAtual) { if (!iniciarAnalise()) return; }
    destacarCelula(null, null);
    while (!analisadorAtual.finalizado) {
        const r = analisadorAtual.executarPasso();
        if (r) { linhasResultado.push(r); renderizarLinha(r); }
    }
    mostrarResultado();
    atualizarContador();
}

function gerarValida() {
    document.getElementById('inp').value = gerarSentencaValida().join('');
    reiniciar();
}

function gerarAleatoria() {
    document.getElementById('inp').value = gerarSentencaAleatoria().join('');
    reiniciar();
}

function limpar() {
    document.getElementById('inp').value = '';
    reiniciar();
}

function reiniciar() {
    analisadorAtual = null;
    linhasResultado = [];
    naoTerminalDest = null;
    terminalDest    = null;
    limparTabelaReconhecimento();
    esconderBanner();
    destacarCelula(null, null);
    document.getElementById('stepControls').style.display = 'none';
    document.getElementById('stepBadge').textContent = '0 passos';
    document.getElementById('stepLabel').textContent  = '';
}

function renderizarLinhas(linhas) {
    limparTabelaReconhecimento();
    for (const l of linhas) renderizarLinha(l);
}

function renderizarLinha(linha) {
    const corpo   = document.getElementById('recogBody');
    const tr      = document.createElement('tr');
    const ehErro  = linha.acao.toLowerCase().startsWith('erro');
    const ehAceito = linha.acao.toLowerCase().startsWith('aceito');
    tr.className  = ehErro ? 'linha-erro' : ehAceito ? 'linha-aceita' : linha.acao.startsWith('Lê') ? 'linha-leitura' : '';
    tr.innerHTML  = `<td>${linha.iteracao}</td><td>${linha.pilha}</td><td>${linha.entrada}</td><td>${linha.acao}</td>`;
    corpo.appendChild(tr);
    tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function limparTabelaReconhecimento() { document.getElementById('recogBody').innerHTML = ''; }

function mostrarResultado() {
    if (!linhasResultado.length) return;
    const ultima = linhasResultado[linhasResultado.length - 1];
    mostrarBanner(
        ultima.acao.toLowerCase().startsWith('aceito') ? 'ok' : 'erro',
        ultima.acao.toLowerCase().startsWith('aceito') ? '✓' : '✗',
        ultima.acao
    );
}

function mostrarBanner(tipo, icone, mensagem) {
    const banner = document.getElementById('statusBanner');
    banner.className = `banner-status visivel ${tipo === 'ok' ? 'banner-ok' : 'banner-erro'}`;
    document.getElementById('statusIcon').textContent = icone;
    document.getElementById('statusMsg').textContent  = mensagem;
}

function esconderBanner() { document.getElementById('statusBanner').className = 'banner-status'; }

function atualizarContador() {
    const n = linhasResultado.length;
    document.getElementById('stepBadge').textContent = `${n} passo${n !== 1 ? 's' : ''}`;
    document.getElementById('stepLabel').textContent  = `Passo ${n}`;
}

const terminaisTabela = ['a','b','c','d','$'];

function construirTabelaParsing() {
    const corpo = document.getElementById('parseTableBody');
    for (const nt of obterNaoTerminais()) {
        const linha = document.createElement('tr');
        linha.setAttribute('data-nt', nt);
        let html = `<td>${nt}</td>`;
        for (const t of terminaisTabela) {
            const prod    = tabelaParsing[nt][t];
            const idCel   = `celula-${nt}-${t}`;
            if (prod && prod !== '-') {
                const partes = prod.split('→');
                const ntP    = partes[0].trim();
                const ld     = partes[1].trim();
                const ldHtml = ld === 'ε'
                    ? `<span class="prod-eps">ε</span>`
                    : [...ld].map(s => ehNaoTerminal(s)
                        ? `<span class="prod-nt">${s}</span>`
                        : `<span class="prod-sym">${s}</span>`).join('');
                html += `<td class="celula-producao" id="${idCel}" data-nt="${nt}" data-t="${t}">
                            <span class="prod-nt">${ntP}</span> → ${ldHtml}</td>`;
            } else {
                html += `<td class="celula-vazia" id="${idCel}">—</td>`;
            }
        }
        linha.innerHTML = html;
        corpo.appendChild(linha);
    }
}

function destacarCelula(nt, t) {
    document.querySelectorAll('.celula-destaque').forEach(c => c.classList.remove('celula-destaque'));
    if (nt && t) {
        const cel = document.getElementById(`celula-${nt}-${t}`);
        if (cel) cel.classList.add('celula-destaque');
    }
}

construirTabelaParsing();