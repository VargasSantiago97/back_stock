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

const Ingreso = require('../../model/ingresos.model');
const Devolucion = require('../../model/ingresosDevoluciones.model');
const Egresos = require('../../model/egresos.model');
const RemitoDevolucion = require('../../model/egresosDevoluciones.model');
const Operacion = require('../../model/operaciones.model');

const ArticuloAsociado = require('../../model/articulosAsociados.model');
const UnidadMedida = require('../../model/unidadMedidas.model');
const Cliente = require('../../model/clientes.model');


router.post('/viejo', async (req, res) => {

    log.info('GET stock por clientes')

    const fechaDesde = req.body.fechaDesde;
    const fechaHasta = req.body.fechaHasta;

    const clientes = req.body.clientes
    const depositos = req.body.depositos
    const articulos = req.body.articulos
    const rubros = req.body.rubros
    const subRubros = req.body.subRubros
    const laboratorios = req.body.laboratorios

    try {
        var respuesta = []

        var unidadMedidas = {}
        const unidadesMedidas = await UnidadMedida.findAll({
            where: {
                estado: 1
            }
        })
        unidadesMedidas.forEach(um => { unidadMedidas[um.dataValues.id] = um.dataValues.alias });


        var buscandoCliente = {
            estado: 1
        }
        if (clientes && clientes.length > 0) {
            buscandoCliente.id = {
                [Op.in]: clientes
            };
        }

        const resultado_clientes = await Cliente.findAll({
            where: buscandoCliente
        })

        for (let resultado_cliente of resultado_clientes) {
            var cliente = {
                id_cliente: resultado_cliente.dataValues.id,
                cliente: resultado_cliente.dataValues.razon_social,
                datos: []
            }

            //BUSCAMOS LOS INGRESOS
            var buscando = {
                estado: 1,
                id_cliente: resultado_cliente.dataValues.id,
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

            var buscandoArticulos = {
                estado: 1,
                id_documento: {
                    [Op.in]: [...ids_ing, ...ids_dev]
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

            //entradas
            const articulosAsociadosIngresos = await ArticuloAsociado.findAll({
                where: buscandoArticulos
            })
            const ids_articulosIngreso = articulosAsociadosIngresos.map(e => e.dataValues.id)

            for (let artAsoc of articulosAsociadosIngresos) {
                if (!cliente.datos.some(art => art.id_articulo == artAsoc.id_articulo)) {
                    cliente.datos.push({
                        id_articulo: artAsoc.id_articulo,
                        codigo: artAsoc.codigo,
                        descripcion: artAsoc.descripcion,
                        um: unidadMedidas[artAsoc.id_unidadMedida] ? unidadMedidas[artAsoc.id_unidadMedida] : '-',
                        umf: artAsoc.unidadFundamental,

                        ingresos: 0,
                        ingresos_uf: 0,

                        salidas: 0,
                        salidas_uf: 0,

                        operaciones: 0,
                        operaciones_uf: 0,

                        stock: 0,
                        stock_uf: 0,

                        otros_destinos: 0,
                        otros_destinos_uf: 0,

                        stock_fisico: 0,
                        stock_fisico_uf: 0,

                        otros_origenes: 0,
                        otros_origenes_uf: 0,

                        stock_real: 0,
                        stock_real_uf: 0
                    })
                }

                var registro = cliente.datos.find(e => e.id_articulo == artAsoc.id_articulo)


                if (artAsoc.documento == 'ingreso') {
                    registro.ingresos += artAsoc.cantidad
                    registro.ingresos_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock += artAsoc.cantidad
                    registro.stock_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico += artAsoc.cantidad
                    registro.stock_fisico_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_real += artAsoc.cantidad
                    registro.stock_real_uf += artAsoc.cantidadUnidadFundamental
                }
                if (artAsoc.documento == 'ingreso_devolucion') {
                    registro.ingresos -= artAsoc.cantidad
                    registro.ingresos_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock -= artAsoc.cantidad
                    registro.stock_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico -= artAsoc.cantidad
                    registro.stock_fisico_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_real -= artAsoc.cantidad
                    registro.stock_real_uf -= artAsoc.cantidadUnidadFundamental
                }
            }


            //salidas
            const articulosAsociadosEgresos = await ArticuloAsociado.findAll({
                where: {
                    estado: 1,
                    id_documento: {
                        [Op.in]: [...ids_rem, ...ids_remDev]
                    },
                    id_original: {
                        [Op.in]: articulosAsociadosIngresos.map(f => f.dataValues.id)
                    },
                    documento: {
                        [Op.in]: ['remito', 'remito_devolucion']
                    },
                }
            })
            for (let artAsoc of articulosAsociadosEgresos) {
                if (!cliente.datos.some(art => art.id_articulo == artAsoc.id_articulo)) {
                    cliente.datos.push({
                        id_articulo: artAsoc.id_articulo,
                        codigo: artAsoc.codigo,
                        descripcion: artAsoc.descripcion,
                        um: unidadMedidas[artAsoc.id_unidadMedida] ? unidadMedidas[artAsoc.id_unidadMedida] : '-',
                        umf: artAsoc.unidadFundamental,

                        ingresos: 0,
                        ingresos_uf: 0,

                        salidas: 0,
                        salidas_uf: 0,

                        operaciones: 0,
                        operaciones_uf: 0,

                        stock: 0,
                        stock_uf: 0,

                        otros_destinos: 0,
                        otros_destinos_uf: 0,

                        stock_fisico: 0,
                        stock_fisico_uf: 0,

                        otros_origenes: 0,
                        otros_origenes_uf: 0,

                        stock_real: 0,
                        stock_real_uf: 0
                    })
                }

                var registro = cliente.datos.find(e => e.id_articulo == artAsoc.id_articulo)


                if (artAsoc.documento == 'remito') {
                    registro.salidas += artAsoc.cantidad
                    registro.salidas_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock -= artAsoc.cantidad
                    registro.stock_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico -= artAsoc.cantidad
                    registro.stock_fisico_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_real -= artAsoc.cantidad
                    registro.stock_real_uf -= artAsoc.cantidadUnidadFundamental
                }
                if (artAsoc.documento == 'remito_devolucion') {
                    registro.salidas -= artAsoc.cantidad
                    registro.salidas_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock += artAsoc.cantidad
                    registro.stock_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico += artAsoc.cantidad
                    registro.stock_fisico_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_real += artAsoc.cantidad
                    registro.stock_real_uf += artAsoc.cantidadUnidadFundamental
                }
            }

            //otros destinos
            var buscandoOD = {
                estado: 1,
                id_cliente: {
                    [Op.notIn]: [resultado_cliente.dataValues.id]
                }
            }

            if (fechaDesde && fechaHasta) {
                buscandoOD.fechafecha = {
                    [Op.between]: [new Date(fechaDesde), new Date(fechaHasta)]
                };
            } else if (fechaDesde) {
                buscandoOD.fechafecha = {
                    [Op.gte]: new Date(fechaDesde)
                };
            } else if (fechaHasta) {
                buscandoOD.fechafecha = {
                    [Op.lte]: new Date(fechaHasta)
                };
            }


            const resultado_remOD = await Egresos.findAll({
                where: buscandoOD
            })
            const resultado_remDevOD = await RemitoDevolucion.findAll({
                where: buscandoOD
            })

            const ids_remOD = resultado_remOD.map(e => e.dataValues.id)
            const ids_remODDev = resultado_remDevOD.map(e => e.dataValues.id)


            const articulosAsociadosOtrosDestinos = await ArticuloAsociado.findAll({
                where: {
                    estado: 1,
                    id_documento: {
                        [Op.in]: [...ids_remOD, ...ids_remODDev]
                    },
                    id_original: {
                        [Op.in]: articulosAsociadosIngresos.map(f => f.dataValues.id)
                    },
                    documento: {
                        [Op.in]: ['remito', 'remito_devolucion']
                    },
                }
            })
            for (let artAsoc of articulosAsociadosOtrosDestinos) {
                if (!cliente.datos.some(art => art.id_articulo == artAsoc.id_articulo)) {
                    cliente.datos.push({
                        id_articulo: artAsoc.id_articulo,
                        codigo: artAsoc.codigo,
                        descripcion: artAsoc.descripcion,
                        um: unidadMedidas[artAsoc.id_unidadMedida] ? unidadMedidas[artAsoc.id_unidadMedida] : '-',
                        umf: artAsoc.unidadFundamental,

                        ingresos: 0,
                        ingresos_uf: 0,

                        salidas: 0,
                        salidas_uf: 0,

                        operaciones: 0,
                        operaciones_uf: 0,

                        stock: 0,
                        stock_uf: 0,

                        otros_destinos: 0,
                        otros_destinos_uf: 0,

                        stock_fisico: 0,
                        stock_fisico_uf: 0,

                        otros_origenes: 0,
                        otros_origenes_uf: 0,

                        stock_real: 0,
                        stock_real_uf: 0
                    })
                }

                var registro = cliente.datos.find(e => e.id_articulo == artAsoc.id_articulo)


                if (artAsoc.documento == 'remito') {
                    registro.otros_destinos += artAsoc.cantidad
                    registro.otros_destinos_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico -= artAsoc.cantidad
                    registro.stock_fisico_uf -= artAsoc.cantidadUnidadFundamental
                }
                if (artAsoc.documento == 'remito_devolucion') {
                    registro.otros_destinos -= artAsoc.cantidad
                    registro.otros_destinos_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico += artAsoc.cantidad
                    registro.stock_fisico_uf += artAsoc.cantidadUnidadFundamental
                }
            }



            //otros origenes
            buscandoArticulos.id_documento = {
                [Op.in]: [...ids_rem, ...ids_remDev]
            }
            buscandoArticulos.id_original = {
                [Op.notIn]: ids_articulosIngreso
            }

            const articulosAsociadosOtrosOrigenes = await ArticuloAsociado.findAll({
                where: buscandoArticulos
            })

            for (let artAsoc of articulosAsociadosOtrosOrigenes) {
                if (!cliente.datos.some(art => art.id_articulo == artAsoc.id_articulo)) {
                    cliente.datos.push({
                        id_articulo: artAsoc.id_articulo,
                        codigo: artAsoc.codigo,
                        descripcion: artAsoc.descripcion,
                        um: unidadMedidas[artAsoc.id_unidadMedida] ? unidadMedidas[artAsoc.id_unidadMedida] : '-',
                        umf: artAsoc.unidadFundamental,

                        ingresos: 0,
                        ingresos_uf: 0,

                        salidas: 0,
                        salidas_uf: 0,

                        operaciones: 0,
                        operaciones_uf: 0,

                        stock: 0,
                        stock_uf: 0,

                        otros_destinos: 0,
                        otros_destinos_uf: 0,

                        stock_fisico: 0,
                        stock_fisico_uf: 0,

                        otros_origenes: 0,
                        otros_origenes_uf: 0,

                        stock_real: 0,
                        stock_real_uf: 0
                    })
                }

                var registro = cliente.datos.find(e => e.id_articulo == artAsoc.id_articulo)


                if (artAsoc.documento == 'remito') {
                    registro.otros_origenes += artAsoc.cantidad
                    registro.otros_origenes_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_real -= artAsoc.cantidad
                    registro.stock_real_uf -= artAsoc.cantidadUnidadFundamental
                }
                if (artAsoc.documento == 'remito_devolucion') {
                    registro.otros_origenes -= artAsoc.cantidad
                    registro.otros_origenes_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_real += artAsoc.cantidad
                    registro.stock_real_uf += artAsoc.cantidadUnidadFundamental
                }
            }

            respuesta.push(cliente)
        }

        res.status(200).json({
            ok: true,
            mensaje: respuesta.filter(e => e.datos.length)
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

    log.info('GET stock por clientes')

    const fechaDesde = req.body.fechaDesde;
    const fechaHasta = req.body.fechaHasta;

    const clientes = req.body.clientes
    const depositos = req.body.depositos
    const articulos = req.body.articulos
    const rubros = req.body.rubros
    const subRubros = req.body.subRubros
    const laboratorios = req.body.laboratorios

    try {
        var respuesta = []

        var unidadMedidas = {}
        const unidadesMedidas = await UnidadMedida.findAll({
            where: {
                estado: 1
            }
        })
        unidadesMedidas.forEach(um => { unidadMedidas[um.dataValues.id] = um.dataValues.alias });


        var buscandoCliente = {
            estado: 1
        }
        if (clientes && clientes.length > 0) {
            buscandoCliente.id = {
                [Op.in]: clientes
            };
        }

        const resultado_clientes = await Cliente.findAll({
            where: buscandoCliente
        })

        for (let resultado_cliente of resultado_clientes) {
            var cliente = {
                id_cliente: resultado_cliente.dataValues.id,
                cliente: resultado_cliente.dataValues.razon_social,
                datos: []
            }

            //BUSCAMOS LOS INGRESOS
            var buscando = {
                estado: 1,
                id_cliente: resultado_cliente.dataValues.id,
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

            var buscandoArticulos = {
                estado: 1,
                id_documento: {
                    [Op.in]: [...ids_ing, ...ids_dev]
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

            //entradas
            const articulosAsociadosIngresos = await ArticuloAsociado.findAll({
                where: buscandoArticulos
            })
            const ids_articulosIngreso = articulosAsociadosIngresos.map(e => e.dataValues.id)

            for (let artAsoc of articulosAsociadosIngresos) {
                if (!cliente.datos.some(art => art.id_articulo == artAsoc.id_articulo)) {
                    cliente.datos.push({
                        id_articulo: artAsoc.id_articulo,
                        codigo: artAsoc.codigo,
                        descripcion: artAsoc.descripcion,
                        um: unidadMedidas[artAsoc.id_unidadMedida] ? unidadMedidas[artAsoc.id_unidadMedida] : '-',
                        umf: artAsoc.unidadFundamental,

                        ingresos: 0,
                        ingresos_uf: 0,

                        salidas: 0,
                        salidas_uf: 0,

                        operaciones: 0,
                        operaciones_uf: 0,

                        stock: 0,
                        stock_uf: 0,

                        otros_destinos: 0,
                        otros_destinos_uf: 0,

                        stock_fisico: 0,
                        stock_fisico_uf: 0,

                        otros_origenes: 0,
                        otros_origenes_uf: 0,

                        stock_real: 0,
                        stock_real_uf: 0
                    })
                }

                var registro = cliente.datos.find(e => e.id_articulo == artAsoc.id_articulo)

                if (artAsoc.documento == 'ingreso') {
                    registro.ingresos += artAsoc.cantidad
                    registro.ingresos_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock += artAsoc.cantidad
                    registro.stock_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico += artAsoc.cantidad
                    registro.stock_fisico_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_real += artAsoc.cantidad
                    registro.stock_real_uf += artAsoc.cantidadUnidadFundamental
                }
                if (artAsoc.documento == 'ingreso_devolucion') {
                    registro.ingresos -= artAsoc.cantidad
                    registro.ingresos_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock -= artAsoc.cantidad
                    registro.stock_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico -= artAsoc.cantidad
                    registro.stock_fisico_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_real -= artAsoc.cantidad
                    registro.stock_real_uf -= artAsoc.cantidadUnidadFundamental
                }
            }


            //salidas
            const articulosAsociadosEgresos = await ArticuloAsociado.findAll({
                where: {
                    estado: 1,
                    id_documento: {
                        [Op.in]: [...ids_rem, ...ids_remDev]
                    },
                    id_original: {
                        [Op.in]: articulosAsociadosIngresos.map(f => f.dataValues.id)
                    },
                    documento: {
                        [Op.in]: ['remito', 'remito_devolucion']
                    },
                }
            })
            for (let artAsoc of articulosAsociadosEgresos) {
                if (!cliente.datos.some(art => art.id_articulo == artAsoc.id_articulo)) {
                    cliente.datos.push({
                        id_articulo: artAsoc.id_articulo,
                        codigo: artAsoc.codigo,
                        descripcion: artAsoc.descripcion,
                        um: unidadMedidas[artAsoc.id_unidadMedida] ? unidadMedidas[artAsoc.id_unidadMedida] : '-',
                        umf: artAsoc.unidadFundamental,

                        ingresos: 0,
                        ingresos_uf: 0,

                        salidas: 0,
                        salidas_uf: 0,

                        operaciones: 0,
                        operaciones_uf: 0,

                        stock: 0,
                        stock_uf: 0,

                        otros_destinos: 0,
                        otros_destinos_uf: 0,

                        stock_fisico: 0,
                        stock_fisico_uf: 0,

                        otros_origenes: 0,
                        otros_origenes_uf: 0,

                        stock_real: 0,
                        stock_real_uf: 0
                    })
                }

                var registro = cliente.datos.find(e => e.id_articulo == artAsoc.id_articulo)


                if (artAsoc.documento == 'remito') {
                    registro.salidas += artAsoc.cantidad
                    registro.salidas_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock -= artAsoc.cantidad
                    registro.stock_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico -= artAsoc.cantidad
                    registro.stock_fisico_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_real -= artAsoc.cantidad
                    registro.stock_real_uf -= artAsoc.cantidadUnidadFundamental
                }
                if (artAsoc.documento == 'remito_devolucion') {
                    registro.salidas -= artAsoc.cantidad
                    registro.salidas_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock += artAsoc.cantidad
                    registro.stock_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico += artAsoc.cantidad
                    registro.stock_fisico_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_real += artAsoc.cantidad
                    registro.stock_real_uf += artAsoc.cantidadUnidadFundamental
                }
            }

            //operaciones
            //BUSCAMOS LOS INGRESOS
            var buscandoOp = {
                estado: 1,
                [Op.or]: {
                    id_cliente_ingreso: resultado_cliente.dataValues.id,
                    id_cliente_egreso: resultado_cliente.dataValues.id
                }
            }

            if (fechaDesde && fechaHasta) {
                buscandoOp.fechafecha = {
                    [Op.between]: [new Date(fechaDesde), new Date(fechaHasta)]
                };
            } else if (fechaDesde) {
                buscandoOp.fechafecha = {
                    [Op.gte]: new Date(fechaDesde)
                };
            } else if (fechaHasta) {
                buscandoOp.fechafecha = {
                    [Op.lte]: new Date(fechaHasta)
                };
            }

            const resultado_op = await Operacion.findAll({
                where: buscandoOp
            })

            var buscandoArticuloOp = {
                estado: 1,
                id_documento: {
                    [Op.in]: resultado_op.map(f => f.dataValues.id)
                }
            }

            if (depositos && depositos.length > 0) {
                buscandoArticuloOp.id_deposito = {
                    [Op.in]: depositos
                };
            }

            if (articulos && articulos.length > 0) {
                buscandoArticuloOp.id_articulo = {
                    [Op.in]: articulos
                };
            }

            if (rubros && rubros.length > 0) {
                buscandoArticuloOp.id_rubro = {
                    [Op.in]: rubros
                };
            }

            if (subRubros && subRubros.length > 0) {
                buscandoArticuloOp.id_subRubro = {
                    [Op.in]: subRubros
                };
            }

            if (laboratorios && laboratorios.length > 0) {
                buscandoArticuloOp.id_laboratorio = {
                    [Op.in]: laboratorios
                };
            }

            const articulosAsociadosOperaciones = await ArticuloAsociado.findAll({
                where: buscandoArticuloOp
            })
            for (let artAsoc of articulosAsociadosOperaciones) {
                if (!cliente.datos.some(art => art.id_articulo == artAsoc.id_articulo)) {
                    cliente.datos.push({
                        id_articulo: artAsoc.id_articulo,
                        codigo: artAsoc.codigo,
                        descripcion: artAsoc.descripcion,
                        um: unidadMedidas[artAsoc.id_unidadMedida] ? unidadMedidas[artAsoc.id_unidadMedida] : '-',
                        umf: artAsoc.unidadFundamental,

                        ingresos: 0,
                        ingresos_uf: 0,

                        salidas: 0,
                        salidas_uf: 0,

                        operaciones: 0,
                        operaciones_uf: 0,

                        stock: 0,
                        stock_uf: 0,

                        otros_destinos: 0,
                        otros_destinos_uf: 0,

                        stock_fisico: 0,
                        stock_fisico_uf: 0,

                        otros_origenes: 0,
                        otros_origenes_uf: 0,

                        stock_real: 0,
                        stock_real_uf: 0
                    })
                }

                var registro = cliente.datos.find(e => e.id_articulo == artAsoc.id_articulo)

                if (artAsoc.ajuste == 'positivo') {
                    registro.operaciones += artAsoc.cantidad
                    registro.operaciones_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock += artAsoc.cantidad
                    registro.stock_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico += artAsoc.cantidad
                    registro.stock_fisico_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_real += artAsoc.cantidad
                    registro.stock_real_uf += artAsoc.cantidadUnidadFundamental
                }
                if (artAsoc.ajuste == 'negativo') {
                    registro.operaciones -= artAsoc.cantidad
                    registro.operaciones_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock -= artAsoc.cantidad
                    registro.stock_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico -= artAsoc.cantidad
                    registro.stock_fisico_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_real -= artAsoc.cantidad
                    registro.stock_real_uf -= artAsoc.cantidadUnidadFundamental
                }
            }


            //otros destinos
            var buscandoOD = {
                estado: 1,
                id_cliente: {
                    [Op.notIn]: [resultado_cliente.dataValues.id]
                }
            }

            if (fechaDesde && fechaHasta) {
                buscandoOD.fechafecha = {
                    [Op.between]: [new Date(fechaDesde), new Date(fechaHasta)]
                };
            } else if (fechaDesde) {
                buscandoOD.fechafecha = {
                    [Op.gte]: new Date(fechaDesde)
                };
            } else if (fechaHasta) {
                buscandoOD.fechafecha = {
                    [Op.lte]: new Date(fechaHasta)
                };
            }


            const resultado_remOD = await Egresos.findAll({
                where: buscandoOD
            })
            const resultado_remDevOD = await RemitoDevolucion.findAll({
                where: buscandoOD
            })

            const ids_remOD = resultado_remOD.map(e => e.dataValues.id)
            const ids_remODDev = resultado_remDevOD.map(e => e.dataValues.id)


            const articulosAsociadosOtrosDestinos = await ArticuloAsociado.findAll({
                where: {
                    estado: 1,
                    id_documento: {
                        [Op.in]: [...ids_remOD, ...ids_remODDev]
                    },
                    id_original: {
                        [Op.in]: articulosAsociadosIngresos.map(f => f.dataValues.id)
                    },
                    documento: {
                        [Op.in]: ['remito', 'remito_devolucion']
                    },
                }
            })
            for (let artAsoc of articulosAsociadosOtrosDestinos) {
                if (!cliente.datos.some(art => art.id_articulo == artAsoc.id_articulo)) {
                    cliente.datos.push({
                        id_articulo: artAsoc.id_articulo,
                        codigo: artAsoc.codigo,
                        descripcion: artAsoc.descripcion,
                        um: unidadMedidas[artAsoc.id_unidadMedida] ? unidadMedidas[artAsoc.id_unidadMedida] : '-',
                        umf: artAsoc.unidadFundamental,

                        ingresos: 0,
                        ingresos_uf: 0,

                        salidas: 0,
                        salidas_uf: 0,

                        operaciones: 0,
                        operaciones_uf: 0,

                        stock: 0,
                        stock_uf: 0,

                        otros_destinos: 0,
                        otros_destinos_uf: 0,

                        stock_fisico: 0,
                        stock_fisico_uf: 0,

                        otros_origenes: 0,
                        otros_origenes_uf: 0,

                        stock_real: 0,
                        stock_real_uf: 0
                    })
                }

                var registro = cliente.datos.find(e => e.id_articulo == artAsoc.id_articulo)


                if (artAsoc.documento == 'remito') {
                    registro.otros_destinos += artAsoc.cantidad
                    registro.otros_destinos_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico -= artAsoc.cantidad
                    registro.stock_fisico_uf -= artAsoc.cantidadUnidadFundamental
                }
                if (artAsoc.documento == 'remito_devolucion') {
                    registro.otros_destinos -= artAsoc.cantidad
                    registro.otros_destinos_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_fisico += artAsoc.cantidad
                    registro.stock_fisico_uf += artAsoc.cantidadUnidadFundamental
                }
            }

            //otros origenes
            buscandoArticulos.id_documento = {
                [Op.in]: [...ids_rem, ...ids_remDev]
            }
            buscandoArticulos.id_original = {
                [Op.notIn]: ids_articulosIngreso
            }

            const articulosAsociadosOtrosOrigenes = await ArticuloAsociado.findAll({
                where: buscandoArticulos
            })

            for (let artAsoc of articulosAsociadosOtrosOrigenes) {
                if (!cliente.datos.some(art => art.id_articulo == artAsoc.id_articulo)) {
                    cliente.datos.push({
                        id_articulo: artAsoc.id_articulo,
                        codigo: artAsoc.codigo,
                        descripcion: artAsoc.descripcion,
                        um: unidadMedidas[artAsoc.id_unidadMedida] ? unidadMedidas[artAsoc.id_unidadMedida] : '-',
                        umf: artAsoc.unidadFundamental,

                        ingresos: 0,
                        ingresos_uf: 0,

                        salidas: 0,
                        salidas_uf: 0,

                        operaciones: 0,
                        operaciones_uf: 0,

                        stock: 0,
                        stock_uf: 0,

                        otros_destinos: 0,
                        otros_destinos_uf: 0,

                        stock_fisico: 0,
                        stock_fisico_uf: 0,

                        otros_origenes: 0,
                        otros_origenes_uf: 0,

                        stock_real: 0,
                        stock_real_uf: 0
                    })
                }

                var registro = cliente.datos.find(e => e.id_articulo == artAsoc.id_articulo)


                if (artAsoc.documento == 'remito') {
                    registro.otros_origenes += artAsoc.cantidad
                    registro.otros_origenes_uf += artAsoc.cantidadUnidadFundamental

                    registro.stock_real -= artAsoc.cantidad
                    registro.stock_real_uf -= artAsoc.cantidadUnidadFundamental
                }
                if (artAsoc.documento == 'remito_devolucion') {
                    registro.otros_origenes -= artAsoc.cantidad
                    registro.otros_origenes_uf -= artAsoc.cantidadUnidadFundamental

                    registro.stock_real += artAsoc.cantidad
                    registro.stock_real_uf += artAsoc.cantidadUnidadFundamental
                }
            }

            respuesta.push(cliente)
        }

        res.status(200).json({
            ok: true,
            mensaje: respuesta.filter(e => e.datos.length)
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