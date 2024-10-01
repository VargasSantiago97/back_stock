const express = require('express');
const router = express.Router();

const { Op } = require('sequelize');

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

function mostrarDocumento(pto, nro) {
    return `${String(pto).padStart(4, '0')}-${String(nro).padStart(8, '0')}`
}

const Ingreso = require('../../model/ingresos.model');
const Devolucion = require('../../model/ingresosDevoluciones.model');

router.post('/', async (req, res) => {

    log.info('GET all Ingresos y Devoluciones')

    const fechaDesde = req.query.fechaDesde;
    const fechaHasta = req.query.fechaHasta;
    const clientes = req.body.clientes

    try {
        var buscando = {
            estado: 1
        }

        if (clientes && clientes.length > 0) {
            buscando.id_cliente = {
                [Op.in]: clientes
            };
        }

        if (fechaDesde && fechaHasta) {
            buscando.fechafecha = {
                [Op.between]: [new Date(fechaDesde), new Date(fechaHasta)]
            };
        } else if (fechaDesde) {
            buscando.fechafecha = {
                [Op.gte]: new Date(fechaDesde)
            };
        } else if (fechaHasta) {
            buscando.fechafecha = {
                [Op.lte]: new Date(fechaHasta)
            };
        }

        const resultado_dev = await Devolucion.findAll({
            where: buscando
        })
        const resultado_ing = await Ingreso.findAll({
            where: buscando
        })

        const registros_dev = resultado_dev.map(dev => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(dev.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...dev.dataValues,
                tipo: 'DEVOLUCION',
                datos: datosConvertidos,
                numeroMostrar: mostrarDocumento(dev.dataValues.punto, dev.dataValues.numero)
            };
        });
        
        const registros_ing = resultado_ing.map(ing => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(ing.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...ing.dataValues,
                tipo: 'INGRESO',
                datos: datosConvertidos,
                numeroMostrar: mostrarDocumento(ing.dataValues.punto, ing.dataValues.numero)
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: [ ...registros_ing, ...registros_dev ]
        })
    }
    catch (err) {
        res.status(500).json({
            ok: false,
            mensaje: err,
            id: ''
        })
    }
});

module.exports = router;