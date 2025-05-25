module.exports = (sequelize, DataTypes) => {
    const Repair = sequelize.define('Repair', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        client_name: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: false },
        brand: { type: DataTypes.STRING, allowNull: false },
        model: { type: DataTypes.STRING, allowNull: false },
        issue_description: { type: DataTypes.TEXT, allowNull: false },
        repair_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        status: { type: DataTypes.ENUM('accepted', 'in_progress', 'completed', 'canceled'), allowNull: false, defaultValue: 'accepted' },
        photo: { type: DataTypes.STRING, allowNull: true }
    }, {
        tableName: 'repairs',
        timestamps: false
    });
    return Repair;
};