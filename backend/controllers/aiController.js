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

async function fetchWritingSamples(userId) {
    const { data } = await supabase
        .from('users')
        .select('writing_sample_1, writing_sample_2, writing_sample_3')
        .eq('id', userId)
        .single();

    if (!data) return '';
    return [data.writing_sample_1, data.writing_sample_2, data.writing_sample_3]
        .filter(Boolean)
        .join('\n\n---\n\n');
}

exports.generateEmail = async (req, res, next) => {
    if (!validateField(res, req.body.context, 'Email context', 10, 2000)) return;

    let writingSamples = '';
    if (req.body.matchStyle) {
        writingSamples = await fetchWritingSamples(req.user.id);
    }

    const prompt = promptBuilder.buildGenerateEmailPrompt({ ...req.body, writingSamples });
    await processLogAndRespond(req, res, next, prompt, 'generation', req.body);
};

exports.improveEmail = async (req, res, next) => {
    if (!validateField(res, req.body.emailText, 'Draft email text', 10, 5000)) return;

    let writingSamples = '';
    if (req.body.matchStyle) {
        writingSamples = await fetchWritingSamples(req.user.id);
    }

    const prompt = promptBuilder.buildImproveEmailPrompt({ ...req.body, writingSamples });
    await processLogAndRespond(req, res, next, prompt, 'improvement', req.body);
};


exports.smartReply = async (req, res, next) => {
    if (!validateField(res, req.body.receivedEmail, 'Received email text', 10, 5000)) return;
    const prompt = promptBuilder.buildSmartReplyPrompt(req.body);
    await processLogAndRespond(req, res, next, prompt, 'smart_reply', req.body);
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

exports.getAnalytics = async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('email_history').select('type').eq('user_id', req.user.id);
        if (error) throw error;

        const counts = {
            generation: 0,
            grammar: 0,
            translation: 0,
            summary: 0,
            tone: 0,
            smart_reply: 0,
            improvement: 0
        };

        data.forEach(item => {
            if (counts.hasOwnProperty(item.type)) counts[item.type]++;
        });

        res.status(200).json({
            success: true,
            data: {
                totalGenerated: counts.generation,
                totalGrammarChecks: counts.grammar,
                totalTranslations: counts.translation,
                totalSummaries: counts.summary,
                totalToneRewrites: counts.tone,
                totalSmartReplies: counts.smart_reply,
                totalRequests: data.length
            }
        });
    } catch (error) { next(error); }
};

exports.deleteHistoryItem = async (req, res, next) => {
    try {
        const { error } = await supabase.from('email_history').delete().eq('id', req.params.id).eq('user_id', req.user.id);
        if (error) throw error;
        res.status(200).json({ success: true, message: 'History item deleted.' });
    } catch (error) { next(error); }
};

exports.renameHistoryItem = async (req, res, next) => {
    try {
        const { customTitle } = req.body;
        if (!customTitle || !customTitle.trim()) {
            return res.status(400).json({ success: false, message: 'Title cannot be empty.' });
        }
        const { data, error } = await supabase
            .from('email_history')
            .update({ custom_title: customTitle.trim() })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();
        if (error) throw error;
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

exports.toggleFavorite = async (req, res, next) => {
    try {
        const { data: current, error: fetchError } = await supabase
            .from('email_history')
            .select('is_favorite')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();
        if (fetchError) throw fetchError;

        const { data, error } = await supabase
            .from('email_history')
            .update({ is_favorite: !current.is_favorite })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();
        if (error) throw error;
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};