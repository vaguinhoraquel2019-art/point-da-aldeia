/* =============================================
   POINT DA ALDEIA – carrinho.js
   Sistema completo de carrinho + checkout
   ============================================= */

const WA_NUMBER = '5513997886293';
const TAXA_ENTREGA = 4.99;

/* ── Estado global ── */
let carrinho   = JSON.parse(localStorage.getItem('pda_carrinho') || '[]');
let pedidoNum  = parseInt(localStorage.getItem('pda_pedido_num') || '100000') + 1;
let produtoAtual = null;
let qtyAtual   = 1;

let pedido = {
  tipoEntrega : '',   // entrega | retirada | local
  endereco    : {},
  pagamento   : '',   // cartao | pix | dinheiro
  troco       : null,
  cliente     : {},
  desconto    : 0
};

/* ============================================
   NAVEGAÇÃO
   ============================================ */
function irPara(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  window.scrollTo(0, 0);
  atualizarBottomBars();
}

function voltarParaLoja() {
  window.location.href = 'index.html';
}

/* ============================================
   PRODUTO — abrir da loja
   ============================================ */
function abrirProduto(nome, preco, emoji) {
  produtoAtual = { nome, preco, emoji };
  qtyAtual = 1;
  document.getElementById('prodNome').textContent   = nome;
  document.getElementById('prodPreco').textContent  = fmtNum(preco);
  document.getElementById('prodObs').value          = '';
  document.getElementById('prodImg').innerHTML      = '<span style="font-size:5rem">' + emoji + '</span>';
  atualizarProdTotal();
  irPara('page-produto');
}

function alterarQtyProd(delta) {
  qtyAtual = Math.max(1, qtyAtual + delta);
  document.getElementById('prodQty').textContent = qtyAtual;
  atualizarProdTotal();
}

function atualizarProdTotal() {
  const total = (produtoAtual?.preco || 0) * qtyAtual;
  document.getElementById('prodTotal').textContent = fmtMoeda(total);
}

function adicionarAoCarrinho() {
  if (!produtoAtual) return;
  const obs = document.getElementById('prodObs').value.trim();
  const item = {
    id    : Date.now(),
    nome  : produtoAtual.nome,
    preco : produtoAtual.preco,
    emoji : produtoAtual.emoji,
    qty   : qtyAtual,
    obs   : obs
  };
  carrinho.push(item);
  salvarCarrinho();
  irPara('page-carrinho');
  renderCarrinho();
  mostrarToast('Item adicionado ao carrinho!');
}

/* ============================================
   CARRINHO
   ============================================ */
function renderCarrinho() {
  const lista = document.getElementById('carrinho-lista');
  if (!carrinho.length) {
    lista.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#aaa"><i class="fas fa-shopping-cart" style="font-size:2.5rem;margin-bottom:12px;display:block;opacity:.3"></i><p>Seu carrinho está vazio.</p><br><a href="index.html" style="color:var(--red);font-weight:700">Ver cardápio</a></div>';
  } else {
    lista.innerHTML = carrinho.map(item => `
      <div class="cart-item" id="item-${item.id}">
        <div class="cart-item-info">
          <h4>${item.nome}</h4>
          ${item.obs ? '<p class="obs">' + item.obs + '</p>' : ''}
          <p class="price">${fmtMoeda(item.preco * item.qty)}</p>
        </div>
        <div class="cart-item-right">
          <button class="alterar-btn" onclick="editarItem(${item.id})">Alterar</button>
          <div class="qty-ctrl">
            <button onclick="alterarQtyItem(${item.id}, -1)"><i class="fas fa-trash" style="font-size:.65rem;color:var(--red)"></i></button>
            <span class="qty-val">${item.qty}</span>
            <button onclick="alterarQtyItem(${item.id}, 1)"><i class="fas fa-plus" style="font-size:.7rem"></i></button>
          </div>
        </div>
      </div>
    `).join('') + '<a href="index.html" class="add-more-btn"><i class="fas fa-plus" style="margin-right:4px"></i> Adicionar mais itens</a>';
  }
  atualizarBottomBars();
}

function alterarQtyItem(id, delta) {
  const idx = carrinho.findIndex(i => i.id === id);
  if (idx === -1) return;
  carrinho[idx].qty += delta;
  if (carrinho[idx].qty <= 0) carrinho.splice(idx, 1);
  salvarCarrinho();
  renderCarrinho();
}

