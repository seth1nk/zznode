const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Smartwatch } = require('../models');
const authRequired = require('../middleware/authRequired');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../images', 'smartwatches');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Сохраняем оригинальное имя файла
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });

// Маршрут для списка смарт-часов (редирект на страницу)
router.get('/list-smartwatches', authRequired, (req, res) => {
    res.redirect('/smartwatches/index.html');
});

// Получить список смарт-часов с пагинацией
router.get('/api/smartwatches', authRequired, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Smartwatch.findAndCountAll({
            limit,
            offset,
            order: [['id', 'ASC']],
            attributes: ['id', 'brand', 'model', 'color', 'display_type', 'battery_life', 'price', 'in_stock', 'photo'],
        });

        const totalPages = Math.ceil(count / limit);

        // Форматирование данных
        const formattedSmartwatches = rows.map(item => ({
            id: item.id,
            brand: item.brand,
            model: item.model,
            color: item.color,
            display_type: item.display_type,
            battery_life: item.battery_life,
            price: Math.floor(item.price),
            in_stock: item.in_stock,
            photo: item.photo ? item.photo.replace('/img/', '/images/') : null,
        }));

        res.json({
            smartwatches: formattedSmartwatches,
            currentPage: page,
            totalPages,
            totalItems: count,
        });
    } catch (error) {
        console.error('Ошибка при получении смарт-часов:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Получить смарт-часы по ID
router.get('/api/view-smartwatch/:id', authRequired, async (req, res) => {
    try {
        const smartwatch = await Smartwatch.findByPk(req.params.id, {
            attributes: ['id', 'brand', 'model', 'color', 'display_type', 'battery_life', 'price', 'in_stock', 'photo'],
        });
        if (!smartwatch) {
            return res.status(404).json({ error: 'Смарт-часы не найдены' });
        }
        // Форматирование данных
        const formattedSmartwatch = {
            id: smartwatch.id,
            brand: smartwatch.brand,
            model: smartwatch.model,
            color: smartwatch.color,
            display_type: smartwatch.display_type,
            battery_life: smartwatch.battery_life,
            price: Math.floor(smartwatch.price),
            in_stock: smartwatch.in_stock,
            photo: smartwatch.photo ? smartwatch.photo.replace('/img/', '/images/') : null,
        };
        res.json(formattedSmartwatch);
    } catch (error) {
        console.error('Ошибка при получении смарт-часов:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Создать смарт-часы (API)
router.post('/api/smartwatches', authRequired, async (req, res) => {
    try {
        const { brand, model, color, display_type, battery_life, price, in_stock, photo } = req.body;
        const smartwatch = await Smartwatch.create({
            brand,
            model,
            color,
            display_type,
            battery_life,
            price: Math.floor(price),
            in_stock,
            photo: photo ? photo.replace('/img/', '/images/') : null,
        });
        // Форматирование ответа
        const formattedSmartwatch = {
            id: smartwatch.id,
            brand: smartwatch.brand,
            model: smartwatch.model,
            color: smartwatch.color,
            display_type: smartwatch.display_type,
            battery_life: smartwatch.battery_life,
            price: smartwatch.price,
            in_stock: smartwatch.in_stock,
            photo: smartwatch.photo,
        };
        res.status(201).json(formattedSmartwatch);
    } catch (error) {
        console.error('Ошибка при создании смарт-часов:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Создать смарт-часы (форма)
router.post('/add-smartwatch', authRequired, upload.single('photo'), async (req, res) => {
    console.log('===== REQUEST DATA =====');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    let smartwatch;
    try {
        // Проверка обязательных полей
        const requiredFields = ['brand', 'model', 'color', 'display_type', 'battery_life', 'price'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                throw new Error(`Отсутствует обязательное поле: ${field}`);
            }
        }

        // Парсинг данных
        const { brand, model, color, display_type, battery_life, price } = req.body;
        const inStock = req.body.in_stock === 'on';
        const numericBatteryLife = parseInt(battery_life);
        const numericPrice = parseFloat(price);

        if (isNaN(numericBatteryLife) || isNaN(numericPrice)) {
            throw new Error('Время работы батареи и цена должны быть числами');
        }

        // Создание записи в базе данных
        smartwatch = await Smartwatch.create({
            brand: brand.trim(),
            model: model.trim(),
            color: color.trim(),
            display_type: display_type.trim(),
            battery_life: numericBatteryLife,
            price: Math.floor(numericPrice),
            in_stock: inStock,
            photo: null // Временно устанавливаем null
        });

        // Обработка изображения
        let photoPath = null;
        if (req.file) {
            if (!req.file.path) {
                throw new Error('Не удалось загрузить файл');
            }
            // Путь к файлу уже содержит оригинальное имя
            const newFilePath = path.join(__dirname, '../images', 'smartwatches', req.file.originalname);

            // Проверяем, существует ли файл
            if (!fs.existsSync(newFilePath)) {
                throw new Error('Не удалось сохранить файл');
            }

            // Формируем путь для базы данных
            photoPath = `/images/smartwatches/${req.file.originalname}`;
            await smartwatch.update({ photo: photoPath });
        }

        console.log('Создан смарт-часы:', smartwatch.toJSON());
        res.redirect('/smartwatches/index.html');

    } catch (error) {
        console.error('ПОДРОБНОСТИ ОШИБКИ:', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            file: req.file
        });
        // Удаляем запись при ошибке, если она была создана
        if (smartwatch) {
            await smartwatch.destroy();
        }
        res.status(500).send(`Ошибка при создании смарт-часов: ${error.message}`);
    }
});

// Обновить смарт-часы (API)
router.put('/api/smartwatches/:id', authRequired, async (req, res) => {
    try {
        const smartwatch = await Smartwatch.findByPk(req.params.id);
        if (!smartwatch) {
            return res.status(404).json({ error: 'Смарт-часы не найдены' });
        }
        const { brand, model, color, display_type, battery_life, price, in_stock, photo } = req.body;
        await smartwatch.update({
            brand,
            model,
            color,
            display_type,
            battery_life,
            price: Math.floor(price),
            in_stock,
            photo: photo ? photo.replace('/img/', '/images/') : null,
        });
        // Форматирование ответа
        const formattedSmartwatch = {
            id: smartwatch.id,
            brand: smartwatch.brand,
            model: smartwatch.model,
            color: smartwatch.color,
            display_type: smartwatch.display_type,
            battery_life: smartwatch.battery_life,
            price: smartwatch.price,
            in_stock: smartwatch.in_stock,
            photo: smartwatch.photo,
        };
        res.json(formattedSmartwatch);
    } catch (error) {
        console.error('Ошибка при обновлении смарт-часов:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Обновить смарт-часы (форма)
router.post('/edit-smartwatch/:id', authRequired, upload.single('photo'), async (req, res) => {
    try {
        const smartwatch = await Smartwatch.findByPk(req.params.id);
        if (!smartwatch) {
            return res.status(404).send('Смарт-часы не найдены');
        }
        const { brand, model, color, display_type, battery_life, price, in_stock } = req.body;
        let photoPath = smartwatch.photo;
        if (req.file) {
            // Новый файл уже сохранён с оригинальным именем
            const newFilePath = path.join(__dirname, '../images', 'smartwatches', req.file.originalname);
            if (!fs.existsSync(newFilePath)) {
                throw new Error('Не удалось сохранить файл');
            }
            photoPath = `/images/smartwatches/${req.file.originalname}`;
        }
        await smartwatch.update({
            brand: brand.trim(),
            model: model.trim(),
            color: color.trim(),
            display_type: display_type.trim(),
            battery_life: parseInt(battery_life),
            price: Math.floor(parseFloat(price)),
            in_stock: in_stock === 'on',
            photo: photoPath,
        });
        res.redirect('/smartwatches/index.html');
    } catch (error) {
        console.error('Ошибка при обновлении смарт-часов:', error);
        res.status(500).send(`Ошибка сервера: ${error.message}`);
    }
});

// Удалить смарт-часы
router.delete('/delete-smartwatch/:id', authRequired, async (req, res) => {
    try {
        const smartwatch = await Smartwatch.findByPk(req.params.id);
        if (!smartwatch) {
            return res.status(404).json({ error: 'Смарт-часы не найдены' });
        }
        // Связанный файл не удаляем, так как он может использоваться другими записями
        await smartwatch.destroy();
        res.json({ message: 'Смарт-часы удалены' });
    } catch (error) {
        console.error('Ошибка при удалении смарт-часов:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

module.exports = router;