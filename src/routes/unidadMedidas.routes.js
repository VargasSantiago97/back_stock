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

const UnidadMedida = require('../model/unidadMedidas.model');

router.get('/', async (req, res) => {
    log.info('GET all Unidad Medida')

    try {
        const resultado = await UnidadMedida.findAll({
            where: {
                estado: 1
            }
        })

        const unidadMedidas = resultado.map(unidadMedida => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(unidadMedida.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...unidadMedida.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: unidadMedidas
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
    log.info('GET one unidadMedida')
    const id = req.params.id

    try {
        const unidadMedida = await UnidadMedida.findOne({
            where: {
                id: id
            }
        })

        let datosConvertidos;
        try {
            datosConvertidos = JSON.parse(unidadMedida.datos);
        } catch (error) {
            datosConvertidos = {};
        }

        res.status(200).json({
            ok: true,
            mensaje: {
                ...unidadMedida,
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

    await UnidadMedida.sync();
    const dataBody = req.body

    try {
        const createUnidadMedida = await UnidadMedida.create({
            descripcion: dataBody.descripcion,
            alias: dataBody.alias,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        })

        res.status(201).json({
            ok: true,
            mensaje: createUnidadMedida.id,
            id: createUnidadMedida.id
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
    log.info('PUT unidadMedida')

    const id = req.params.id
    const dataBody = req.body

    try {
        const updateUnidadMedida = await UnidadMedida.update({
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
            mensaje: updateUnidadMedida,
            id: updateUnidadMedida
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
        const updateUnidadMedida = await UnidadMedida.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateUnidadMedida,
            id: updateUnidadMedida
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