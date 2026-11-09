// Mobile menu, theme toggle, term tooltips, photo gallery and the services route animation. The page works without this file.
(function () {
  var root = document.documentElement;
  var L = root.lang === 'nl'
    ? { toDark: 'Donkere weergave', toLight: 'Lichte weergave', menu: 'Menu', close: 'Sluiten' }
    : { toDark: 'Dark mode', toLight: 'Light mode', menu: 'Menu', close: 'Close' };

  // Theme: follows the system until the visitor picks one; the choice is remembered.
  function isDark() {
    var t = root.dataset.theme;
    if (t) return t === 'dark';
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function syncThemeButtons() {
    var dark = isDark();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      var l = b.querySelector('[data-theme-label]');
      if (l) { l.textContent = dark ? L.toLight : L.toDark; b.removeAttribute('aria-label'); }
      else b.setAttribute('aria-label', dark ? L.toLight : L.toDark);
    });
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('gdmj-theme', next); } catch (e) {}
      syncThemeButtons();
    });
  });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeButtons);
  syncThemeButtons();

  // Mobile menu
  var header = document.querySelector('.g-header');
  var btn = document.querySelector('[data-menu]');
  var panel = document.getElementById('g-header-panel');
  function setOpen(open) {
    header.classList.toggle('g-header--open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('[data-menu-label]').textContent = open ? L.close : L.menu;
    panel.hidden = !open;
  }
  if (btn && panel) {
    btn.addEventListener('click', function () { setOpen(panel.hidden); });
    panel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); } });
  }

  // IT terms: keep the explanation on screen (shift sideways, flip above when there's no room
  // below), open on tap for touch screens, close with Escape or a tap elsewhere.
  var terms = Array.prototype.slice.call(document.querySelectorAll('.s-term'));
  function place(t) {
    var tip = t.querySelector('.s-term__tip');
    t.style.setProperty('--term-shift', '0px');
    t.classList.remove('s-term--up');
    var r = tip.getBoundingClientRect(), m = 16, shift = 0;
    if (r.left < m) shift = m - r.left;
    else if (r.right > innerWidth - m) shift = innerWidth - m - r.right;
    t.style.setProperty('--term-shift', shift + 'px');
    if (r.bottom > innerHeight - m && t.getBoundingClientRect().top > r.height + 24) t.classList.add('s-term--up');
  }
  function closeAll(except) { terms.forEach(function (t) { if (t !== except) t.classList.remove('is-open'); }); }
  terms.forEach(function (t) {
    var b = t.querySelector('.s-term__btn');
    t.addEventListener('mouseenter', function () { place(t); });
    b.addEventListener('focus', function () { place(t); });
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !t.classList.contains('is-open');
      closeAll(t);
      t.classList.toggle('is-open', open);
      if (open) place(t);
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.s-term')) closeAll(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('.s-term.is-open, .s-term:focus-within');
    closeAll();
    if (open && document.activeElement && open.contains(document.activeElement)) document.activeElement.blur();
  });

  // Photo gallery: prev/next buttons and a counter on top of a native swipeable strip.
  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var track = g.querySelector('.s-gallery__track');
    var slides = track.children;
    var nav = g.querySelector('.s-gallery__nav');
    var prev = g.querySelector('[data-gallery-prev]');
    var next = g.querySelector('[data-gallery-next]');
    var out = g.querySelector('[data-gallery-index]');
    var smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function index() { return Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); }
    function update() {
      var i = index();
      out.textContent = i + 1;
      prev.disabled = i <= 0;
      next.disabled = i >= slides.length - 1;
    }
    function go(step) {
      var i = Math.min(slides.length - 1, Math.max(0, index() + step));
      track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    }
    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });
    var t;
    track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(update, 60); }, { passive: true });
    window.addEventListener('resize', update);
    nav.hidden = false;
    g.classList.add('is-ready');
    update();
  });

  // Services route: draw the clay line once when it scrolls into view.
  var route = document.querySelector('[data-route]');
  if (route && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    route.classList.add('g-route--animate');
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { route.classList.add('is-visible'); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(route);
  }
})();
