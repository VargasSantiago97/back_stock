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
const Operaciones = require('../../model/operaciones.model');

const UnidadMedida = require('../../model/unidadMedidas.model');
const Deposito = require('../../model/depositos.model');

router.get('/viejo', async (req, res) => {

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


        //BUSCAMOS OPERACIONES
        var buscandoOp = {
            estado: 1,
            [Op.or]: {
                id_cliente_ingreso: cliente,
                id_cliente_egreso: cliente
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

        const resultado_operaciones = await Operaciones.findAll({
            where: buscandoOp
        })

        const articulosAsociadosOperaciones = await ArticuloAsociado.findAll({
            where: {
                id_documento: {
                    [Op.in]: resultado_operaciones.map(e => e.id)
                },
                [Op.or]: {
                    id_original: {
                        [Op.in]: ids_articulosIngreso
                    },
                    id: {
                        [Op.in]: ids_articulosIngreso
                    }
                },
                estado: 1
            }
        })

        for (let artAsoc of articulosAsociadosOperaciones) {
            const operaciones = resultado_operaciones.find(e => e.id == artAsoc.id_documento)

            if (!respuesta.some(e => e.id_documento == artAsoc.id_documento)) {
                respuesta.push({
                    tipo: 'OPERACION',
                    numero: mostrarDocumento(operaciones.punto, operaciones.numero),
                    fecha: operaciones.fecha,
                    cliente: operaciones.tipo.toUpperCase(),
                    cantidad: 0, //
                    unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                    id_documento: artAsoc.id_documento
                })
            }
            var resp = respuesta.find(e => e.id_documento == artAsoc.id_documento)

            resp.cantidad += artAsoc.cantidad
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

router.get('/viejo2', async (req, res) => {

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


        //BUSCAMOS OPERACIONES
        var buscandoOp = {
            estado: 1,
            [Op.or]: {
                id_cliente_ingreso: cliente,
                id_cliente_egreso: cliente
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

        const resultado_operaciones = await Operaciones.findAll({
            where: buscandoOp
        })

        const articulosAsociadosOperaciones = await ArticuloAsociado.findAll({
            where: {
                id_documento: {
                    [Op.in]: resultado_operaciones.map(e => e.dataValues.id)
                },
                [Op.or]: {
                    //id_original: {
                    //    [Op.in]: ids_articulosIngreso
                    //},
                    id_articulo: articulo
                },
                estado: 1
            }
        })


        for (let artAsoc of articulosAsociadosOperaciones) {
            const operaciones = resultado_operaciones.find(e => e.id == artAsoc.id_documento)

            if (!respuesta.some(e => e.id_documento == artAsoc.id_documento)) {
                respuesta.push({
                    tipo: 'OPERACION',
                    numero: mostrarDocumento(operaciones.punto, operaciones.numero),
                    fecha: operaciones.fecha,
                    cliente: operaciones.tipo.toUpperCase(),
                    cantidad: 0, //
                    unidad_medida: unidadMedidas[artAsoc.id_unidadMedida], //
                    id_documento: artAsoc.id_documento
                })
            }
            var resp = respuesta.find(e => e.id_documento == artAsoc.id_documento)

            if (artAsoc.ajuste == 'positivo') {
                resp.cantidad += artAsoc.cantidad
            } else {
                resp.cantidad -= artAsoc.cantidad
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
            estado: 1
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

        const INGRESOS = await Ingreso.findAll({
            where: buscando
        })

        const DEVOLUCIONES = await Devolucion.findAll({
            where: buscando
        })

        const REMITOS = await Egresos.findAll({
            where: buscando
        })

        const REMITOS_DEVOLUCIONES = await RemitoDevolucion.findAll({
            where: buscando
        })

        const OPERACIONES = await Operaciones.findAll({
            where: buscando
        })

        const ArticulosAsociados = await ArticuloAsociado.findAll({
            where: {
                estado: 1,
                id_articulo: articulo,
                id_documento: {
                    [Op.in]: [ ...INGRESOS.map(e => e.dataValues.id), ...DEVOLUCIONES.map(e => e.dataValues.id), ...REMITOS.map(e => e.dataValues.id), ...REMITOS_DEVOLUCIONES.map(e => e.dataValues.id), ...OPERACIONES.map(e => e.dataValues.id), ]
                }
            }
        })

        const buscarDocumento = async (artAsoc) => {
            let datosDocumento = undefined
            if(artAsoc.documento == 'ingreso') {
                if(INGRESOS.some(e => e.dataValues.id == artAsoc.id_documento)){
                    datosDocumento = INGRESOS.find(e => e.dataValues.id == artAsoc.id_documento)
                } else {
                    datosDocumento = await Ingreso.findOne({
                        where: {
                            estado: 1,
                            id: artAsoc.id_documento
                        }
                    })
                }
            }
            if(artAsoc.documento == 'ingreso_devolucion') {
                if(DEVOLUCIONES.some(e => e.dataValues.id == artAsoc.id_documento)){
                    datosDocumento = DEVOLUCIONES.find(e => e.dataValues.id == artAsoc.id_documento)
                } else {
                    datosDocumento = await Devolucion.findOne({
                        where: {
                            estado: 1,
                            id: artAsoc.id_documento
                        }
                    })
                }
            }
            if(artAsoc.documento == 'operaciones') {
                if(OPERACIONES.some(e => e.dataValues.id == artAsoc.id_documento)){
                    datosDocumento = OPERACIONES.find(e => e.dataValues.id == artAsoc.id_documento)
                } else {
                    datosDocumento = await Operaciones.findOne({
                        where: {
                            estado: 1,
                            id: artAsoc.id_documento
                        }
                    })
                }
            }
            if(artAsoc.documento == 'remito') {
                if(REMITOS.some(e => e.dataValues.id == artAsoc.id_documento)){
                    datosDocumento = REMITOS.find(e => e.dataValues.id == artAsoc.id_documento)
                } else {
                    datosDocumento = await Egresos.findOne({
                        where: {
                            estado: 1,
                            id: artAsoc.id_documento
                        }
                    })
                }
            }
            if(artAsoc.documento == 'remito_devolucion') {
                if(REMITOS_DEVOLUCIONES.some(e => e.dataValues.id == artAsoc.id_documento)){
                    datosDocumento = REMITOS_DEVOLUCIONES.find(e => e.dataValues.id == artAsoc.id_documento)
                } else {
                    datosDocumento = await RemitoDevolucion.findOne({
                        where: {
                            estado: 1,
                            id: artAsoc.id_documento
                        }
                    })
                }
            }

            return datosDocumento ? datosDocumento.dataValues : datosDocumento
        }

        const verificarMercaderiaPropia = async (artAsoc, documento) => {
            //si no tiene id original, es un ingreso. Por lo tanto es propia
            if(!artAsoc.id_original){
                return true
            }

            //buscamos articuloOriginal en memoria, sino en DB
            var articuloOriginal = {}
            if(ArticulosAsociados.some(e => e.dataValues.id == artAsoc.id_original)){
                articuloOriginal = ArticulosAsociados.find(e => e.dataValues.id == artAsoc.id_original)
            } else {
                articuloOriginal = await ArticuloAsociado.findOne({
                    where: {
                        estado: 1,
                        id: artAsoc.id_original
                    }
                })
            }

            //buscamos el documento del articuloOriginal
            var documentoOriginal = buscarDocumento(articuloOriginal)

            if(articuloOriginal.dataValues.documento == 'operaciones'){
                return documentoOriginal.id_cliente_ingreso == cliente
            } else {
                return documentoOriginal.id_cliente == cliente
            }
        }

        let articulosAsociados = []
        for (let artAsoc of ArticulosAsociados) {

            const documento = await buscarDocumento(artAsoc.dataValues)

            const mercaderiaPropia = await verificarMercaderiaPropia(artAsoc.dataValues, documento)

            articulosAsociados.push({ ...artAsoc.dataValues, ...documento, mercaderiaPropia })
        }

        const agregarArticuloRespuesta = (tipoDocumento, datos) => {
            if (!respuesta.some(e => e.id_documento == datos.id_documento)) {
                respuesta.push({
                    tipo: tipoDocumento,
                    numero: mostrarDocumento(datos.punto, datos.numero),
                    fecha: datos.fecha,
                    cliente: tipoDocumento == 'OPERACIONES' ? datos.tipo.toUpperCase() : datos.razon_social,
                    cantidad: 0, //
                    unidad_medida: unidadMedidas[datos.id_unidadMedida], //
                    id_documento: datos.id_documento
                })
            }

            var resp = respuesta.find(e => e.id_documento == datos.id_documento)

            if(tipoDocumento == 'OPERACIONES'){
                if(datos.ajuste == 'positivo' && datos.id_cliente_ingreso == cliente){
                    resp.cantidad += datos.cantidad
                }
                if(datos.ajuste == 'negativo' && datos.id_cliente_egreso == cliente){
                    resp.cantidad -= datos.cantidad
                }
            } else {
                if(datos.ajuste == 'positivo'){
                    resp.cantidad += datos.cantidad
                } else {
                    resp.cantidad -= datos.cantidad
                }
            }
        }

        for (let articuloAsociado of articulosAsociados) {
            //INGRESO
            if(articuloAsociado.documento == 'ingreso' && articuloAsociado.id_cliente == cliente){
                agregarArticuloRespuesta('INGRESO', articuloAsociado)
            }

            //DEV. INGRESO
            if(articuloAsociado.documento == 'ingreso_devolucion' && articuloAsociado.id_cliente == cliente){
                agregarArticuloRespuesta('DEV. INGRESO', articuloAsociado)
            }

            //REMITO
            if(
                articuloAsociado.documento == 'remito' && 
                articuloAsociado.id_cliente == cliente &&
                articuloAsociado.mercaderiaPropia
            ){
                agregarArticuloRespuesta('REMITO', articuloAsociado)
            }

            //DEV. REMITO
            if(
                articuloAsociado.documento == 'remito_devolucion' && 
                articuloAsociado.id_cliente == cliente &&
                articuloAsociado.mercaderiaPropia
            ){
                agregarArticuloRespuesta('DEV. REMITO', articuloAsociado)
            }

            //REMITO OTRO DESTINO
            if(
                articuloAsociado.documento == 'remito' && 
                articuloAsociado.id_cliente != cliente &&
                articuloAsociado.mercaderiaPropia
            ){
                agregarArticuloRespuesta('REMITO OTRO DESTINO', articuloAsociado)
            }

            //DEV. REMITO OTRO DEST
            if(
                articuloAsociado.documento == 'remito_devolucion' && 
                articuloAsociado.id_cliente != cliente &&
                articuloAsociado.mercaderiaPropia
            ){
                agregarArticuloRespuesta('DEV. REMITO OTRO DEST', articuloAsociado)
            }

            //REMITO OTRO ORIGEN
            if(
                articuloAsociado.documento == 'remito' && 
                articuloAsociado.id_cliente == cliente &&
                !articuloAsociado.mercaderiaPropia
            ){
                agregarArticuloRespuesta('REMITO OTRO ORIGEN', articuloAsociado)
            }

            //DEV. REMITO OTRO ORIGEN
            if(
                articuloAsociado.documento == 'remito_devolucion' && 
                articuloAsociado.id_cliente == cliente &&
                !articuloAsociado.mercaderiaPropia
            ){
                agregarArticuloRespuesta('DEV. REMITO OTRO ORIGEN', articuloAsociado)
            }

            //OPERACIONES
            if(
                articuloAsociado.documento == 'operaciones' && 
                (articuloAsociado.id_cliente_ingreso == cliente || articuloAsociado.id_cliente_egreso == cliente)
            ){
                agregarArticuloRespuesta('OPERACIONES', articuloAsociado)
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