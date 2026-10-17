(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js-enabled');
  const themeToggle = document.getElementById('theme-toggle');
  const mobileButton = document.getElementById('mobile-menu-button');
  const mobileNav = document.getElementById('mobile-nav');
  const header = document.querySelector('.site-header');
  const progress = document.getElementById('scroll-progress');
  const dialog = document.getElementById('download-dialog');
  const dialogClose = document.getElementById('dialog-close');
  const dialogDone = document.getElementById('dialog-done');
  const previewImage = document.getElementById('preview-image');
  const previewDemo = document.getElementById('preview-panel');
  const previewTabs = [...document.querySelectorAll('[data-preview]')];

  const previewContent = {
    home: { image:'assets/home.webp', title:'Главная', caption:'Чистое пространство для твоего старта.', url:'mono://home', alt:'Главный экран браузера Mono' },
    workspace: { image:'assets/workspace.webp', title:'Workspaces', caption:'Инструменты и развлечения в одном разделе.', url:'mono://workspaces', alt:'Workspaces браузера Mono' },
    notes: { image:'assets/notes.webp', title:'Notes', caption:'Документы, заметки и идеи без лишних окон.', url:'mono://notes', alt:'Текстовый редактор Mono Notes' },
    messenger: { image:'assets/messenger.webp', title:'Messenger', caption:'Общение прямо в браузере.', url:'mono://messenger', alt:'Встроенный мессенджер Mono' },
    performance: { image:'assets/performance.webp', title:'Performance', caption:'Узнай характеристики своего соединения.', url:'mono://performance', alt:'Экран измерения скорости интернета Mono' },
    customize: { image:'assets/customize.webp', title:'Customize', caption:'Сделай интерфейс таким, как тебе нравится.', url:'mono://customize', alt:'Настройки оформления Mono' },
  };

  const safeStore = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} },
  };

  function setTheme(theme, save = true) {
    const next = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = next;
    themeToggle.setAttribute('aria-label', next === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
    themeToggle.title = themeToggle.getAttribute('aria-label');
    document.querySelector('meta[name="theme-color"]').content = next === 'dark' ? '#0e1322' : '#f8f9fd';
    if (save) safeStore.set('mono-website-theme', next);
  }

  setTheme(safeStore.get('mono-website-theme') || 'light', false);
  themeToggle.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  function toggleMobileNav(open) {
    mobileNav.classList.toggle('is-open', open);
    mobileNav.inert = !open;
    mobileButton.setAttribute('aria-expanded', String(open));
    mobileButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileButton.querySelector('use').setAttribute('href', open ? '#ic-x' : '#ic-menu');
  }

  mobileButton.addEventListener('click', () => toggleMobileNav(!mobileNav.classList.contains('is-open')));
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggleMobileNav(false)));
  document.addEventListener('click', event => {
    if (mobileNav.classList.contains('is-open') && !mobileNav.contains(event.target) && !mobileButton.contains(event.target)) toggleMobileNav(false);
  });

  let scrollRequested = false;
  function refreshScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const pct = Math.max(0, Math.min(1, window.scrollY / max));
    progress.style.transform = `scaleX(${pct})`;
    header.classList.toggle('is-scrolled', window.scrollY > 28);
    scrollRequested = false;
  }
  addEventListener('scroll', () => {
    if (!scrollRequested) { requestAnimationFrame(refreshScroll); scrollRequested = true; }
  }, { passive: true });
  refreshScroll();

  const motionReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !motionReduced) {
    const appear = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          appear.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -45px 0px', threshold: .07 });
    document.querySelectorAll('.fade-in').forEach(node => appear.observe(node));
  } else {
    document.querySelectorAll('.fade-in').forEach(node => node.classList.add('visible'));
  }

  // Interactive showcase: one selected screen, keyboard-accessible tab list.
  let activePreview = 'home';
  let switchSerial = 0;
  function selectPreview(key) {
    const entry = previewContent[key];
    if (!entry || !previewImage) return;
    activePreview = key;
    const serial = ++switchSerial;
    previewTabs.forEach(tab => {
      const selected = tab.dataset.preview === key;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    previewDemo.setAttribute('aria-labelledby', `tab-${key}`);
    previewImage.classList.add('is-changing');
    const commit = () => {
      if (serial !== switchSerial) return;
      previewImage.src = entry.image;
      previewImage.alt = entry.alt;
      document.getElementById('demo-url').innerHTML = `<svg class="icon"><use href="#ic-lock"/></svg>${entry.url}`;
      document.getElementById('preview-label').textContent = entry.title;
      document.getElementById('preview-subtitle').textContent = entry.caption;
      document.getElementById('preview-index').textContent = String(Object.keys(previewContent).indexOf(key) + 1).padStart(2, '0');
      previewImage.classList.remove('is-changing');
    };
    if (motionReduced) commit(); else setTimeout(commit, 155);
  }
  previewTabs.forEach(tab => {
    tab.addEventListener('click', () => selectPreview(tab.dataset.preview));
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = previewTabs.indexOf(tab);
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % previewTabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + previewTabs.length) % previewTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = previewTabs.length - 1;
      previewTabs[next].focus(); selectPreview(previewTabs[next].dataset.preview);
    });
  });
  document.querySelectorAll('[data-select-preview]').forEach(link => {
    link.addEventListener('click', () => selectPreview(link.dataset.selectPreview));
  });

  // The website intentionally doesn't invent an installer URL.
  // Site owner configures real direct download in js/config.js.
  let beforeDialog = null;
  function showDialog() {
    beforeDialog = document.activeElement;
    dialog.hidden = false;
    document.body.style.overflow = 'hidden';
    dialogClose.focus();
  }
  function hideDialog() {
    if (dialog.hidden) return;
    dialog.hidden = true;
    document.body.style.overflow = '';
    if (beforeDialog?.isConnected) beforeDialog.focus();
  }
  function handleDownload() {
    const url = typeof window.MONO_DOWNLOAD_URL === 'string' ? window.MONO_DOWNLOAD_URL.trim() : '';
    if (url) {
      try {
        const parsed = new URL(url, location.href);
        if (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && parsed.hostname === 'localhost') || (parsed.protocol === 'file:' && location.protocol === 'file:')) {
          const a = document.createElement('a');
          a.href = parsed.href;
          a.rel = 'noopener noreferrer';
          a.download = '';
          document.body.append(a);
          a.click();
          a.remove();
          return;
        }
      } catch (_) { /* Invalid URL: show release status instead */ }
    }
    showDialog();
  }
  document.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', handleDownload));
  dialogClose.addEventListener('click', hideDialog);
  dialogDone.addEventListener('click', hideDialog);
  dialog.addEventListener('click', event => { if (event.target === dialog) hideDialog(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { hideDialog(); toggleMobileNav(false); }
    if (event.key === 'Tab' && !dialog.hidden) {
      const focusables = [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')];
      if (!focusables.length) return;
      const first = focusables[0], last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    }
  });
  document.getElementById('footer-year').textContent = String(new Date().getFullYear());
})();
