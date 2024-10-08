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

const Ingreso = require('../../model/ingresos.model');
const Devolucion = require('../../model/ingresosDevoluciones.model');
const Egresos = require('../../model/egresos.model');
const RemitoDevolucion = require('../../model/egresosDevoluciones.model');
const ArticuloAsociado = require('../../model/articulosAsociados.model');
const UnidadMedida = require('../../model/unidadMedidas.model');

router.post('/', async (req, res) => {

    log.info('GET stock')

    const fechaDesde = req.body.fechaDesde;
    const fechaHasta = req.body.fechaHasta;
    const clientes = req.body.clientes
    const depositos = req.body.depositos
    const articulos = req.body.articulos
    const rubros = req.body.rubros
    const subRubros = req.body.subRubros
    const laboratorios = req.body.laboratorios

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

        const resultado_ing = await Ingreso.findAll({
            where: buscando
        })
        const resultado_dev = await Devolucion.findAll({
            where: buscando
        })
        const resultado_rem = await Egresos.findAll({
            where: buscando
        })
        const resultado_remDev = await RemitoDevolucion.findAll({
            where: buscando
        })

        const ids_ing = resultado_ing.map(e => e.dataValues.id)
        const ids_dev = resultado_dev.map(e => e.dataValues.id)
        const ids_rem = resultado_rem.map(e => e.dataValues.id)
        const ids_remDev = resultado_remDev.map(e => e.dataValues.id)

        var unidadMedidas = {}
        const unidadesMedidas = await UnidadMedida.findAll({
            where: {
                estado: 1
            }
        })
        unidadesMedidas.forEach(um => { unidadMedidas[um.dataValues.id] = um.dataValues.alias });

        var buscandoArticulos = {
            estado: 1,
            id_documento: {
                [Op.in]: [ ...ids_ing , ...ids_dev , ...ids_rem , ...ids_remDev ]
            }
        }

        if (depositos && depositos.length > 0) {
            buscandoArticulos.id_deposito = {
                [Op.in]: depositos
            };
        }

        if (articulos && articulos.length > 0) {
            buscandoArticulos.id_articulo = {
                [Op.in]: articulos
            };
        }

        if (rubros && rubros.length > 0) {
            buscandoArticulos.id_rubro = {
                [Op.in]: rubros
            };
        }

        if (subRubros && subRubros.length > 0) {
            buscandoArticulos.id_subRubro = {
                [Op.in]: subRubros
            };
        }

        if (laboratorios && laboratorios.length > 0) {
            buscandoArticulos.id_laboratorio = {
                [Op.in]: laboratorios
            };
        }

        const articulosAsociados = await ArticuloAsociado.findAll({
            where: buscandoArticulos
        })

        var respuesta = []
        for(let artAsoc of articulosAsociados){
            if(!respuesta.some(e => e.id_articulo == artAsoc.id_articulo)){
                respuesta.push({
                    id_articulo: artAsoc.id_articulo,
                    codigo: artAsoc.codigo,
                    descripcion: artAsoc.descripcion,
                    um: unidadMedidas[artAsoc.id_unidadMedida] ? unidadMedidas[artAsoc.id_unidadMedida] : '-',
                    umf: artAsoc.unidadFundamental,

                    ingresos: 0,
                    ingresos_devoluciones: 0,

                    remitos: 0,
                    remitos_devoluciones: 0,

                    operaciones_entradas: 0,
                    operaciones_salidas: 0,

                    stock: 0,


                    ingresos_uf: 0,
                    ingresos_devoluciones_uf: 0,

                    remitos_uf: 0,
                    remitos_devoluciones_uf: 0,

                    operaciones_entradas_uf: 0,
                    operaciones_salidas_uf: 0,

                    stock_uf: 0
                })
            }

            var registro = respuesta.find(e => e.id_articulo == artAsoc.id_articulo)


            if(artAsoc.documento == 'ingreso'){
                registro.ingresos += artAsoc.cantidad
                registro.ingresos_uf += artAsoc.cantidadUnidadFundamental

                registro.stock += artAsoc.cantidad
                registro.stock_uf += artAsoc.cantidadUnidadFundamental
            }
            if(artAsoc.documento == 'ingreso_devolucion'){
                registro.ingresos_devoluciones += artAsoc.cantidad
                registro.ingresos_devoluciones_uf += artAsoc.cantidadUnidadFundamental

                registro.stock -= artAsoc.cantidad
                registro.stock_uf -= artAsoc.cantidadUnidadFundamental
            }
            if(artAsoc.documento == 'remito'){
                registro.remitos += artAsoc.cantidad
                registro.remitos_uf += artAsoc.cantidadUnidadFundamental

                registro.stock -= artAsoc.cantidad
                registro.stock_uf -= artAsoc.cantidadUnidadFundamental
            }
            if(artAsoc.documento == 'remito_devolucion'){
                registro.remitos_devoluciones += artAsoc.cantidad
                registro.remitos_devoluciones_uf += artAsoc.cantidadUnidadFundamental

                registro.stock += artAsoc.cantidad
                registro.stock_uf += artAsoc.cantidadUnidadFundamental
            }
            
            if(artAsoc.documento == 'operaciones'){

            }
        }


        res.status(200).json({
            ok: true,
            mensaje: respuesta
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