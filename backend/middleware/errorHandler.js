function errorHandler(err, req, res, next) {
    console.error(`[System Error Block Logged] ${req.method} ${req.originalUrl} ->`, err.message);

    const status = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' && status === 500
        ? 'A backend platform service conflict occurred. Please retry shortly.'
        : err.message || 'Internal server error';

    res.status(status).json({ success: false, message });
}

function asyncHandler(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };