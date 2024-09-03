const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express()

app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200
}))
app.use(express.json());

const users = require('./../routes/users');

const clientes = require('./../routes/clientes.routes');


const login = require('./../validations/login');
const verifyToken = require('./../validations/validation');
const usersVerifyToken = require('../validations/users.validation');

app.use(express.static(path.join(__dirname, '../public')));
app.use('/login', login);
app.use('/users', usersVerifyToken, users);
app.use('/clientes', usersVerifyToken, clientes);


app.get('/version', (req, res) => {
    const packageJson = require('../../package.json');
    const version = packageJson.version;
    res.send(version);
});


// CUALQUIER RUTA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'index.html'));
})


module.exports = app;