function editarItem(id) {
  const item = carrinho.find(i => i.id === id);
  if (!item) return;
  produtoAtual = { nome: item.nome, preco: item.preco, emoji: item.emoji };
  qtyAtual = item.qty;
  // Remove o item antigo para re-adicionar
  carrinho = carrinho.filter(i => i.id !== id);
  salvarCarrinho();
  document.getElementById('prodNome').textContent   = item.nome;
  document.getElementById('prodPreco').textContent  = fmtNum(item.preco);
  document.getElementById('prodObs').value          = item.obs || '';
  document.getElementById('prodQty').textContent    = qtyAtual;
  document.getElementById('prodImg').innerHTML      = '<span style="font-size:5rem">' + item.emoji + '</span>';
  atualizarProdTotal();
  irPara('page-produto');
}

function limparCarrinho() {
  if (!confirm('Limpar o carrinho?')) return;
  carrinho = [];
  salvarCarrinho();
  renderCarrinho();
}

function salvarCarrinho() {
  localStorage.setItem('pda_carrinho', JSON.stringify(carrinho));
  atualizarFab();
}

/* ============================================
   ENTREGA
   ============================================ */
function selecionarEntrega(tipo) {
  pedido.tipoEntrega = tipo;
  if (tipo === 'entrega') {
    irPara('page-endereco');
  } else {
    // Retirada / local — sem endereço
    pedido.endereco = {};
    document.getElementById('pgto-back-btn').onclick = () => irPara('page-entrega');
    irPara('page-pagamento-tipo');
  }
}

/* ============================================
   ENDEREÇO
   ============================================ */
function confirmarEndereco() {
  const log  = document.getElementById('logradouro').value.trim();
  const num  = document.getElementById('numero').value.trim();
  const bai  = document.getElementById('bairro').value.trim();
  const cid  = document.getElementById('cidade').value.trim();
  const uf   = document.getElementById('uf').value.trim();
  if (!log || !num || !bai || !cid || !uf) {
    alert('Preencha os campos obrigatórios.');
    return;
  }
  pedido.endereco = {
    logradouro : log,
    numero     : num,
    complemento: document.getElementById('complemento').value.trim(),
    bairro     : bai,
    cidade     : cid,
    uf         : uf.toUpperCase(),
    referencia : document.getElementById('referencia').value.trim(),
    cep        : document.getElementById('cep').value.trim()
  };
  document.getElementById('pgto-back-btn').onclick = () => irPara('page-endereco');
  irPara('page-pagamento-tipo');
}

async function buscarCEP() {
  const cep = document.getElementById('cep').value.replace(/\D/g, '');
  if (cep.length !== 8) return;
  try {
    const res  = await fetch('https://viacep.com.br/ws/' + cep + '/json/');
    const data = await res.json();
    if (data.erro) return;
    document.getElementById('logradouro').value = data.logradouro || '';
    document.getElementById('bairro').value     = data.bairro || '';
    document.getElementById('cidade').value     = data.localidade || '';
    document.getElementById('uf').value         = data.uf || '';
  } catch {}
}

/* ============================================
   PAGAMENTO
   ============================================ */
function voltarDePagamento() {
  if (pedido.tipoEntrega === 'entrega') irPara('page-endereco');
  else irPara('page-entrega');
}

function selecionarPagamento(metodo) {
  pedido.pagamento = metodo;
  pedido.troco = null;
  if (metodo === 'dinheiro') {
    const total = calcTotal();
    document.getElementById('trocoValorPedido').textContent = 'Valor do pedido: ' + fmtMoeda(total);
    document.getElementById('trocoInput').value = '';
    document.getElementById('modalTroco').classList.add('open');
  } else {
    irPara('page-dados');
  }
}

function confirmarTroco() {
  const val = parseFloat(document.getElementById('trocoInput').value) || 0;
  pedido.troco = val > 0 ? val : null;
  fecharModal();
  irPara('page-dados');
}

function fecharModal() {
  document.getElementById('modalTroco').classList.remove('open');
}

/* ============================================
   DADOS DO CLIENTE
   ============================================ */
function confirmarDados() {
  const nome = document.getElementById('clienteNome').value.trim();
  const tel  = document.getElementById('clienteTel').value.trim();
  if (!nome || !tel) {
    alert('Preencha seu nome e telefone.');
    return;
  }
  pedido.cliente = {
    nome  : nome,
    tel   : tel,
    email : document.getElementById('clienteEmail').value.trim(),
    cpf   : document.getElementById('clienteCPF').value.trim()
  };
  renderRevisar();
  irPara('page-revisar');
}

