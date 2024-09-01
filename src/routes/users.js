const express = require('express');
const router = express.Router();

const log = require('electron-log');
const path = require('path');
log.transports.file.resolvePathFn = () => path.join(__dirname, `../../logs/logs ${fechaHoy()}.txt`);

function fechaHoy() {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    let mes = fecha.getMonth() + 1;
    mes = mes < 10 ? '0' + mes : mes;
    let dia = fecha.getDate();
    dia = dia < 10 ? '0' + dia : dia;
    
    return `${anio}-${mes}-${dia}`;
}


router.get('/', (req, res) => {
    log.info('users')
    res.send('asd')
});

router.get('/', (req, res) => {
    log.info('users')
    res.send('asd')
});

router.post('/', (req, res) => {
    log.info('users')
    res.send('asd')
});

router.put('/', (req, res) => {
    log.info('users')
    res.send('asd')
});

router.delete('/', (req, res) => {
    log.info('users')
    res.send('asd')
});


module.exports = router;