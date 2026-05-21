(function () {
  'use strict';

  var dismissed = false;

  function getGreeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function getIcon() {
    var h = new Date().getHours();
    if (h < 12) return 'fa-sun';
    if (h < 17) return 'fa-cloud-sun';
    return 'fa-moon';
  }

  function getUserName(callback) {
    if (typeof window.getUserInfo === 'function') {
      window.getUserInfo()
        .then(function (u) {
          var name = (u && (u.firstName || (u.name && u.name.split(' ')[0]))) || null;
          callback(name);
        })
        .catch(function () { callback(null); });
      return;
    }

    try {
      var card = document.querySelector('.user-info-card');
      if (card) {
        var text = card.textContent.trim();
        text = text.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '').trim();
        text = text.replace(/^[A-Z]{2}/, '').trim();
        if (text) { callback(text.split(' ')[0]); return; }
      }
    } catch (e) {}

    var lsKeys = ['user', 'userData', 'currentUser', 'ghl_user'];
    for (var k = 0; k < lsKeys.length; k++) {
      try {
        var raw = localStorage.getItem(lsKeys[k]);
        if (raw) {
          var obj = JSON.parse(raw);
          var n = obj.firstName || obj.first_name || (obj.name && obj.name.split(' ')[0]);
          if (n) { callback(n); return; }
        }
      } catch (e) {}
    }

    callback(null);
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
    var s = document.createElement('style');
    s.id = 'kg-banner-style';
    s.textContent = '@keyframes kg-banner-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(s);
  }

  function buildBanner(name) {
    injectStyle();

    var greeting = getGreeting();
    var icon     = getIcon();
    var headline = name ? (greeting + ', ' + name + ' \uD83D\uDC4B') : (greeting + ' \uD83D\uDC4B');

    /* Outer wrapper */
    var banner = document.createElement('div');
    banner.id = 'kg-welcome-banner';
    banner.style.cssText = [
      'background:var(--kg-primary-color,#04342C)',
      'border-radius:12px',
      'display:flex',
      'overflow:hidden',
      'min-height:60px',
      'margin:0 0 20px',
      'font-family:Poppins,sans-serif',
      'animation:kg-banner-in .35s ease',
      'position:relative',
    ].join(';');

    /* Left accent block */
    var accent = document.createElement('div');
    accent.style.cssText = [
      'background:var(--kg-highlight-color,#1D9E75)',
      'padding:0 20px',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'flex-shrink:0',
      'min-width:60px',
    ].join(';');

    var ico = document.createElement('i');
    ico.className = 'fas ' + icon;
    ico.setAttribute('aria-hidden', 'true');
    ico.style.cssText = 'font-size:22px;color:#ffffff';
    accent.appendChild(ico);

    /* Right text block */
    var right = document.createElement('div');
    right.style.cssText = [
      'padding:14px 52px 14px 20px',
      'display:flex',
      'flex-direction:column',
      'gap:4px',
      'justify-content:center',
    ].join(';');

    var h = document.createElement('p');
    h.style.cssText = 'font-size:15px;font-weight:500;color:#ffffff;margin:0;line-height:1.3';
    h.textContent = headline;

    var sub = document.createElement('p');
    sub.style.cssText = 'font-size:12px;color:var(--kg-nav-text,#9FE1CB);margin:0;opacity:0.9';
    sub.textContent = 'Welcome to Keep-Generating';

    right.appendChild(h);
    right.appendChild(sub);

    /* Close button */
    var close = document.createElement('button');
    close.setAttribute('aria-label', 'Dismiss welcome banner');
    close.style.cssText = [
      'position:absolute',
      'top:50%',
      'right:14px',
      'transform:translateY(-50%)',
      'background:rgba(255,255,255,0.12)',
      'border:1px solid rgba(255,255,255,0.2)',
      'border-radius:50%',
      'width:26px',
      'height:26px',
      'cursor:pointer',
      'color:rgba(255,255,255,0.75)',
      'font-size:15px',
      'line-height:1',
      'padding:0',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'transition:background .15s',
    ].join(';');
    close.innerHTML = '&times;';

    close.addEventListener('mouseenter', function () {
      close.style.background = 'rgba(255,255,255,0.25)';
      close.style.color = '#fff';
    });
    close.addEventListener('mouseleave', function () {
      close.style.background = 'rgba(255,255,255,0.12)';
      close.style.color = 'rgba(255,255,255,0.75)';
    });

    close.addEventListener('click', function () {
      dismissed = true;
      banner.style.transition = 'opacity .25s,transform .25s';
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-8px)';
      setTimeout(function () { banner.remove(); }, 260);
    });

    banner.appendChild(accent);
    banner.appendChild(right);
    banner.appendChild(close);
    return banner;
  }

  function injectBanner() {
    if (document.getElementById('kg-welcome-banner')) return;
    if (dismissed) return;
    if (!isDashboard()) return;

    getUserName(function (name) {
      if (!isDashboard() || dismissed) return;

      var banner  = buildBanner(name);
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
    });
  }

  function tryInject(attempts) {
    attempts = attempts || 0;
    if (!isDashboard()) return;
    if (dismissed) return;

    var target =
      document.getElementById('dashboard-wrapper') ||
      document.querySelector('.hl_dashboard') ||
      document.querySelector('[class*="wrapper-container"]');

    if (!target && attempts < 20) {
      setTimeout(function () { tryInject(attempts + 1); }, 300);
      return;
    }

    injectBanner();
  }

  ['pushState', 'replaceState'].forEach(function (method) {
    var orig = history[method].bind(history);
    history[method] = function () {
      orig.apply(history, arguments);
      setTimeout(function () {
        if (isDashboard()) { dismissed = false; tryInject(); }
        else removeBanner();
      }, 400);
    };
  });

  window.addEventListener('popstate', function () {
    setTimeout(function () {
      if (isDashboard()) { dismissed = false; tryInject(); }
      else removeBanner();
    }, 400);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryInject(); });
  } else {
    tryInject();
  }

  console.log('[KG Welcome Banner] Running');

})();
