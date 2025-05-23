const { Sequelize, DataTypes } = require('sequelize');
const { faker } = require('@faker-js/faker/locale/ru');
const path = require('path');
const fs = require('fs');
const sequelize = new Sequelize('postgresql://uwbrrzerxx05zn6dd4ha:FxrjVohfWjKljhepkR8zyTE0FpAvK1@bcyknwpphsrxdyve4pho-postgresql.services.clever-cloud.com:50013/bcyknwpphsrxdyve4pho', {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});
const Smartwatch = require('../models/Smartwatches')(sequelize, DataTypes);
const brands = ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Huawei'];
const colors = ['Черный', 'Серебристый', 'Золотой', 'Белый', 'Синий'];
const displayTypes = ['AMOLED', 'LCD', 'OLED', 'TFT'];
const sampleImages = [
    '1.jpg',
    '2.jpg',
    '3.jpeg',
    '4.jpg',
    '5.jpg',
];

async function fillSmartwatchesTable(count) {
    try {
        await sequelize.sync();
        for (let i = 0; i < count; i++) {
            const smartwatch = await Smartwatch.create({
                brand: faker.helpers.arrayElement(brands),
                model: faker.commerce.productName(),
                color: faker.helpers.arrayElement(colors),
                display_type: faker.helpers.arrayElement(displayTypes),
                battery_life: faker.number.int({ min: 24, max: 240 }),
                price: faker.number.int({ min: 5000, max: 50000 }),
                in_stock: faker.datatype.boolean(),
                photo: null // Временно null
            });

            // Копируем случайное изображение с оригинальным именем
            const sampleImage = faker.helpers.arrayElement(sampleImages);
            const sourcePath = path.join(__dirname, '../images/smartwatches', sampleImage);
            const destPath = path.join(__dirname, '../images/smartwatches', sampleImage);

            // Проверяем, существует ли исходный файл
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath); // Копируем с перезаписью
                await smartwatch.update({ photo: `/images/smartwatches/${sampleImage}` });
            }

            console.log(`Запись #${i + 1} успешно создана.`);
        }
        console.log(`${count} записей успешно создано.`);
    } catch (err) {
        console.error('Ошибка при создании записи:', err);
    } finally {
        await sequelize.close();
    }
}

const count = process.argv[2] ? parseInt(process.argv[2], 10) : 100;
if (isNaN(count) || count <= 0) {
    console.error('Укажите корректное количество записей.');
    process.exit(1);
}
fillSmartwatchesTable(count);