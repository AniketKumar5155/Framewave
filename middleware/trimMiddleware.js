const trimmer = require('./utils/trimmer');

const trimMiddleware = (req, res, next) => {
    if (req.body) req.body = trimmer(req.body);
    if (req.query) req.query = trimmer(req.query);
    if (req.params) req.params = trimmer(req.params);
    next();
};

module.exports = trimMiddleware;
