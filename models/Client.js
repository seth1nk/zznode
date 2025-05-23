module.exports = (sequelize, DataTypes) => {
    const Client = sequelize.define('Client', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        first_name: { type: DataTypes.STRING, allowNull: false },
        last_name: { type: DataTypes.STRING, allowNull: false },
        phone: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: true },
        address: { type: DataTypes.STRING, allowNull: true },
        birth_date: { type: DataTypes.DATEONLY, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        photo: { type: DataTypes.STRING, allowNull: true }
    }, {
        tableName: 'clients',
        timestamps: false
    });
    return Client;
};