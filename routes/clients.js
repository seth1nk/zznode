const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Client } = require('../models');
const authRequired = require('../middleware/authRequired');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../images', 'clients');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });

router.get('/list-clients', authRequired, (req, res) => {
    res.redirect('/clients/index.html');
});

router.get('/api/clients', authRequired, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Client.findAndCountAll({
            limit,
            offset,
            order: [['id', 'ASC']],
            attributes: ['id', 'first_name', 'last_name', 'phone', 'email', 'address', 'birth_date', 'notes', 'photo'],
        });

        const totalPages = Math.ceil(count / limit);

        const formattedClients = rows.map(item => ({
            id: item.id,
            first_name: item.first_name,
            last_name: item.last_name,
            phone: item.phone,
            email: item.email,
            address: item.address,
            birth_date: item.birth_date,
            notes: item.notes,
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

router.get('/api/view-client/:id', authRequired, async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id, {
            attributes: ['id', 'first_name', 'last_name', 'phone', 'email', 'address', 'birth_date', 'notes', 'photo'],
        });
        if (!client) {
            return res.status(404).json({ error: 'Клиент не найден' });
        }
        const formattedClient = {
            id: client.id,
            first_name: client.first_name,
            last_name: client.last_name,
            phone: client.phone,
            email: client.email,
            address: client.address,
            birth_date: client.birth_date,
            notes: client.notes,
            photo: client.photo ? client.photo.replace('/img/', '/images/') : null,
        };
        res.json(formattedClient);
    } catch (error) {
        console.error('Ошибка при получении клиента:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

router.post('/api/clients', authRequired, async (req, res) => {
    try {
        const { first_name, last_name, phone, email, address, birth_date, notes, photo } = req.body;
        const client = await Client.create({
            first_name,
            last_name,
            phone,
            email,
            address,
            birth_date,
            notes,
            photo: photo ? photo.replace('/img/', '/images/') : null,
        });
        const formattedClient = {
            id: client.id,
            first_name: client.first_name,
            last_name: client.last_name,
            phone: client.phone,
            email: client.email,
            address: client.address,
            birth_date: client.birth_date,
            notes: client.notes,
            photo: client.photo,
        };
        res.status(201).json(formattedClient);
    } catch (error) {
        console.error('Ошибка при создании клиента:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

router.post('/add-client', authRequired, upload.single('photo'), async (req, res) => {
    let client;
    try {
        const requiredFields = ['first_name', 'last_name', 'phone'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                throw new Error(`Отсутствует обязательное поле: ${field}`);
            }
        }

        const { first_name, last_name, phone, email, address, birth_date, notes } = req.body;
        client = await Client.create({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            phone: phone.trim(),
            email: email ? email.trim() : null,
            address: address ? address.trim() : null,
            birth_date: birth_date || null,
            notes: notes ? notes.trim() : null,
            photo: null
        });

        let photoPath = null;
        if (req.file) {
            const newFilePath = path.join(__dirname, '../images', 'clients', req.file.originalname);
            if (!fs.existsSync(newFilePath)) {
                throw new Error('Не удалось сохранить файл');
            }
            photoPath = `/images/clients/${req.file.originalname}`;
            await client.update({ photo: photoPath });
        }

        res.redirect('/clients/index.html');
    } catch (error) {
        console.error('Ошибка при создании клиента:', error);
        if (client) await client.destroy();
        res.status(500).send(`Ошибка при создании клиента: ${error.message}`);
    }
});

router.put('/api/clients/:id', authRequired, async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Клиент не найден' });
        }
        const { first_name, last_name, phone, email, address, birth_date, notes, photo } = req.body;
        await client.update({
            first_name,
            last_name,
            phone,
            email,
            address,
            birth_date,
            notes,
            photo: photo ? photo.replace('/img/', '/images/') : null,
        });
        const formattedClient = {
            id: client.id,
            first_name: client.first_name,
            last_name: client.last_name,
            phone: client.phone,
            email: client.email,
            address: client.address,
            birth_date: client.birth_date,
            notes: client.notes,
            photo: client.photo,
        };
        res.json(formattedClient);
    } catch (error) {
        console.error('Ошибка при обновлении клиента:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

router.post('/edit-client/:id', authRequired, upload.single('photo'), async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        if (!client) {
            return res.status(404).send('Клиент не найден');
        }
        const { first_name, last_name, phone, email, address, birth_date, notes } = req.body;
        let photoPath = client.photo;
        if (req.file) {
            const newFilePath = path.join(__dirname, '../images', 'clients', req.file.originalname);
            if (!fs.existsSync(newFilePath)) {
                throw new Error('Не удалось сохранить файл');
            }
            photoPath = `/images/clients/${req.file.originalname}`;
        }
        await client.update({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            phone: phone.trim(),
            email: email ? email.trim() : null,
            address: address ? address.trim() : null,
            birth_date: birth_date || null,
            notes: notes ? notes.trim() : null,
            photo: photoPath,
        });
        res.redirect('/clients/index.html');
    } catch (error) {
        console.error('Ошибка при обновлении клиента:', error);
        res.status(500).send(`Ошибка сервера: ${error.message}`);
    }
});

router.delete('/delete-client/:id', authRequired, async (req, res) => {
    try {
        const client = await Client.findByPk(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Клиент не найден' });
        }
        await client.destroy();
        res.json({ message: 'Клиент удален' });
    } catch (error) {
        console.error('Ошибка при удалении клиента:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

module.exports = router;