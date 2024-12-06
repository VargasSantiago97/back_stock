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
const Operacion = require('../../model/operaciones.model');

router.post('/', async (req, res) => {

    log.info('GET all Operaciones')

    const fechaDesde = req.query.fechaDesde;
    const fechaHasta = req.query.fechaHasta;
    const clientes = req.body.clientes

    try {
        var buscando = {
            estado: 1
        }

        if (clientes && clientes.length > 0) {
            buscando[Op.or] = [
                { id_cliente_egreso: { [Op.in]: clientes } },
                { id_cliente_ingreso: { [Op.in]: clientes } }
            ];
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

        await Operacion.sync();
        const resultado_op = await Operacion.findAll({
            where: buscando
        })


        const registros_op = resultado_op.map(op => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(op.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...op.dataValues,
                datos: datosConvertidos,
                numeroMostrar: mostrarDocumento(op.dataValues.punto, op.dataValues.numero)
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: registros_op
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