/* ============================================
   REVISAR
   ============================================ */
function renderRevisar() {
  const c = pedido.cliente;
  document.getElementById('rev-cliente').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:4px 0 8px">
      <i class="fas fa-user-circle" style="font-size:1.5rem;color:var(--muted)"></i>
      <div>
        <div style="font-weight:700">${c.nome}</div>
        ${c.email ? '<div style="font-size:.8rem;color:var(--muted)">' + c.email + '</div>' : ''}
        <div style="font-size:.8rem;color:var(--muted)">+55 ${c.tel}</div>
      </div>
    </div>`;

  const tipoLabel = { entrega:'Entrega', retirada:'Retirada', local:'Consumo no local' };
  const tipoIcon  = { entrega:'fas fa-motorcycle', retirada:'fas fa-store', local:'fas fa-utensils' };
  let endHtml = '';
  if (pedido.tipoEntrega === 'entrega' && pedido.endereco.logradouro) {
    const e = pedido.endereco;
    endHtml = `<p class="review-info"><i class="fas fa-map-marker-alt" style="color:var(--red);margin-right:4px"></i>${e.logradouro}, ${e.numero}${e.complemento ? ', ' + e.complemento : ''}<br>${e.bairro}, ${e.cidade} &ndash; ${e.uf}</p>`;
  }
  document.getElementById('rev-entrega').innerHTML = `
    <div class="review-section-header">
      <h3><i class="${tipoIcon[pedido.tipoEntrega]}"></i> ${tipoLabel[pedido.tipoEntrega]}</h3>
      <button class="alterar" onclick="irPara('page-entrega')">Alterar</button>
    </div>
    ${endHtml}
    <div class="review-edit-icon"><i class="fas fa-pen"></i></div>`;

  const pgLabel = { cartao:'Cartão de crédito/débito', pix:'PIX', dinheiro:'Pagamento em dinheiro' };
  const pgIcon  = { cartao:'fas fa-credit-card', pix:'fas fa-qrcode', dinheiro:'fas fa-money-bill-wave' };
  let trocoHtml = '';
  if (pedido.pagamento === 'dinheiro' && pedido.troco) {
    trocoHtml = `<div style="font-size:.82rem;color:var(--muted);margin-top:4px">Troco para R$ ${fmtNum(pedido.troco)}</div>
    <button onclick="reabrirTroco()" style="color:var(--red);font-size:.8rem;font-weight:700;margin-top:4px">Alterar o valor</button>`;
  }
  document.getElementById('rev-pagamento').innerHTML = `
    <div class="review-section-header">
      <h3><i class="fas fa-dollar-sign"></i> Pagar na entrega</h3>
      <button class="alterar" onclick="irPara('page-pagamento-metodo')">Alterar</button>
    </div>
    <p class="review-info"><i class="${pgIcon[pedido.pagamento]}" style="color:var(--red);margin-right:4px"></i><strong>${pgLabel[pedido.pagamento]}</strong></p>
    ${trocoHtml}
    <div class="review-edit-icon"><i class="fas fa-pen"></i></div>`;

  renderTotaisRevisar();
}

function renderTotaisRevisar() {
  const sub   = calcSubtotal();
  const taxa  = pedido.tipoEntrega === 'entrega' ? TAXA_ENTREGA : 0;
  const desc  = pedido.desconto || 0;
  const total = Math.max(0, sub + taxa - desc);
  let html = `
    <div class="total-row"><span>Subtotal</span><span>R$ ${fmtNum(sub)}</span></div>`;
  if (taxa > 0) html += `<div class="total-row"><span>Taxa de entrega</span><span class="add">+ R$ ${fmtNum(taxa)}</span></div>`;
  if (desc > 0) html += `<div class="total-row" style="color:#22c55e"><span>Desconto</span><span>- R$ ${fmtNum(desc)}</span></div>`;
  html += `<div class="total-row final"><span>Total</span><span>R$ ${fmtNum(total)}</span></div>`;
  document.getElementById('rev-totais').innerHTML = html;
}

function toggleCupom() {
  const box = document.getElementById('cupomBox');
  const chev = document.getElementById('cupomChevron');
  const open = box.style.display === 'none';
  box.style.display = open ? 'block' : 'none';
  chev.className = open ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}

function aplicarCupom() {
  const cod = document.getElementById('cupomInput').value.trim().toUpperCase();
  const cupons = { 'ALDEIA10': 10, 'PROMO5': 5 };
  if (cupons[cod]) {
    pedido.desconto = cupons[cod];
    renderTotaisRevisar();
    mostrarToast('Cupom aplicado! -R$ ' + fmtNum(cupons[cod]));
  } else {
    alert('Cupom inválido.');
  }
}

function reabrirTroco() {
  const total = calcTotal();
  document.getElementById('trocoValorPedido').textContent = 'Valor do pedido: ' + fmtMoeda(total);
  document.getElementById('trocoInput').value = pedido.troco || '';
  document.getElementById('modalTroco').classList.add('open');
}

/* ============================================
   FAZER PEDIDO
   ============================================ */
function fazerPedido() {
  pedidoNum++;
  localStorage.setItem('pda_pedido_num', pedidoNum);

  const msgWa = gerarMensagemWA();
  renderConfirmacao();
  irPara('page-confirmacao');

  // Armazena mensagem para o botão
  window._msgWA = msgWa;
}

function gerarMensagemWA() {
  const n    = pedidoNum;
  const c    = pedido.cliente;
  const sub  = calcSubtotal();
  const taxa = pedido.tipoEntrega === 'entrega' ? TAXA_ENTREGA : 0;
  const desc = pedido.desconto || 0;
  const total= Math.max(0, sub + taxa - desc);

  const tipoLabel = { entrega:'Entrega', retirada:'Retirada', local:'Consumo no local' };
  const pgLabel   = { cartao:'Cartão de crédito/débito', pix:'PIX', dinheiro:'Dinheiro' };

  let msg = `*🛒 Pedido nº ${n}*\n\n`;
  msg += `👤 Cliente: *${c.nome}*\n`;
  if (c.cpf)   msg += `📄 CPF: ${c.cpf}\n`;
  if (c.tel)   msg += `📞 Tel: ${c.tel}\n`;

  msg += `📍 *${tipoLabel[pedido.tipoEntrega]}*\n`;
  if (pedido.tipoEntrega === 'entrega' && pedido.endereco.logradouro) {
    const e = pedido.endereco;
    msg += `${e.logradouro}, ${e.numero}`;
    if (e.complemento) msg += `, ${e.complemento}`;
    msg += `\n${e.bairro}, ${e.cidade}`;
    if (e.referencia) msg += `\n📌 Ref: ${e.referencia}`;
    msg += '\n';
  }

  msg += `━━━━━━━━━━━━━━━\n`;
  carrinho.forEach(item => {
    msg += `➡️ ${item.qty}x *${item.nome}*\n`;
    if (item.obs) msg += `   Obs: ${item.obs}\n`;
    msg += `   ${fmtMoeda(item.preco * item.qty)}\n\n`;
  });
  msg += `━━━━━━━━━━━━━━━\n`;

  const pgStr = pedido.pagamento === 'dinheiro' && pedido.troco
    ? `Dinheiro (troco para: R$ ${fmtNum(pedido.troco)})`
    : pgLabel[pedido.pagamento];
  msg += `💵 ${pgStr}\n\n`;

  msg += `Subtotal: *${fmtMoeda(sub)}*\n`;
  if (taxa > 0) msg += `Entrega: *${fmtMoeda(taxa)}*\n`;
  if (desc > 0) msg += `Desconto: *-${fmtMoeda(desc)}*\n`;
  msg += `\n💵 *TOTAL: ${fmtMoeda(total)}*`;

  return msg;
}

function renderConfirmacao() {
  const n    = pedidoNum;
  const sub  = calcSubtotal();
  const taxa = pedido.tipoEntrega === 'entrega' ? TAXA_ENTREGA : 0;
  const desc = pedido.desconto || 0;
  const total= Math.max(0, sub + taxa - desc);
  const now  = new Date();
  const dataStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  const pgLabel = { cartao:'Cartão de crédito/débito', pix:'PIX', dinheiro:'Pagamento em dinheiro' };

  let html = `
    <div class="confirm-header">
      <h2>Pedido ${n}</h2>
      <span class="confirm-badge">Aguardando aprovação</span>
    </div>
    <div class="confirm-date">${dataStr}</div>

    <button class="btn-wa-full" onclick="enviarWhatsApp()">
      <i class="fab fa-whatsapp"></i> Enviar pedido no WhatsApp
    </button>

    <div class="confirm-items">
      ${carrinho.map(i => `
        <div class="confirm-item">
          <span class="name">${i.qty}x ${i.nome}${i.obs ? ' <span style="color:var(--muted);font-size:.78rem">('+i.obs+')</span>' : ''}</span>
          <span class="val">${fmtMoeda(i.preco * i.qty)}</span>
        </div>`).join('')}
    </div>

    <div class="confirm-totals">
      <div class="confirm-total-row"><span>Subtotal</span><span>${fmtMoeda(sub)}</span></div>
      ${taxa > 0 ? '<div class="confirm-total-row"><span>Entrega</span><span class="add">+ ' + fmtMoeda(taxa) + '</span></div>' : ''}
      ${desc > 0 ? '<div class="confirm-total-row" style="color:#22c55e"><span>Desconto</span><span>- ' + fmtMoeda(desc) + '</span></div>' : ''}
      <div class="confirm-total-row"><span>TOTAL</span><span>${fmtMoeda(total)}</span></div>
    </div>

    <div class="confirm-info-block">
      <h4>Pagamento na entrega</h4>
      <p><strong>${pgLabel[pedido.pagamento]}</strong>
      ${pedido.pagamento === 'dinheiro' && pedido.troco ? '<br>Troco para R$ ' + fmtNum(pedido.troco) : ''}</p>
    </div>`;

  if (pedido.tipoEntrega === 'entrega' && pedido.endereco.logradouro) {
    const e = pedido.endereco;
    html += `<div class="confirm-info-block">
      <h4>Endereço de entrega</h4>
      <p>${e.logradouro}, ${e.numero}${e.complemento ? ', ' + e.complemento : ''}<br>
      <strong>${e.bairro}, ${e.cidade} &ndash; ${e.uf}</strong></p>
    </div>`;
  }

  document.getElementById('confirmBody').innerHTML = html;

  // Toast "Pedido enviado!"
  setTimeout(() => mostrarToast('✅ Pedido enviado!'), 600);

  // Limpar carrinho após confirmar
  carrinho = [];
  salvarCarrinho();
}

function enviarWhatsApp() {
  const msg = window._msgWA || gerarMensagemWA();
  const url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');
}

/* ============================================
   UTILITÁRIOS
   ============================================ */
function calcSubtotal() {
  return carrinho.reduce((s, i) => s + i.preco * i.qty, 0);
}
function calcTotal() {
  const taxa = pedido.tipoEntrega === 'entrega' ? TAXA_ENTREGA : 0;
  return Math.max(0, calcSubtotal() + taxa - (pedido.desconto || 0));
}
function fmtNum(v)   { return (parseFloat(v) || 0).toFixed(2).replace('.', ','); }
function fmtMoeda(v) { return 'R$ ' + fmtNum(v); }

function atualizarBottomBars() {
  const sub = calcSubtotal();
  const taxa = pedido.tipoEntrega === 'entrega' ? TAXA_ENTREGA : 0;
  const ids = ['cart-subtotal','entrega-subtotal','pgto-subtotal','metodo-subtotal'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = fmtMoeda(sub); });
  const taxaEls = ['pgto-taxa','metodo-taxa'];
  taxaEls.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '+ ' + fmtMoeda(taxa); });
}

function atualizarFab() {
  const fab = document.getElementById('cartFab');
  if (!fab) return;
  const total = carrinho.reduce((s, i) => s + i.qty, 0);
  const badge = fab.querySelector('.badge');
  if (badge) badge.textContent = total;
  fab.classList.toggle('hidden', total === 0);
}

function mostrarToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast-success';
  t.innerHTML = '<i class="fas fa-check-circle"></i> ' + msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* Máscaras */
function mascaraCEP(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 8);
  if (v.length > 5) v = v.substring(0, 5) + '-' + v.substring(5);
  el.value = v;
}
function mascaraTel(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 11);
  if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  el.value = v;
}
function mascaraCPF(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 11);
  v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  el.value = v;
}

/* ============================================
   INIT — verifica se veio da loja com produto
   ============================================ */
(function init() {
  // Verifica params na URL
  const params = new URLSearchParams(window.location.search);
  const nome  = params.get('nome');
  const preco = params.get('preco');
  const emoji = params.get('emoji');

  if (nome && preco) {
    abrirProduto(decodeURIComponent(nome), parseFloat(preco), decodeURIComponent(emoji || '🍽'));
  } else if (carrinho.length > 0) {
    renderCarrinho();
    irPara('page-carrinho');
  } else {
    renderCarrinho();
    irPara('page-carrinho');
  }

  atualizarBottomBars();
})();
