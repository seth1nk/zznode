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

// Импорт модели Order
const Order = require('../models/Orders')(sequelize, DataTypes);

// Список статусов
const statuses = ['в обработке', 'отправлен', 'доставлен'];

// Список изображений
const images = [
    'kol.jpg',
    'ser.jpg',
    'brasl.jpg',
    'ozher.jpg',
    'clock.jpg',
];

// Функция для создания записей
async function fillOrdersTable(count) {
    try {
        // Синхронизация модели с базой данных
        await sequelize.sync();

        for (let i = 0; i < count; i++) {
            const orderDate = faker.date.past({ years: 2 }).toISOString().split('T')[0];
            const order = await Order.create({
                jewelry_id: faker.number.int({ min: 1, max: 100 }),
                client_name: faker.person.fullName(),
                order_date: orderDate,
                total_amount: faker.number.int({ min: 1000, max: 100000 }),
                status: faker.helpers.arrayElement(statuses),
                delivery_address: faker.location.streetAddress(),
                image: `/images/orders/${faker.helpers.arrayElement(images)}`,
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

fillOrdersTable(count);