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
const autorizados = require('./../routes/autorizados.routes');
const transportes = require('./../routes/transportes.routes');
const establecimientos = require('./../routes/establecimientos.routes');
const rubros = require('./../routes/rubros.routes');
const subrubros = require('./../routes/subrubros.routes');
const tiposOperaciones = require('./../routes/tiposOperaciones.routes');
const laboratorios = require('./../routes/laboratorios.routes');
const unidadMedidas = require('./../routes/unidadMedidas.routes');
const articulos = require('./../routes/articulos.routes');
const depositos = require('./../routes/depositos.routes');
const ingresos = require('./../routes/ingresos.routes');
const egresos = require('./../routes/egresos.routes');
const ingresosDevoluciones = require('./../routes/ingresosDevoluciones.routes');
const egresosDevoluciones = require('./../routes/egresosDevoluciones.routes');
const operaciones = require('./../routes/operaciones.routes');
const articulosAsociados = require('./../routes/articulosAsociados.routes');

const operacionesIngresos = require('./../routes/operaciones/ingresos.routes');
const operacionesEgresos = require('./../routes/operaciones/egresos.routes');
const operacionesOperaciones = require('./../routes/operaciones/operaciones.routes');
const operacionesArticulosRemito = require('./../routes/operaciones/articulosRemito.routes');
const operacionesStock = require('./../routes/operaciones/stock.routes');
const operacionesStockPorClientes = require('./../routes/operaciones/stockPorClientes.routes');
const operacionesMovimientosPorArticulo = require('./../routes/operaciones/movimientosPorArticulo.routes');

const pdf_ingresos = require('./../routes/pdf/ingreso.routes');
const pdf_remitos = require('./../routes/pdf/remito.routes');
const pdf_devoluciones = require('./../routes/pdf/devolucion.routes');
const pdf_remitoDevoluciones = require('./../routes/pdf/remitoDevolucion.routes');
const pdf_operaciones = require('./../routes/pdf/operacion.routes');

const xlsx = require('./../routes/xlsx/xlsx.routes');


const login = require('./../validations/login');
const verifyToken = require('./../validations/validation');
const usersVerifyToken = require('../validations/users.validation');

app.use(express.static(path.join(__dirname, '../../public')));
app.use('/login', login);
app.use('/users', usersVerifyToken, users);

app.use('/clientes', usersVerifyToken, clientes);
app.use('/autorizados', usersVerifyToken, autorizados);
app.use('/transportes', usersVerifyToken, transportes);
app.use('/establecimientos', usersVerifyToken, establecimientos);
app.use('/rubros', usersVerifyToken, rubros);
app.use('/subrubros', usersVerifyToken, subrubros);
app.use('/tiposOperaciones', usersVerifyToken, tiposOperaciones);
app.use('/laboratorios', usersVerifyToken, laboratorios);
app.use('/unidadMedidas', usersVerifyToken, unidadMedidas);
app.use('/articulos', usersVerifyToken, articulos);
app.use('/depositos', usersVerifyToken, depositos);
app.use('/ingresos', usersVerifyToken, ingresos);
app.use('/egresos', usersVerifyToken, egresos);
app.use('/devoluciones', usersVerifyToken, ingresosDevoluciones);
app.use('/egresosDevoluciones', usersVerifyToken, egresosDevoluciones);
app.use('/articulosAsociados', usersVerifyToken, articulosAsociados);

app.use('/operaciones/ingresos', usersVerifyToken, operacionesIngresos);
app.use('/operaciones/egresos', usersVerifyToken, operacionesEgresos);
app.use('/operaciones/operaciones', usersVerifyToken, operacionesOperaciones);
app.use('/operaciones/articulosRemito', usersVerifyToken, operacionesArticulosRemito);
app.use('/operaciones/stock', usersVerifyToken, operacionesStock);
app.use('/operaciones/stockPorClientes', usersVerifyToken, operacionesStockPorClientes);
app.use('/operaciones/movimientosPorArticulo', usersVerifyToken, operacionesMovimientosPorArticulo);

app.use('/operaciones', usersVerifyToken, operaciones);

app.use('/pdf/ingresos', usersVerifyToken, pdf_ingresos);
app.use('/pdf/remitos', usersVerifyToken, pdf_remitos);
app.use('/pdf/devoluciones', usersVerifyToken, pdf_devoluciones);
app.use('/pdf/remitoDevoluciones', usersVerifyToken, pdf_remitoDevoluciones);
app.use('/pdf/operaciones', usersVerifyToken, pdf_operaciones);

app.use('/xlsx', usersVerifyToken, xlsx);


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