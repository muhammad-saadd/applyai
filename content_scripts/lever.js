self.ApplyAI = self.ApplyAI || {};

ApplyAI.lever = {
  extractJobData() {
    const getText = (sel) => document.querySelector(sel)?.textContent?.trim() || '';

    const title = getText('.posting-headline h2')
      || getText('.posting-headline h1')
      || getText('[data-qa="posting-title"]');

    const descEl = document.querySelector('.section.page-centered .content')
      || document.querySelector('.posting-description')
      || document.querySelector('[data-qa="posting-description"]');
    const description = descEl?.innerText?.trim() || '';

    const location = getText('.posting-categories .location')
      || getText('[data-qa="posting-location"]');

    const commitment = getText('.posting-categories .commitment')
      || getText('[data-qa="posting-commitment"]');

    const workplace = getText('.posting-categories .workplaceType')
      || '';

    return {
      jobTitle: title,
      company: getText('.posting-company') || getText('[data-qa="posting-company"]'),
      location: [location, workplace].filter(Boolean).join(', '),
      employmentType: commitment,
      jobDescription: description,
      requiredSkills: [],
      responsibilities: []
    };
  },

  extractFormFields() {
    const fields = [];
    const form = document.querySelector('.application-form')
      || document.querySelector('[data-qa="application-form"]')
      || document.querySelector('form.application');

    if (!form) return fields;

    form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="file"]), textarea, select').forEach(el => {
      const labelEl = form.querySelector(`label[for="${el.id}"]`)
        || el.closest('.application-field')?.querySelector('.application-field-label');
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
