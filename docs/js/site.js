// Mobile menu, theme toggle and the services route animation. The page works without this file.
(function () {
  var root = document.documentElement;

  // Theme: follows the system until the visitor picks one; the choice is remembered.
  function isDark() {
    var t = root.dataset.theme;
    if (t) return t === 'dark';
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function syncThemeButtons() {
    var dark = isDark();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      var l = b.querySelector('[data-theme-label]');
      if (l) l.textContent = dark ? 'Light mode' : 'Dark mode';
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
    btn.querySelector('[data-menu-label]').textContent = open ? 'Close' : 'Menu';
    panel.hidden = !open;
  }
  if (btn && panel) {
    btn.addEventListener('click', function () { setOpen(panel.hidden); });
    panel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); } });
  }

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
