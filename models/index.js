const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgresql://u4rrszbkx3keaibopb8b:T8Bve2Nn3vuglwUJELnSHUPZHsboeD@bzkvgpndmdz37iek3wwg-postgresql.services.clever-cloud.com:50013/bzkvgpndmdz37iek3wwg', {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
    define: {
        timestamps: true,
        underscored: true,
    }
});

const User = require('./User')(sequelize, DataTypes);
const Client = require('./Client')(sequelize, DataTypes);
const Repair = require('./Repair')(sequelize, DataTypes);

sequelize.sync({ alter: true })
    .then(() => console.log('Models synchronized with database'))
    .catch(err => console.error('Error synchronizing models:', err));

module.exports = {
    sequelize,
    User,
    Client,
    Repair
};