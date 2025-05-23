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
const Client = require('../models/Clients')(sequelize, DataTypes);
const sampleImages = [
    '11.jpg',
    '22.png',
    '33.jpg',
    '44.jpg',
    '55.png',
    '66.jpg',
];

async function fillClientsTable(count) {
    try {
        await sequelize.sync();
        for (let i = 0; i < count; i++) {
            const client = await Client.create({
                last_name: faker.person.lastName(),
                first_name: faker.person.firstName(),
                middle_name: faker.person.middleName(),
                birth_date: faker.date.past({ years: 50 }).toISOString().split('T')[0],
                email: faker.internet.email(),
                phone: faker.phone.number(),
                is_subscribed: faker.datatype.boolean(),
                photo: null // Временно null
            });

            // Копируем случайное изображение с оригинальным именем
            const sampleImage = faker.helpers.arrayElement(sampleImages);
            const sourcePath = path.join(__dirname, '../images/clients', sampleImage);
            const destPath = path.join(__dirname, '../images/clients', sampleImage);

            // Проверяем, существует ли исходный файл
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath); // Копируем с перезаписью
                await client.update({ photo: `/images/clients/${sampleImage}` });
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
fillClientsTable(count);