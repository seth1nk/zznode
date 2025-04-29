const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        // Для API лучше вернуть 401, а не редирект HTML страницы
        if (req.accepts('html')) {
            return res.status(401).redirect('/auth/login'); // Оставляем редирект для запросов от браузера напрямую
        } else {
            return res.status(401).json({ message: 'Требуется авторизация' });
        }
    }

    const secret = process.env.JWT_SECRET || 'your_secret_key'; // Используйте переменную окружения!

    try {
        const decoded = jwt.verify(token, secret);
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] },
        });

        if (!user) {
             res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
            });
            if (req.accepts('html')) {
                 return res.status(403).redirect('/auth/login');
            } else {
                 return res.status(403).json({ message: 'Доступ запрещен (пользователь не найден)' });
            }
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Ошибка в authRequired:', err);
         res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
        });
         if (req.accepts('html')) {
             return res.status(403).redirect('/auth/login');
        } else {
            const message = err.name === 'TokenExpiredError' ? 'Токен истек' : 'Недействительный токен';
             return res.status(401).json({ message }); // Возвращаем 401 при проблемах с токеном
        }
    }
};