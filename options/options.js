document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get([
    'apiKey', 'aiModel', 'resumeText', 'writingSample', 'settings'
  ]);

  const settings = data.settings || { autoDetect: true, autoFill: false, includeCoverLetter: true };

  document.getElementById('api-key').value = data.apiKey || '';
  document.getElementById('ai-model').value = data.aiModel || 'gpt-4o-mini';
  document.getElementById('resume-text').value = data.resumeText || '';
  document.getElementById('writing-sample').value = data.writingSample || '';
  document.getElementById('auto-detect').checked = settings.autoDetect !== false;
  document.getElementById('auto-fill').checked = settings.autoFill === true;
  document.getElementById('include-cover-letter').checked = settings.includeCoverLetter !== false;

  updateResumePreview(data.resumeText || '');
  updateCharCounter();

  document.getElementById('writing-sample').addEventListener('input', updateCharCounter);

  document.getElementById('toggle-key-visibility').addEventListener('click', () => {
    const input = document.getElementById('api-key');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btn-save-api').addEventListener('click', async () => {
    const apiKey = document.getElementById('api-key').value.trim();
    const aiModel = document.getElementById('ai-model').value;
    await chrome.storage.local.set({ apiKey, aiModel });
    showFeedback('save-api-feedback', 'Settings saved.', 'success');
  });

  document.getElementById('btn-save-resume').addEventListener('click', async () => {
    const resumeText = document.getElementById('resume-text').value.trim();
    await chrome.storage.local.set({ resumeText });
    updateResumePreview(resumeText);
    showFeedback('save-resume-feedback', 'Resume saved.', 'success');
  });

  document.getElementById('btn-clear-resume').addEventListener('click', async () => {
    await chrome.storage.local.set({ resumeText: '' });
    document.getElementById('resume-text').value = '';
    document.getElementById('resume-preview').style.display = 'none';
    showFeedback('save-resume-feedback', 'Resume cleared.', 'success');
  });

  document.getElementById('resume-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await readFile(file);
      document.getElementById('resume-text').value = text;
      showFeedback('save-resume-feedback', 'File loaded. Click "Save Resume" to store it.', 'success');
    } catch (err) {
      showFeedback('save-resume-feedback', 'Could not read file. Try pasting the text manually.', 'error');
    }
  });

  document.getElementById('btn-save-writing').addEventListener('click', async () => {
    const writingSample = document.getElementById('writing-sample').value.trim();
    await chrome.storage.local.set({ writingSample });
    showFeedback('save-writing-feedback', 'Writing sample saved.', 'success');
  });

  document.getElementById('btn-clear-writing').addEventListener('click', async () => {
    await chrome.storage.local.set({ writingSample: '' });
    document.getElementById('writing-sample').value = '';
    updateCharCounter();
    showFeedback('save-writing-feedback', 'Writing sample cleared.', 'success');
  });

  document.getElementById('btn-save-behavior').addEventListener('click', async () => {
    const settings = {
      autoDetect: document.getElementById('auto-detect').checked,
      autoFill: document.getElementById('auto-fill').checked,
      includeCoverLetter: document.getElementById('include-cover-letter').checked
    };
    await chrome.storage.local.set({ settings });
    showFeedback('save-behavior-feedback', 'Settings saved.', 'success');
  });

  function showFeedback(id, message, type) {
    const el = document.getElementById(id);
    el.textContent = message;
    el.className = `feedback ${type}`;
    setTimeout(() => { el.textContent = ''; el.className = 'feedback'; }, 3000);
  }

  function updateResumePreview(text) {
    const preview = document.getElementById('resume-preview');
    const previewText = document.getElementById('resume-preview-text');
    if (text) {
      preview.style.display = 'block';
      previewText.textContent = text.length > 300 ? text.substring(0, 300) + '...' : text;
    } else {
      preview.style.display = 'none';
    }
  }

  function updateCharCounter() {
    const text = document.getElementById('writing-sample').value;
    document.getElementById('writing-chars').textContent = text.length;
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (file.name.endsWith('.pdf')) {
          resolve(extractTextFromPDF(e.target.result));
        } else {
          resolve(e.target.result);
        }
      };
      reader.onerror = () => reject(new Error('File read failed'));

      if (file.name.endsWith('.pdf')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  function extractTextFromPDF(arrayBuffer) {
    try {
      const text = new TextDecoder('utf-8').decode(arrayBuffer);
      const matches = [];
      const regex = /\(([^)]*)\)/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const content = match[1].trim();
        if (content.length > 3) {
          matches.push(content);
        }
      }
      return matches.join('\n');
    } catch {
      return '[PDF text extraction limited. Please paste text manually.]';
    }
  }
});
