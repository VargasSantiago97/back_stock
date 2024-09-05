const express = require('express');
const router = express.Router();

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

const Autorizado = require('../model/autorizados.model');

router.get('/', async (req, res) => {
    log.info('GET all Autorizados')

    try {
        const resultado = await Autorizado.findAll({
            where: {
                estado: 1
            }
        })

        const autorizados = resultado.map(autorizado => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(autorizado.dataValues.datos);
            } catch (error) {
                datosConvertidos = {}; // Devuelve un objeto vacío en caso de error
            }
            return {
                ...autorizado.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: autorizados
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
    log.info('GET one autorizado')
    const id = req.params.id

    try {
        const resultado = await Autorizado.findAll({
            where: {
                id_cliente: id,
                estado: 1
            }
        })

        const autorizados = resultado.map(autorizado => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(autorizado.dataValues.datos);
            } catch (error) {
                datosConvertidos = {}; // Devuelve un objeto vacío en caso de error
            }
            return {
                ...autorizado.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: autorizados
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

    await Autorizado.sync();
    const dataBody = req.body

    try {
        const createAutorizado = await Autorizado.create({
            id_cliente: dataBody.id_cliente,
            descripcion: dataBody.descripcion,
            documento: dataBody.documento,
            cargo: dataBody.cargo,
            contacto: dataBody.contacto,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        })

        res.status(201).json({
            ok: true,
            mensaje: createAutorizado.id,
            id: createAutorizado.id
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
    log.info('PUT autorizado')

    const id = req.params.id
    const data = req.body

    try {
        const updateAutorizado = await Autorizado.update({
            id_cliente: data.id_cliente,
            descripcion: data.descripcion,
            documento: data.documento,
            cargo: data.cargo,
            contacto: data.contacto,
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
            mensaje: updateAutorizado,
            id: updateAutorizado
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
        const updateAutorizado = await Autorizado.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: updateAutorizado,
            id: updateAutorizado
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