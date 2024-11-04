const apiUrl = '/api';

function obterDados() {
    fetch(`${apiUrl}/dados`)
        .then(response => response.json())
        .then(data => {
            atualizarInterface(data);
        })
        .catch(error => console.error('Erro ao obter dados:', error));
}

function atualizarInterface(dados) {
    const fila = dados.fila;
    const historico = dados.historico;
    const contadores = dados.contadores;


    const listaFila = document.getElementById('fila');
    listaFila.innerHTML = '';
    fila.forEach((pessoa, index) => {
        const li = document.createElement('li');
        li.textContent = pessoa;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', dragStart);
        li.addEventListener('dragover', dragOver);
        li.addEventListener('drop', drop);
        li.addEventListener('dragend', dragEnd);
        listaFila.appendChild(li);
    });

    document.getElementById('proximo').textContent = fila[0] || 'Ninguém';
    document.getElementById('ultimo').textContent = historico[historico.length - 1] || 'Ninguém';
    document.getElementById('seguinte').textContent = fila[1] || 'Ninguém';

    atualizarDestaques(contadores);
    atualizarContadores(contadores);
}

function atualizarDestaques(contadores) {
    let max = -1;
    let min = Infinity;
    let quemMais = '';
    let quemMenos = '';
    let maxContador = 0;
    let minContador = 0;

    for (let pessoa in contadores) {
        if (contadores[pessoa] > max) {
            max = contadores[pessoa];
            quemMais = pessoa;
            maxContador = contadores[pessoa];
        }
        if (contadores[pessoa] < min) {
            min = contadores[pessoa];
            quemMenos = pessoa;
            minContador = contadores[pessoa];
        }
    }
    document.getElementById('mais-fez').textContent = quemMais || 'Ninguém';
    document.getElementById('menos-fez').textContent = quemMenos || 'Ninguém';
    document.getElementById('mais-fez-contador').textContent = maxContador;
    document.getElementById('menos-fez-contador').textContent = minContador;
}

function atualizarContadores(contadores) {
    const listaContadores = document.getElementById('lista-contadores');
    listaContadores.innerHTML = '';
    for (let pessoa in contadores) {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.textContent = pessoa;
        const span = document.createElement('span');
        span.className = 'badge badge-primary badge-pill';
        span.textContent = contadores[pessoa];
        li.appendChild(span);
        listaContadores.appendChild(li);
    }
}

let elementoArrastado;

function dragStart(e) {
    elementoArrastado = e.target;
    e.dataTransfer.effectAllowed = 'move';
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    if (e.target.tagName === 'LI' && e.target !== elementoArrastado) {
        const lista = elementoArrastado.parentNode;
        const filhos = Array.from(lista.children);
        const origemIndex = filhos.indexOf(elementoArrastado);
        const destinoIndex = filhos.indexOf(e.target);

        const itens = filhos.map(li => li.textContent);
        const itemMovido = itens.splice(origemIndex, 1)[0];
        itens.splice(destinoIndex, 0, itemMovido);

        fetch(`${apiUrl}/reordenar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fila: itens })
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                obterDados();
            }
        })
        .catch(error => console.error('Erro ao reordenar fila:', error));
    }
}

function dragEnd(e) {
    elementoArrastado = null;
}

document.getElementById('form-cadastro').addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('nome').value.trim();
    if (nome) {
        fetch(`${apiUrl}/adicionar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome })
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                document.getElementById('nome').value = '';
                obterDados();
            } else {
                alert(data.mensagem);
            }
        })
        .catch(error => console.error('Erro ao adicionar pessoa:', error));
    }
});

document.getElementById('botao-fez-cafe').addEventListener('click', function() {
    fetch(`${apiUrl}/fez-cafe`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.sucesso) {
            obterDados();
        } else {
            alert(data.mensagem);
        }
    })
    .catch(error => console.error('Erro ao marcar que fez o café:', error));
});

document.getElementById('botao-outro-fez-cafe').addEventListener('click', function() {
    const nome = prompt('Quem fez o café?');
    if (nome) {
        fetch(`${apiUrl}/outro-fez-cafe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome })
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                obterDados();
            } else {
                alert(data.mensagem);
            }
        })
        .catch(error => console.error('Erro ao marcar que outra pessoa fez o café:', error));
    }
});

document.getElementById('botao-regras').addEventListener('click', function() {
    $('#modal-regras').modal('show');
});

document.getElementById('botao-relatorios').addEventListener('click', function() {

    fetch(`${apiUrl}/relatorios`)
        .then(response => response.json())
        .then(data => {
            exibirRelatorios(data.relatorios);
            $('#modal-relatorios').modal('show');
        })
        .catch(error => console.error('Erro ao obter relatórios:', error));
});

function exibirRelatorios(relatorios) {
    const conteudoRelatorios = document.getElementById('conteudo-relatorios');
    conteudoRelatorios.innerHTML = '';

    if (relatorios.length === 0) {
        conteudoRelatorios.innerHTML = '<p>Nenhum relatório disponível.</p>';
        return;
    }

    relatorios.forEach((relatorio, index) => {
        const card = document.createElement('div');
        card.className = 'card mb-3';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';
        cardHeader.textContent = `Relatório ${index + 1} - ${relatorio.data}`;

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const maisFez = document.createElement('p');
        maisFez.innerHTML = `<strong>Quem mais fez café:</strong> ${relatorio.quemMais} (${relatorio.maxContador} vezes)`;

        const menosFez = document.createElement('p');
        menosFez.innerHTML = `<strong>Quem menos fez café:</strong> ${relatorio.quemMenos} (${relatorio.minContador} vezes)`;

        const totalFeitos = document.createElement('p');
        totalFeitos.innerHTML = '<strong>Total de Cafés Feitos:</strong>';

        const lista = document.createElement('ul');
        lista.className = 'list-group';

        for (let pessoa in relatorio.contadores) {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.textContent = pessoa;
            const span = document.createElement('span');
            span.className = 'badge badge-primary badge-pill';
            span.textContent = relatorio.contadores[pessoa];
            li.appendChild(span);
            lista.appendChild(li);
        }

        cardBody.appendChild(maisFez);
        cardBody.appendChild(menosFez);
        cardBody.appendChild(totalFeitos);
        cardBody.appendChild(lista);

        card.appendChild(cardHeader);
        card.appendChild(cardBody);

        conteudoRelatorios.appendChild(card);
    });
}

document.getElementById('botao-resetar').addEventListener('click', function() {
    if (confirm('Tem certeza que deseja zerar a contagem? Os dados dos relatórios mais antigos podem ser perdidos.')) {
        fetch(`${apiUrl}/gerar-relatorio`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                obterDados();
                alert('Relatório gerado e contadores resetados com sucesso.');
            } else {
                alert(data.mensagem);
            }
        })
        .catch(error => console.error('Erro ao gerar relatório:', error));
    }
});

obterDados();

setInterval(obterDados, 2000);