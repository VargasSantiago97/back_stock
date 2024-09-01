const app = require('./app/app');
const log = require('electron-log');
const path = require('path');



// INICIAR LOGS
const packageJson = require('../package.json');
const version = packageJson.version;
log.transports.file.resolvePathFn = () => path.join(__dirname, `../logs/logs ${fechaHoy()}.txt`);
log.log('Version actual: ' + version);


// CONFIGURACION SERVIDOR
require('dotenv').config();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    log.info(`SERVER ON http://localhost:${PORT}`);
});


function fechaHoy() {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    let mes = fecha.getMonth() + 1;
    mes = mes < 10 ? '0' + mes : mes;
    let dia = fecha.getDate();
    dia = dia < 10 ? '0' + dia : dia;
    
    return `${anio}-${mes}-${dia}`;
}