(function () {
  'use strict';

  var ACTIONS = [
    {
      icon  : 'fa-user-plus',
      label : 'New contact',
      path  : 'contacts/smart_list/All',
      after : function () {
        setTimeout(function () {
          var btn = document.getElementById('add-record-btn');
          if (btn) btn.click();
        }, 800);
      },
    },
    {
      icon  : 'fa-code-branch',
      label : 'New workflow',
      path  : 'automation/workflows',
      after : function () {
        setTimeout(function () {
          var btn = document.querySelector('#create-workflow-btn') ||
                    document.querySelector('[id*="create-workflow"]');
          if (btn) btn.click();
        }, 800);
      },
    },
    {
      icon  : 'fa-comment-medical',
      label : 'New conversation',
      path  : 'conversations/conversations',
      after : function () {
        setTimeout(function () {
          var btn = document.getElementById('new-conversation-btn-collapsed') ||
                    document.querySelector('[id*="new-conversation"]');
          if (btn) btn.click();
        }, 800);
      },
    },
    {
      icon  : 'fa-calendar-plus',
      label : 'New appointment',
      path  : 'calendars/view',
      after : function () {
        setTimeout(function () {
          var btn = document.getElementById('new-appointment-button');
          if (btn) btn.click();
        }, 800);
      },
    },
  ];

  function getBase() {
    var m = window.location.pathname.match(/\/v2\/location\/([^\/]+)/);
    return m ? '/v2/location/' + m[1] + '/' : null;
  }

  function navigate(action) {
    var base = getBase();
    if (!base) return;
    window.location.href = base + action.path;
    if (action.after) action.after();
  }

  var openState = false;

  function closeMenu() {
    openState = false;
    var list = document.getElementById('kg-qa-list');
    var fabIco = document.getElementById('kg-qa-ico');
    var fab = document.getElementById('kg-qa-fab');
    if (list) {
      list.style.opacity = '0';
      list.style.transform = 'translateY(8px)';
      list.style.pointerEvents = 'none';
      setTimeout(function () {
        if (!openState) list.style.display = 'none';
      }, 200);
    }
    if (fabIco) fabIco.style.transform = 'rotate(0deg)';
    if (fab) fab.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    openState = true;
    var list = document.getElementById('kg-qa-list');
    var fabIco = document.getElementById('kg-qa-ico');
    var fab = document.getElementById('kg-qa-fab');
    if (list) {
      list.style.display = 'flex';
      setTimeout(function () {
        list.style.opacity = '1';
        list.style.transform = 'translateY(0)';
        list.style.pointerEvents = 'auto';
      }, 10);
    }
    if (fabIco) fabIco.style.transform = 'rotate(45deg)';
    if (fab) fab.setAttribute('aria-expanded', 'true');
  }

  function buildUI() {
    if (document.getElementById('kg-qa-wrap')) return;

    var wrap = document.createElement('div');
    wrap.id = 'kg-qa-wrap';
    wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-family:Poppins,sans-serif;';

    var list = document.createElement('div');
    list.id = 'kg-qa-list';
    list.style.cssText = 'display:none;flex-direction:column;gap:6px;align-items:flex-end;transition:opacity .2s,transform .2s;opacity:0;transform:translateY(8px);pointer-events:none;';

    ACTIONS.slice().reverse().forEach(function (action) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;';

      var lbl = document.createElement('span');
      lbl.textContent = action.label;
      lbl.style.cssText = 'font-size:12px;font-weight:500;background:var(--kg-primary-color,#04342C);color:var(--kg-nav-text,#9FE1CB);padding:4px 10px;border-radius:6px;white-space:nowrap;cursor:pointer;border:1px solid rgba(255,255,255,0.1);';

      var btn = document.createElement('button');
      btn.setAttribute('aria-label', action.label);
      btn.style.cssText = 'width:36px;height:36px;border-radius:50%;border:none;cursor:pointer;background:var(--kg-primary-color,#04342C);display:flex;align-items:center;justify-content:center;flex-shrink:0;';

      var ico = document.createElement('i');
      ico.className = 'fas ' + action.icon;
      ico.style.cssText = 'font-size:14px;color:var(--kg-nav-text,#9FE1CB);pointer-events:none;';
      btn.appendChild(ico);

      btn.addEventListener('mouseenter', function () {
        btn.style.background = 'var(--kg-highlight-color,#1D9E75)';
        ico.style.color = '#fff';
        lbl.style.background = 'var(--kg-highlight-color,#1D9E75)';
        lbl.style.color = '#fff';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.background = 'var(--kg-primary-color,#04342C)';
        ico.style.color = 'var(--kg-nav-text,#9FE1CB)';
        lbl.style.background = 'var(--kg-primary-color,#04342C)';
        lbl.style.color = 'var(--kg-nav-text,#9FE1CB)';
      });

      var handler = function (e) { e.stopPropagation(); navigate(action); closeMenu(); };
      btn.addEventListener('click', handler);
      lbl.addEventListener('click', handler);

      row.appendChild(lbl);
      row.appendChild(btn);
      list.appendChild(row);
    });

    var fab = document.createElement('button');
    fab.id = 'kg-qa-fab';
    fab.setAttribute('aria-label', 'Quick actions');
    fab.setAttribute('aria-expanded', 'false');
    fab.style.cssText = 'width:44px;height:44px;border-radius:50%;background:var(--kg-highlight-color,#1D9E75);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;';

    var fabIco = document.createElement('i');
    fabIco.id = 'kg-qa-ico';
    fabIco.className = 'fas fa-plus';
    fabIco.style.cssText = 'font-size:18px;color:#fff;transition:transform .25s;pointer-events:none;';
    fab.appendChild(fabIco);

    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      openState ? closeMenu() : openMenu();
    });

    document.addEventListener('click', function () {
      if (openState) closeMenu();
    });

    wrap.appendChild(list);
    wrap.appendChild(fab);
    document.body.appendChild(wrap);
  }

  ['pushState', 'replaceState'].forEach(function (method) {
    var orig = history[method].bind(history);
    history[method] = function () {
      orig.apply(history, arguments);
      setTimeout(function () {
        if (!document.getElementById('kg-qa-wrap')) buildUI();
      }, 500);
    };
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildUI);
  } else {
    buildUI();
  }

  console.log('[KG Quick Actions] Running');

})();
