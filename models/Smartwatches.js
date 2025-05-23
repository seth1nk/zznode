module.exports = (sequelize, DataTypes) => {
    const Smartwatch = sequelize.define('Smartwatch', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        brand: { type: DataTypes.STRING, allowNull: false },
        model: { type: DataTypes.STRING, allowNull: false },
        color: { type: DataTypes.STRING, allowNull: false },
        display_type: { type: DataTypes.STRING, allowNull: false },
        battery_life: { type: DataTypes.INTEGER, allowNull: false },
        price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        in_stock: { type: DataTypes.BOOLEAN, defaultValue: true },
        photo: { type: DataTypes.STRING, allowNull: true }
    }, {
        tableName: 'smartwatches',
        timestamps: false
    });
    return Smartwatch;
};