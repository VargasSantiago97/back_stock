const express = require('express');
const jwt =  require('jsonwebtoken');


const router = express.Router();

require('dotenv').config();
const secret = process.env.CLAVE_SECRETA


router.post('/', (req, res) => {
    const { sub, name } = { sub:11, name:"Santiago" }

    const token = jwt.sign({
        sub, 
        name, 
        exp: Date.now() + 3600*1000 //3600 segundos
    }, secret);

    res.send({ token, user:8 });
});

module.exports = router;