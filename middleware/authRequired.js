const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Импортируем из models/index.js

module.exports = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).redirect('/auth/login');

    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] },
        });

        if (!user) return res.status(403).redirect('/auth/login');

        req.user = user;
        next();
    } catch (err) {
        console.error('Ошибка в authRequired:', err);
        return res.status(403).redirect('/auth/login');
    }
};