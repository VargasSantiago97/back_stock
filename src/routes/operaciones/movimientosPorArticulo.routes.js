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
const Deposito = require('../../model/depositos.model');
const Cliente = require('../../model/clientes.model');

router.get('/', async (req, res) => {

    log.info('GET movimientos por articulos')

    const cliente = req.query.cliente;
    const articulo = req.query.articulo;
    const fechaDesde = req.query.fechaDesde;
    const fechaHasta = req.query.fechaHasta;

    try {
        var respuesta = []

        var unidadMedidas = {}
        const unidadesMedidas = await UnidadMedida.findAll({
            where: {
                estado: 1
            }
        })
        unidadesMedidas.forEach(um => { unidadMedidas[um.dataValues.id] = um.dataValues.alias });


        var depositos = {}
        const depositoss = await Deposito.findAll({
            where: {
                estado: 1
            }
        })
        depositoss.forEach(dep => { depositos[dep.dataValues.id] = dep.dataValues.alias });



        //BUSCAMOS LOS INGRESOS DEL CLIENTE
        var buscando = {
            estado: 1,
            id_cliente: cliente,
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
        const ids_ing = resultado_ing.map(e => e.dataValues.id)


        //BUSCAMOS LOS ARTICULOS ASOCIADOS DE LOS INGRESOS
        const articulosAsociadosIngresos = await ArticuloAsociado.findAll({
            where: {
                id_documento: {
                    [Op.in]: ids_ing
                },
                id_articulo: articulo
            }
        })
        const ids_articulosIngreso = articulosAsociadosIngresos.map(e => e.dataValues.id)

        for (let artAsoc of articulosAsociadosIngresos) {
            const ing = resultado_ing.find(e => e.id == artAsoc.id_documento)

            if (!respuesta.some(e => e.id_documento == artAsoc.id_documento)) {
                respuesta.push({
                    tipo: 'INGRESO',
                    numero: mostrarDocumento(ing.punto, ing.numero),
                    fecha: ing.fecha,
                    cliente: ing.razon_social,
                    cantidad: 0, //
                    unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                    id_documento: artAsoc.id_documento
                })
            }

            var resp = respuesta.find(e => e.id_documento == artAsoc.id_documento)

            resp.cantidad += artAsoc.cantidad
        }

        //BUSCAMOS LAS DEVOLUCIONES DE INGRESOS
        const resultado_dev = await Devolucion.findAll({
            where: buscando
        })
        const ids_dev = resultado_dev.map(e => e.dataValues.id)

        const articulosAsociadosDevs = await ArticuloAsociado.findAll({
            where: {
                id_documento: {
                    [Op.in]: ids_dev
                },
                id_articulo: articulo,
            }
        })

        for (let artAsoc of articulosAsociadosDevs) {
            const dev = resultado_dev.find(e => e.id == artAsoc.id_documento)

            if (!respuesta.some(e => e.id_documento == artAsoc.id_documento)) {
                respuesta.push({
                    tipo: 'DEV. INGRESO',
                    numero: mostrarDocumento(dev.punto, dev.numero),
                    fecha: dev.fecha,
                    cliente: dev.razon_social,
                    cantidad: 0, //
                    unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                    id_documento: artAsoc.id_documento
                })
            }

            var resp = respuesta.find(e => e.id_documento == artAsoc.id_documento)

            resp.cantidad -= artAsoc.cantidad
        }

        //BUSCAMOS REMITOS DE SALIDA CON MERCADERIA PROPIA
        const resultado_rem = await Egresos.findAll({
            where: buscando
        })
        const ids_rem = resultado_rem.map(e => e.dataValues.id)

        const articulosAsociadosRem = await ArticuloAsociado.findAll({
            where: {
                id_documento: {
                    [Op.in]: ids_rem
                },
                id_original: {
                    [Op.in]: ids_articulosIngreso
                }
            }
        })


        for (let artAsoc of articulosAsociadosRem) {
            const rem = resultado_rem.find(e => e.id == artAsoc.id_documento)

            if (!respuesta.some(e => e.id_documento == artAsoc.id_documento)) {
                respuesta.push({
                    tipo: 'REMITO',
                    numero: mostrarDocumento(rem.punto, rem.numero),
                    fecha: rem.fecha,
                    cliente: rem.razon_social,
                    cantidad: 0, //
                    unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                    id_documento: artAsoc.id_documento
                })
            }

            var resp = respuesta.find(e => e.id_documento == artAsoc.id_documento)

            resp.cantidad -= artAsoc.cantidad
        }

        //BUSCAMOS DEVOLUCIONES DE REMITOS DE MERCADERIA PROPIA
        const resultado_remDevs = await RemitoDevolucion.findAll({
            where: buscando
        })
        const ids_remDevs = resultado_remDevs.map(e => e.dataValues.id)

        const articulosAsociadosRemDevs = await ArticuloAsociado.findAll({
            where: {
                id_documento: {
                    [Op.in]: ids_remDevs
                },
                id_original: {
                    [Op.in]: ids_articulosIngreso
                }
            }
        })

        for (let artAsoc of articulosAsociadosRemDevs) {
            const remDev = resultado_remDevs.find(e => e.id == artAsoc.id_documento)

            if (!respuesta.some(e => e.id_documento == artAsoc.id_documento)) {
                respuesta.push({
                    tipo: 'DEV. REMITO',
                    numero: mostrarDocumento(remDev.punto, remDev.numero),
                    fecha: remDev.fecha,
                    cliente: remDev.razon_social,
                    cantidad: 0, //
                    unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                    id_documento: artAsoc.id_documento
                })
            }

            var resp = respuesta.find(e => e.id_documento == artAsoc.id_documento)

            resp.cantidad += artAsoc.cantidad
        }


        //BUSCAMOS REMITOS PROPIOS DE MERCADERIA DE OTROS CLIENTES
        const articulosAsociadosRemOtrosOrigenes = await ArticuloAsociado.findAll({
            where: {
                id_documento: {
                    [Op.in]: ids_rem
                },
                id_original: {
                    [Op.notIn]: ids_articulosIngreso
                },
                id_articulo: articulo
            }
        })

        for (let artAsoc of articulosAsociadosRemOtrosOrigenes) {
            const remOtrosOrigenes = resultado_rem.find(e => e.id == artAsoc.id_documento)

            const artInic = await ArticuloAsociado.findOne({
                where: {
                    id: artAsoc.id_original
                }
            })

            const ingresoOriginal = await Ingreso.findOne({
                where: {
                    id: artInic.id_documento
                }
            })

            const duenoOriginal = ingresoOriginal.razon_social

            const existeArtAsoc = respuesta.some(e => {
                return (e.id_documento == artAsoc.id_documento) && (e.cliente == duenoOriginal)
            })

            if (!existeArtAsoc) {
                respuesta.push({
                    tipo: 'REMITO OTRO ORIGEN',
                    numero: mostrarDocumento(remOtrosOrigenes.punto, remOtrosOrigenes.numero),
                    fecha: remOtrosOrigenes.fecha,
                    cliente: duenoOriginal,
                    cantidad: 0, //
                    unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                    id_documento: artAsoc.id_documento
                })
            }
            var resp = respuesta.find(e => {
                return (e.id_documento == artAsoc.id_documento) && (e.cliente == duenoOriginal)
            })

            resp.cantidad -= artAsoc.cantidad
        }


        //BUSCAMOS DEVOLUCIONES DE REMITOS PROPIOS DE MERCADERIA DE OTROS CLIENTES
        const articulosAsociadosDevRemOtrosOrigenes = await ArticuloAsociado.findAll({
            where: {
                id_documento: {
                    [Op.in]: ids_remDevs
                },
                id_original: {
                    [Op.notIn]: ids_articulosIngreso
                },
                id_articulo: articulo
            }
        })

        for (let artAsoc of articulosAsociadosDevRemOtrosOrigenes) {
            const devRemOtrosOrigenes = resultado_remDevs.find(e => e.id == artAsoc.id_documento)

            const artInic = await ArticuloAsociado.findOne({
                where: {
                    id: artAsoc.id_original
                }
            })

            const ingresoOriginal = await Ingreso.findOne({
                where: {
                    id: artInic.id_documento
                }
            })

            const duenoOriginal = ingresoOriginal.razon_social

            const existeArtAsoc = respuesta.some(e => {
                return (e.id_documento == artAsoc.id_documento) && (e.cliente == duenoOriginal)
            })

            if (!existeArtAsoc) {
                respuesta.push({
                    tipo: 'DEV. REMITO OTRO ORIGEN',
                    numero: mostrarDocumento(devRemOtrosOrigenes.punto, devRemOtrosOrigenes.numero),
                    fecha: devRemOtrosOrigenes.fecha,
                    cliente: duenoOriginal,
                    cantidad: 0, //
                    unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                    id_documento: artAsoc.id_documento
                })
            }
            var resp = respuesta.find(e => {
                return (e.id_documento == artAsoc.id_documento) && (e.cliente == duenoOriginal)
            })

            resp.cantidad += artAsoc.cantidad
        }


        //BUSCAMOS REMITOS DE OTROS CLIENTES DE MERCADERIA PROPIA
        buscando.id_cliente = {
            [Op.ne]: cliente
        };

        const resultado_remOtros = await Egresos.findAll({
            where: buscando
        })
        const ids_remOtros = resultado_remOtros.map(e => e.dataValues.id)

        const articulosAsociadosRemOtros = await ArticuloAsociado.findAll({
            where: {
                id_documento: {
                    [Op.in]: ids_remOtros
                },
                id_original: {
                    [Op.in]: ids_articulosIngreso
                }
            }
        })

        for (let artAsoc of articulosAsociadosRemOtros) {
            const remOtros = resultado_remOtros.find(e => e.id == artAsoc.id_documento)

            if (!respuesta.some(e => e.id_documento == artAsoc.id_documento)) {
                respuesta.push({
                    tipo: 'REMITO OTRO DESTINO',
                    numero: mostrarDocumento(remOtros.punto, remOtros.numero),
                    fecha: remOtros.fecha,
                    cliente: remOtros.razon_social,
                    cantidad: 0, //
                    unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                    id_documento: artAsoc.id_documento
                })
            }
            var resp = respuesta.find(e => e.id_documento == artAsoc.id_documento)

            resp.cantidad -= artAsoc.cantidad
        }

        //BUSCAMOS DEVOLUCIONES DE REMITOS DE OTROS CLIENTES DE MERCADERIA PROPIA
        const resultado_remDevOtros = await RemitoDevolucion.findAll({
            where: buscando
        })
        const ids_remDevOtros = resultado_remDevOtros.map(e => e.dataValues.id)

        const articulosAsociadosRemDevOtros = await ArticuloAsociado.findAll({
            where: {
                id_documento: {
                    [Op.in]: ids_remDevOtros
                },
                id_original: {
                    [Op.in]: ids_articulosIngreso
                }
            }
        })

        for (let artAsoc of articulosAsociadosRemDevOtros) {
            const remDevOtros = resultado_remDevOtros.find(e => e.id == artAsoc.id_documento)

            if (!respuesta.some(e => e.id_documento == artAsoc.id_documento)) {
                respuesta.push({
                    tipo: 'DEV. REMITO OTRO DEST',
                    numero: mostrarDocumento(remDevOtros.punto, remDevOtros.numero),
                    fecha: remDevOtros.fecha,
                    cliente: remDevOtros.razon_social,
                    cantidad: 0, //
                    unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                    id_documento: artAsoc.id_documento
                })
            }
            var resp = respuesta.find(e => e.id_documento == artAsoc.id_documento)

            resp.cantidad += artAsoc.cantidad
        }
        /*

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
                [Op.notIn]: [e.dataValues.id]
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


            //respuesta.push(cliente)
        } */

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