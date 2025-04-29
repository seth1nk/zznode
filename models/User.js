module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { // Лучше явно определить ID
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { // Добавим валидацию email
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false
    },
  }, {
    tableName: 'users',
    timestamps: true, // Включаем метки времени для этой модели
    underscored: true, // Используем snake_case для createdAt и updatedAt (created_at, updated_at)
    indexes: [ // Добавляем индексы для часто запрашиваемых полей
        { unique: true, fields: ['username'] },
        { unique: true, fields: ['email'] }
    ]
  });
  return User;
};