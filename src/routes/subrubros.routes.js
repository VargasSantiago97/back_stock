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

const Subrubro = require('../model/subrubros.model');

router.get('/', async (req, res) => {
    log.info('GET all Subrubros')

    try {
        const resultado = await Subrubro.findAll({
            where: {
                estado: 1
            }
        })

        const subrubros = resultado.map(subrubro => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(subrubro.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...subrubro.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: subrubros
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
    log.info('GET one subrubro de rubros')
    const id = req.params.id

    try {
        const resultado = await Subrubro.findAll({
            where: {
                estado: 1,
                id_rubro: id
            }
        })

        const subrubros = resultado.map(subrubro => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(subrubro.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...subrubro.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: subrubros
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

    await Subrubro.sync();
    const dataBody = req.body

    try {
        const createSubrubro = await Subrubro.create({
            id_rubro: dataBody.id_rubro,
            descripcion: dataBody.descripcion,
            alias: dataBody.alias,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        })

        res.status(201).json({
            ok: true,
            mensaje: createSubrubro.id,
            id: createSubrubro.id
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
    log.info('PUT subrubro')

    const id = req.params.id
    const dataBody = req.body

    try {
        const updateSubrubro = await Subrubro.update({
            id_rubro: dataBody.id_rubro,
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
            mensaje: updateSubrubro,
            id: updateSubrubro
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
        const updateSubrubro = await Subrubro.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateSubrubro,
            id: updateSubrubro
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
    log.info('GET one Subrubro por alias')
    const alias = req.params.alias

    try {
        const resultado = await Subrubro.findOne({
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