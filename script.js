/* =============================================
   POINT DA ALDEIA – script.js
   ============================================= */

/* ---- Status aberto / fechado ---- */
function isOpen() {
  const now  = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= 660 && mins < 1200; // 11:00 – 20:00
}

function applyStatus() {
  const badge = document.getElementById('statusBadge');
  if (!badge) return;
  if (isOpen()) {
    badge.className = 'status-pill open';
    badge.innerHTML = '<i class="fas fa-circle" style="font-size:.45rem"></i> Aberto agora';
  } else {
    badge.className = 'status-pill closed';
    badge.innerHTML = '<i class="fas fa-circle" style="font-size:.45rem"></i> Fechado';
  }
}

function applyLojaStatus() {
  const el = document.getElementById('lojaStatus');
  if (!el) return;
  if (isOpen()) {
    el.className = 'status-badge open';
    el.innerHTML = '<i class="fas fa-clock"></i> Aberto agora';
  } else {
    el.className = 'status-badge closed';
    el.innerHTML = '<i class="fas fa-clock"></i> Fechado agora';
  }
}

function highlightToday() {
  const today = new Date().getDay();
  document.querySelectorAll('#horTable tr[data-dia]').forEach(r => {
    if (parseInt(r.dataset.dia) === today) r.classList.add('hoje');
  });
}

applyStatus();
applyLojaStatus();
highlightToday();
setInterval(() => { applyStatus(); applyLojaStatus(); }, 60000);

/* ---- Sincroniza ícones das categorias do admin ---- */
function sincronizarCategorias() {
  const cats = (() => {
    try { return JSON.parse(localStorage.getItem('categorias')) || []; } catch { return []; }
  })();
  if (!cats.length) return;

  // Mapa: id numérico → dados da categoria
  const catMap = {
    1: 'porcoes',
    2: 'bebidas',
    3: 'caipirinhas',
    4: 'batidas',
    5: 'doses'
  };

  cats.forEach(cat => {
    const slug = catMap[cat.id];
    if (!slug) return;
    // Atualiza o botão da aba
    const btn = document.querySelector(`.cat-btn[data-cat="${slug}"]`);
    if (btn) {
      // Preserva o texto mas troca o ícone (primeiro filho de texto)
      btn.innerHTML = `${cat.icone} ${cat.nome}`;
    }
    // Atualiza o título da seção
    const sec = document.getElementById('sec-' + slug);
    if (sec) {
      const title = sec.querySelector('.cat-section-title');
      if (title) {
        // Guarda o ícone fa existente para não perder o estilo
        const faIcon = title.querySelector('i');
        if (faIcon) {
          title.innerHTML = `${cat.icone} ${cat.nome}`;
        }
      }
    }
  });
}

sincronizarCategorias();

/* ---- Abas de categoria — mostra só a ativa ---- */
const catBtns = document.querySelectorAll('.cat-btn');
const catSecs = document.querySelectorAll('.cat-section');

function mostrarCategoria(cat) {
  catSecs.forEach(sec => {
    sec.style.display = sec.id === 'sec-' + cat ? 'block' : 'none';
  });
  catBtns.forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
}

if (catBtns.length > 0) {
  mostrarCategoria(catBtns[0].dataset.cat);
}

catBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    mostrarCategoria(btn.dataset.cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

/* ---- Busca ---- */
const searchInput = document.getElementById('searchInput');

if (searchInput) {
  let timer;
  searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const q = searchInput.value.toLowerCase().trim();
      let anyVisible = false;

      if (q) {
        // Busca ativa: mostra todas as seções
        catSecs.forEach(sec => sec.style.display = 'block');
        catBtns.forEach(b => b.classList.remove('active'));
      } else {
        // Sem busca: volta para a primeira aba
        mostrarCategoria(catBtns[0]?.dataset.cat);
      }

      document.querySelectorAll('.product-card').forEach(card => {
        const name = (card.dataset.name || '').toLowerCase();
        const show = !q || name.includes(q);
        card.classList.toggle('hidden', !show);
        if (show) anyVisible = true;
      });

      if (q) {
        catSecs.forEach(sec => {
          const hasVisible = [...sec.querySelectorAll('.product-card')]
            .some(c => !c.classList.contains('hidden'));
          sec.style.display = hasVisible ? 'block' : 'none';
        });
      }

      let emptyEl = document.getElementById('emptyState');
      if (!anyVisible) {
        if (!emptyEl) {
          emptyEl = document.createElement('div');
          emptyEl.id        = 'emptyState';
          emptyEl.className = 'empty-state';
          emptyEl.innerHTML = '<i class="fas fa-search"></i><p>Nenhum produto encontrado para "<strong>' + q + '</strong>"</p>';
          document.getElementById('productsArea')?.prepend(emptyEl);
        }
      } else {
        emptyEl?.remove();
      }
    }, 300);
  });
}

/* ---- Modal de produto ---- */
function abrirModal(card) {
  const nome  = card.querySelector('h3')?.textContent || '';
  const desc  = card.querySelector('.card-desc')?.textContent || '';
  const price = card.querySelector('.card-price')?.textContent || '';
  const cat   = card.querySelector('.card-cat')?.textContent || '';
  const icon  = card.querySelector('.card-img i')?.className || '';
  const href  = card.querySelector('.btn-pedir')?.href || '#';

  document.getElementById('modalNome').textContent  = nome;
  document.getElementById('modalDesc').textContent  = desc;
  document.getElementById('modalPrice').textContent = price;
  document.getElementById('modalCat').textContent   = cat;
  document.getElementById('modalWaBtn').href        = href;

  const imgEl = document.getElementById('modalImg');
  imgEl.style.position = 'relative';
  imgEl.innerHTML =
    '<div style="position:absolute;inset:0;background:radial-gradient(ellipse,rgba(232,86,10,.18),transparent 70%)"></div>'
    + '<i class="' + icon + '" style="position:relative;color:var(--primary);font-size:3.5rem"></i>';

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  document.getElementById('modalOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });

/* ---- Compartilhar ---- */
function compartilhar() {
  if (navigator.share) {
    navigator.share({
      title: 'Point da Aldeia – Porções e Refeições',
      text:  'Confira o cardápio do Point da Aldeia!',
      url:   window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast('Link copiado!', 'success'));
  }
}

/* ---- Toast ---- */
function toast(msg, tipo = 'success') {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className   = 'toast ' + tipo;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2800);
}

/* ---- Scroll reveal ---- */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity   = '1';
      e.target.style.transform = 'translateY(0)';
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.product-card').forEach(card => {
  card.style.opacity    = '0';
  card.style.transform  = 'translateY(20px)';
  card.style.transition = 'opacity .4s ease, transform .4s ease';
  revealObs.observe(card);
});
