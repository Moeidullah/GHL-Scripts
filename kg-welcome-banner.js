(function () {
  'use strict';

  var SESSION_KEY = 'kg-banner-dismissed';

  function getGreeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function getUserName() {
    /* Method 1 — localStorage (GHL sometimes stores user object here) */
    var lsKeys = ['user', 'userData', 'currentUser', 'ghl_user', 'hl_user'];
    for (var k = 0; k < lsKeys.length; k++) {
      try {
        var raw = localStorage.getItem(lsKeys[k]);
        if (raw) {
          var obj = JSON.parse(raw);
          var n = obj.firstName || obj.first_name || (obj.name && obj.name.split(' ')[0]) || null;
          if (n) return n;
        }
      } catch (e) {}
    }

    /* Method 2 — GHL Vue app store */
    try {
      var appEl = document.querySelector('#app');
      if (appEl && appEl.__vue_app__) {
        var gp = appEl.__vue_app__.config.globalProperties;
        var store = gp.$store;
        if (store && store.state) {
          var s = store.state;
          var name =
            (s.user && (s.user.firstName || s.user.name)) ||
            (s.auth && s.auth.user && (s.auth.user.firstName || s.auth.user.name)) ||
            (s.currentUser && (s.currentUser.firstName || s.currentUser.name));
          if (name) return name.split(' ')[0];
        }
      }
    } catch (e) {}

    /* Method 3 — DOM selectors */
    var domSelectors = [
      '[data-user-first-name]',
      '[class*="user-first-name"]',
      '[class*="user-name"]',
      '[data-user-name]',
      '.hl_header--user',
    ];
    for (var d = 0; d < domSelectors.length; d++) {
      var el = document.querySelector(domSelectors[d]);
      if (el) {
        var txt = (el.getAttribute('data-user-first-name') || el.textContent || '').trim();
        if (txt) return txt.split(' ')[0];
      }
    }

    return null;
  }

  function isDashboard() {
    return window.location.pathname.indexOf('/dashboard') !== -1;
  }

  function removeBanner() {
    var el = document.getElementById('kg-welcome-banner');
    if (el) el.remove();
  }

  function injectStyle() {
    if (document.getElementById('kg-banner-style')) return;
    var style = document.createElement('style');
    style.id = 'kg-banner-style';
    style.textContent =
      '@keyframes kg-banner-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);
  }

  function buildBanner() {
    var name    = getUserName();
    var greeting = getGreeting();
    var headline = name ? (greeting + ', ' + name + ' \uD83D\uDC4B') : (greeting + ' \uD83D\uDC4B');

    injectStyle();

    var banner = document.createElement('div');
    banner.id = 'kg-welcome-banner';
    banner.style.cssText = [
      'background:var(--kg-primary-gradient)',
      'border-radius:10px',
      'padding:12px 18px',
      'margin-bottom:16px',
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'font-family:Poppins,sans-serif',
      'animation:kg-banner-in .35s ease',
    ].join(';');

    var left = document.createElement('div');

    var h = document.createElement('p');
    h.style.cssText = 'font-size:14px;font-weight:500;color:#ffffff;margin:0 0 2px';
    h.textContent   = headline;

    var sub = document.createElement('p');
    sub.style.cssText = 'font-size:11px;color:var(--kg-nav-text,#9FE1CB);margin:0';
    sub.textContent   = 'Welcome to Keep-Generating';

    left.appendChild(h);
    left.appendChild(sub);

    var close = document.createElement('button');
    close.setAttribute('aria-label', 'Dismiss welcome banner');
    close.style.cssText = [
      'background:none',
      'border:none',
      'cursor:pointer',
      'color:rgba(255,255,255,0.55)',
      'font-size:20px',
      'line-height:1',
      'padding:0',
      'flex-shrink:0',
      'transition:color .15s',
    ].join(';');
    close.innerHTML = '&times;';

    close.addEventListener('mouseenter', function () { close.style.color = '#fff'; });
    close.addEventListener('mouseleave', function () { close.style.color = 'rgba(255,255,255,0.55)'; });

    close.addEventListener('click', function () {
      banner.style.transition = 'opacity .25s, transform .25s';
      banner.style.opacity    = '0';
      banner.style.transform  = 'translateY(-8px)';
      setTimeout(function () {
        banner.remove();
        sessionStorage.setItem(SESSION_KEY, '1');
      }, 260);
    });

    banner.appendChild(left);
    banner.appendChild(close);
    return banner;
  }

  function injectBanner() {
    if (document.getElementById('kg-welcome-banner')) return;
    if (sessionStorage.getItem(SESSION_KEY))           return;
    if (!isDashboard())                                return;

    var banner  = buildBanner();
    var targets = [
      document.getElementById('dashboard-wrapper'),
      document.querySelector('[id*="dashboard-wrapper"]'),
      document.querySelector('.hl_dashboard'),
      document.querySelector('[class*="hl-wrapper-container"]'),
      document.querySelector('[class*="wrapper-container"]'),
    ];

    for (var i = 0; i < targets.length; i++) {
      if (targets[i]) {
        targets[i].insertBefore(banner, targets[i].firstChild);
        return;
      }
    }
  }

  function tryInject(attempts) {
    attempts = attempts || 0;
    if (!isDashboard())                    return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    var target =
      document.getElementById('dashboard-wrapper') ||
      document.querySelector('.hl_dashboard')       ||
      document.querySelector('[class*="wrapper-container"]');

    if (!target && attempts < 20) {
      setTimeout(function () { tryInject(attempts + 1); }, 300);
      return;
    }

    injectBanner();
  }

  /* Route change detection */
  ['pushState', 'replaceState'].forEach(function (method) {
    var orig = history[method].bind(history);
    history[method] = function () {
      orig.apply(history, arguments);
      setTimeout(function () {
        if (isDashboard()) tryInject();
        else               removeBanner();
      }, 400);
    };
  });

  window.addEventListener('popstate', function () {
    setTimeout(function () {
      if (isDashboard()) tryInject();
      else               removeBanner();
    }, 400);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryInject(); });
  } else {
    tryInject();
  }

  console.log('[KG Welcome Banner] Running');

})();
