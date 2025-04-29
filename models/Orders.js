module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        client_name: { type: DataTypes.STRING, allowNull: false },
        order_date: { type: DataTypes.DATE, allowNull: false },
        total_amount: { type: DataTypes.DECIMAL, allowNull: false },
        status: { type: DataTypes.STRING, allowNull: false },
        image: { type: DataTypes.STRING, allowNull: true },
        delivery_address: { type: DataTypes.STRING, allowNull: false }
    }, {
        tableName: 'orders'
    });
    return Order;
  };