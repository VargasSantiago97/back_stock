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

const Cliente = require('../model/clientes.model');

router.get('/', async (req, res) => {
    log.info('GET all clientes')

    try {
        const resultado = await Cliente.findAll({
            where: {
                estado: 1
            }
        })

        const clientes = resultado.map(cliente => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(cliente.dataValues.datos);
            } catch (error) {
                datosConvertidos = {}; // Devuelve un objeto vacío en caso de error
            }
            return {
                ...cliente.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: clientes
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
    log.info('GET one cliente')
    const id = req.params.id

    try {
        const cliente = await Cliente.findOne({
            where: {
                id: id
            }
        })

        let datosConvertidos;
        try {
            datosConvertidos = JSON.parse(cliente.datos);
        } catch (error) {
            datosConvertidos = {};
        }

        res.status(200).json({
            ok: true,
            mensaje: {
                ...cliente.dataValues,
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

    await Cliente.sync();
    const dataBody = req.body

    try {
        const createCliente = await Cliente.create({
            cuit: dataBody.cuit,
            codigo: dataBody.codigo,
            razon_social: dataBody.razon_social,
            alias: dataBody.alias,
            direccion: dataBody.direccion,
            localidad: dataBody.localidad,
            provincia: dataBody.provincia,
            codigo_postal: dataBody.codigo_postal,
            telefono: dataBody.telefono,
            correo: dataBody.correo,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy,
        })

        res.status(201).json({
            ok: true,
            mensaje: createCliente.id,
            id: createCliente.id
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
    log.info('PUT cliente')

    const id = req.params.id
    const data = req.body

    try {
        const updateCliente = await Cliente.update({
            cuit: data.cuit,
            codigo: data.codigo,
            razon_social: data.razon_social,
            alias: data.alias,
            direccion: data.direccion,
            localidad: data.localidad,
            provincia: data.provincia,
            codigo_postal: data.codigo_postal,
            telefono: data.telefono,
            correo: data.correo,
            datos: data.datos,
            estado: data.estado,
            createdBy: data.createdBy,
            updatedBy: data.updatedBy
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateCliente,
            id: updateCliente
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
        const updateCliente = await Cliente.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateCliente,
            id: updateCliente
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

router.get('/codigo/:codigo', async (req, res) => {
    log.info('GET one cliente por codigo')
    const codigo = req.params.codigo

    try {
        const cliente = await Cliente.findOne({
            where: {
                codigo: codigo
            }
        })

        let datosConvertidos;
        try {
            datosConvertidos = JSON.parse(cliente.datos);
        } catch (error) {
            datosConvertidos = {};
        }

        res.status(200).json({
            ok: true,
            mensaje: {
                ...cliente.dataValues,
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

router.get('/buscar/:buscando', async (req, res) => {
    log.info('GET clientes buscando alias o razon social')
    const buscando = req.params.buscando

    try {
        const resultado = await Cliente.findAll({
            where: {
                estado: 1,
                [Op.or]: [
                    { razon_social: { [Op.like]: `%${buscando}%` } },
                    { alias: { [Op.like]: `%${buscando}%` } }
                ]
            }
        })

        const clientes = resultado.map(cliente => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(cliente.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...cliente.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: clientes
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