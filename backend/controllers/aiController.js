const { callGeminiJSON } = require('../services/groqService');
const supabase = require('../config/db');
const promptBuilder = require('../utils/promptBuilder');

function validateField(res, value, fieldName, minLen = 3, maxLen = 8000) {
    const trimmed = (value || '').toString().trim();
    if (trimmed.length === 0) {
        res.status(400).json({ success: false, message: `${fieldName} cannot be empty.` });
        return false;
    }
    if (trimmed.length < minLen) {
        res.status(400).json({ success: false, message: `${fieldName} is too short.` });
        return false;
    }
    if (trimmed.length > maxLen) {
        res.status(400).json({ success: false, message: `${fieldName} exceeds maximum allowed length (${maxLen} characters).` });
        return false;
    }
    return true;
}

async function processLogAndRespond(req, res, next, prompt, type, inputPayload) {
    try {
        const aiResponse = await callGeminiJSON(prompt);

        await supabase.from('email_history').insert([{
            user_id: req.user.id,
            type: type,
            input_data: inputPayload,
            response_data: JSON.stringify(aiResponse),
            created_at: new Date()
        }]);

        res.status(200).json({ success: true, data: aiResponse });
    } catch (error) { next(error); }
}

exports.generateEmail = async (req, res, next) => {
    if (!validateField(res, req.body.context, 'Email context', 10, 2000)) return;
    const prompt = promptBuilder.buildGenerateEmailPrompt(req.body);
    await processLogAndRespond(req, res, next, prompt, 'generation', req.body);
};

exports.improveEmail = async (req, res, next) => {
    if (!validateField(res, req.body.emailText, 'Draft email text', 10, 5000)) return;
    const prompt = promptBuilder.buildImproveEmailPrompt(req.body);
    await processLogAndRespond(req, res, next, prompt, 'improvement', req.body);
};

exports.checkGrammar = async (req, res, next) => {
    if (!validateField(res, req.body.text, 'Text to check', 5, 5000)) return;
    const prompt = promptBuilder.buildGrammarCheckPrompt(req.body);
    await processLogAndRespond(req, res, next, prompt, 'grammar', req.body);
};

exports.changeTone = async (req, res, next) => {
    if (!validateField(res, req.body.text, 'Text to rewrite', 5, 5000)) return;
    const prompt = promptBuilder.buildToneChangePrompt(req.body);
    await processLogAndRespond(req, res, next, prompt, 'tone', req.body);
};

exports.summarizeEmail = async (req, res, next) => {
    if (!validateField(res, req.body.text, 'Email text to summarize', 20, 8000)) return;
    const prompt = promptBuilder.buildSummarizePrompt(req.body);
    await processLogAndRespond(req, res, next, prompt, 'summary', req.body);
};

exports.translateEmail = async (req, res, next) => {
    if (!validateField(res, req.body.text, 'Text to translate', 2, 5000)) return;
    const prompt = promptBuilder.buildTranslatePrompt(req.body);
    await processLogAndRespond(req, res, next, prompt, 'translation', req.body);
};

exports.getHistory = async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('email_history').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
        if (error) throw error;
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};