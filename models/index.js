const { Sequelize, DataTypes } = require('sequelize');

// Подключение к базе данных (Clever Cloud)
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

// Импорт моделей
const User = require('./User')(sequelize, DataTypes);
const Jewelry = require('./Jewelry')(sequelize, DataTypes);
const Order = require('./Orders')(sequelize, DataTypes);

// Синхронизация моделей с базой данных
sequelize.sync({ alter: true })
    .then(() => console.log('Models synchronized with database'))
    .catch(err => console.error('Error synchronizing models:', err));

// Экспорт моделей и sequelize
module.exports = {
    sequelize,
    User,
    Jewelry,
    Order,
};