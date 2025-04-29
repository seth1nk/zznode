module.exports = (roles) => {
  return (req, res, next) => {
    if (!req.userId) return res.status(401).json({ message: 'Требуется авторизация' });

    User.findById(req.userId)
      .then(user => {
        if (!user) return res.status(403).json({ message: 'Пользователь не найден' });

        if (!roles.includes(user.role)) {
          return res.status(403).json({ message: 'Недостаточно прав' });
        }

        req.user = user;
        next();
      })
      .catch(err => res.status(500).json({ message: 'Ошибка сервера', error: err.message }));
  };
};
