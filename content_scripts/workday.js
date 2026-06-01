self.ApplyAI = self.ApplyAI || {};

ApplyAI.workday = {
  _jobData: null,
  _fields: null,
  _observer: null,

  extractJobData() {
    const getText = (sel) => document.querySelector(sel)?.textContent?.trim() || '';

    const title = getText('[data-automation-id="jobPostingHeader"]')
      || getText('[data-automation-id="jobPostingTitle"]')
      || getText('h1[data-automation-id]')
      || getText('h1');

    const descEl = document.querySelector('[data-automation-id="jobPostingDescription"]')
      || document.querySelector('[data-automation-id="job-description"]');
    const description = descEl?.innerText?.trim() || '';

    const location = getText('[data-automation-id="jobPostingLocation"]')
      || getText('[data-automation-id="location"]');

    return {
      jobTitle: title,
      company: getText('[data-automation-id="companyName"]'),
      location,
      employmentType: '',
      jobDescription: description,
      requiredSkills: [],
      responsibilities: []
    };
  },

  extractFormFields() {
    const fields = [];
    const form = document.querySelector('[data-automation-id="applicationForm"]')
      || document.querySelector('[data-automation-id="apply-form"]')
      || document.querySelector('.wd-application-form');

    const inputs = form
      ? form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="file"]), textarea, select')
      : document.querySelectorAll('[data-automation-id] input:not([type="hidden"]):not([type="submit"]):not([type="file"]), [data-automation-id] textarea, [data-automation-id] select');

    inputs.forEach(el => {
      const labelEl = el.closest('[data-automation-id]')
        ?.querySelector('[data-automation-id="label"], label');
      const label = labelEl?.textContent?.trim()
        || el.placeholder
        || el.name
        || el.getAttribute('aria-label')
        || '';
      if (!label) return;

      fields.push({
        fieldName: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        fieldType: el.tagName.toLowerCase() === 'textarea' ? 'textarea'
          : el.tagName.toLowerCase() === 'select' ? 'select'
          : el.type || 'text',
        selector: ApplyAI.utils.getUniqueSelector(el),
        isRequired: el.required || el.getAttribute('aria-required') === 'true',
        label
      });
    });

    return fields;
  },

  waitForForm(callback) {
    if (this._observer) this._observer.disconnect();

    const check = () => {
      const fields = this.extractFormFields();
      if (fields.length > 0) {
        if (this._observer) this._observer.disconnect();
        callback(fields);
        return true;
      }
      return false;
    };

    if (check()) return;

    this._observer = new MutationObserver(() => {
      check();
    });
    this._observer.observe(document.body, { childList: true, subtree: true });
  }
};
