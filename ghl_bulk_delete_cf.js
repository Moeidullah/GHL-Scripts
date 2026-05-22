
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // RESILIENCE DESIGN
  // 1. Token captured by intercepting fetch/XHR — no localStorage key to break
  // 2. Field IDs fetched fresh from GHL's official v2 API — no DOM parsing for IDs
  // 3. DOM selectors use an ordered fallback array — first working one wins
  // 4. Health check warns visibly if the page structure has changed
  // 5. SPA navigation handled via history.pushState patch + MutationObserver
  // ─────────────────────────────────────────────────────────────

  const API_BASE    = 'https://services.leadconnectorhq.com';
  const API_VERSION = '2021-07-28';

  let capturedToken = null;
  let locationId    = null;
  let allFields     = [];   // [{id, name}] from API — single source of truth for IDs
  let barInjected   = false;

  // ─────────────────────────────────────────────────────────────
  // 1. TOKEN CAPTURE
  // Intercept every fetch/XHR that GHL makes and steal the Bearer token.
  // This survives any localStorage key rename GHL ever does.
  // ─────────────────────────────────────────────────────────────
  const _fetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    try {
      const headers = init?.headers || {};
      const auth = (headers instanceof Headers)
        ? (headers.get('Authorization') || headers.get('authorization'))
        : (headers['Authorization'] || headers['authorization'] || '');
      if (auth && auth.startsWith('Bearer ')) {
        capturedToken = auth.slice(7);
      }
    } catch (_) {}
    return _fetch(input, init);
  };

  const _xhrSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (name.toLowerCase() === 'authorization' && typeof value === 'string' && value.startsWith('Bearer ')) {
      capturedToken = value.slice(7);
    }
    return _xhrSetHeader.apply(this, arguments);
  };

  // ─────────────────────────────────────────────────────────────
  // 2. LOCATION ID
  // Try URL first (most reliable), then a list of known localStorage keys.
  // ─────────────────────────────────────────────────────────────
  function resolveLocationId () {
    const urlMatch = location.href.match(/\/location\/([a-zA-Z0-9]{10,})/);
    if (urlMatch) return urlMatch[1];

    const candidates = [
      'locationId', 'activeLocation', 'currentLocation',
      'ghl_location_id', 'lc_location_id',
    ];
    for (const key of candidates) {
      const v = localStorage.getItem(key);
      if (v && v.length > 8) return v;
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. SELECTOR FALLBACKS
  // Each list is tried in order. If GHL's DOM changes, the next one fires.
  // ─────────────────────────────────────────────────────────────
  const SEL_ROWS = [
    'table tbody tr[data-field-id]',
    'table tbody tr[data-id]',
    '.custom-fields-table tbody tr',
    'table tbody tr',
  ];

  const SEL_INSERT_BEFORE = [
    () => document.querySelector('[class*="custom-field"] table')?.closest('div'),
    () => document.querySelector('table')?.closest('section'),
    () => document.querySelector('table')?.parentElement,
    () => document.querySelector('table')?.closest('div'),
  ];

  function queryRows () {
    for (const sel of SEL_ROWS) {
      try {
        const nodes = document.querySelectorAll(sel);
        if (nodes.length > 0) return Array.from(nodes);
      } catch (_) {}
    }
    return [];
  }

  // ─────────────────────────────────────────────────────────────
  // 4. API HELPERS
  // ─────────────────────────────────────────────────────────────
  function authHeaders () {
    return {
      'Authorization' : `Bearer ${capturedToken}`,
      'Version'       : API_VERSION,
      'Content-Type'  : 'application/json',
    };
  }

  async function loadFields () {
    if (!capturedToken || !locationId) return;
    try {
      const res  = await _fetch(`${API_BASE}/custom-fields/?locationId=${locationId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      allFields  = (data.customFields || data.fields || []).map(f => ({
        id   : f.id,
        name : f.name,
      }));
    } catch (e) {
      console.warn('[GHL-BD] loadFields error:', e);
    }
  }

  async function deleteField (fieldId) {
    const res = await _fetch(`${API_BASE}/custom-fields/${fieldId}`, {
      method  : 'DELETE',
      headers : authHeaders(),
    });
    return res.ok;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. MATCH ROW → FIELD ID
  // Primary: data-field-id / data-id attribute on <tr>
  // Fallback: match displayed name against the API field list
  // ─────────────────────────────────────────────────────────────
  function getFieldId (row) {
    if (row.dataset.fieldId) return row.dataset.fieldId;
    if (row.dataset.id)      return row.dataset.id;

    const nameText = row.querySelector('td:nth-child(2)')?.textContent?.trim();
    if (nameText && allFields.length) {
      const match = allFields.find(f => f.name === nameText);
      if (match) return match.id;
    }
    return null;
  }

  function getSelectedRows () {
    return queryRows().filter(row => {
      const cb = row.querySelector('input[type="checkbox"]');
      return cb?.checked;
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 6. STYLES
  // ─────────────────────────────────────────────────────────────
  function injectStyles () {
    if (document.getElementById('ghl-bd-css')) return;
    const s = document.createElement('style');
    s.id    = 'ghl-bd-css';
    s.textContent = `
      #ghl-bd-bar {
        display: none;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: #fff8e1;
        border: 1px solid #ffc107;
        border-radius: 8px;
        margin-bottom: 12px;
        font-size: 13px;
        color: #7a5200;
        font-family: inherit;
        animation: ghl-bd-in .2s ease;
        position: relative;
        z-index: 100;
      }
      @keyframes ghl-bd-in {
        from { opacity:0; transform:translateY(-6px); }
        to   { opacity:1; transform:translateY(0); }
      }
      #ghl-bd-bar.show { display: flex !important; }
      .ghl-bd-btn {
        font-size: 13px;
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-family: inherit;
        transition: opacity .15s;
      }
      .ghl-bd-btn:hover   { opacity: .85; }
      .ghl-bd-btn:active  { opacity: .7; }
      .ghl-bd-cancel      { background:transparent; color:#7a5200; border:1px solid #ffc107; }
      .ghl-bd-delete      { background:#dc3545; color:#fff; border:none; font-weight:600; }
      .ghl-bd-delete:disabled { background:#ccc; cursor:not-allowed; }

      #ghl-bd-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,.5);
        display: flex; align-items: center; justify-content: center;
        z-index: 9999999;
      }
      #ghl-bd-modal {
        background: #fff;
        border-radius: 12px;
        padding: 28px 24px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        font-family: inherit;
        box-shadow: 0 8px 32px rgba(0,0,0,.18);
      }
      #ghl-bd-modal h3 { font-size:17px; font-weight:600; margin:0 0 8px; color:#1a1a1a; }
      #ghl-bd-modal p  { font-size:13px; color:#555; margin:0 0 20px; line-height:1.55; }
      .ghl-bd-prog-wrap { background:#f3f4f6; border-radius:4px; height:6px; margin:12px 0 4px; overflow:hidden; }
      .ghl-bd-prog-bar  { height:6px; background:#dc3545; border-radius:4px; width:0%; transition:width .3s ease; }
      .ghl-bd-modal-actions { display:flex; gap:8px; justify-content:center; }

      #ghl-bd-warn {
        background:#fff3cd; border:1px solid #ffc107;
        border-radius:8px; padding:10px 14px;
        font-size:12px; color:#7a5200; margin-bottom:10px;
        font-family:inherit;
      }
    `;
    document.head.appendChild(s);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. HEALTH CHECK
  // Warns if no rows found → lets Moeid know the selector needs updating
  // ─────────────────────────────────────────────────────────────
  function healthCheck () {
    const rows = queryRows();
    if (rows.length === 0) {
      let warn = document.getElementById('ghl-bd-warn');
      if (!warn) {
        warn      = document.createElement('div');
        warn.id   = 'ghl-bd-warn';
        warn.innerHTML = '⚠️ <strong>GHL Bulk Delete:</strong> Could not detect the custom fields table. GHL may have updated its layout. Please check for a script update.';
        document.querySelector('table')
          ?.closest('section, div')
          ?.prepend(warn)
          || document.body.prepend(warn);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 8. BULK BAR UI
  // ─────────────────────────────────────────────────────────────
  function updateBar () {
    const bar = document.getElementById('ghl-bd-bar');
    if (!bar) return;
    const n = getSelectedRows().length;
    if (n > 0) {
      bar.querySelector('#ghl-bd-count').textContent = n;
      bar.querySelector('.ghl-bd-delete').textContent = `🗑 Delete selected (${n})`;
      bar.classList.add('show');
    } else {
      bar.classList.remove('show');
    }
  }

  function injectBar () {
    if (document.getElementById('ghl-bd-bar')) {
      attachListeners(); return;
    }

    const bar    = document.createElement('div');
    bar.id       = 'ghl-bd-bar';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML = `
      <span>
        <strong id="ghl-bd-count">0</strong> fields selected
      </span>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="ghl-bd-btn ghl-bd-cancel" id="ghl-bd-clear">Clear selection</button>
        <button class="ghl-bd-btn ghl-bd-delete" id="ghl-bd-del">🗑 Delete selected</button>
      </div>
    `;

    // Try each insertion candidate until one works
    let placed = false;
    for (const fn of SEL_INSERT_BEFORE) {
      try {
        const target = fn();
        if (target) {
          target.insertAdjacentElement('afterbegin', bar);
          placed = true; break;
        }
      } catch (_) {}
    }
    if (!placed) document.body.prepend(bar);

    bar.querySelector('#ghl-bd-clear').addEventListener('click', () => {
      queryRows().forEach(row => {
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb?.checked) {
          cb.checked = false;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
          cb.dispatchEvent(new Event('input',  { bubbles: true }));
        }
      });
      updateBar();
    });

    bar.querySelector('#ghl-bd-del').addEventListener('click', openConfirm);

    barInjected = true;
    attachListeners();
  }

  // ─────────────────────────────────────────────────────────────
  // 9. CHECKBOX LISTENERS
  // Re-attach on every MutationObserver tick so new rows get covered
  // ─────────────────────────────────────────────────────────────
  function attachListeners () {
    queryRows().forEach(row => {
      const cb = row.querySelector('input[type="checkbox"]');
      if (!cb || cb.dataset.bdOk) return;
      cb.dataset.bdOk = '1';
      cb.addEventListener('change', updateBar);
    });

    // Also watch the master "select all" checkbox in thead
    const master = document.querySelector('table thead input[type="checkbox"]');
    if (master && !master.dataset.bdOk) {
      master.dataset.bdOk = '1';
      master.addEventListener('change', () => setTimeout(updateBar, 50));
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 10. CONFIRM MODAL + DELETE LOOP
  // ─────────────────────────────────────────────────────────────
  async function openConfirm () {
    const selected = getSelectedRows();
    if (!selected.length) return;

    if (!capturedToken) {
      alert('GHL Bulk Delete: Auth token not captured yet.\nClick any other GHL settings page and come back, then try again.');
      return;
    }

    locationId = locationId || resolveLocationId();
    if (!locationId) {
      alert('GHL Bulk Delete: Could not detect Location ID.\nMake sure you are inside a sub-account (not the agency view).');
      return;
    }

    // Refresh the field list so IDs are fresh
    await loadFields();

    const overlay = document.createElement('div');
    overlay.id    = 'ghl-bd-overlay';
    overlay.innerHTML = `
      <div id="ghl-bd-modal">
        <div style="font-size:36px;margin-bottom:8px;">🗑️</div>
        <h3>Delete ${selected.length} custom field${selected.length > 1 ? 's' : ''}?</h3>
        <p>
          This <strong>cannot be undone</strong>. All stored data in these fields
          will be permanently removed from every contact.
        </p>
        <div class="ghl-bd-prog-wrap" id="ghl-bd-pw" style="display:none">
          <div class="ghl-bd-prog-bar" id="ghl-bd-pb"></div>
        </div>
        <p id="ghl-bd-plabel" style="display:none;font-size:12px;color:#666;margin:4px 0 16px;"></p>
        <div class="ghl-bd-modal-actions" id="ghl-bd-mactions">
          <button class="ghl-bd-btn" style="border:1px solid #ccc;background:#fff;color:#333;" id="ghl-bd-mno">Cancel</button>
          <button class="ghl-bd-btn ghl-bd-delete" id="ghl-bd-myes">Yes, delete all</button>
        </div>
        <p id="ghl-bd-mdone" style="display:none;color:#065f46;font-size:13px;font-weight:600;margin-top:8px;"></p>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#ghl-bd-mno').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#ghl-bd-myes').addEventListener('click', () => runDelete(selected, overlay));
  }

  async function runDelete (rows, overlay) {
    overlay.querySelector('#ghl-bd-mactions').style.display = 'none';
    overlay.querySelector('#ghl-bd-pw').style.display      = 'block';
    overlay.querySelector('#ghl-bd-plabel').style.display  = 'block';

    const pb    = overlay.querySelector('#ghl-bd-pb');
    const label = overlay.querySelector('#ghl-bd-plabel');
    const total = rows.length;
    let done = 0, failed = 0;

    for (const row of rows) {
      const fieldId = getFieldId(row);

      if (fieldId) {
        const ok = await deleteField(fieldId);
        if (ok) {
          row.style.opacity         = '0.35';
          row.style.textDecoration  = 'line-through';
          row.style.pointerEvents   = 'none';
        } else {
          failed++;
          row.style.background = '#fee2e2';
        }
      } else {
        // Could not resolve ID — skip and flag
        failed++;
        row.style.background = '#fef3c7';
        const nameCell = row.querySelector('td:nth-child(2)');
        if (nameCell) nameCell.title = 'Field ID could not be resolved — skipped';
      }

      done++;
      pb.style.width    = Math.round((done / total) * 100) + '%';
      label.textContent = `Deleting ${done} of ${total}…${failed > 0 ? ` (${failed} failed)` : ''}`;
    }

    const msg = failed === 0
      ? `✅ ${total} field${total > 1 ? 's' : ''} deleted successfully`
      : `⚠️ ${total - failed} deleted — ${failed} skipped (ID not resolved)`;

    overlay.querySelector('#ghl-bd-mdone').textContent = msg;
    overlay.querySelector('#ghl-bd-mdone').style.display = 'block';

    // Reload after short pause so GHL table refreshes
    setTimeout(() => { overlay.remove(); location.reload(); }, 2200);
  }

  // ─────────────────────────────────────────────────────────────
  // 11. SPA NAVIGATION HANDLING
  // GHL uses Vue Router — actual page changes don't reload the browser.
  // Patch pushState + popstate + MutationObserver covers all navigation types.
  // ─────────────────────────────────────────────────────────────
  function isTargetPage () {
    return /custom.?field/i.test(location.href);
  }

  function onNavigate () {
    if (!isTargetPage()) { barInjected = false; return; }
    locationId = locationId || resolveLocationId();
    injectStyles();
    setTimeout(() => { injectBar(); healthCheck(); }, 600);
  }

  const _pushState = history.pushState.bind(history);
  history.pushState = function (...a) {
    _pushState(...a);
    setTimeout(onNavigate, 300);
  };
  window.addEventListener('popstate', () => setTimeout(onNavigate, 300));

  // MutationObserver catches lazy-rendered tables after route change
  const mo = new MutationObserver(() => {
    if (!isTargetPage()) return;
    if (!document.getElementById('ghl-bd-bar')) { barInjected = false; }
    injectBar();
    attachListeners();
    updateBar();
  });

  window.addEventListener('load', () => {
    mo.observe(document.body, { childList: true, subtree: true });
    onNavigate();
  });

})();
