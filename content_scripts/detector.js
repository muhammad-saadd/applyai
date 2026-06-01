self.ApplyAI = self.ApplyAI || {};

ApplyAI.utils = ApplyAI.utils || {};

ApplyAI.utils.getUniqueSelector = function (el) {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const attrs = ['data-automation-id', 'data-testid', 'name', 'aria-label'];
  for (const attr of attrs) {
    const val = el.getAttribute(attr);
    if (val) return `[${attr}="${val.replace(/"/g, '\\"')}"]`;
  }

  const path = [];
  let current = el;
  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      path.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(c => c && !c.startsWith('applyai') && !c.startsWith('_'));
      if (classes.length > 0) {
        selector += '.' + classes.map(c => CSS.escape(c)).join('.');
      }
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
      if (siblings.length > 1 || (current.className && !current.id)) {
        const allSiblings = Array.from(parent.children);
        const index = allSiblings.indexOf(current);
        if (index >= 0) {
          selector += `:nth-child(${index + 1})`;
        }
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
};

ApplyAI.detectPortal = function () {
  const host = window.location.hostname;
  if (host.includes('ashbyhq.com')) return 'ashby';
  if (host.includes('lever.co')) return 'lever';
  if (host.includes('greenhouse.io')) return 'greenhouse';
  if (host.includes('myworkdayjobs.com')) return 'workday';
  if (host.includes('smartrecruiters.com')) return 'smartrecruiters';
  return 'generic';
};

ApplyAI.getExtractor = function () {
  return ApplyAI[ApplyAI.portal];
};

let _bannerEl = null;

ApplyAI.showBanner = function () {
  if (_bannerEl) return;

  const banner = document.createElement('div');
  banner.id = 'applyai-banner';
  Object.assign(banner.style, {
    position: 'fixed', top: '0', left: '0', right: '0', height: '48px',
    zIndex: '2147483645', background: 'rgba(79,70,229,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
    padding: '0 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '14px', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    transform: 'translateY(-100%)', transition: 'transform 200ms ease'
  });

  banner.innerHTML = `
    <span style="font-weight:500;">ApplyAI: Job application detected.</span>
    <button id="applyai-banner-fill" style="padding:6px 16px;background:#fff;color:#4f46e5;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity 150ms;">Fill with AI ▶</button>
    <button id="applyai-banner-close" style="background:rgba(255,255,255,0.2);border:none;color:#fff;font-size:18px;cursor:pointer;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;transition:background 150ms;">×</button>
  `;

  document.body.prepend(banner);

  requestAnimationFrame(() => {
    banner.style.transform = 'translateY(0)';
  });

  document.getElementById('applyai-banner-fill').onclick = () => {
    ApplyAI.startFillFlow();
  };

  document.getElementById('applyai-banner-close').onclick = () => {
    banner.style.transform = 'translateY(-100%)';
    setTimeout(() => banner.remove(), 200);
    _bannerEl = null;
  };

  _bannerEl = banner;
};

ApplyAI.removeBanner = function () {
  if (_bannerEl) {
    _bannerEl.remove();
    _bannerEl = null;
  }
};

ApplyAI.startFillFlow = async function () {
  const ext = ApplyAI.getExtractor();
  if (!ext) {
    ApplyAI.showError('Unrecognized job portal.');
    return;
  }

  ApplyAI.jobData = ext.extractJobData();
  ApplyAI.fields = ext.extractFormFields();

  if (ApplyAI.fields.length === 0) {
    ApplyAI.showError('Could not detect form fields on this page.');
    return;
  }

  const { settings } = await chrome.storage.local.get('settings');
  ApplyAI.settings = settings || {};

  chrome.runtime.sendMessage({
    action: 'generate_content',
    payload: {
      jobData: ApplyAI.jobData,
      fieldsToFill: ApplyAI.fields
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      ApplyAI.showError('Connection error. Please try again.');
      return;
    }
    if (!response) {
      ApplyAI.showError('No response from background service.');
      return;
    }
    if (response.error) {
      ApplyAI.showError(response.error);
      return;
    }

    if (ApplyAI.settings.autoFill) {
      ApplyAI.fields.forEach(f => {
        const val = response.content[f.fieldName];
        if (val !== null && val !== undefined) {
          ApplyAI.setFieldValue(f.selector, String(val));
        }
      });
      const filledCount = Object.keys(response.content).filter(k => response.content[k] !== null).length;
      ApplyAI.showToast(`ApplyAI filled ${filledCount} fields`);
    } else {
      ApplyAI.showModal(response.content, ApplyAI.fields, {
        onRegenerate() {
          ApplyAI.startFillFlow();
        }
      });
    }
  });
};

async function init() {
  ApplyAI.portal = ApplyAI.detectPortal();
  const ext = ApplyAI.getExtractor();
  if (!ext) return;

  const fields = ext.extractFormFields();
  if (!fields || fields.length === 0) return;

  ApplyAI.fields = fields;
  ApplyAI.jobData = ext.extractJobData();

  try {
    const { settings } = await chrome.storage.local.get('settings');
    ApplyAI.settings = settings || {};

    if (ApplyAI.settings.autoDetect !== false) {
      ApplyAI.showBanner();
    }
  } catch {
    ApplyAI.settings = { autoDetect: true, autoFill: false, includeCoverLetter: true };
    ApplyAI.showBanner();
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'trigger_fill':
      ApplyAI.startFillFlow();
      sendResponse({ success: true });
      break;
    case 'get_page_info':
      sendResponse({
        portal: ApplyAI.portal,
        jobData: ApplyAI.jobData || null,
        fields: ApplyAI.fields || [],
        isApplicationPage: !!(ApplyAI.fields && ApplyAI.fields.length > 0)
      });
      break;
  }
});

let _lastUrl = location.href;
const _urlObserver = new MutationObserver(() => {
  const url = location.href;
  if (url !== _lastUrl) {
    _lastUrl = url;
    ApplyAI.removeBanner();
    setTimeout(init, 500);
  }
});
_urlObserver.observe(document, { subtree: true, childList: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
