const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const User = require('./../model/users');

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

        console.log(secret)

        if(!user){
            return res.status(400).json({
                ok: false,
                mensaje: 'Usuario o contraseña incorrectos',
                id: ''
            })
        }

        const ok_pass = await bcrypt.compare(data.password, user.password);


        if(!ok_pass){
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

        res.status(200).json({
            ok: true,
            mensaje: token
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