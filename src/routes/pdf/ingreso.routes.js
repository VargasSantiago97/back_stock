const express = require('express');
const router = express.Router();

const PDFDocument = require('pdfkit');

//const Articulo = require('../model/articulos.model');

router.get('/:id', async (req, res) => {

    const remitoId = req.params.id;

    try {
        // Obtener los datos del remito desde la base de datos
        /* 
        const remito = await Remito.findByPk(remitoId, {
            include: [Articulo] // Asumiendo que tienes una relación entre Remito y Articulo
        });

        if (!remito) {
            return res.status(404).json({ message: 'Remito no encontrado' });
        } */

        const doc = new PDFDocument({ margin: 0, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=remito.pdf');

        doc.pipe(res);

        const drawRoundedRect = (x, y, width, height) => {
            doc.roundedRect(x, y, width, height, 3).stroke();
        };

        //#############################################
        //                ENCABEZADO
        //#############################################

        drawRoundedRect(20, 20, 560, 104);

        //doc.image('src/routes/pdf/img/logo.png', 20, 20, { width: 80 }); // Logo
        doc.fontSize(16).font('Helvetica-Bold')
            .text('MOLIENDAS PAMPA S.A.S.', 30, 30)
        doc.fontSize(12).font('Helvetica')
            .text('Ruta Nacional 16, km 262.3', 30, 60)
            .text('Pampa del Infierno, Chaco', 30, 80)
            .text('IVA RESPONSABLE INSCRIPTO', 30, 105);

        // LETRA
        drawRoundedRect(285, 24, 40, 50);
        doc.fontSize(40).text('X', 291, 30);

        // NUMERO - FECHA - CUIT
        numero = '0001-00008888'
        fecha = '12/12/2222'

        doc.fontSize(14).text('INGRESO DE MERCADERIA', 350, 30);
        doc.fontSize(16).font('Helvetica-Bold').text(`N°: ${numero}`, 350, 50, {
            font: 'Courier-Bold'
        })
        doc.fontSize(12).text(`Fecha: ${fecha}`, 350, 70);

        doc.fontSize(10).font('Helvetica')
            .text(`CUIT: 30-12345678-9`, 350, 92)
            .text(`Ingresos Brutos: 123456789`, 350, 105);


        //#############################################
        //                CLIENTE
        //#############################################


        nombre = 'nombre'
        direccion = 'direccion'
        localidad = 'localidad'
        provincia = 'provincia'
        codigoPostal = 'codigoPostal'
        cuit = 'cuit'
        contacto = 'contacto'
        // Segunda Sección: Datos del Cliente
        drawRoundedRect(20, 129, 560, 80);
        doc.fontSize(10)
            .text('Señores:', 30, 140)
            .text('Dirección:', 30, 157)
            .text('I.V.A.:', 30, 176)
            .text('Contacto:', 30, 194)

            .text('Localidad:', 290, 157)
            .text('Provincia:', 290, 176)
            .text('C.U.I.T:', 290, 194)





        //#############################################
        //                TRANSPORTE
        //#############################################

        drawRoundedRect(20, 214, 560, 60);

        nombre = 'nombre'
        cuit = 'cuit'
        chofer = 'chofer'
        patente = 'patente'

        doc.fontSize(10)
            .text('Transporte:', 30, 225)
            .text('Domicilio:', 30, 242)
            .text('C.U.I.T:', 30, 259)
            
            .text('Conductor:', 290, 225)
            .text('Patente Chasis:', 290, 242)
            .text('Patente Acoplado:', 290, 259)






        //#############################################
        //                TABLA ARTICULOS
        //#############################################

        drawRoundedRect(20, 279, 560, 350);
        const tableTop = 390;
        const itemCodeX = 60;
        const descriptionX = 100;
        const quantityX = 300;
        const unitX = 350;
        const depositX = 400;
        const lotX = 450;
        const expiryX = 500;

        // Encabezados de la tabla
        doc.fontSize(10)
            .text('Código', itemCodeX, tableTop)
            .text('Descripción', descriptionX, tableTop)
            .text('Cantidad', quantityX, tableTop)
            .text('U. Medida', unitX, tableTop)
            .text('Depósito', depositX, tableTop)
            .text('Lote', lotX, tableTop)
            .text('Vencimiento', expiryX, tableTop);


        var Articulos = [
            {
                codigo: '01',
                descripcion: 'Access-Control-Allow-Origin',
                cantidad: '01',
                unidad: 123,
                deposito: 123,
                lote: 123,
                vencimiento: 123,
            },
            {
                codigo: '2',
                descripcion: 'Access-Control-Allow-Origin',
                cantidad: '01',
                unidad: 123,
                deposito: 123,
                lote: 123,
                vencimiento: 123,
            },
            {
                codigo: '013',
                descripcion: 'Access-Control-Allow-Origin',
                cantidad: '01',
                unidad: 123,
                deposito: 123,
                lote: 123,
                vencimiento: 123,
            },
        ];

        let y = tableTop + 20;
        Articulos.forEach(articulo => {
            doc.fontSize(10)
                .text(articulo.codigo, itemCodeX, y)
                .text(articulo.descripcion, descriptionX, y)
                .text(articulo.cantidad, quantityX, y)
                .text(articulo.unidad, unitX, y)
                .text(articulo.deposito, depositX, y)
                .text(articulo.lote, lotX, y)
                .text(articulo.vencimiento, expiryX, y);
            y += 20;
        });



        //#############################################
        //              OBSERVACIONES
        //#############################################

        drawRoundedRect(20, 634, 560, 70);
        doc.fontSize(12).text('Observaciones:', 60, 610)
            .text('Ninguna', 60, 630);

        // Firma del Cliente
        drawRoundedRect(20, 709, 560, 90);
        doc.fontSize(12).text('Firma del Cliente:', 60, 680)
            .moveTo(200, 720).lineTo(500, 720).stroke(); // Línea para la firma

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar el PDF' });
    }

});

module.exports = router;