module.exports = (sequelize, DataTypes) => {
    const Client = sequelize.define('Client', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        last_name: { type: DataTypes.STRING, allowNull: false },
        first_name: { type: DataTypes.STRING, allowNull: false },
        middle_name: { type: DataTypes.STRING, allowNull: true },
        birth_date: { type: DataTypes.DATEONLY, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        phone: { type: DataTypes.STRING, allowNull: true },
        is_subscribed: { type: DataTypes.BOOLEAN, defaultValue: false },
        photo: { type: DataTypes.STRING, allowNull: true }
    }, {
        tableName: 'clients',
        timestamps: false
    });
    return Client;
};