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

const Laboratorio = require('../model/laboratorios.model');

router.get('/', async (req, res) => {
    log.info('GET all Laboratorios')

    try {
        const resultado = await Laboratorio.findAll({
            where: {
                estado: 1
            }
        })

        const laboratorios = resultado.map(laboratorio => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(laboratorio.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...laboratorio.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: laboratorios
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
    log.info('GET one laboratorio')
    const id = req.params.id

    try {
        const laboratorio = await Laboratorio.findOne({
            where: {
                id: id
            }
        })

        let datosConvertidos;
        try {
            datosConvertidos = JSON.parse(laboratorio.datos);
        } catch (error) {
            datosConvertidos = {};
        }

        res.status(200).json({
            ok: true,
            mensaje: {
                ...laboratorio,
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

    await Laboratorio.sync();
    const dataBody = req.body

    try {
        const createLaboratorio = await Laboratorio.create({
            descripcion: dataBody.descripcion,
            alias: dataBody.alias,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        })

        res.status(201).json({
            ok: true,
            mensaje: createLaboratorio.id,
            id: createLaboratorio.id
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
    log.info('PUT laboratorio')

    const id = req.params.id
    const dataBody = req.body

    try {
        const updateLaboratorio = await Laboratorio.update({
            descripcion: dataBody.descripcion,
            alias: dataBody.alias,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateLaboratorio,
            id: updateLaboratorio
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
        const updateLaboratorio = await Laboratorio.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateLaboratorio,
            id: updateLaboratorio
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