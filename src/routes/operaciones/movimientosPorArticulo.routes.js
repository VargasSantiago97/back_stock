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
                    [Op.in]: [...INGRESOS.map(e => e.dataValues.id), ...DEVOLUCIONES.map(e => e.dataValues.id), ...REMITOS.map(e => e.dataValues.id), ...REMITOS_DEVOLUCIONES.map(e => e.dataValues.id), ...OPERACIONES.map(e => e.dataValues.id),]
                }
            }
        })

        const buscarDocumento = async (artAsoc) => {
            let datosDocumento = undefined
            if (artAsoc.documento == 'ingreso') {
                if (INGRESOS.some(e => e.dataValues.id == artAsoc.id_documento)) {
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
            if (artAsoc.documento == 'ingreso_devolucion') {
                if (DEVOLUCIONES.some(e => e.dataValues.id == artAsoc.id_documento)) {
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
            if (artAsoc.documento == 'operaciones') {
                if (OPERACIONES.some(e => e.dataValues.id == artAsoc.id_documento)) {
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
            if (artAsoc.documento == 'remito') {
                if (REMITOS.some(e => e.dataValues.id == artAsoc.id_documento)) {
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
            if (artAsoc.documento == 'remito_devolucion') {
                if (REMITOS_DEVOLUCIONES.some(e => e.dataValues.id == artAsoc.id_documento)) {
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

        let articulosAsociados = []
        for (let artAsoc of ArticulosAsociados) {

            let dueno = ''
            let retira_ingresa = ''
            let id_dueno = ''
            let id_retira_ingresa = ''
            const documento = await buscarDocumento(artAsoc.dataValues)

            //QUIEN RETIRA O INGRESA LA MERCADERIA
            if (artAsoc.dataValues.documento != 'operaciones') {
                retira_ingresa = documento.razon_social
                id_retira_ingresa = documento.id_cliente
            } else {
                if (artAsoc.dataValues.ajuste == 'positivo') {
                    retira_ingresa = documento.razon_social_ingreso
                    id_retira_ingresa = documento.id_cliente_ingreso
                } else {
                    retira_ingresa = documento.razon_social_egreso
                    id_retira_ingresa = documento.id_cliente_egreso
                }
            }

            //QUIEN ES EL DUEÑO DE LA MERCADERIA
            if (!artAsoc.dataValues.id_original) {
                dueno = retira_ingresa
                id_dueno = id_retira_ingresa
            } else {
                var articuloOriginal = ArticulosAsociados.find(e => e.dataValues.id == artAsoc.dataValues.id_original) || await ArticuloAsociado.findOne({ where: { estado: 1, id: artAsoc.dataValues.id_original } })

                //Buscamos el documento del articuloOriginal
                var documentoOriginal = await buscarDocumento(articuloOriginal.dataValues)

                if (articuloOriginal.dataValues.documento != 'operaciones') {
                    dueno = documentoOriginal.razon_social
                    id_dueno = documentoOriginal.id_cliente
                } else {
                    //Si no es una operacion, si o si es un ingreso
                    dueno = documentoOriginal.razon_social_ingreso
                    id_dueno = documentoOriginal.id_cliente_ingreso
                }
            }

            const tiposDocumentos = {
                ingreso: 'INGRESO',
                ingreso_devolucion: 'DEV. INGRESO',
                remito: 'REMITO',
                remito_devolucion: 'DEV. REMITO',
                operaciones: 'OPERACIONES'
            }

            let tipo = tiposDocumentos[artAsoc.dataValues.documento] || '' //ingreso //ingreso_devolucion //remito //remito_devolucion //operaciones
            if(artAsoc.dataValues.documento == 'operaciones'){
                tipo += ` (${documento.tipo.toUpperCase()})`
            }

            if(id_dueno == cliente || id_retira_ingresa == cliente){
                articulosAsociados.push({
                    tipo: tipo,
                    numero: mostrarDocumento(documento.punto, documento.numero),
                    fecha: documento.fecha,
    
                    dueno: dueno,
                    retira_ingresa: retira_ingresa,
                    _cantidad: artAsoc.dataValues.ajuste == 'positivo' ? artAsoc.dataValues.cantidad : (artAsoc.dataValues.cantidad * -1),
    
                    unidad_medida: unidadMedidas[artAsoc.dataValues.id_unidadMedida],

                    establecimiento_descripcion: documento.establecimiento_descripcion || '',
                    observaciones: documento.observaciones + (documento.observaciones_sistema ? ' OBS SIS:' : '') + documento.observaciones_sistema,

                    id_documento: documento.id
                })
            }
        }

        for (let articuloAsociado of articulosAsociados) {

            if (!respuesta.some(e => e.id_documento == articuloAsociado.id_documento)) {
                respuesta.push({ ...articuloAsociado, cantidad: 0})
            }

            var resp = respuesta.find(e => e.id_documento == articuloAsociado.id_documento)

            resp['cantidad'] += articuloAsociado._cantidad
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