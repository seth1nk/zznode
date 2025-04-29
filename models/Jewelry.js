module.exports = (sequelize, DataTypes) => {
    const Jewelry = sequelize.define('Jewelry', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: { type: DataTypes.STRING, allowNull: false },
        category: { type: DataTypes.STRING, allowNull: false },
        material: { type: DataTypes.STRING, allowNull: false },
        weight: { type: DataTypes.DECIMAL, allowNull: false },
        price: { type: DataTypes.DECIMAL, allowNull: false },
        image: { type: DataTypes.STRING, allowNull: true },
        in_stock: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, {
        tableName: 'jewelry'
    });
    return Jewelry;
  };