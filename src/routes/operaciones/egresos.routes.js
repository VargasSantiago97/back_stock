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

const Egresos = require('../../model/egresos.model');
const RemitoDevolucion = require('../../model/egresosDevoluciones.model');
const ArticuloAsociado = require('../../model/articulosAsociados.model');

router.post('/', async (req, res) => {

    log.info('GET all Remitos y Devoluciones')

    const fechaDesde = req.query.fechaDesde;
    const fechaHasta = req.query.fechaHasta;
    const clientes = req.body.clientes

    try {
        var buscando = {
            estado: 1
        }

        if (clientes && clientes.length > 0) {
            buscando.id_cliente = {
                [Op.in]: clientes
            };
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

        const resultado_dev = await RemitoDevolucion.findAll({
            where: buscando
        })

        const resultado_ing = await Egresos.findAll({
            where: buscando
        })

        const registros_dev = resultado_dev.map(dev => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(dev.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...dev.dataValues,
                tipo: 'DEVOLUCION',
                datos: datosConvertidos,
                numeroMostrar: mostrarDocumento(dev.dataValues.punto, dev.dataValues.numero)
            };
        });

        const registros_ing = resultado_ing.map(ing => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(ing.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...ing.dataValues,
                tipo: 'REMITO',
                datos: datosConvertidos,
                numeroMostrar: mostrarDocumento(ing.dataValues.punto, ing.dataValues.numero)
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: [ ...registros_ing, ...registros_dev ]
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
    log.info('Obtener articulos de remito disponibles para devolver')

    const id_documento = req.params.id_documento

    try {
        const articulosAsociadosRemito = await ArticuloAsociado.findAll({
            where: {
                estado: 1,
                id_documento: id_documento
            }
        })

        const devoluciones = await RemitoDevolucion.findAll({
            where: {
                estado: 1,
                id_asociado: id_documento
            }
        })

        const devoluciones_id = devoluciones.map(dev => dev.id)

        const articulosAsociadosDevoluciones = await ArticuloAsociado.findAll({
            where: {
                estado: 1,
                id_documento: {
                    [Op.in]: devoluciones_id
                }
            }
        })

        const articulosAsociados = articulosAsociadosRemito.map(articuloAsociado => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(articuloAsociado.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }

            const articulosRestar = articulosAsociadosDevoluciones.filter(e => e.dataValues.id_original == articuloAsociado.dataValues.id_original)

            const restar = articulosRestar.reduce((acc, artAsoc) => {
                return acc + artAsoc.dataValues.cantidad
            }, 0)
            const restar_uf = articulosRestar.reduce((acc, artAsoc) => {
                return acc + artAsoc.dataValues.cantidadUnidadFundamental
            }, 0)


            return {
                ...articuloAsociado.dataValues,
                datos: datosConvertidos,
                disponibleDevolver: articuloAsociado.dataValues.cantidad - restar,
                disponibleDevolver_uf: articuloAsociado.dataValues.cantidadUnidadFundamental - restar_uf
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

module.exports = router;