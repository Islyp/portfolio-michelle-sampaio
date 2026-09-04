/* ==========================================================================
   main.js — comportamento base do portfólio
   ========================================================================== */
(function () {
  'use strict';

  /* ── menu mobile ─────────────────────────────────────────────────────── */
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  if (toggle && nav) {
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      nav.classList.toggle('is-open', open);
      backdrop.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    backdrop.addEventListener('click', () => setOpen(false));

    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    // fecha ao voltar para desktop
    const mq = window.matchMedia('(min-width: 941px)');
    mq.addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  /* ── header com borda ao rolar ───────────────────────────────────────── */
  const header = document.querySelector('.site-header');

  if (header) {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
    document.body.prepend(sentinel);

    new IntersectionObserver(
      ([entry]) => header.classList.toggle('is-stuck', !entry.isIntersecting),
      { threshold: 0 }
    ).observe(sentinel);
  }

  /* ── carrossel com giro contínuo ───────────────────────────────────────
     O movimento é feito por transform, não por scrollLeft. A rolagem nativa
     é renderizada em pixels inteiros: a 16px/s a posição só mudava de 1 em 1
     pixel umas 15 vezes por segundo, o que parecia travamento. transform vai
     para o compositor e aceita subpixel, então o giro fica contínuo. */
  document.querySelectorAll('[data-carousel-prev]').forEach((prev) => {
    const track = document.getElementById(prev.getAttribute('aria-controls'));
    if (!track) return;

    const viewport = track.parentElement;
    const next = document.querySelector(
      `[data-carousel-next][aria-controls="${track.id}"]`
    );

    const SPEED = 26;              // px por segundo — um giro discreto
    const originals = Array.from(track.children);
    if (!originals.length) return;

    /* Clona a lista uma vez. Como o conteúdo se repete, ao chegar no fim do
       primeiro conjunto dá para voltar ao começo em silêncio: o que está na
       tela é idêntico, então o salto é invisível. */
    const clones = originals.map((li) => {
      const c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a, button, [tabindex]').forEach((el) => { el.tabIndex = -1; });
      track.appendChild(c);
      return c;
    });

    let loopWidth = 0;
    // getBoundingClientRect (e não offsetLeft) porque o valor é fracionário:
    // com offsetLeft arredondado o salto erraria ~1px e o desvio acumularia
    const measure = () => {
      loopWidth = clones[0].getBoundingClientRect().left
                - originals[0].getBoundingClientRect().left;
    };

    let pos = 0;        // deslocamento atual, com casas decimais
    /* Distância que ainda falta percorrer por causa das setas — relativa,
       não um destino absoluto. Como `pos` é normalizado dentro da volta a
       cada quadro, um alvo absoluto além de loopWidth ficaria inalcançável:
       a distância restante nunca zerava e o carrossel disparava em voltas
       sem parar (simulado: 1 clique andava 57.210px em vez de 195). */
    let pending = 0;

    const norm = (v) => {
      if (loopWidth <= 0) return v;
      return ((v % loopWidth) + loopWidth) % loopWidth;
    };

    const draw = () => {
      track.style.transform = `translate3d(${-pos}px, 0, 0)`;
    };

    /* ── setas ── */
    const step = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return originals[0].getBoundingClientRect().width + gap;
    };

    const nudge = (dir) => { pending += dir * step(); };

    prev.addEventListener('click', () => nudge(-1));
    if (next) next.addEventListener('click', () => nudge(1));

    /* ── arraste ── */
    let dragging = false;
    let dragX = 0;
    let dragPos = 0;

    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();   // impede seleção de texto e arraste de imagem
      dragging = true;
      pending = 0;
      dragX = e.clientX;
      dragPos = pos;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      pos = norm(dragPos - (e.clientX - dragX));
      draw();
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      if (e && e.pointerId != null && viewport.hasPointerCapture(e.pointerId)) {
        viewport.releasePointerCapture(e.pointerId);
      }
    };

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    /* ── teclado: o trilho não é mais um contêiner rolável ── */
    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { nudge(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { nudge(-1); e.preventDefault(); }
    });

    /* ── pausas ── */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let hovering = false;
    let onScreen = true;

    viewport.addEventListener('pointerenter', () => { hovering = true; });
    viewport.addEventListener('pointerleave', () => { hovering = false; });
    viewport.addEventListener('focusin', () => { hovering = true; });
    viewport.addEventListener('focusout', () => { hovering = false; });
    viewport.addEventListener('touchstart', () => { hovering = true; }, { passive: true });
    viewport.addEventListener('touchend', () => {
      setTimeout(() => { hovering = false; }, 2000);
    }, { passive: true });

    new IntersectionObserver(
      ([e]) => { onScreen = e.isIntersecting; },
      { threshold: 0 }
    ).observe(viewport);

    /* ── laço de animação ── */
    let last = 0;

    const tick = (t) => {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      requestAnimationFrame(tick);

      if (dragging) return;

      if (pending !== 0) {
        // consome a distância pendente da seta com desaceleração
        let move = Math.abs(pending) < 0.5 ? pending : pending * Math.min(1, dt * 9);
        pos += move;
        pending -= move;
        if (Math.abs(pending) < 0.5) pending = 0;
      } else if (onScreen && !hovering && !reduced.matches) {
        pos += SPEED * dt;
      } else {
        return;   // parado: nada a redesenhar
      }

      pos = norm(pos);
      draw();
    };

    // as imagens são lazy: a largura do laço só é final depois que carregam
    measure();
    window.addEventListener('resize', measure);
    track.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', measure, { once: true });
    });

    requestAnimationFrame(tick);
  });

  /* ── embeds do Instagram ─────────────────────────────────────────────── */
  /* O iframe do Instagram é cross-origin: não dá para ler a altura do
     conteúdo de dentro dele. Calcular por fórmula erra o rodapé, porque
     cabeçalho e barra de ações não escalam com a largura. O embed.js oficial
     resolve isso — o iframe manda a altura exata por postMessage e o script
     redimensiona. Carregamos só quando a seção se aproxima da tela, para não
     pesar o carregamento inicial da página. */
  document.querySelectorAll('[data-ig-embeds]').forEach((section) => {
    let requested = false;

    const load = () => {
      if (requested) return;
      requested = true;

      if (window.instgrm) {
        window.instgrm.Embeds.process();
        return;
      }

      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.instagram.com/embed.js';
      document.body.appendChild(s);
    };

    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      load();
    }, { rootMargin: '600px 0px' });

    io.observe(section);
  });

  /* ── ano do rodapé ───────────────────────────────────────────────────── */
  // já vem preenchido no HTML, então funciona sem JS; isto só evita que
  // o ano fique defasado quando o site passar a virada de ano
  const ano = document.getElementById('anoAtual');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ── reveal on scroll ────────────────────────────────────────────────── */
  const revealables = document.querySelectorAll('.reveal');

  if (revealables.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    revealables.forEach((el) => io.observe(el));
  }
})();
