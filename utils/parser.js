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
    return '';
  }
}

function parseResume(text) {
  const result = {
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    skills: []
  };

  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) result.email = emailMatch[0];

  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) result.phone = phoneMatch[0].trim();

  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
  const linkedinMatch = text.match(linkedinRegex);
  if (linkedinMatch) result.linkedin = 'https://www.' + linkedinMatch[0].toLowerCase();

  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    result.name = lines[0].trim();
  }

  return result;
}

function parseJobDescription(text) {
  const skills = [];
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'typescript', 'sql',
    'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum', 'rest', 'api',
    'machine learning', 'data science', 'frontend', 'backend', 'full-stack',
    'devops', 'ci/cd', 'terraform', 'graphql', 'mongodb', 'postgresql',
    'redis', 'kafka', 'rabbitmq', 'nginx', 'linux', 'css', 'html'
  ];

  const lower = text.toLowerCase();
  skillKeywords.forEach(skill => {
    if (lower.includes(skill)) {
      skills.push(skill);
    }
  });

  return { skills };
}
