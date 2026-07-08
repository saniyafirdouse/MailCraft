function buildGenerateEmailPrompt({ recipient, purpose, tone, length, language, context, notes, writingSamples }) {
    return `You are an expert professional email writer. Write a complete email based on these parameters:
Recipient: ${recipient || 'Not specified'}
Purpose: ${purpose || 'Not specified'}
Tone: ${tone || 'Professional'}
Desired length: ${length || 'Medium'}
Language: ${language || 'English'}
Context: ${context || 'None provided'}
Additional notes: ${notes || 'None'}

${writingSamples ? `The user has provided the following samples of their own personal writing style. Match the sentence rhythm, vocabulary choices, and overall voice of these samples as closely as possible while still fulfilling the request above:\n"""\n${writingSamples}\n"""\n` : ''}
Do NOT invent or include any signature, sender name, job title, GitHub link, or LinkedIn link. The email body should end naturally without a closing signature block — that will be added separately by the platform.

Return ONLY valid JSON. Do not include markdown code blocks or backticks. Use this format:
{
  "subject": "string",
  "body": "string (use \\n for line breaks, do not include a signature block)",
  "signature": ""
}`;
}

function buildSmartReplyPrompt({ receivedEmail, additionalInstructions }) {
    return `You are an expert professional email assistant. A user has received the following email:
"""
${receivedEmail}
"""

${additionalInstructions ? `The user also wants the following point(s) included or addressed in the replies: "${additionalInstructions}"\n` : ''}
Generate exactly 3 distinct reply options for this email, each with a different approach (e.g. one accepting/agreeing, one declining/pushing back, one asking for more information or proposing a follow-up — adapt based on what fits the email). If the user provided additional instructions above, make sure all 3 replies naturally incorporate that point. Keep each reply professional, concise, and ready to send.

Return ONLY valid JSON. Do not include markdown code blocks or backticks. Use this format:
{
  "replies": [
    {"label": "string (short 2-4 word description of this reply's approach)", "text": "string (use \\n for line breaks)"},
    {"label": "string", "text": "string (use \\n for line breaks)"},
    {"label": "string", "text": "string (use \\n for line breaks)"}
  ]
}`;
}

function buildImproveEmailPrompt({ emailText, writingSamples }) {
    return `You are an expert email editor. Improve the following email text while preserving intent:
"""
${emailText}
"""

${writingSamples ? `The user has provided the following samples of their own personal writing style. While improving the email, adjust the phrasing to match the sentence rhythm, vocabulary choices, and overall voice of these samples as closely as possible:\n"""\n${writingSamples}\n"""\n` : ''}
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
    buildSmartReplyPrompt,
    buildImproveEmailPrompt,
    buildGrammarCheckPrompt,
    buildToneChangePrompt,
    buildSummarizePrompt,
    buildTranslatePrompt
};