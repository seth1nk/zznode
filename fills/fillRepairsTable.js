const { Sequelize, DataTypes } = require('sequelize');
const { faker } = require('@faker-js/faker/locale/ru');
const path = require('path');
const fs = require('fs');
const sequelize = new Sequelize('postgresql://ul1e6bvbtulgghqikapt:HBmabTXjQKj9cuvnVQJJMMGcnDfwqf@bok8olbwcb3wgp8da8ze-postgresql.services.clever-cloud.com:50013/bok8olbwcb3wgp8da8ze', {
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
const deviceTypes = ['Смартфон', 'Планшет', 'Ноутбук', 'Часы', 'Компьютер'];
const brands = ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Dell'];
const statuses = ['В ожидании', 'В ремонте', 'Завершен', 'Отменен'];
const sampleImages = ['tele1.jpg', 'tele2.png'];

async function fillRepairsTable(count) {
    try {
        await sequelize.sync();
        for (let i = 0; i < count; i++) {
            const repair = await Repair.create({
                device_type: faker.helpers.arrayElement(deviceTypes),
                device_brand: faker.helpers.arrayElement(brands),
                device_model: faker.commerce.productName(),
                issue_description: faker.lorem.sentence(),
                repair_cost: faker.number.int({ min: 1000, max: 50000 }),
                status: faker.helpers.arrayElement(statuses),
                date: faker.date.recent({ days: 30 }),
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