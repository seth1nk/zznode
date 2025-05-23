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
            attributes: ['id', 'device_type', 'device_brand', 'device_model', 'issue_description', 'repair_cost', 'status', 'date', 'photo'],
        });

        const totalPages = Math.ceil(count / limit);

        const formattedRepairs = rows.map(item => ({
            id: item.id,
            device_type: item.device_type,
            device_brand: item.device_brand,
            device_model: item.device_model,
            issue_description: item.issue_description,
            repair_cost: parseFloat(item.repair_cost),
            status: item.status,
            date: item.date,
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
            attributes: ['id', 'device_type', 'device_brand', 'device_model', 'issue_description', 'repair_cost', 'status', 'date', 'photo'],
        });
        if (!repair) {
            return res.status(404).json({ error: 'Ремонт не найден' });
        }
        const formattedRepair = {
            id: repair.id,
            device_type: repair.device_type,
            device_brand: repair.device_brand,
            device_model: repair.device_model,
            issue_description: repair.issue_description,
            repair_cost: parseFloat(repair.repair_cost),
            status: repair.status,
            date: repair.date,
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
        const { device_type, device_brand, device_model, issue_description, repair_cost, status, date, photo } = req.body;
        const repair = await Repair.create({
            device_type,
            device_brand,
            device_model,
            issue_description,
            repair_cost: parseFloat(repair_cost),
            status,
            date,
            photo: photo ? photo.replace('/img/', '/images/') : null,
        });
        const formattedRepair = {
            id: repair.id,
            device_type: repair.device_type,
            device_brand: repair.device_brand,
            device_model: repair.device_model,
            issue_description: repair.issue_description,
            repair_cost: parseFloat(repair.repair_cost),
            status: repair.status,
            date: repair.date,
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
        const requiredFields = ['device_type', 'device_brand', 'device_model', 'issue_description', 'repair_cost', 'status'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                throw new Error(`Отсутствует обязательное поле: ${field}`);
            }
        }

        const { device_type, device_brand, device_model, issue_description, repair_cost, status, date } = req.body;
        const numericRepairCost = parseFloat(repair_cost);
        if (isNaN(numericRepairCost)) {
            throw new Error('Стоимость ремонта должна быть числом');
        }

        repair = await Repair.create({
            device_type: device_type.trim(),
            device_brand: device_brand.trim(),
            device_model: device_model.trim(),
            issue_description: issue_description.trim(),
            repair_cost: numericRepairCost,
            status: status.trim(),
            date: date || null,
            photo: null
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
        const { device_type, device_brand, device_model, issue_description, repair_cost, status, date, photo } = req.body;
        await repair.update({
            device_type,
            device_brand,
            device_model,
            issue_description,
            repair_cost: parseFloat(repair_cost),
            status,
            date,
            photo: photo ? photo.replace('/img/', '/images/') : null,
        });
        const formattedRepair = {
            id: repair.id,
            device_type: repair.device_type,
            device_brand: repair.device_brand,
            device_model: repair.device_model,
            issue_description: repair.issue_description,
            repair_cost: parseFloat(repair.repair_cost),
            status: repair.status,
            date: repair.date,
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
        const { device_type, device_brand, device_model, issue_description, repair_cost, status, date } = req.body;
        let photoPath = repair.photo;
        if (req.file) {
            const newFilePath = path.join(__dirname, '../images', 'repairs', req.file.originalname);
            if (!fs.existsSync(newFilePath)) {
                throw new Error('Не удалось сохранить файл');
            }
            photoPath = `/images/repairs/${req.file.originalname}`;
        }
        await repair.update({
            device_type: device_type.trim(),
            device_brand: device_brand.trim(),
            device_model: device_model.trim(),
            issue_description: issue_description.trim(),
            repair_cost: parseFloat(repair_cost),
            status: status.trim(),
            date: date || null,
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