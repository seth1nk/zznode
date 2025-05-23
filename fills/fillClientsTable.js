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
const Client = require('../models/Client')(sequelize, DataTypes);
const sampleImages = ['t1.jpg', 't2.jpg', 't3.jpg', 't4.jpg', 't5.jpg', 't6.jpg'];

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
                birth_date: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
                notes: faker.lorem.sentence(),
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