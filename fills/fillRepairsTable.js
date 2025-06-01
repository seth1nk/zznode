const { Sequelize, DataTypes } = require('sequelize');
const { faker } = require('@faker-js/faker/locale/ru');
const path = require('path');
const fs = require('fs');
const sequelize = new Sequelize('postgresql://u4rrszbkx3keaibopb8b:T8Bve2Nn3vuglwUJELnSHUPZHsboeD@bzkvgpndmdz37iek3wwg-postgresql.services.clever-cloud.com:50013/bzkvgpndmdz37iek3wwg', {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});
const Repair = require('../models/Repair')(sequelize, DataTypes);
const sampleImages = ['a1.jpg', 'a2.jpg', 'a3.jpg', 'a4.jpg', 'a5.jpg', 'a6.jpg', 'a7.jpg'];

async function fillRepairsTable(count) {
    try {
        await sequelize.sync();
        for (let i = 0; i < count; i++) {
            const repair = await Repair.create({
                client_name: `${faker.person.firstName()} ${faker.person.lastName()}`,
                type: faker.helpers.arrayElement(['LCD', 'LED', 'OLED', 'CRT']),
                brand: faker.company.name(),
                model: faker.vehicle.model(),
                issue_description: faker.lorem.sentence(),
                repair_cost: faker.number.float({ min: 1000, max: 50000, precision: 0.01 }),
                status: faker.helpers.arrayElement(['accepted', 'in_progress', 'completed', 'canceled']),
                photo: null
            });

            const sampleImage = faker.helpers.arrayElement(sampleImages);
            const sourcePath = path.join(__dirname, '../images/repairs', sampleImage);
            const destPath = path.join(__dirname, '../images/repairs', sampleImage);

            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
                await repair.update({ photo: `/images/repairs/${sampleImage}` });
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
fillRepairsTable(count);