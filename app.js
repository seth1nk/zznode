const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const authRouter = require('./routes/auth');
const clientsRouter = require('./routes/clients');
const repairsRouter = require('./routes/repairs');
const authRequired = require('./middleware/authRequired');

const app = express();

const sequelize = new Sequelize('postgresql://ul1e6bvbtulgghqikapt:HBmabTXjQKj9cuvnVQJJMMGcnDfwqf@bok8olbwcb3wgp8da8ze-postgresql.services.clever-cloud.com:50013/bok8olbwcb3wgp8da8ze', {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});

const { User, Client, Repair } = require('./models');

sequelize.sync({ alter: true })
    .then(() => console.log('Models synchronized with database'))
    .catch(err => console.error('Error synchronizing models:', err));

app.use(logger('dev'));
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true,
}));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/clients', express.static(path.join(__dirname, 'views', 'clients')));
app.use('/repairs', express.static(path.join(__dirname, 'views', 'repairs')));
app.use('/js', express.static(path.join(__dirname, 'js')));

app.use('/auth', authRouter);
app.use('/', clientsRouter);
app.use('/', repairsRouter);

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