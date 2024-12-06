const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {

    const TiposOperaciones = [
        {
            id: 1,
            alias: 'Clasificacion',
            descripcion: 'Clasificacion',
        },
        {
            id: 2,
            alias: 'Embolsado',
            descripcion: 'Embolsado',
        },
        {
            id: 3,
            alias: 'Inoculacion',
            descripcion: 'Inoculacion',
        },
        {
            id: 4,
            alias: 'Cambios de ubicación',
            descripcion: 'Cambios de ubicación',
        },
        {
            id: 5,
            alias: 'Cambios de mercadería',
            descripcion: 'Cambios de mercadería',
        },
        {
            id: 6,
            alias: 'Otros',
            descripcion: 'Otros',
        },
    ]

    res.status(200).json({
        ok: true,
        mensaje: TiposOperaciones
    })

});

module.exports = router;