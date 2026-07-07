function buildGenerateEmailPrompt({ recipient, purpose, tone, length, language, context, notes }) {
    return `You are an expert professional email writer. Write a complete email based on these parameters:
Recipient: ${recipient || 'Not specified'}
Purpose: ${purpose || 'Not specified'}
Tone: ${tone || 'Professional'}
Desired length: ${length || 'Medium'}
Language: ${language || 'English'}
Context: ${context || 'None provided'}
Additional notes: ${notes || 'None'}

Return ONLY valid JSON. Do not include markdown code blocks or backticks. Use this format:
{
  "subject": "string",
  "body": "string (use \\n for line breaks)",
  "signature": "string"
}`;
}

function buildImproveEmailPrompt({ emailText }) {
    return `You are an expert email editor. Improve the following email text while preserving intent:
"""
${emailText}
"""

Return ONLY valid JSON. Do not include markdown code blocks or backticks. Use this format:
{
  "improvedEmail": "string (use \\n for line breaks)",
  "changesSummary": "string"
}`;
}

function buildGrammarCheckPrompt({ text }) {
    return `You are a professional grammar checker. Analyze this text:
"""
${text}
"""

Return ONLY valid JSON. Do not include markdown code blocks or backticks. Use this format:
{
  "correctedText": "string",
  "mistakes": [{"original": "string", "correction": "string", "explanation": "string"}],
  "confidenceScore": 95
}`;
}

function buildToneChangePrompt({ text, tone }) {
    return `Rewrite the following text in an explicit "${tone}" tone profile:
"""
${text}
"""

Return ONLY valid JSON. Do not include markdown code blocks or backticks. Use this format:
{
  "rewrittenText": "string (use \\n for line breaks)"
}`;
}

function buildSummarizePrompt({ text }) {
    return `Analyze and summarize this email body copy completely:
"""
${text}
"""

Return ONLY valid JSON. Do not include markdown code blocks or backticks. Use this format:
{
  "summary": "string",
  "keyPoints": ["string"],
  "actionItems": ["string"]
}`;
}

function buildTranslatePrompt({ text, targetLanguage }) {
    return `Translate the following text into ${targetLanguage}:
"""
${text}
"""

Return ONLY valid JSON. Do not include markdown code blocks or backticks. Use this format:
{
  "translatedText": "string (use \\n for line breaks)"
}`;
}

module.exports = {
    buildGenerateEmailPrompt,
    buildImproveEmailPrompt,
    buildGrammarCheckPrompt,
    buildToneChangePrompt,
    buildSummarizePrompt,
    buildTranslatePrompt
};