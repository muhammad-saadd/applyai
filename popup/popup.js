const SUPPORTED_DOMAINS = [
  'ashbyhq.com', 'lever.co', 'greenhouse.io',
  'myworkdayjobs.com', 'smartrecruiters.com'
];

document.addEventListener('DOMContentLoaded', async () => {
  const btnFill = document.getElementById('btn-fill');
  const btnSettings = document.getElementById('btn-settings');
  const jobTitleEl = document.getElementById('job-title');
  const jobCompanyEl = document.getElementById('job-company');
  const statusBadge = document.getElementById('status-badge');
  const warningsEl = document.getElementById('warnings');

  btnSettings.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.url) {
    showNotSupported();
    return;
  }

  const url = new URL(tab.url);
  const isSupported = SUPPORTED_DOMAINS.some(d => url.hostname.includes(d));

  if (!isSupported) {
    showNotSupported();
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'get_page_info' });

    if (response?.isApplicationPage) {
      jobTitleEl.textContent = response.jobData?.jobTitle || 'Unknown Position';
      jobCompanyEl.textContent = response.jobData?.company || '';
      btnFill.disabled = false;

      btnFill.addEventListener('click', () => {
        chrome.tabs.sendMessage(tab.id, { action: 'trigger_fill' }).catch(() => {
          showWarning('Could not trigger fill. Reload the page and try again.');
        });
      });
    } else {
      jobTitleEl.textContent = 'Job listing detected (no application form)';
      btnFill.disabled = true;
    }
  } catch {
    jobTitleEl.textContent = 'Reload the page to activate ApplyAI';
    btnFill.disabled = true;
  }

  updateStatus();

  document.querySelectorAll('.quick-link').forEach(el => {
    el.addEventListener('click', () => {
      const section = el.dataset.section;
      const target = document.getElementById(`section-${section}`);
      if (target) {
        const isVisible = target.style.display !== 'none';
        target.style.display = isVisible ? 'none' : 'block';
      }
    });
  });

  document.getElementById('btn-save-resume')?.addEventListener('click', async () => {
    const text = document.getElementById('quick-resume').value;
    await chrome.storage.local.set({ resumeText: text });
    updateStatus();
    document.getElementById('section-resume').style.display = 'none';
  });

  document.getElementById('btn-save-writing')?.addEventListener('click', async () => {
    const text = document.getElementById('quick-writing').value;
    await chrome.storage.local.set({ writingSample: text });
    document.getElementById('section-writing').style.display = 'none';
  });

  async function updateStatus() {
    const { apiKey, resumeText } = await chrome.storage.local.get(['apiKey', 'resumeText']);
    warningsEl.innerHTML = '';

    let status = 'ready';
    if (!apiKey) {
      status = 'warning';
      showWarning('API key missing. <a href="#" id="warn-apikey" style="color:#4f46e5;text-decoration:underline;">Add API Key →</a>');
    }
    if (!resumeText) {
      status = status === 'warning' ? 'warning' : 'warning';
      showWarning('Resume not set. <a href="#" id="warn-resume" style="color:#4f46e5;text-decoration:underline;">Add Resume →</a>');
    }

    statusBadge.textContent = status === 'ready' ? 'Ready' : 'Needs Setup';
    statusBadge.className = `badge ${status}`;

    document.getElementById('warn-apikey')?.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
    document.getElementById('warn-resume')?.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }

  function showWarning(html) {
    const div = document.createElement('div');
    div.className = 'warning-item';
    div.innerHTML = html;
    warningsEl.appendChild(div);
  }

  function showNotSupported() {
    const container = document.getElementById('page-info');
    container.innerHTML = `
      <div class="not-supported">
        <div class="icon">🔍</div>
        <div class="message">Open a job application page on a supported portal to get started.<br>
        Supported: Greenhouse, Lever, Ashby, Workday, SmartRecruiters</div>
      </div>
    `;
    btnFill.disabled = true;
    statusBadge.textContent = 'N/A';
    statusBadge.className = 'badge';
    document.getElementById('quick-links').style.display = 'none';
  }
});
