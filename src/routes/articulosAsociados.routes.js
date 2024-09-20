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

const ArticuloAsociado = require('../model/articulosAsociados.model');

router.get('/', async (req, res) => {
    log.info('GET all ArticuloAsociado')

    try {
        const resultado = await ArticuloAsociado.findAll({
            where: {
                estado: 1
            }
        })

        const articulosAsociados = resultado.map(articuloAsociado => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(articuloAsociado.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...articuloAsociado.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: articulosAsociados
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
    log.info('GET one articuloAsociado')
    const id = req.params.id

    try {
        const resultado = await ArticuloAsociado.findOne({
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
                ...resultado,
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

    await ArticuloAsociado.sync();
    const dataBody = req.body

    try {
        const createArticuloAsociado = await ArticuloAsociado.create({
            id_original: dataBody.id_original,
            id_articulo: dataBody.id_articulo,
            id_documento: dataBody.id_documento,
            id_rubro: dataBody.id_rubro,
            id_subRubro: dataBody.id_subRubro,
            id_laboratorio: dataBody.id_laboratorio,
            id_unidadMedida: dataBody.id_unidadMedida,
            id_deposito: dataBody.id_deposito,
            cantidad: dataBody.cantidad,
            cantidadUnidadFundamental: dataBody.cantidadUnidadFundamental,
            solicitaLote: dataBody.solicitaLote,
            solicitaVencimiento: dataBody.solicitaVencimiento,
            lote: dataBody.lote,
            vencimiento: dataBody.vencimiento,
            codigo: dataBody.codigo,
            descripcion: dataBody.descripcion,
            observaciones: dataBody.observaciones,
            unidadFundamental: dataBody.unidadFundamental,
            cantidadPorUnidadFundamental: dataBody.cantidadPorUnidadFundamental,
            ajuste: dataBody.ajuste,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        })

        res.status(201).json({
            ok: true,
            mensaje: createArticuloAsociado.id,
            id: createArticuloAsociado.id
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

router.post('/multiple', async (req, res) => {

    await ArticuloAsociado.sync();
    const dataBody = req.body

    try {
        const createArticulosAsociados = await ArticuloAsociado.bulkCreate(dataBody);

        res.status(201).json({
            ok: true,
            mensaje: createArticulosAsociados,
            id: createArticulosAsociados
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
    log.info('PUT articuloAsociado')

    const id = req.params.id
    const dataBody = req.body

    try {
        const updateArticuloAsociado = await ArticuloAsociado.update({
            id_original: dataBody.id_original,
            id_articulo: dataBody.id_articulo,
            id_documento: dataBody.id_documento,
            id_rubro: dataBody.id_rubro,
            id_subRubro: dataBody.id_subRubro,
            id_laboratorio: dataBody.id_laboratorio,
            id_unidadMedida: dataBody.id_unidadMedida,
            id_deposito: dataBody.id_deposito,
            cantidad: dataBody.cantidad,
            cantidadUnidadFundamental: dataBody.cantidadUnidadFundamental,
            solicitaLote: dataBody.solicitaLote,
            solicitaVencimiento: dataBody.solicitaVencimiento,
            lote: dataBody.lote,
            vencimiento: dataBody.vencimiento,
            codigo: dataBody.codigo,
            descripcion: dataBody.descripcion,
            observaciones: dataBody.observaciones,
            unidadFundamental: dataBody.unidadFundamental,
            cantidadPorUnidadFundamental: dataBody.cantidadPorUnidadFundamental,
            ajuste: dataBody.ajuste,
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
            mensaje: updateArticuloAsociado,
            id: updateArticuloAsociado
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
        const updateArticuloAsociado = await ArticuloAsociado.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateArticuloAsociado,
            id: updateArticuloAsociado
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

router.get('/buscar/:id_documento', async (req, res) => {
    log.info('Obtener articuloAsociado de documento')

    const id_documento = req.params.id_documento

    try {
        const resultado = await ArticuloAsociado.findAll({
            where: {
                estado: 1,
                id_documento: id_documento
            }
        })

        const articulosAsociados = resultado.map(articuloAsociado => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(articuloAsociado.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...articuloAsociado.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: articulosAsociados
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

router.get('/devolucion/:id_documento', async (req, res) => {
    log.info('Obtener articuloAsociado de documento')

    const id_documento = req.params.id_documento

    try {
        const resultado = await ArticuloAsociado.findAll({
            where: {
                estado: 1,
                id_documento: id_documento
            }
        })

        log.info('## resultado')

        const articulosAsociados = await Promise.all(resultado.map(async articuloAsociado => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(articuloAsociado.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }

            const positivos = await ArticuloAsociado.findAll({
                where: {
                    estado: 1,
                    id_original: articuloAsociado.dataValues.id,
                    ajuste: 'positivo'
                }
            })
            log.info('## positivo')
            console.log(positivos)

            const negativos = await ArticuloAsociado.findAll({
                where: {
                    estado: 1,
                    id_original: articuloAsociado.dataValues.id,
                    ajuste: 'negativo'
                }
            })
            log.info('## negativo')
            console.log(negativos)


            const sumar = positivos.reduce((acc, artAsoc) => {
                return acc + artAsoc.dataValues.cantidad
            }, 0)
            log.info('## suma')

            const restar = negativos.reduce((acc, artAsoc) => {
                return acc + artAsoc.dataValues.cantidad
            }, 0)
            log.info('## resta')



            return {
                ...articuloAsociado.dataValues,
                datos: datosConvertidos,
                salidas: restar,
                entradas: sumar
            };
        }));

        res.status(200).json({
            ok: true,
            mensaje: articulosAsociados
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