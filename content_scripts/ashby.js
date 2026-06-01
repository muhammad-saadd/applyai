self.ApplyAI = self.ApplyAI || {};

ApplyAI.ashby = {
  extractJobData() {
    const getText = (sel) => document.querySelector(sel)?.textContent?.trim() || '';

    const title = getText('h1.ashby-job-posting-heading')
      || getText('[data-testid="job-title"]')
      || getText('.ashby-job-posting-title');

    const description = document.querySelector('div.ashby-job-posting-description')?.innerText?.trim()
      || document.querySelector('[data-testid="job-description"]')?.innerText?.trim()
      || document.querySelector('.ashby-job-posting-description')?.innerText?.trim() || '';

    const location = getText('.ashby-job-posting-location')
      || getText('[data-testid="job-location"]');

    const type = getText('.ashby-job-posting-type')
      || getText('[data-testid="job-type"]');

    return {
      jobTitle: title,
      company: getText('.ashby-company-name') || getText('[data-testid="company-name"]'),
      location,
      employmentType: type,
      jobDescription: description,
      requiredSkills: [],
      responsibilities: []
    };
  },

  extractFormFields() {
    const fields = [];
    const form = document.querySelector('.ashby-application-form')
      || document.querySelector('[data-testid="application-form"]')
      || document.querySelector('form[class*="application"]');

    if (!form) return fields;

    form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="file"]), textarea, select').forEach(el => {
      const labelEl = form.querySelector(`label[for="${el.id}"]`)
        || form.querySelector(`[data-testid="label-${el.name || el.id}"]`);
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
  }
};
