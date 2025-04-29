const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const path = require('path');

router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'register.html'));
});

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'user',
        });

        res.status(201).json({ message: 'Регистрация успешна!', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Ошибка при регистрации:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'login.html'));
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Неверный email или пароль' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверный email или пароль' });
        }

        const secret = process.env.JWT_SECRET || 'your_secret_key'; // Используйте переменную окружения!

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            secret,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 1 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production', // true для production
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax' // None для production
        });
        res.json({ message: 'Вход выполнен успешно', token, user: { username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Ошибка при входе:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});


router.get('/logout', (req, res) => {
    try {
        res.clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
        });
        // Redirect может не сработать для API запроса, лучше просто отправить JSON
        res.json({ message: 'Успешно вышли из аккаунта' });
    } catch (err) {
        console.error('Ошибка выхода:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});


// Этот маршрут лучше использовать из вашего Vue приложения
router.post('/logout', (req, res) => {
    try {
        res.clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
        });
        res.json({ message: 'Успешно вышли из аккаунта' });
    } catch (err) {
        console.error('Ошибка выхода:', err);
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

router.get('/check', async (req, res) => {
    const tokenFromHeader = req.headers.authorization?.split(' ')[1];
    const tokenFromCookie = req.cookies.token;
    const token = tokenFromCookie || tokenFromHeader; // Приоритет cookie

    if (!token) {
        return res.status(401).json({ message: 'Требуется авторизация' });
    }

    const secret = process.env.JWT_SECRET || 'your_secret_key'; // Используйте переменную окружения!

    try {
        const decoded = jwt.verify(token, secret);
        const user = await User.findByPk(decoded.userId, {
          attributes: ['username', 'email', 'role'] // Явно указываем нужные поля
        });
        if (!user) {
            // Если токен валидный, но юзера нет, возможно, его удалили
            res.clearCookie('token', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
            });
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json({
            username: user.username,
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        console.error('Ошибка проверки токена:', err.message);
        // Очищаем невалидный или истекший токен
        res.clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
        });

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Токен истек' }); // Используем 401
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Недействительный токен' }); // Используем 401
        }
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

module.exports = router;