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

//DEVUELVE LOS PRODUCTOS DISPONIBLES PARA REMITAR
router.get('/', async (req, res) => {
    log.info('Obtener articuloAsociado de documento')

    const id_documento = req.params.id_documento

    try {
        const resultado = await ArticuloAsociado.findAll({
            where: {
                estado: 1,
                id_documento: id_documento
            }
        })

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

            const negativos = await ArticuloAsociado.findAll({
                where: {
                    estado: 1,
                    id_original: articuloAsociado.dataValues.id,
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



            return {
                ...articuloAsociado.dataValues,
                datos: datosConvertidos,
                salidas: restar,
                entradas: sumar,
                salidas_uf: restar_uf,
                entradas_uf: sumar_uf
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