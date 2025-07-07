const API_URL = 'https://controledemensalidades-api.onrender.com/';
let todasParcelas = [];

document.addEventListener('DOMContentLoaded', () => {
  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration);
      })
      .catch(err => {
        console.log('Falha ao registrar Service Worker:', err);
      });
  }

  // Eventos de filtros
  document.getElementById('filtroMesAno').addEventListener('input', aplicarFiltros);
  document.getElementById('filtroStatus').addEventListener('change', aplicarFiltros);

  // Testa a API ao carregar
  pingAPI();
});

async function consultar() {
  const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
  const membro = document.getElementById('membro');
  const info = document.getElementById('info');
  const erro = document.getElementById('erro');
  const corpo = document.getElementById('corpoTabela');
  const filtersContainer = document.getElementById('filtersContainer');
  const tableResponsive = document.getElementById('tableResponsive');

  membro.textContent = '';
  info.textContent = '';
  erro.textContent = '';
  membro.classList.remove('active');
  info.classList.remove('active');
  erro.classList.remove('active');
  corpo.innerHTML = '';
  tableResponsive.style.display = 'none';
  filtersContainer.style.display = 'none';

  if (!cpf) {
    erro.textContent = 'Por favor, digite o CPF.';
    erro.classList.add('active');
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}mensalidade?cpf=${cpf}`);
    if (!resposta.ok) throw new Error('CPF não encontrado');
    const dados = await resposta.json();

    todasParcelas = dados.parcelas;
    exibirParcelas(todasParcelas);

    tableResponsive.style.display = 'grid';
    filtersContainer.style.display = 'grid';
    membro.textContent = `Mostrando dados de:\n${dados.membro.nome}`;
    membro.classList.add('active');
    info.textContent = `Mensalidade atual: R$ ${dados.valorMensalidade} | Última atualização do extrato: ${formatarDataParaHumano(dados.ultimaAtualizacao)}`;
    info.classList.add('active');
  } catch (e) {
    erro.textContent = 'Erro ao buscar dados. Verifique o CPF ou tente novamente mais tarde.';
    erro.classList.add('active');
  }
}

function exibirParcelas(parcelas) {
  const corpo = document.getElementById('corpoTabela');
  corpo.innerHTML = '';

  if (parcelas.length === 0) {
    corpo.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Nenhuma parcela encontrada com os filtros aplicados.</td></tr>';
    return;
  }

  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  let totalSaldo = 0;

  parcelas.forEach(p => {
    const linha = document.createElement('tr');
    const [_, mes, ano] = p.competencia.split('/');
    const mesCompetencia = parseInt(mes);
    const anoCompetencia = parseInt(ano);

    let status = p.status;
    let statusClass = `status-${status.toLowerCase().replace(/\s/g, '-')}`;

    if (status === 'Em Aberto') {
      let isOverdue = false;

      if (anoCompetencia < anoAtual ||
          (anoCompetencia === anoAtual && mesCompetencia < mesAtual) ||
          (anoCompetencia === anoAtual && mesCompetencia === mesAtual && diaAtual > 10)) {
        isOverdue = true;
      }

      if (isOverdue) {
        status = 'Vencida';
        statusClass = 'status-vencido';
      }
    }

    const saldoValue = p.saldo ? parseFloat(p.saldo.replace('R$ ', '').replace(',', '.')) : 0;
    if (!isNaN(saldoValue)) {
      totalSaldo += saldoValue;
    }

    linha.innerHTML = `
      <td>${p.competencia.substring(3)}</td>
      <td>R$ ${parseFloat(p.valorDevido.replace('R$ ','').replace('.',',')).toFixed(2).replace('.', ',')}</td>
      <td>R$ ${parseFloat(p.ValorPago.replace('R$ ','').replace('.',',')).toFixed(2).replace('.', ',')}</td>
      <td class="${statusClass}">${status}</td>
      <td>${p.dataPagamento ? formatarDataParaHumano(p.dataPagamento) : '-'}</td>
      <td>R$ ${parseFloat(p.saldo.replace('R$ ','').replace('.',',')).toFixed(2).replace('.', ',') || '-'}</td>
    `;
    corpo.appendChild(linha);
  });

  const totalRow = document.createElement('tr');
  totalRow.classList.add('total-row');
  totalRow.innerHTML = `
    <td colspan="5" style="text-align: right;">Total Saldo:</td>
    <td>R$ ${totalSaldo.toFixed(2).replace('.', ',')}</td>
  `;
  corpo.appendChild(totalRow);
}

function aplicarFiltros() {
  const filtroMesAnoInput = document.getElementById('filtroMesAno').value.trim();
  const filtroStatusSelect = document.getElementById('filtroStatus').value;

  let parcelasFiltradas = todasParcelas.filter(parcela => {
    const competenciaMesAno = parcela.competencia.substring(3);
    const statusParcela = parcela.status;

    const matchMesAno = filtroMesAnoInput === '' || competenciaMesAno.includes(filtroMesAnoInput);
    const matchStatus = filtroStatusSelect === '' || statusParcela === filtroStatusSelect;

    return matchMesAno && matchStatus;
  });

  exibirParcelas(parcelasFiltradas);
}

function formatarDataParaHumano(dataTexto) {
  if (!dataTexto) return '';
  return dataTexto;
}

// Toast
const toaster = document.createElement('div');
toaster.style.position = 'fixed';
toaster.style.bottom = '20px';
toaster.style.right = '20px';
toaster.style.padding = '12px 20px';
toaster.style.backgroundColor = '#333';
toaster.style.color = '#fff';
toaster.style.fontWeight = 'bold';
toaster.style.borderRadius = '6px';
toaster.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
toaster.style.zIndex = '9999';
toaster.style.opacity = '0';
toaster.style.transition = 'opacity 0.5s ease';
document.body.appendChild(toaster);

function showToast(message, color = '#333', duration = 5000) {
  toaster.textContent = message;
  toaster.style.backgroundColor = color;
  toaster.style.opacity = '1';
  setTimeout(() => {
    toaster.style.opacity = '0';
  }, duration);
}

async function pingAPI() {
  showToast('Conectando ao serviço...', '#007bff');
  try {
    const response = await fetch(`${API_URL}ping`);
    const text = await response.text();
    if (text.toLowerCase() === 'ok') {
      showToast('Conectado.', '#28a745');
    } else {
      showToast('Falha ao conectar.', '#dc3545');
    }
  } catch (error) {
    showToast('Erro na conexão.', '#dc3545');
  }
}
