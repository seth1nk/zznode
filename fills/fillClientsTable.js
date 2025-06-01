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
const Client = require('../models/Client')(sequelize, DataTypes);
const sampleImages = ['t4.png', 't5.jpg', 't6.png'];

async function fillClientsTable(count) {
    try {
        await sequelize.sync();
        for (let i = 0; i < count; i++) {
            const client = await Client.create({
                first_name: faker.person.firstName(),
                last_name: faker.person.lastName(),
                phone: faker.phone.number(),
                email: faker.internet.email(),
                address: faker.location.streetAddress(),
                notes: faker.lorem.sentence(),
                preferred_contact: faker.helpers.arrayElement(['phone', 'email', null]),
                photo: null
            });

            const sampleImage = faker.helpers.arrayElement(sampleImages);
            const sourcePath = path.join(__dirname, '../images/clients', sampleImage);
            const destPath = path.join(__dirname, '../images/clients', sampleImage);

            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
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