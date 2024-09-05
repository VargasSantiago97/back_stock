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

const Establecimiento = require('../model/establecimientos.model');

router.get('/', async (req, res) => {
    log.info('GET all Establecimiento')

    try {
        const resultado = await Establecimiento.findAll({
            where: {
                estado: 1
            }
        })

        const establecimientos = resultado.map(establecimiento => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(establecimiento.dataValues.datos);
            } catch (error) {
                datosConvertidos = {}; // Devuelve un objeto vacío en caso de error
            }
            return {
                ...establecimiento.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: establecimientos
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
    log.info('GET one Establecimiento')
    const id = req.params.id

    try {
        const resultado = await Establecimiento.findAll({
            where: {
                id_cliente: id,
                estado: 1
            }
        })

        const establecimientos = resultado.map(establecimiento => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(establecimiento.dataValues.datos);
            } catch (error) {
                datosConvertidos = {}; // Devuelve un objeto vacío en caso de error
            }
            return {
                ...establecimiento.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: establecimientos
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

    await Establecimiento.sync();
    const dataBody = req.body

    try {
        const createEstablecimiento = await Establecimiento.create({
            id_cliente: dataBody.id_cliente,
            descripcion: dataBody.descripcion,
            localidad: dataBody.localidad,
            provincia: dataBody.provincia,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        })

        res.status(201).json({
            ok: true,
            mensaje: createEstablecimiento.id,
            id: createEstablecimiento.id
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
    log.info('PUT Establecimiento')

    const id = req.params.id
    const data = req.body

    try {
        const updateEstablecimiento = await Establecimiento.update({
            id_cliente: data.id_cliente,
            descripcion: data.descripcion,
            localidad: data.localidad,
            provincia: data.provincia,
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
            mensaje: updateEstablecimiento,
            id: updateEstablecimiento
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
        const updateEstablecimiento = await Establecimiento.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateEstablecimiento,
            id: updateEstablecimiento
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