const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgresql://ul1e6bvbtulgghqikapt:HBmabTXjQKj9cuvnVQJJMMGcnDfwqf@bok8olbwcb3wgp8da8ze-postgresql.services.clever-cloud.com:50013/bok8olbwcb3wgp8da8ze', {
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