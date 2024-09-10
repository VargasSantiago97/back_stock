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

const Articulo = require('../model/articulos.model');

router.get('/', async (req, res) => {
    log.info('GET all Articulos')

    try {
        const resultado = await Articulo.findAll({
            where: {
                estado: 1
            }
        })

        const articulos = resultado.map(articulo => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(articulo.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...articulo.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: articulos
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
    log.info('GET one articulo')
    const id = req.params.id

    try {
        const resultado = await Articulo.findOne({
            where: {
                id: id
            }
        })

        let datosConvertidos;
        try {
            datosConvertidos = JSON.parse(resultado.datos);
        } catch (error) {
            datosConvertidos = {};
        }

        res.status(200).json({
            ok: true,
            mensaje: {
                ...subrubros,
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

router.get('/:id_rubro/:id_subRubro', async (req, res) => {
    log.info('GET all Articulos con rubro y subRubro')
    const id_rubro = req.params.id_rubro
    const id_subRubro = req.params.id_subRubro

    try {
        const resultado = await Articulo.findAll({
            where: {
                id_rubro: id_rubro,
                id_subRubro: id_subRubro,
                estado: 1
            }
        })

        const articulos = resultado.map(articulo => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(articulo.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...articulo.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: articulos
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

    await Articulo.sync();
    const dataBody = req.body

    try {
        const createArticulo = await Articulo.create({
            id_rubro: dataBody.id_rubro,
            id_subRubro: dataBody.id_subRubro,
            id_laboratorio: dataBody.id_laboratorio,
            id_unidadMedida: dataBody.id_unidadMedida,
            codigo: dataBody.codigo,
            descripcion: dataBody.descripcion,
            observaciones: dataBody.observaciones,
            unidadFundamental: dataBody.unidadFundamental,
            cantidadUnidadFundamental: dataBody.cantidadUnidadFundamental,
            solicitaVencimiento: dataBody.solicitaVencimiento,
            solicitaLote: dataBody.solicitaLote,
            activo: dataBody.activo,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        })

        res.status(201).json({
            ok: true,
            mensaje: createArticulo.id,
            id: createArticulo.id
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
        const updateArticulo = await Articulo.update({
            id_rubro: dataBody.id_rubro,
            id_subRubro: dataBody.id_subRubro,
            id_laboratorio: dataBody.id_laboratorio,
            id_unidadMedida: dataBody.id_unidadMedida,
            codigo: dataBody.codigo,
            descripcion: dataBody.descripcion,
            observaciones: dataBody.observaciones,
            unidadFundamental: dataBody.unidadFundamental,
            cantidadUnidadFundamental: dataBody.cantidadUnidadFundamental,
            solicitaVencimiento: dataBody.solicitaVencimiento,
            solicitaLote: dataBody.solicitaLote,
            activo: dataBody.activo,
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
            mensaje: updateArticulo,
            id: updateArticulo
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
        const updateArticulo = await Articulo.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateArticulo,
            id: updateArticulo
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

router.get('/buscar/codigo/:codigo', async (req, res) => {
    log.info('GET one articulo por codigo')
    const codigo = req.params.codigo

    try {
        const resultado = await Articulo.findOne({
            where: {
                codigo: codigo,
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

router.get('/buscar/descripcion/:descripcion', async (req, res) => {
    log.info('GET all articulo por descripcion')
    const descripcion = req.params.descripcion


    try {
        const resultado = await Articulo.findAll({
            where: {
                estado: 1,
                activo : 1,
                descripcion: { [Op.like]: `%${descripcion}%` }
            }
        })

        const articulos = resultado.map(articulo => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(articulo.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...articulo.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: articulos
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