const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Order } = require('../models');
const authRequired = require('../middleware/authRequired');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../images', 'orders');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Уникальное имя файла
    },
});
const upload = multer({ storage });

// Маршрут для списка заказов (редирект на страницу)
router.get('/list-orders', authRequired, (req, res) => {
    res.redirect('/orders/index.html');
});

// Получить список заказов с пагинацией
router.get('/api/orders', authRequired, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Order.findAndCountAll({
            limit,
            offset,
            order: [['id', 'ASC']],
            attributes: ['id', 'client_name', 'order_date', 'total_amount', 'status', 'delivery_address', 'image'], // Исключить jewelry_id
        });

        const totalPages = Math.ceil(count / limit);

        // Форматирование данных
        const formattedOrders = rows.map(order => ({
            id: order.id,
            client_name: order.client_name,
            order_date: order.order_date, // Дата уже в формате YYYY-MM-DD
            total_amount: Math.floor(order.total_amount), // Целое число
            status: order.status,
            delivery_address: order.delivery_address,
            image: order.image ? order.image.replace('/img/', '/images/') : null, // Корректировка пути
        }));

        res.json({
            orders: formattedOrders,
            currentPage: page,
            totalPages,
            totalItems: count,
        });
    } catch (error) {
        console.error('Ошибка при получении заказов:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Получить заказ по ID (для view.html и edit.html)
router.get('/api/view-order/:id', authRequired, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            attributes: ['id', 'client_name', 'order_date', 'total_amount', 'status', 'delivery_address', 'image'], // Исключить jewelry_id
        });
        if (!order) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }
        // Форматирование данных
        const formattedOrder = {
            id: order.id,
            client_name: order.client_name,
            order_date: order.order_date,
            total_amount: Math.floor(order.total_amount), // Целое число
            status: order.status,
            delivery_address: order.delivery_address,
            image: order.image ? order.image.replace('/img/', '/images/') : null, // Корректировка пути
        };
        res.json(formattedOrder);
    } catch (error) {
        console.error('Ошибка при получении заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Создать заказ (API)
router.post('/api/orders', authRequired, async (req, res) => {
    try {
        const { client_name, order_date, total_amount, status, delivery_address, image } = req.body;
        const order = await Order.create({
            client_name,
            order_date,
            total_amount: Math.floor(total_amount), // Целое число
            status,
            delivery_address,
            image: image ? image.replace('/img/', '/images/') : null, // Корректировка пути
        });
        // Форматирование ответа
        const formattedOrder = {
            id: order.id,
            client_name: order.client_name,
            order_date: order.order_date,
            total_amount: order.total_amount,
            status: order.status,
            delivery_address: order.delivery_address,
            image: order.image,
        };
        res.status(201).json(formattedOrder);
    } catch (error) {
        console.error('Ошибка при создании заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Создать заказ (форма)
router.post('/add-order', authRequired, upload.single('image'), async (req, res) => {
    try {
        const { client_name, order_date, total_amount, status, delivery_address } = req.body;
        let image = null;
        if (req.file) {
            image = `/images/orders/${req.file.filename}`; // Используем имя файла, сгенерированное multer
        }
        const order = await Order.create({
            client_name,
            order_date,
            total_amount: Math.floor(total_amount), // Целое число
            status,
            delivery_address,
            image,
        });
        res.redirect('/orders/index.html');
    } catch (error) {
        console.error('Ошибка при создании заказа:', error);
        res.status(500).send('Ошибка сервера: ' + error.message);
    }
});

// Обновить заказ (API)
router.put('/api/orders/:id', authRequired, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }
        const { client_name, order_date, total_amount, status, delivery_address, image } = req.body;
        await order.update({
            client_name,
            order_date,
            total_amount: Math.floor(total_amount), // Целое число
            status,
            delivery_address,
            image: image ? image.replace('/img/', '/images/') : null, // Корректировка пути
        });
        // Форматирование ответа
        const formattedOrder = {
            id: order.id,
            client_name: order.client_name,
            order_date: order.order_date,
            total_amount: order.total_amount,
            status: order.status,
            delivery_address: order.delivery_address,
            image: order.image,
        };
        res.json(formattedOrder);
    } catch (error) {
        console.error('Ошибка при обновлении заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// Обновить заказ (форма)
router.post('/edit-order/:id', authRequired, upload.single('image'), async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) {
            return res.status(404).send('Заказ не найден');
        }
        const { client_name, order_date, total_amount, status, delivery_address } = req.body;
        let image = order.image; // Сохраняем текущее изображение по умолчанию
        if (req.file) {
            image = `/images/orders/${req.file.filename}`; // Используем имя файла, сгенерированное multer
        }
        await order.update({
            client_name,
            order_date,
            total_amount: Math.floor(total_amount), // Целое число
            status,
            delivery_address,
            image,
        });
        res.redirect('/orders/index.html');
    } catch (error) {
        console.error('Ошибка при обновлении заказа:', error);
        res.status(500).send('Ошибка сервера: ' + error.message);
    }
});

// Удалить заказ
router.delete('/delete-order/:id', authRequired, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }
        await order.destroy();
        res.json({ message: 'Заказ удален' });
    } catch (error) {
        console.error('Ошибка при удалении заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

module.exports = router;