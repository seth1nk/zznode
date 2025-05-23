module.exports = (sequelize, DataTypes) => {
    const Repair = sequelize.define('Repair', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        device_type: { type: DataTypes.STRING, allowNull: false },
        device_brand: { type: DataTypes.STRING, allowNull: false },
        device_model: { type: DataTypes.STRING, allowNull: false },
        issue_description: { type: DataTypes.TEXT, allowNull: false },
        repair_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        status: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.DATEONLY, allowNull: true },
        photo: { type: DataTypes.STRING, allowNull: true }
    }, {
        tableName: 'repairs',
        timestamps: false
    });
    return Repair;
};