async function getStorage(keys) {
  return chrome.storage.local.get(keys);
}

async function setStorage(data) {
  return chrome.storage.local.set(data);
}

async function clearStorage(keys) {
  return chrome.storage.local.remove(keys);
}

async function getDefaults() {
  const data = await getStorage([
    'apiKey', 'aiModel', 'resumeText', 'writingSample', 'settings', 'history'
  ]);
  return {
    apiKey: data.apiKey || '',
    aiModel: data.aiModel || 'gpt-4o-mini',
    resumeText: data.resumeText || '',
    writingSample: data.writingSample || '',
    settings: data.settings || {
      autoDetect: true,
      autoFill: false,
      includeCoverLetter: true
    },
    history: data.history || []
  };
}
