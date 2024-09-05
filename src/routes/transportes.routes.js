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

const Transporte = require('../model/transportes.model');

router.get('/', async (req, res) => {
    log.info('GET all Transportes')

    try {
        const resultado = await Transporte.findAll({
            where: {
                estado: 1
            }
        })

        const transportes = resultado.map(transporte => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(transporte.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...transporte.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: transportes
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
    log.info('GET one transporte')
    const id = req.params.id

    try {
        const resultado = await Transporte.findAll({
            where: {
                id_cliente: id,
                estado: 1
            }
        })

        const transportes = resultado.map(transporte => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(transporte.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...transporte.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: transportes
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

    await Transporte.sync();
    const dataBody = req.body

    try {
        const createTransporte = await Transporte.create({
            id_cliente: dataBody.id_cliente,
            transporte: dataBody.transporte,
            cuit_transporte: dataBody.cuit_transporte,
            chofer: dataBody.chofer,
            cuit_chofer: dataBody.cuit_chofer,
            patente_chasis: dataBody.patente_chasis,
            patente_acoplado: dataBody.patente_acoplado,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        })

        res.status(201).json({
            ok: true,
            mensaje: createTransporte.id,
            id: createTransporte.id
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
    log.info('PUT autorizado')

    const id = req.params.id
    const data = req.body

    try {
        const updateTransporte = await Transporte.update({
            id_cliente: data.id_cliente,
            transporte: data.transporte,
            cuit_transporte: data.cuit_transporte,
            chofer: data.chofer,
            cuit_chofer: data.cuit_chofer,
            patente_chasis: data.patente_chasis,
            patente_acoplado: data.patente_acoplado,
            datos: data.datos,
            estado: data.estado,
            createdBy: data.createdBy,
            updatedBy: data.updatedBy
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateTransporte,
            id: updateTransporte
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
        const updateTransporte = await Transporte.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateTransporte,
            id: updateTransporte
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