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

const Rubro = require('../model/rubros.model');

router.get('/', async (req, res) => {
    log.info('GET all Rubros')

    try {
        const resultado = await Rubro.findAll({
            where: {
                estado: 1
            }
        })

        const rubros = resultado.map(rubro => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(rubro.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...rubro.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: rubros
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
    log.info('GET one rubro')
    const id = req.params.id

    try {
        const rubro = await Rubro.findOne({
            where: {
                id: id
            }
        })

        let datosConvertidos;
        try {
            datosConvertidos = JSON.parse(rubro.datos);
        } catch (error) {
            datosConvertidos = {};
        }

        res.status(200).json({
            ok: true,
            mensaje: {
                ...rubro,
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

    await Rubro.sync();
    const dataBody = req.body

    try {
        const createRubro = await Rubro.create({
            descripcion: dataBody.descripcion,
            alias: dataBody.alias,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        })

        res.status(201).json({
            ok: true,
            mensaje: createRubro.id,
            id: createRubro.id
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
    const dataBody = req.body

    try {
        const updateRubro = await Rubro.update({
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
            mensaje: updateRubro,
            id: updateRubro
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
        const updateRubro = await Rubro.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateRubro,
            id: updateRubro
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

router.get('/buscar/alias/:alias', async (req, res) => {
    log.info('GET one Rubro por alias')
    const alias = req.params.alias

    try {
        const resultado = await Rubro.findOne({
            where: {
                alias: alias,
                estado: 1
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

module.exports = router;