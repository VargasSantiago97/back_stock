const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

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

const User = require('./../model/users');

router.get('/', async (req, res) => {
    log.info('GET all users')


    try {
        const users = await User.findAll()

        res.status(200).json({
            ok: true,
            mensaje: users
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
    log.info('GET one users')
    const id = req.params.id

    try {
        const user = await User.findOne({
            where: {
                id: id
            }
        })

        res.status(200).json({
            ok: true,
            mensaje: user
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

    await User.sync();
    const dataUser = req.body

    try {
        const hashedPassword = await bcrypt.hash(dataUser.password, 10);

        const createUser = await User.create({
            alias: dataUser.alias,
            descripcion: dataUser.descripcion,
            password: hashedPassword,
            email: dataUser.email,
            imagen: dataUser.imagen,
            datos: dataUser.datos,
            permisos: dataUser.permisos
        })

        res.status(201).json({
            ok: true,
            mensaje: 'Usuario creado',
            id: createUser.id
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
    log.info('PUT user')

    const id = req.params.id
    const dataUser = req.body

    console.log(dataUser)

    try {
        const updateUser = await User.update({
            alias: dataUser.alias,
            descripcion: dataUser.descripcion,
            password: dataUser.password,
            email: dataUser.email,
            imagen: dataUser.imagen,
            datos: dataUser.datos,
            permisos: dataUser.permisos
        },
            {
                where: {
                    id: id
                }
            })

        res.status(202).json({
            ok: true,
            mensaje: 'Usuario editado',
            id: updateUser
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
        const user = await User.destroy({
            where: {
                id: id,
            },
        });
    
        res.status(200).json({
            ok: true,
            mensaje: 'Usuario eliminado',
            id: user
        })
    } catch (err) {
        res.status(500).json({
            ok: false,
            mensaje: err,
            id: ''
        })
    }

});


module.exports = router;