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

const Operacion = require('../model/operaciones.model');

router.get('/', async (req, res) => {
    log.info('GET all Operaciones')
    await Operacion.sync();

    try {
        const resultado = await Operacion.findAll({
            where: {
                estado: 1
            }
        })

        const operaciones = resultado.map(operacion => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(operacion.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...operacion.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: operaciones
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

router.get('/:id', async (req, res) => {
    log.info('GET one operacion')
    const id = req.params.id

    await Operacion.sync();

    try {
        const resultado = await Operacion.findOne({
            where: {
                id: id
            }
        })

        let datosConvertidos;
        try {
            datosConvertidos = JSON.parse(resultado.dataValues.datos);
        } catch (error) {
            datosConvertidos = {};
        }

        res.status(200).json({
            ok: true,
            mensaje: {
                ...resultado.dataValues,
                datos: datosConvertidos
            }
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

router.post('/', async (req, res) => {

    await Operacion.sync();
    const dataBody = req.body

    try {
        const createOperacion = await Operacion.create({
            fechaFecha: new Date(dataBody.fecha),
            fecha: dataBody.fecha,
            numero: dataBody.numero,
            punto: dataBody.punto,
            modelo: dataBody.modelo,
            tipo: dataBody.tipo,
            id_cliente_egreso: dataBody.id_cliente_egreso,
            codigo_egreso: dataBody.codigo_egreso,
            razon_social_egreso: dataBody.razon_social_egreso,
            cuit_egreso: dataBody.cuit_egreso,
            alias_egreso: dataBody.alias_egreso,
            id_cliente_ingreso: dataBody.id_cliente_ingreso,
            codigo_ingreso: dataBody.codigo_ingreso,
            razon_social_ingreso: dataBody.razon_social_ingreso,
            cuit_ingreso: dataBody.cuit_ingreso,
            alias_ingreso: dataBody.alias_ingreso,
            observaciones: dataBody.observaciones,
            observaciones_sistema: dataBody.observaciones_sistema,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy,
        })

        res.status(201).json({
            ok: true,
            mensaje: createOperacion.id,
            id: createOperacion.id
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

router.put('/:id', async (req, res) => {
    log.info('PUT operacion')

    const id = req.params.id
    const dataBody = req.body

    await Operacion.sync();

    try {
        const updateOperacion = await Operacion.update({
            fechaFecha: new Date(dataBody.fecha),
            fecha: dataBody.fecha,
            numero: dataBody.numero,
            punto: dataBody.punto,
            modelo: dataBody.modelo,
            tipo: dataBody.tipo,
            id_cliente_egreso: dataBody.id_cliente_egreso,
            codigo_egreso: dataBody.codigo_egreso,
            razon_social_egreso: dataBody.razon_social_egreso,
            cuit_egreso: dataBody.cuit_egreso,
            alias_egreso: dataBody.alias_egreso,
            id_cliente_ingreso: dataBody.id_cliente_ingreso,
            codigo_ingreso: dataBody.codigo_ingreso,
            razon_social_ingreso: dataBody.razon_social_ingreso,
            cuit_ingreso: dataBody.cuit_ingreso,
            alias_ingreso: dataBody.alias_ingreso,
            observaciones: dataBody.observaciones,
            observaciones_sistema: dataBody.observaciones_sistema,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy,
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateOperacion,
            id: updateOperacion
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

router.delete('/:id', async (req, res) => {

    const id = req.params.id

    try {
        const updateOperacion = await Operacion.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateOperacion,
            id: updateOperacion
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

router.get('/buscar/siguiente/:ptoVta', async (req, res) => {
    log.info('Obtener ultimo operacion')

    const ptoVta = req.params.ptoVta
    await Operacion.sync();

    try {
        const resultado = await Operacion.findAll({
            where: {
                estado: 1,
                punto: ptoVta
            }
        })

        ultimo = resultado.reduce((max, curr) => {
            return max < curr.dataValues.numero ? curr.dataValues.numero : max
        }, 0)

        res.status(200).json({
            ok: true,
            mensaje: ultimo + 1
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