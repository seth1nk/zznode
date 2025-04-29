const { Sequelize, DataTypes } = require('sequelize');
const { faker } = require('@faker-js/faker/locale/ru');

// Подключение к PostgreSQL (Clever Cloud)
const sequelize = new Sequelize('postgresql://uqhnsy0zoriffb7sednp:EzBtfkqYZhEDeJyh4bBNqCP1VhCdSC@bsgrmqwceckysck4ikkx-postgresql.services.clever-cloud.com:50013/bsgrmqwceckysck4ikkx', {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});

// Импорт модели Jewelry
const Jewelry = require('../models/Jewelry')(sequelize, DataTypes);

// Список категорий и материалов
const categories = ['Кольцо', 'Серьги', 'Браслет', 'Ожерелье', 'Часы'];
const materials = ['Золото', 'Серебро', 'Платина', 'Титан'];

// Список изображений
const images = [
    'kol.jpg',
    'ser.jpg',
    'brasl.jpg',
    'ozher.jpg',
    'clock.jpg',
];

// Функция для создания записей
async function fillJewelryTable(count) {
    try {
        // Синхронизация модели с базой данных
        await sequelize.sync();

        for (let i = 0; i < count; i++) {
            const jewelry = await Jewelry.create({
                name: faker.commerce.productName(),
                category: faker.helpers.arrayElement(categories),
                material: faker.helpers.arrayElement(materials),
                weight: faker.number.int({ min: 1, max: 100 }),
                price: faker.number.int({ min: 1000, max: 100000 }),
                in_stock: faker.datatype.boolean(),
                image: `/images/jewelry/${faker.helpers.arrayElement(images)}`,
            });

            console.log(`Запись #${i + 1} успешно создана.`);
        }

        console.log(`${count} записей успешно создано.`);
    } catch (err) {
        console.error('Ошибка при создании записи:', err);
    } finally {
        await sequelize.close();
    }
}

// Запуск скрипта
const count = process.argv[2] ? parseInt(process.argv[2], 10) : 100;
if (isNaN(count) || count <= 0) {
    console.error('Укажите корректное количество записей.');
    process.exit(1);
}

fillJewelryTable(count);