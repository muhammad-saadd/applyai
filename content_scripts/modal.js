self.ApplyAI = self.ApplyAI || {};

ApplyAI.showToast = function (message, duration) {
  duration = duration || 3000;
  const existing = document.getElementById('applyai-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'applyai-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: '2147483647',
    background: '#1a1a2e', color: '#fff', padding: '12px 20px', borderRadius: '8px',
    fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)', opacity: '0',
    transition: 'opacity 150ms ease', maxWidth: '360px'
  });
  document.body.appendChild(toast);

  requestAnimationFrame(() => { toast.style.opacity = '1'; });

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 150);
  }, duration);
};

ApplyAI.showModal = function (content, fields, callbacks) {
  const existing = document.getElementById('applyai-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'applyai-modal-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '2147483646',
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  });

  const modal = document.createElement('div');
  Object.assign(modal.style, {
    background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '640px',
    maxHeight: '80vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden'
  });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e5e7eb;flex-shrink:0;">
      <span style="font-weight:600;font-size:16px;color:#1a1a2e;">ApplyAI — Review Generated Content</span>
      <button id="applyai-modal-close" style="background:none;border:none;font-size:22px;cursor:pointer;color:#6b7280;padding:4px 8px;border-radius:4px;">×</button>
    </div>
    <div id="applyai-modal-body" style="flex:1;overflow-y:auto;padding:16px 20px;"></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px 20px;border-top:1px solid #e5e7eb;flex-shrink:0;">
      <button id="applyai-fill-all" style="flex:1;min-width:120px;padding:10px 16px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:background 150ms ease;">Fill All Fields</button>
      <button id="applyai-copy-all" style="flex:1;min-width:120px;padding:10px 16px;background:#f3f4f6;color:#1a1a2e;border:1px solid #d1d5db;border-radius:8px;font-size:14px;cursor:pointer;transition:background 150ms ease;">Copy All as Text</button>
      <button id="applyai-regenerate" style="padding:10px 16px;background:#fef3c7;color:#92400e;border:1px solid #f59e0b;border-radius:8px;font-size:14px;cursor:pointer;transition:background 150ms ease;">Regenerate</button>
    </div>
    <div style="text-align:center;padding:6px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;flex-shrink:0;">Powered by ApplyAI</div>
  `;

  const body = modal.querySelector('#applyai-modal-body');
  let fieldKeys = Object.keys(content).filter(k => content[k] !== null && content[k] !== undefined);

  fieldKeys.forEach(key => {
    const fieldDef = fields.find(f => f.fieldName === key);
    const label = fieldDef?.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const value = String(content[key]);

    const item = document.createElement('div');
    item.style.cssText = 'margin-bottom:14px;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;';

    const labelEl = document.createElement('label');
    labelEl.style.cssText = 'font-weight:600;font-size:13px;color:#1a1a2e;';
    labelEl.textContent = label;

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:6px;';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.style.cssText = 'padding:4px 10px;font-size:11px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;transition:background 150ms ease;color:#374151;';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(value).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      });
    };

    const fillBtn = document.createElement('button');
    fillBtn.textContent = 'Fill ↓';
    fillBtn.style.cssText = 'padding:4px 10px;font-size:11px;background:#eef2ff;color:#4f46e5;border:1px solid #c7d2fe;border-radius:4px;cursor:pointer;transition:background 150ms ease;';
    fillBtn.onclick = () => {
      const field = fields.find(f => f.fieldName === key);
      if (field) {
        ApplyAI.setFieldValue(field.selector, value);
        ApplyAI.showToast(`Filled: ${label}`);
      }
    };

    actions.appendChild(copyBtn);
    actions.appendChild(fillBtn);
    header.appendChild(labelEl);
    header.appendChild(actions);

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.cssText = 'width:100%;min-height:60px;padding:10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;font-family:inherit;resize:vertical;box-sizing:border-box;outline:none;';
    textarea.onfocus = () => { textarea.style.borderColor = '#4f46e5'; };
    textarea.onblur = () => { textarea.style.borderColor = '#d1d5db'; };
    textarea.oninput = () => { content[key] = textarea.value; };

    const charCount = document.createElement('div');
    charCount.style.cssText = 'font-size:11px;color:#9ca3af;text-align:right;margin-top:2px;';
    charCount.textContent = `${value.length} chars`;
    textarea.oninput = () => {
      content[key] = textarea.value;
      charCount.textContent = `${textarea.value.length} chars`;
    };

    item.appendChild(header);
    item.appendChild(textarea);
    item.appendChild(charCount);
    body.appendChild(item);
  });

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector('#applyai-modal-close').onclick = () => overlay.remove();
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  modal.querySelector('#applyai-fill-all').onclick = () => {
    fields.forEach(f => {
      const val = content[f.fieldName];
      if (val !== null && val !== undefined) {
        ApplyAI.setFieldValue(f.selector, String(val));
      }
    });
    ApplyAI.showToast(`Filled ${fieldKeys.length} fields`);
    overlay.remove();
  };

  modal.querySelector('#applyai-copy-all').onclick = () => {
    const text = fieldKeys.map(key => {
      const fieldDef = fields.find(f => f.fieldName === key);
      const label = fieldDef?.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `${label}:\n${content[key]}`;
    }).join('\n\n---\n\n');

    navigator.clipboard.writeText(text).then(() => {
      ApplyAI.showToast('Copied all content to clipboard');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      ApplyAI.showToast('Copied all content to clipboard');
    });
  };

  modal.querySelector('#applyai-regenerate').onclick = () => {
    overlay.remove();
    if (callbacks?.onRegenerate) callbacks.onRegenerate();
  };

  return overlay;
};

ApplyAI.setFieldValue = function (selector, value) {
  const el = document.querySelector(selector);
  if (!el) return false;

  try {
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(el, value);
    } else {
      el.value = value;
    }
  } catch {
    el.value = value;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));

  if (el.tagName === 'SELECT') {
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  return true;
};

ApplyAI.showError = function (message) {
  const existing = document.getElementById('applyai-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'applyai-modal-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '2147483646',
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  });

  const box = document.createElement('div');
  Object.assign(box.style, {
    background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '420px',
    width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  });

  box.innerHTML = `
    <div style="font-size:32px;margin-bottom:12px;">⚠️</div>
    <div style="font-size:15px;color:#1a1a2e;margin-bottom:16px;line-height:1.5;">${message}</div>
    <div style="display:flex;gap:8px;justify-content:center;">
      <button id="applyai-error-retry" style="padding:10px 20px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Retry</button>
      <button id="applyai-error-close" style="padding:10px 20px;background:#f3f4f6;color:#1a1a2e;border:1px solid #d1d5db;border-radius:8px;font-size:14px;cursor:pointer;">Close</button>
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  box.querySelector('#applyai-error-close').onclick = () => overlay.remove();
  box.querySelector('#applyai-error-retry').onclick = () => {
    overlay.remove();
    if (ApplyAI.startFillFlow) ApplyAI.startFillFlow();
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
};
