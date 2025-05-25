const { Sequelize, DataTypes } = require('sequelize');
const { faker } = require('@faker-js/faker/locale/ru');
const path = require('path');
const fs = require('fs');
const sequelize = new Sequelize('postgresql://uhri6rljeutxcoo4ldel:QMnQBcOhZrQL3DXnw7vO75mBGRTvSV@bgejjcdl1op7xb2ptvdr-postgresql.services.clever-cloud.com:50013/bgejjcdl1op7xb2ptvdr', {
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
const sampleImages = ['t1.png', 't2.png'];

async function fillRepairsTable(count) {
    try {
        await sequelize.sync();
        for (let i = 0; i < count; i++) {
            const repair = await Repair.create({
                client_name: `${faker.person.firstName()} ${faker.person.lastName()}`,
                type: faker.helpers.arrayElement(['однокамерный', 'двухкамерный', 'side-by-side', 'встраиваемый']),
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