/* =============================================
   POINT DA ALDEIA – protecao.js
   Proteções do lado do cliente
   ============================================= */

(function () {
  'use strict';

  /* ── 1. Bloquear botão direito ── */
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  /* ── 2. Bloquear atalhos de DevTools e cópia ── */
  document.addEventListener('keydown', function (e) {
    const key = e.key ? e.key.toUpperCase() : '';
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;

    // F12
    if (e.keyCode === 123) { e.preventDefault(); return false; }

    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
    if (ctrl && shift && (key === 'I' || key === 'J' || key === 'C' || key === 'K')) {
      e.preventDefault(); return false;
    }

    // Ctrl+U (ver código fonte)
    if (ctrl && key === 'U') { e.preventDefault(); return false; }

    // Ctrl+S (salvar página)
    if (ctrl && key === 'S') { e.preventDefault(); return false; }

    // Ctrl+P (imprimir/salvar PDF)
    if (ctrl && key === 'P') { e.preventDefault(); return false; }
  });

  /* ── 3. Bloquear seleção de texto em áreas protegidas ── */
  document.addEventListener('selectstart', function (e) {
    // Permite seleção em inputs e textareas
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    return false;
  });

  /* ── 4. Bloquear arrastar imagens ── */
  document.addEventListener('dragstart', function (e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });

  /* ── 5. Detectar DevTools aberto (por tamanho de janela) ── */
  var devToolsAberto = false;
  var threshold = 160;

  function checkDevTools() {
    var widthDiff  = window.outerWidth  - window.innerWidth;
    var heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > threshold || heightDiff > threshold) {
      if (!devToolsAberto) {
        devToolsAberto = true;
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0d0d0d;color:#e8560a;font-family:Inter,sans-serif;flex-direction:column;gap:16px">'
          + '<div style="font-size:3rem">🔒</div>'
          + '<div style="font-size:1.2rem;font-weight:800">Acesso Restrito</div>'
          + '<div style="font-size:.9rem;color:#888">Feche as ferramentas do desenvolvedor para continuar.</div>'
          + '</div>';
      }
    } else {
      devToolsAberto = false;
    }
  }

  setInterval(checkDevTools, 1000);

  /* ── 6. Proteção contra cópia de texto via clipboard ── */
  document.addEventListener('copy', function (e) {
    // Permite copiar apenas de inputs
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', '© Point da Aldeia - Conteúdo protegido');
    }
    return false;
  });

  /* ── 7. Bloquear Print Screen (limitado, JS não tem acesso total) ── */
  window.addEventListener('keyup', function (e) {
    if (e.key === 'PrintScreen') {
      navigator.clipboard?.writeText('');
    }
  });

  /* ── 8. Proteção contra injeção de iframes ── */
  if (window.self !== window.top) {
    window.top.location = window.self.location;
  }

  /* ── 9. Desabilitar modo de leitura e salvar como no Firefox/Chrome ── */
  var meta = document.createElement('meta');
  meta.name    = 'robots';
  meta.content = 'noarchive, nosnippet';
  document.head.appendChild(meta);

  /* ── 10. Anti-hotlinking: verifica o referrer ── */
  // (Implementado via netlify.toml no servidor)

})();
