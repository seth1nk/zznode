const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgresql://uhri6rljeutxcoo4ldel:QMnQBcOhZrQL3DXnw7vO75mBGRTvSV@bgejjcdl1op7xb2ptvdr-postgresql.services.clever-cloud.com:50013/bgejjcdl1op7xb2ptvdr', {
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