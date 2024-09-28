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

const Ingreso = require('../model/ingresos.model');

router.get('/', async (req, res) => {
    log.info('GET all Ingresos')

    try {
        const resultado = await Ingreso.findAll({
            where: {
                estado: 1
            }
        })

        const ingresos = resultado.map(ingreso => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(ingreso.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...ingreso.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: ingresos
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
    log.info('GET one ingreso')
    const id = req.params.id

    try {
        const resultado = await Ingreso.findOne({
            where: {
                id: id
            }
        })

        let datosConvertidos;
        try {
            datosConvertidos = JSON.parse(resultado.dataValues.datos);
        } catch (error) {
            datosConvertidos = {};
        }

        res.status(200).json({
            ok: true,
            mensaje: {
                ...resultado.dataValues,
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

    await Ingreso.sync();
    const dataBody = req.body

    try {
        const createIngreso = await Ingreso.create({
            fechaFecha: new Date(dataBody.fecha),
            fecha: dataBody.fecha,
            numero: dataBody.numero,
            punto: dataBody.punto,
            modelo: dataBody.modelo,
            id_cliente: dataBody.id_cliente,
            codigo: dataBody.codigo,
            razon_social: dataBody.razon_social,
            cuit: dataBody.cuit,
            alias: dataBody.alias,
            direccion: dataBody.direccion,
            localidad: dataBody.localidad,
            provincia: dataBody.provincia,
            codigo_postal: dataBody.codigo_postal,
            telefono: dataBody.telefono,
            correo: dataBody.correo,
            id_autorizado: dataBody.id_autorizado,
            autorizado_descripcion: dataBody.autorizado_descripcion,
            autorizado_documento: dataBody.autorizado_documento,
            autorizado_contacto: dataBody.autorizado_contacto,
            id_transporte: dataBody.id_transporte,
            transporte_transporte: dataBody.transporte_transporte,
            transporte_cuit_transporte: dataBody.transporte_cuit_transporte,
            transporte_chofer: dataBody.transporte_chofer,
            transporte_cuit_chofer: dataBody.transporte_cuit_chofer,
            transporte_patente_chasis: dataBody.transporte_patente_chasis,
            transporte_patente_acoplado: dataBody.transporte_patente_acoplado,
            id_establecimiento: dataBody.id_establecimiento,
            establecimiento_descripcion: dataBody.establecimiento_descripcion,
            establecimiento_localidad: dataBody.establecimiento_localidad,
            establecimiento_provincia: dataBody.establecimiento_provincia,
            observaciones: dataBody.observaciones,
            observaciones_sistema: dataBody.observaciones_sistema,
            total_unidades: dataBody.total_unidades,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        })

        res.status(201).json({
            ok: true,
            mensaje: createIngreso.id,
            id: createIngreso.id
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
    log.info('PUT ingreso')

    const id = req.params.id
    const dataBody = req.body

    try {
        const updateIngreso = await Ingreso.update({
            fechaFecha: new Date(dataBody.fecha),
            fecha: dataBody.fecha,
            numero: dataBody.numero,
            punto: dataBody.punto,
            modelo: dataBody.modelo,
            id_cliente: dataBody.id_cliente,
            codigo: dataBody.codigo,
            razon_social: dataBody.razon_social,
            cuit: dataBody.cuit,
            alias: dataBody.alias,
            direccion: dataBody.direccion,
            localidad: dataBody.localidad,
            provincia: dataBody.provincia,
            codigo_postal: dataBody.codigo_postal,
            telefono: dataBody.telefono,
            correo: dataBody.correo,
            id_autorizado: dataBody.id_autorizado,
            autorizado_descripcion: dataBody.autorizado_descripcion,
            autorizado_documento: dataBody.autorizado_documento,
            autorizado_contacto: dataBody.autorizado_contacto,
            id_transporte: dataBody.id_transporte,
            transporte_transporte: dataBody.transporte_transporte,
            transporte_cuit_transporte: dataBody.transporte_cuit_transporte,
            transporte_chofer: dataBody.transporte_chofer,
            transporte_cuit_chofer: dataBody.transporte_cuit_chofer,
            transporte_patente_chasis: dataBody.transporte_patente_chasis,
            transporte_patente_acoplado: dataBody.transporte_patente_acoplado,
            id_establecimiento: dataBody.id_establecimiento,
            establecimiento_descripcion: dataBody.establecimiento_descripcion,
            establecimiento_localidad: dataBody.establecimiento_localidad,
            establecimiento_provincia: dataBody.establecimiento_provincia,
            observaciones: dataBody.observaciones,
            observaciones_sistema: dataBody.observaciones_sistema,
            total_unidades: dataBody.total_unidades,
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
            mensaje: updateIngreso,
            id: updateIngreso
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
        const updateIngreso = await Ingreso.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateIngreso,
            id: updateIngreso
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

router.get('/buscar/siguiente/:ptoVta', async (req, res) => {
    log.info('Obtener ultimo ingreso')

    const ptoVta = req.params.ptoVta

    try {
        const resultado = await Ingreso.findAll({
            where: {
                estado: 1,
                punto: ptoVta
            }
        })

        ultimo = resultado.reduce((max, curr) => {
            return max < curr.dataValues.numero ? curr.dataValues.numero : max
        }, 0)

        res.status(200).json({
            ok: true,
            mensaje: ultimo + 1
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