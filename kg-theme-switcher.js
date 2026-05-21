(function () {
  'use strict';

  var STORAGE_KEY = 'kg-active-theme';

  var THEMES = {
    aurora: {
      name: 'Aurora',
      '--kg-primary-color':            '#04342C',
      '--kg-secondary-color':          '#04342C',
      '--kg-highlight-color':          '#1D9E75',
      '--kg-primary-gradient':         'linear-gradient(135deg, #04342C 0%, #1D9E75 100%)',
      '--kg-button-grey':              '#0F4A3A',
      '--kg-nav-text':                 '#9FE1CB',
      '--kg-nav-text-hover':           '#ffffff',
      '--kg-nav-text-active':          '#ffffff',
      '--kg-gradient-start':           '#04342C',
      '--kg-gradient-end':             '#085041',
      '--kg-topbar-bg':                '#ffffff',
      '--kg-topbar-text':              '#1D9E75',
      '--kg-topbar-text-hover':        '#1D9E75',
      '--kg-topbar-active-underline':  '#5DCAA5',
    },
    obsidian: {
      name: 'Obsidian',
      '--kg-primary-color':            '#0C0C14',
      '--kg-secondary-color':          '#0C0C14',
      '--kg-highlight-color':          '#7F77DD',
      '--kg-primary-gradient':         'linear-gradient(135deg, #1A1A2E 0%, #7F77DD 100%)',
      '--kg-button-grey':              '#1E1E2E',
      '--kg-nav-text':                 '#AFA9EC',
      '--kg-nav-text-hover':           '#ffffff',
      '--kg-nav-text-active':          '#ffffff',
      '--kg-gradient-start':           '#0C0C14',
      '--kg-gradient-end':             '#1A1A2E',
      '--kg-topbar-bg':                '#ffffff',
      '--kg-topbar-text':              '#7F77DD',
      '--kg-topbar-text-hover':        '#7F77DD',
      '--kg-topbar-active-underline':  '#AFA9EC',
    },
    midnight_gold: {
      name: 'Midnight Gold',
      '--kg-primary-color':            '#111108',
      '--kg-secondary-color':          '#111108',
      '--kg-highlight-color':          '#BA7517',
      '--kg-primary-gradient':         'linear-gradient(135deg, #111108 0%, #BA7517 100%)',
      '--kg-button-grey':              '#2A2408',
      '--kg-nav-text':                 '#FAC775',
      '--kg-nav-text-hover':           '#ffffff',
      '--kg-nav-text-active':          '#ffffff',
      '--kg-gradient-start':           '#111108',
      '--kg-gradient-end':             '#1F1A04',
      '--kg-topbar-bg':                '#ffffff',
      '--kg-topbar-text':              '#BA7517',
      '--kg-topbar-text-hover':        '#BA7517',
      '--kg-topbar-active-underline':  '#EF9F27',
    },
    deep_navy: {
      name: 'Deep Navy',
      '--kg-primary-color':            '#042C53',
      '--kg-secondary-color':          '#042C53',
      '--kg-highlight-color':          '#185FA5',
      '--kg-primary-gradient':         'linear-gradient(135deg, #042C53 0%, #185FA5 100%)',
      '--kg-button-grey':              '#0C3D6B',
      '--kg-nav-text':                 '#B5D4F4',
      '--kg-nav-text-hover':           '#ffffff',
      '--kg-nav-text-active':          '#ffffff',
      '--kg-gradient-start':           '#042C53',
      '--kg-gradient-end':             '#0C447C',
      '--kg-topbar-bg':                '#ffffff',
      '--kg-topbar-text':              '#185FA5',
      '--kg-topbar-text-hover':        '#185FA5',
      '--kg-topbar-active-underline':  '#378ADD',
    },
    crimson: {
      name: 'Crimson',
      '--kg-primary-color':            '#4B1528',
      '--kg-secondary-color':          '#4B1528',
      '--kg-highlight-color':          '#D4537E',
      '--kg-primary-gradient':         'linear-gradient(135deg, #4B1528 0%, #D4537E 100%)',
      '--kg-button-grey':              '#6B1F38',
      '--kg-nav-text':                 '#F4C0D1',
      '--kg-nav-text-hover':           '#ffffff',
      '--kg-nav-text-active':          '#ffffff',
      '--kg-gradient-start':           '#4B1528',
      '--kg-gradient-end':             '#72243E',
      '--kg-topbar-bg':                '#ffffff',
      '--kg-topbar-text':              '#D4537E',
      '--kg-topbar-text-hover':        '#D4537E',
      '--kg-topbar-active-underline':  '#ED93B1',
    },
  };

  var SWATCHES = {
    aurora:       '#1D9E75',
    obsidian:     '#7F77DD',
    midnight_gold:'#BA7517',
    deep_navy:    '#185FA5',
    crimson:      '#D4537E',
  };

  function applyTheme(key) {
    var theme = THEMES[key];
    if (!theme) return;
    var root = document.documentElement;
    Object.keys(theme).forEach(function (prop) {
      if (prop === 'name') return;
      root.style.setProperty(prop, theme[prop]);
    });
    localStorage.setItem(STORAGE_KEY, key);
    updateActiveState(key);
  }

  function updateActiveState(activeKey) {
    document.querySelectorAll('.kg-swatch').forEach(function (el) {
      var isActive = el.getAttribute('data-theme') === activeKey;
      el.style.transform = isActive ? 'scale(1.25)' : 'scale(1)';
      el.style.boxShadow = isActive ? '0 0 0 2px #fff, 0 0 0 3px ' + SWATCHES[activeKey] : 'none';
    });
    var label = document.getElementById('kg-active-label');
    if (label) label.textContent = THEMES[activeKey] ? THEMES[activeKey].name : '';
  }

  function buildUI() {
    if (document.getElementById('kg-switcher')) return;

    var panel = document.createElement('div');
    panel.id = 'kg-switcher';
    panel.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:72px',
      'z-index:9999999',
      'display:flex',
      'flex-direction:column',
      'align-items:flex-end',
      'gap:8px',
      'font-family:Poppins,sans-serif',
    ].join(';');

    var drawer = document.createElement('div');
    drawer.id = 'kg-drawer';
    drawer.style.cssText = [
      'background:#ffffff',
      'border:1px solid rgba(0,0,0,0.1)',
      'border-radius:12px',
      'padding:12px 14px',
      'box-shadow:0 8px 24px rgba(0,0,0,0.12)',
      'display:none',
      'flex-direction:column',
      'gap:10px',
      'min-width:160px',
    ].join(';');

    var title = document.createElement('p');
    title.style.cssText = 'margin:0;font-size:10px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:.06em';
    title.textContent = 'Theme';

    var swatchRow = document.createElement('div');
    swatchRow.style.cssText = 'display:flex;gap:8px;align-items:center';

    Object.keys(SWATCHES).forEach(function (key) {
      var dot = document.createElement('button');
      dot.className = 'kg-swatch';
      dot.setAttribute('data-theme', key);
      dot.setAttribute('title', THEMES[key].name);
      dot.style.cssText = [
        'width:20px',
        'height:20px',
        'border-radius:50%',
        'border:none',
        'cursor:pointer',
        'background:' + SWATCHES[key],
        'transition:transform .15s, box-shadow .15s',
        'padding:0',
        'flex-shrink:0',
      ].join(';');
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        applyTheme(key);
      });
      swatchRow.appendChild(dot);
    });

    var activeLabel = document.createElement('p');
    activeLabel.id = 'kg-active-label';
    activeLabel.style.cssText = 'margin:0;font-size:11px;color:#444;font-weight:500;text-align:center';

    drawer.appendChild(title);
    drawer.appendChild(swatchRow);
    drawer.appendChild(activeLabel);

    var trigger = document.createElement('button');
    trigger.id = 'kg-trigger';
    trigger.setAttribute('title', 'Switch theme');
    trigger.style.cssText = [
      'width:36px',
      'height:36px',
      'border-radius:50%',
      'border:none',
      'cursor:pointer',
      'background:var(--kg-highlight-color)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'box-shadow:0 4px 12px rgba(0,0,0,0.2)',
      'transition:transform .15s',
      'padding:0',
      'position:relative',
      'z-index:9999999',
    ].join(';');

    trigger.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';

    var open = false;
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      open = !open;
      drawer.style.display = open ? 'flex' : 'none';
      trigger.style.transform = open ? 'rotate(30deg)' : 'rotate(0deg)';
      if (open) updateActiveState(localStorage.getItem(STORAGE_KEY) || 'aurora');
    });

    document.addEventListener('click', function (e) {
      if (open && !panel.contains(e.target)) {
        open = false;
        drawer.style.display = 'none';
        trigger.style.transform = 'rotate(0deg)';
      }
    });

    panel.appendChild(drawer);
    panel.appendChild(trigger);
    document.body.appendChild(panel);
  }

  function init() {
    buildUI();
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES[saved]) {
      applyTheme(saved);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  ['pushState', 'replaceState'].forEach(function (m) {
    var orig = history[m].bind(history);
    history[m] = function () {
      orig.apply(history, arguments);
      setTimeout(function () {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved && THEMES[saved]) applyTheme(saved);
        var btn = document.getElementById('kg-trigger');
        if (btn) btn.style.background = 'var(--kg-highlight-color)';
      }, 300);
    };
  });

})();
