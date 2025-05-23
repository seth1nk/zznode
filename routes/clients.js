const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Client } = require('../models');
const authRequired = require('../middleware/authRequired');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../images', 'clients');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Сохраняем оригинальное имя файла
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });

// Маршрут для списка клиентов (редирект на страницу)
router.get('/list-clients', authRequired, (req, res) => {
    res.redirect('/clients/index.html');
});

// Получить список клиентов с пагинацией
router.get('/api/clients', authRequired, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Client.findAndCountAll({
            limit,
            offset,
            order: [['id', 'ASC']],
            attributes: ['id', 'last_name', 'first_name', 'middle_name', 'birth_date', 'email', 'phone', 'is_subscribed', 'photo'],
        });

        const totalPages = Math.ceil(count / limit);

        // Форматирование данных
        const formattedClients = rows.map(item => ({
            id: item.id,
            last_name: item.last_name,
            first_name: item.first_name,
            middle_name: item.middle_name,
            birth_date: item.birth_date,
            email: item.email,
            phone: item.phone,
            is_subscribed: item.is_subscribed,
            photo: item.photo ? item.photo.replace('/img/', '/images/') : null,
        }));

        res.json({
            clients: formattedClients,
            currentPage: page,
            totalPages,
            totalItems: count,
        });
    } catch (error) {
        console.error('Ошибка при получении клиентов:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Получить клиента по ID
router.get('/api/view-client/:id', authRequired, async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id, {
            attributes: ['id', 'last_name', 'first_name', 'middle_name', 'birth_date', 'email', 'phone', 'is_subscribed', 'photo'],
        });
        if (!client) {
            return res.status(404).json({ error: 'Клиент не найден' });
        }
        // Форматирование данных
        const formattedClient = {
            id: client.id,
            last_name: client.last_name,
            first_name: client.first_name,
            middle_name: client.middle_name,
            birth_date: client.birth_date,
            email: client.email,
            phone: client.phone,
            is_subscribed: client.is_subscribed,
            photo: client.photo ? client.photo.replace('/img/', '/images/') : null,
        };
        res.json(formattedClient);
    } catch (error) {
        console.error('Ошибка при получении клиента:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Создать клиента (API)
router.post('/api/clients', authRequired, async (req, res) => {
    try {
        const { last_name, first_name, middle_name, birth_date, email, phone, is_subscribed, photo } = req.body;
        const client = await Client.create({
            last_name,
            first_name,
            middle_name,
            birth_date,
            email,
            phone,
            is_subscribed,
            photo: photo ? photo.replace('/img/', '/images/') : null,
        });
        // Форматирование ответа
        const formattedClient = {
            id: client.id,
            last_name: client.last_name,
            first_name: client.first_name,
            middle_name: client.middle_name,
            birth_date: client.birth_date,
            email: client.email,
            phone: client.phone,
            is_subscribed: client.is_subscribed,
            photo: client.photo,
        };
        res.status(201).json(formattedClient);
    } catch (error) {
        console.error('Ошибка при создании клиента:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Создать клиента (форма)
router.post('/add-client', authRequired, upload.single('photo'), async (req, res) => {
    console.log('===== REQUEST DATA =====');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    let client;
    try {
        // Проверка обязательных полей
        const requiredFields = ['last_name', 'first_name', 'birth_date', 'email'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                throw new Error(`Отсутствует обязательное поле: ${field}`);
            }
        }

        // Парсинг данных
        const { last_name, first_name, middle_name, birth_date, email, phone, is_subscribed } = req.body;
        const isSubscribed = is_subscribed === 'on';

        // Создание записи в базе данных
        client = await Client.create({
            last_name: last_name.trim(),
            first_name: first_name.trim(),
            middle_name: middle_name ? middle_name.trim() : null,
            birth_date,
            email: email.trim(),
            phone: phone ? phone.trim() : null,
            is_subscribed: isSubscribed,
            photo: null // Временно устанавливаем null
        });

        // Обработка изображения
        let photoPath = null;
        if (req.file) {
            if (!req.file.path) {
                throw new Error('Не удалось загрузить файл');
            }
            // Путь к файлу уже содержит оригинальное имя (file.originalname)
            const newFilePath = path.join(__dirname, '../images', 'clients', req.file.originalname);

            // Проверяем, существует ли файл
            if (!fs.existsSync(newFilePath)) {
                throw new Error('Не удалось сохранить файл');
            }

            // Формируем путь для базы данных
            photoPath = `/images/clients/${req.file.originalname}`;
            await client.update({ photo: photoPath });
        }

        console.log('Создан клиент:', client.toJSON());
        res.redirect('/clients/index.html');

    } catch (error) {
        console.error('ПОДРОБНОСТИ ОШИБКИ:', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            file: req.file
        });
        // Удаляем запись при ошибке, если она была создана
        if (client) {
            await client.destroy();
        }
        res.status(500).send(`Ошибка при создании клиента: ${error.message}`);
    }
});

// Обновить клиента (API)
router.put('/api/clients/:id', authRequired, async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Клиент не найден' });
        }
        const { last_name, first_name, middle_name, birth_date, email, phone, is_subscribed, photo } = req.body;
        await client.update({
            last_name,
            first_name,
            middle_name,
            birth_date,
            email,
            phone,
            is_subscribed,
            photo: photo ? photo.replace('/img/', '/images/') : null,
        });
        // Форматирование ответа
        const formattedClient = {
            id: client.id,
            last_name: client.last_name,
            first_name: client.first_name,
            middle_name: client.middle_name,
            birth_date: client.birth_date,
            email: client.email,
            phone: client.phone,
            is_subscribed: client.is_subscribed,
            photo: client.photo,
        };
        res.json(formattedClient);
    } catch (error) {
        console.error('Ошибка при обновлении клиента:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Обновить клиента (форма)
router.post('/edit-client/:id', authRequired, upload.single('photo'), async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        if (!client) {
            return res.status(404).send('Клиент не найден');
        }
        const { last_name, first_name, middle_name, birth_date, email, phone, is_subscribed } = req.body;
        let photoPath = client.photo;
        if (req.file) {
            // Новый файл уже сохранён с оригинальным именем
            const newFilePath = path.join(__dirname, '../images', 'clients', req.file.originalname);
            if (!fs.existsSync(newFilePath)) {
                throw new Error('Не удалось сохранить файл');
            }
            photoPath = `/images/clients/${req.file.originalname}`;
        }
        await client.update({
            last_name: last_name.trim(),
            first_name: first_name.trim(),
            middle_name: middle_name ? middle_name.trim() : null,
            birth_date,
            email: email.trim(),
            phone: phone ? phone.trim() : null,
            is_subscribed: is_subscribed === 'on',
            photo: photoPath,
        });
        res.redirect('/clients/index.html');
    } catch (error) {
        console.error('Ошибка при обновлении клиента:', error);
        res.status(500).send(`Ошибка сервера: ${error.message}`);
    }
});

// Удалить клиента
router.delete('/delete-client/:id', authRequired, async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Клиент не найден' });
        }
        // Связанный файл не удаляем, так как он может использоваться другими записями
        await client.destroy();
        res.json({ message: 'Клиент удалён' });
    } catch (error) {
        console.error('Ошибка при удалении клиента:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

module.exports = router;