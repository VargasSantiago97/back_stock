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

            var registro = {
                tipo: artAsoc.documento == 'ingreso' ? 'INGRESO' : 'INGRESO DEVOLUCION',
                numero: mostrarDocumento(ing.punto, ing.numero),
                fecha: ing.fecha,
                cliente: ing.razon_social,
                cantidad: artAsoc.cantidad, //
                unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                deposito: depositos[artAsoc.id_deposito],
                lote: artAsoc.lote,
                vencimiento: artAsoc.vencimiento,
                id_documento: artAsoc.id_documento
            }
            respuesta.push(registro)
        }

        //BUSCAMOS LAS DEVOLUCIONES DE INGRESOS
        const resultado_dev = await Devolucion.findAll({
            where: {
                estado: 1,
                id_cliente: cliente,
            }
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

            var registro = {
                tipo: artAsoc.documento == 'ingreso' ? 'INGRESO' : 'INGRESO DEVOLUCION',
                numero: mostrarDocumento(dev.punto, dev.numero),
                fecha: dev.fecha,
                cliente: dev.razon_social,
                cantidad: artAsoc.cantidad, //
                unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                deposito: depositos[artAsoc.id_deposito],
                lote: artAsoc.lote,
                vencimiento: artAsoc.vencimiento,
                id_documento: artAsoc.id_documento
            }
            respuesta.push(registro)
        }
        /* 
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