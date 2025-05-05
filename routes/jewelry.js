const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Jewelry } = require('../models');
const authRequired = require('../middleware/authRequired');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../images', 'jewelry');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Уникальное имя файла
    },
});
const upload = multer({ storage });

// Маршрут для списка ювелирных изделий (редирект на страницу)
router.get('/list-jewelry', authRequired, (req, res) => {
    res.redirect('/jewelry/index.html');
});

// Получить список ювелирных изделий с пагинацией
router.get('/api/jewelry', authRequired, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Jewelry.findAndCountAll({
            limit,
            offset,
            order: [['id', 'ASC']],
            attributes: ['id', 'name', 'category', 'material', 'weight', 'price', 'in_stock', 'image'],
        });

        const totalPages = Math.ceil(count / limit);

        // Форматирование данных
        const formattedJewelry = rows.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            material: item.material,
            weight: Math.floor(item.weight),
            price: Math.floor(item.price),
            in_stock: item.in_stock,
            image: item.image ? item.image.replace('/img/', '/images/') : null,
        }));

        res.json({
            jewelry: formattedJewelry,
            currentPage: page,
            totalPages,
            totalItems: count,
        });
    } catch (error) {
        console.error('Ошибка при получении ювелирных изделий:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Получить ювелирное изделие по ID
router.get('/api/view-jewelry/:id', authRequired, async (req, res) => {
    try {
        const jewelry = await Jewelry.findByPk(req.params.id, {
            attributes: ['id', 'name', 'category', 'material', 'weight', 'price', 'in_stock', 'image'],
        });
        if (!jewelry) {
            return res.status(404).json({ error: 'Ювелирное изделие не найдено' });
        }
        // Форматирование данных
        const formattedJewelry = {
            id: jewelry.id,
            name: jewelry.name,
            category: jewelry.category,
            material: jewelry.material,
            weight: Math.floor(jewelry.weight),
            price: Math.floor(jewelry.price),
            in_stock: jewelry.in_stock,
            image: jewelry.image ? jewelry.image.replace('/img/', '/images/') : null,
        };
        res.json(formattedJewelry);
    } catch (error) {
        console.error('Ошибка при получении ювелирного изделия:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Создать ювелирное изделие (API)
router.post('/api/jewelry', authRequired, async (req, res) => {
    try {
        const { name, category, material, weight, price, in_stock, image } = req.body;
        const jewelry = await Jewelry.create({
            name,
            category,
            material,
            weight: Math.floor(weight),
            price: Math.floor(price),
            in_stock,
            image: image ? image.replace('/img/', '/images/') : null,
        });
        // Форматирование ответа
        const formattedJewelry = {
            id: jewelry.id,
            name: jewelry.name,
            category: jewelry.category,
            material: jewelry.material,
            weight: jewelry.weight,
            price: jewelry.price,
            in_stock: jewelry.in_stock,
            image: jewelry.image,
        };
        res.status(201).json(formattedJewelry);
    } catch (error) {
        console.error('Ошибка при создании ювелирного изделия:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

router.post('/add-jewelry', authRequired, upload.single('image'), async (req, res) => {
    try {
        const { name, category, material, weight, price, in_stock } = req.body;
        
        // Проверка обязательных полей
        if (!name || !category || !material || !weight || !price) {
            return res.status(400).send('Не все обязательные поля заполнены');
        }

        // Обработка checkbox (может приходить как 'on' или undefined)
        const inStock = req.body.in_stock === 'on';
        
        // Обработка веса и цены (преобразование в числа)
        const numericWeight = parseFloat(weight);
        const numericPrice = parseFloat(price);
        
        // Обработка изображения
        let imagePath = null;
        if (req.file) {
            imagePath = `/images/jewelry/${req.file.filename}`;
        }

        // Создание записи
        await Jewelry.create({
            name,
            category,
            material,
            weight: Math.floor(numericWeight),
            price: Math.floor(numericPrice),
            in_stock: inStock,
            image: imagePath
        });

        res.redirect('/jewelry/index.html');
    } catch (error) {
        console.error('Ошибка при создании ювелирного изделия:', error);
        res.status(500).send(`Ошибка сервера: ${error.message}`);
    }
});

// Обновить ювелирное изделие (API)
router.put('/api/jewelry/:id', authRequired, async (req, res) => {
    try {
        const jewelry = await Jewelry.findByPk(req.params.id);
        if (!jewelry) {
            return res.status(404).json({ error: 'Ювелирное изделие не найдено' });
        }
        const { name, category, material, weight, price, in_stock, image } = req.body;
        await jewelry.update({
            name,
            category,
            material,
            weight: Math.floor(weight),
            price: Math.floor(price),
            in_stock,
            image: image ? image.replace('/img/', '/images/') : null,
        });
        // Форматирование ответа
        const formattedJewelry = {
            id: jewelry.id,
            name: jewelry.name,
            category: jewelry.category,
            material: jewelry.material,
            weight: jewelry.weight,
            price: jewelry.price,
            in_stock: jewelry.in_stock,
            image: jewelry.image,
        };
        res.json(formattedJewelry);
    } catch (error) {
        console.error('Ошибка при обновлении ювелирного изделия:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Обновить ювелирное изделие (форма)
router.post('/edit-jewelry/:id', authRequired, upload.single('image'), async (req, res) => {
    try {
        const jewelry = await Jewelry.findByPk(req.params.id);
        if (!jewelry) {
            return res.status(404).send('Ювелирное изделие не найдено');
        }
        const { name, category, material, weight, price, in_stock } = req.body;
        let image = jewelry.image;
        if (req.file) {
            image = `/images/jewelry/${req.file.filename}`;
        }
        await jewelry.update({
            name,
            category,
            material,
            weight: Math.floor(weight),
            price: Math.floor(price),
            in_stock: in_stock === 'on',
            image,
        });
        res.redirect('/jewelry/index.html');
    } catch (error) {
        console.error('Ошибка при обновлении ювелирного изделия:', error);
        res.status(500).send('Ошибка сервера: ' + error.message);
    }
});

// Удалить ювелирное изделие
router.delete('/delete-jewelry/:id', authRequired, async (req, res) => {
    try {
        const jewelry = await Jewelry.findByPk(req.params.id);
        if (!jewelry) {
            return res.status(404).json({ error: 'Ювелирное изделие не найдено' });
        }
        await jewelry.destroy();
        res.json({ message: 'Ювелирное изделие удалено' });
    } catch (error) {
        console.error('Ошибка при удалении ювелирного изделия:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

module.exports = router;
