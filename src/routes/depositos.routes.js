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

const Deposito = require('../model/depositos.model');

router.get('/', async (req, res) => {
    log.info('GET all Depositos')

    try {
        const resultado = await Deposito.findAll({
            where: {
                estado: 1
            }
        })

        const depositos = resultado.map(deposito => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(deposito.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...deposito.dataValues,
                datos: datosConvertidos
            };
        });

        res.status(200).json({
            ok: true,
            mensaje: depositos
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
    log.info('GET one Deposito')
    const id = req.params.id

    try {
        const deposito = await Deposito.findOne({
            where: {
                id: id
            }
        })

        let datosConvertidos;
        try {
            datosConvertidos = JSON.parse(deposito.datos);
        } catch (error) {
            datosConvertidos = {};
        }

        res.status(200).json({
            ok: true,
            mensaje: {
                ...deposito,
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

    await Deposito.sync();
    const dataBody = req.body

    try {
        const createDeposito = await Deposito.create({
            descripcion: dataBody.descripcion,
            alias: dataBody.alias,
            datos: dataBody.datos,
            estado: dataBody.estado,
            createdBy: dataBody.createdBy,
            updatedBy: dataBody.updatedBy
        })

        res.status(201).json({
            ok: true,
            mensaje: createDeposito.id,
            id: createDeposito.id
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
    log.info('PUT deposito')

    const id = req.params.id
    const dataBody = req.body

    try {
        const deposito = await Deposito.update({
            descripcion: dataBody.descripcion,
            alias: dataBody.alias,
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
            mensaje: deposito,
            id: deposito
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
        const deposito = await Deposito.update({
            estado: 0
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: deposito,
            id: deposito
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