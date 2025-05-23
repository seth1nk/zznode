const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgresql://uwbrrzerxx05zn6dd4ha:FxrjVohfWjKljhepkR8zyTE0FpAvK1@bcyknwpphsrxdyve4pho-postgresql.services.clever-cloud.com:50013/bcyknwpphsrxdyve4pho', {
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
const Client = require('./Clients')(sequelize, DataTypes);
const Smartwatch = require('./Smartwatches')(sequelize, DataTypes);

sequelize.sync({ alter: true })
    .then(() => console.log('Models synchronized with database'))
    .catch(err => console.error('Error synchronizing models:', err));

module.exports = {
    sequelize,
    User,
    Client,
    Smartwatch
};