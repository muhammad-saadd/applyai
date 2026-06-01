const AI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

async function generateApplicationContent(payload) {
  const { apiKey, model, resumeText, writingSample, jobData, fieldsToFill } = payload;

  const systemPrompt = buildSystemPrompt(writingSample);
  const userPrompt = buildUserPrompt({ resumeText, jobData, fieldsToFill });

  const response = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  const body = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your settings.');
    }
    throw new Error(body.error?.message || `API error: ${response.status}`);
  }

  const text = body.choices?.[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('Failed to parse AI response as JSON.');
    }
  }
  throw new Error('AI response did not contain valid JSON.');
}

function buildSystemPrompt(writingSample) {
  let prompt = `You are an expert job application assistant. Your job is to help candidates write compelling, authentic-sounding application content tailored to the specific role.

The candidate's resume is provided. Analyze their experience and skills against the job requirements and generate content that:
- Highlights the most relevant experience for THIS specific role
- Sounds natural and human, never robotic or generic
- Uses specific examples and numbers from the resume where possible
- Avoids overused phrases like "passionate", "results-driven", "team player"`;

  if (writingSample) {
    prompt += `\n\nIMPORTANT — Tone Matching: The candidate has provided a writing sample. Mirror their vocabulary, sentence length, formality level, and voice as closely as possible. Writing sample:
"""
${writingSample}
"""`;
  }

  prompt += `\n\nRespond ONLY in valid JSON matching the requested schema. No extra text.`;
  return prompt;
}

function buildUserPrompt({ resumeText, jobData, fieldsToFill }) {
  const fieldNames = fieldsToFill.map(f => f.fieldName);
  const fieldTypes = {};
  fieldsToFill.forEach(f => { fieldTypes[f.fieldName] = f.fieldType; });

  return `Resume:
"""
${resumeText}
"""

Job Title: ${jobData.jobTitle || 'N/A'}
Company: ${jobData.company || 'N/A'}
Job Description:
"""
${jobData.jobDescription || ''}
"""

Generate content for each of the following application fields. Return a JSON object where each key is the exact field name and the value is the generated content:
${JSON.stringify(fieldNames)}

Rules:
- For personal fields (first_name, last_name, email, phone, linkedin_url), extract directly from resume text, never hallucinate. Return null if not found in resume.
- For "cover_letter" or "why_this_company" type fields, write 2-3 concise paragraphs.
- For short text fields (summary, headline), keep it under 2 sentences.
- For skill or experience fields, be specific and direct.
- Return ONLY the JSON object, no other text.

Field type hints: ${JSON.stringify(fieldTypes)}`;
}
