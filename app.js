const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const authRouter = require('./routes/auth');
const jewelryRouter = require('./routes/jewelry');
const ordersRouter = require('./routes/orders');
const authRequired = require('./middleware/authRequired');

const app = express();

const sequelize = new Sequelize('postgresql://uqhnsy0zoriffb7sednp:EzBtfkqYZhEDeJyh4bBNqCP1VhCdSC@bsgrmqwceckysck4ikkx-postgresql.services.clever-cloud.com:50013/bsgrmqwceckysck4ikkx', {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});

const { User, Jewelry, Order } = require('./models');

sequelize.sync({ alter: true })
    .then(() => console.log('Models synchronized with database'))
    .catch(err => console.error('Error synchronizing models:', err));

app.use(logger('dev'));
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: 'https://denglebov.netlify.app',
    credentials: true,
}));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/jewelry', express.static(path.join(__dirname, 'views', 'jewelry')));
app.use('/orders', express.static(path.join(__dirname, 'views', 'orders')));
app.use('/js', express.static(path.join(__dirname, 'js')));

app.use('/auth', authRouter);
app.use('/', jewelryRouter);
app.use('/', ordersRouter);

app.get('/', authRequired, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/api/user', authRequired, (req, res) => {
    res.json({ username: req.user.username });
});

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'views', 'error.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).sendFile(path.join(__dirname, 'views', 'error.html'), {
        message: err.message,
        errorStatus: err.status || 500,
        errorStack: err.stack
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;