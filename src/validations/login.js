const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const User = require('./../model/users');

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

require('dotenv').config();
const secret = process.env.CLAVE_SECRETA

router.post('/', async (req, res) => {

    const data = req.body

    try {
        const user = await User.findOne({
            where: {
                alias: data.user
            }
        })

        if(!user){
            log.error(`Se intentó iniciar sesión sin usuario o usuario incorrecto: ${data.user}`)
            return res.status(400).json({
                ok: false,
                mensaje: 'Usuario o contraseña incorrectos',
                id: ''
            })
        }

        const ok_pass = await bcrypt.compare(data.password, user.password);


        if(!ok_pass){
            log.error(`Contraseña incorrecta. Se intentó iniciar sesión con ${user.descripcion} (${data.user})`)

            return res.status(400).json({
                ok: false,
                mensaje: 'Usuario o contraseña incorrectos',
                id: ''
            })
        }

        const { sub, descripcion, permisos } = { sub: user.id, descripcion: user.descripcion, permisos: user.permisos }

        const token = jwt.sign({
            user: data.user,
            sub,
            descripcion,
            permisos,
            exp: Date.now() + 7200 * 1000 //7200 segundos = 120 minutoos = 2 horas
        }, secret);

        log.info(`SESIÓN INICIADA. User: ${data.user} - Descripcion: ${descripcion}`)
        res.status(200).json({
            ok: true,
            mensaje: token
        })


    }
    catch (err) {
        log.error(`Error al intentar iniciar sesión. ${err.message ? err.message : 'Sin mensaje'}`)
        res.status(500).json({
            ok: false,
            mensaje: err,
            id: ''
        })
    }

});

module.exports = router;