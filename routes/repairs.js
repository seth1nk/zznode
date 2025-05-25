const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Repair } = require('../models');
const authRequired = require('../middleware/authRequired');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../images', 'repairs');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });

router.get('/list-repairs', authRequired, (req, res) => {
    res.redirect('/repairs/index.html');
});

router.get('/api/repairs', authRequired, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Repair.findAndCountAll({
            limit,
            offset,
            order: [['id', 'ASC']],
            attributes: ['id', 'client_name', 'type', 'brand', 'model', 'issue_description', 'repair_cost', 'status', 'photo'],
        });

        const totalPages = Math.ceil(count / limit);

        const formattedRepairs = rows.map(item => ({
            id: item.id,
            client_name: item.client_name,
            type: item.type,
            brand: item.brand,
            model: item.model,
            issue_description: item.issue_description,
            repair_cost: item.repair_cost,
            status: item.status,
            photo: item.photo ? item.photo.replace('/img/', '/images/') : null,
        }));

        res.json({
            repairs: formattedRepairs,
            currentPage: page,
            totalPages,
            totalItems: count,
        });
    } catch (error) {
        console.error('Ошибка при получении ремонтов:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

router.get('/api/view-repair/:id', authRequired, async (req, res) => {
    try {
        const repair = await Repair.findByPk(req.params.id, {
            attributes: ['id', 'client_name', 'type', 'brand', 'model', 'issue_description', 'repair_cost', 'status', 'photo'],
        });
        if (!repair) {
            return res.status(404).json({ error: 'Ремонт не найден' });
        }
        const formattedRepair = {
            id: repair.id,
            client_name: repair.client_name,
            type: repair.type,
            brand: repair.brand,
            model: repair.model,
            issue_description: repair.issue_description,
            repair_cost: repair.repair_cost,
            status: repair.status,
            photo: repair.photo ? repair.photo.replace('/img/', '/images/') : null,
        };
        res.json(formattedRepair);
    } catch (error) {
        console.error('Ошибка при получении ремонта:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

router.post('/api/repairs', authRequired, async (req, res) => {
    try {
        const { client_name, type, brand, model, issue_description, repair_cost, status, photo } = req.body;
        const repair = await Repair.create({
            client_name,
            type,
            brand,
            model,
            issue_description,
            repair_cost,
            status,
            photo: photo ? photo.replace('/img/', '/images/') : null,
        });
        const formattedRepair = {
            id: repair.id,
            client_name: repair.client_name,
            type: repair.type,
            brand: repair.brand,
            model: repair.model,
            issue_description: repair.issue_description,
            repair_cost: repair.repair_cost,
            status: repair.status,
            photo: repair.photo,
        };
        res.status(201).json(formattedRepair);
    } catch (error) {
        console.error('Ошибка при создании ремонта:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

router.post('/add-repair', authRequired, upload.single('photo'), async (req, res) => {
    let repair;
    try {
        const requiredFields = ['client_name', 'type', 'brand', 'model', 'issue_description', 'repair_cost', 'status'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                throw new Error(`Отсутствует обязательное поле: ${field}`);
            }
        }

        const { client_name, type, brand, model, issue_description, repair_cost, status } = req.body;
        repair = await Repair.create({
            client_name: client_name.trim(),
            type: type.trim(),
            brand: brand.trim(),
            model: model.trim(),
            issue_description: issue_description.trim(),
            repair_cost,
            status,
            photo: null,
        });

        let photoPath = null;
        if (req.file) {
            const newFilePath = path.join(__dirname, '../images', 'repairs', req.file.originalname);
            if (!fs.existsSync(newFilePath)) {
                throw new Error('Не удалось сохранить файл');
            }
            photoPath = `/images/repairs/${req.file.originalname}`;
            await repair.update({ photo: photoPath });
        }

        res.redirect('/repairs/index.html');
    } catch (error) {
        console.error('Ошибка при создании ремонта:', error);
        if (repair) await repair.destroy();
        res.status(500).send(`Ошибка при создании ремонта: ${error.message}`);
    }
});

router.put('/api/repairs/:id', authRequired, async (req, res) => {
    try {
        const repair = await Repair.findByPk(req.params.id);
        if (!repair) {
            return res.status(404).json({ error: 'Ремонт не найден' });
        }
        const { client_name, type, brand, model, issue_description, repair_cost, status, photo } = req.body;
        await repair.update({
            client_name,
            type,
            brand,
            model,
            issue_description,
            repair_cost,
            status,
            photo: photo ? photo.replace('/img/', '/images/') : null,
        });
        const formattedRepair = {
            id: repair.id,
            client_name: repair.client_name,
            type: repair.type,
            brand: repair.brand,
            model: repair.model,
            issue_description: repair.issue_description,
            repair_cost: repair.repair_cost,
            status: repair.status,
            photo: repair.photo,
        };
        res.json(formattedRepair);
    } catch (error) {
        console.error('Ошибка при обновлении ремонта:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

router.post('/edit-repair/:id', authRequired, upload.single('photo'), async (req, res) => {
    try {
        const repair = await Repair.findByPk(req.params.id);
        if (!repair) {
            return res.status(404).send('Ремонт не найден');
        }
        const { client_name, type, brand, model, issue_description, repair_cost, status } = req.body;
        let photoPath = repair.photo;
        if (req.file) {
            const newFilePath = path.join(__dirname, '../images', 'repairs', req.file.originalname);
            if (!fs.existsSync(newFilePath)) {
                throw new Error('Не удалось сохранить файл');
            }
            photoPath = `/images/repairs/${req.file.originalname}`;
        }
        await repair.update({
            client_name: client_name.trim(),
            type: type.trim(),
            brand: brand.trim(),
            model: model.trim(),
            issue_description: issue_description.trim(),
            repair_cost,
            status,
            photo: photoPath,
        });
        res.redirect('/repairs/index.html');
    } catch (error) {
        console.error('Ошибка при обновлении ремонта:', error);
        res.status(500).send(`Ошибка сервера: ${error.message}`);
    }
});

router.delete('/delete-repair/:id', authRequired, async (req, res) => {
    try {
        const repair = await Repair.findByPk(req.params.id);
        if (!repair) {
            return res.status(404).json({ error: 'Ремонт не найден' });
        }
        await repair.destroy();
        res.json({ message: 'Ремонт удален' });
    } catch (error) {
        console.error('Ошибка при удалении ремонта:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

module.exports = router;