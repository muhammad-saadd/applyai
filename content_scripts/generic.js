self.ApplyAI = self.ApplyAI || {};

ApplyAI.generic = {
  extractJobData() {
    const h1 = document.querySelector('h1');
    const title = h1?.textContent?.trim() || document.title || '';

    const main = document.querySelector('main') || document.querySelector('article') || document.body;
    const description = main?.innerText?.trim() || '';

    return {
      jobTitle: title,
      company: '',
      location: '',
      employmentType: '',
      jobDescription: description,
      requiredSkills: [],
      responsibilities: []
    };
  },

  extractFormFields() {
    const fields = [];
    const forms = document.querySelectorAll('form');

    const processed = new Set();
    forms.forEach(form => {
      form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea, select').forEach(el => {
        if (processed.has(el)) return;
        processed.add(el);

        const labelEl = form.querySelector(`label[for="${el.id}"]`)
          || el.closest('.field, .form-group, .form-field')?.querySelector('label, .label, .field-label');
        const label = labelEl?.textContent?.trim()
          || el.placeholder
          || el.name
          || el.getAttribute('aria-label')
          || el.id
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
    });

    if (fields.length === 0) {
      document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea, select').forEach(el => {
        if (processed.has(el)) return;
        processed.add(el);

        const label = el.placeholder || el.name || el.getAttribute('aria-label') || el.id || '';
        if (!label) return;

        fields.push({
          fieldName: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
          fieldType: el.tagName.toLowerCase() === 'textarea' ? 'textarea'
            : el.tagName.toLowerCase() === 'select' ? 'select'
            : el.type || 'text',
          selector: ApplyAI.utils.getUniqueSelector(el),
          isRequired: el.required || false,
          label
        });
      });
    }

    return fields;
  }
};
