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

const ArticuloAsociado = require('../../model/articulosAsociados.model');
const Ingresos = require('../../model/ingresos.model');
const Operaciones = require('../../model/operaciones.model')
const Egresos = require('../../model/egresos.model');

//DEVUELVE LOS PRODUCTOS DISPONIBLES PARA REMITAR
router.post('/', async (req, res) => {
    log.info('Obtener articuloAsociado disponibles para remitar')

    const id_clientes = req.body.id_clientes

    try {

        var articulosDisponibles = []
        //OBTENEMOS LOS INGRESOS
        const resultado_ingresos = await Ingresos.findAll({
            where: {
                estado: 1,
                id_cliente: {
                    [Op.in]: id_clientes
                }
            }
        })

        const ingresos = resultado_ingresos.map(res_ing => {
            return {
                ...res_ing.dataValues,
                tipo: 'INGRESO'
            }
        })



        //OBTENEMOS LOS INGRESOS POR OPERACIONES Y AGREGAMOS LOS ID A LOS id_ingresos
        /*
        */
        const resultado_operaciones = await Operaciones.findAll({
            where: {
                estado: 1,
                
            }
        })

        const operaciones = resultado_operaciones.map(res_op => {
            return {
                ...res_op.dataValues,
                tipo: 'OPERACIONES'
            }
        })

        for (let documento of [...ingresos, ...operaciones]) {
            const articulosAsociadosIngresos = await ArticuloAsociado.findAll({
                where: {
                    estado: 1,
                    id_documento: documento.id
                }
            })


            for (let artAsociado of articulosAsociadosIngresos) {
                const positivos = await ArticuloAsociado.findAll({
                    where: {
                        estado: 1,
                        id_original: artAsociado.dataValues.id,
                        ajuste: 'positivo'
                    }
                })

                const negativos = await ArticuloAsociado.findAll({
                    where: {
                        estado: 1,
                        id_original: artAsociado.dataValues.id,
                        ajuste: 'negativo'
                    }
                })

                const sumar = positivos.reduce((acc, artAsoc) => {
                    return acc + artAsoc.dataValues.cantidad
                }, 0)
                const sumar_uf = positivos.reduce((acc, artAsoc) => {
                    return acc + artAsoc.dataValues.cantidadUnidadFundamental
                }, 0)

                const restar = negativos.reduce((acc, artAsoc) => {
                    return acc + artAsoc.dataValues.cantidad
                }, 0)
                const restar_uf = negativos.reduce((acc, artAsoc) => {
                    return acc + artAsoc.dataValues.cantidadUnidadFundamental
                }, 0)

                articulosDisponibles.push({
                    ...documento,
                    ...artAsociado.dataValues,
                    cantidad: artAsociado.dataValues.cantidad - restar + sumar,
                    cantidadUnidadFundamental: artAsociado.dataValues.cantidadUnidadFundamental - restar_uf + sumar_uf
                })
            }
        }

        res.status(200).json({
            ok: true,
            mensaje: articulosDisponibles.filter(e => e.cantidad != 0)
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