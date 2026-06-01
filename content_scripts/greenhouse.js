self.ApplyAI = self.ApplyAI || {};

ApplyAI.greenhouse = {
  extractJobData() {
    const getText = (sel) => document.querySelector(sel)?.textContent?.trim() || '';

    const title = getText('.app-title')
      || getText('.job__title')
      || getText('[data-job-title]')
      || getText('h1');

    const descEl = document.querySelector('#content .job__description')
      || document.querySelector('.job__description')
      || document.querySelector('[data-job-description]');
    const description = descEl?.innerText?.trim() || '';

    const location = getText('.job__location')
      || getText('[data-job-location]');

    const commitment = getText('.job__commitment')
      || getText('[data-job-commitment]');

    return {
      jobTitle: title,
      company: getText('.company-name') || getText('[data-company-name]'),
      location,
      employmentType: commitment,
      jobDescription: description,
      requiredSkills: [],
      responsibilities: []
    };
  },

  extractFormFields() {
    const fields = [];
    const form = document.querySelector('#application_form')
      || document.querySelector('[data-application-form]')
      || document.querySelector('form[action*="application"]');

    if (!form) return fields;

    form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="file"]), textarea, select').forEach(el => {
      const labelEl = form.querySelector(`label[for="${el.id}"]`)
        || el.closest('.field')?.querySelector('label')
        || el.closest('.form-group')?.querySelector('label');
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
