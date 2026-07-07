const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

exports.register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: 'All inputs parameters required.' });
        }

        const { data: userExists } = await supabase.from('users').select('*').eq('email', email.trim().toLowerCase()).single();
        if (userExists) return res.status(400).json({ success: false, message: 'An account profile already exists with this email address.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data: newUser, error } = await supabase.from('users').insert([
            { email: email.trim().toLowerCase(), password_hash: hashedPassword, name, created_at: new Date() }
        ]).select().single();

        if (error) throw error;

        const token = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ success: true, token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { data: user, error } = await supabase.from('users').select('*').eq('email', email.trim().toLowerCase()).single();
        
        if (!user || error) return res.status(401).json({ success: false, message: 'Invalid authentication credentials.' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid authentication credentials.' });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) { next(error); }
};

exports.getProfile = async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('name, email, title, signature')
            .eq('id', req.user.id)
            .single();

        if (error || !user) return res.status(404).json({ success: false, message: 'Profile not found.' });
        res.status(200).json({ success: true, data: user });
    } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { name, title, signature } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Full name is required.' });
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ name: name.trim(), title: title || null, signature: signature || null })
            .eq('id', req.user.id)
            .select('name, email, title, signature')
            .single();

        if (error) throw error;
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) { next(error); }
};