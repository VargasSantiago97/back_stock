const express = require('express');
const router = express.Router();
const fs = require('fs');

const PDFDocument = require('pdfkit');

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
function vencimientoFormato(venc) {
    if (!venc) {
        return '-'
    }
    try {
        var fecha_venc = venc.split('-')
        return `${fecha_venc[2]}/${fecha_venc[1]}/${fecha_venc[0]}`
    } catch {
        return '-'
    }
}

const Devolucion = require('../../model/ingresosDevoluciones.model');
const ArticuloAsociado = require('../../model/articulosAsociados.model');
const Deposito = require('../../model/depositos.model');
const UnidadMedida = require('../../model/unidadMedidas.model');

const drawRoundedRect = (doc, x, y, width, height) => {
    doc.roundedRect(x, y, width, height, 3).stroke();
};
const drawTextWithBorder = (doc, text, x, y, width, height, align, font = 'Helvetica', fontSize = 8) => {

    doc.fontSize(fontSize).font(font)
        //.rect(x, y, width, height).stroke()
        .text(text, x, y, {
            align: align,
            width: width,
            height: height,
            ellipsis: true
        });
};

var modelos = {}
fs.readFile('./src/config/modelos.json', 'utf8', (err, data) => {
    if (err) {
        log.error('Error al leer el archivo:', err);
        return;
    }
    try {
        modelos = JSON.parse(data);
    } catch (error) {
        log.error('Error al parsear el JSON:', error);
    }
});

const tableTop = 284;
const codigoX = 24;
const descripcionX = 85;
const cantidadX = 310;
const unidadMedidaX = 360;
const depositoX = 410;
const loteX = 460;
const vencimientoX = 530;

const addEncabezado = (doc, datos, copia) => {

    razon_social = modelos[datos.modelo].razon_social
    direccion = modelos[datos.modelo].direccion
    localidad = modelos[datos.modelo].localidad
    condicion_iva = modelos[datos.modelo].condicion_iva
    cuit = modelos[datos.modelo].cuit
    iibb = modelos[datos.modelo].iibb

    drawRoundedRect(doc, 20, 20, 560, 104);

    //doc.image('src/routes/pdf/img/logo.png', 20, 20, { width: 80 }); // Logo
    doc.fontSize(16).font('Helvetica-Bold')
        .text(razon_social, 30, 30)
    doc.fontSize(12).font('Helvetica')
        .text(direccion, 30, 60)
        .text(localidad, 30, 80)
        .text(condicion_iva, 30, 105);

    // LETRA
    drawRoundedRect(doc, 285, 24, 40, 50);
    doc.fontSize(22).text('X', 296, 28);

    doc.fontSize(7).text('Documento no valido como factura', 286, 47, {
        align: 'center',
        width: 40,
        height: 35,
        ellipsis: true,
        lineGap: -2
    });

    //COPIA [original, dup...]
    doc.fontSize(10).font('Helvetica-Bold').text(copia, 265, 85, {
        align: 'center',
        width: 80,
        height: 20,
        ellipsis: true
    });


    // NUMERO - FECHA - CUIT

    numero = `${String(datos.punto).padStart(4, '0')}-${String(datos.numero).padStart(8, '0')}`

    var fecha_ent = datos.fecha.split('-')
    fecha = `${fecha_ent[2]}/${fecha_ent[1]}/${fecha_ent[0]}`

    doc.fontSize(14).text('DEVOLUCIÓN DE MERCADERIA', 350, 30);
    doc.fontSize(16).font('Helvetica-Bold').text(`N°: ${numero}`, 350, 50, {
        font: 'Courier-Bold'
    })
    doc.fontSize(12).text(`Fecha: ${fecha}`, 350, 70);

    doc.fontSize(10).font('Helvetica')
        .text(`CUIT: ${cuit}`, 350, 92)
        .text(`Ingresos Brutos: ${iibb}`, 350, 105);


    //#############################################
    //                TABLA ARTICULOS
    //#############################################

    drawRoundedRect(doc, 20, 279, 560, 350);

    // Encabezados de la tabla
    doc.fontSize(8).font('Helvetica-Bold')
        .text('CÓD.', codigoX, tableTop, { align: 'center', width: 65, height: 8 })
        .text('DESCRIPCIÓN', descripcionX, tableTop, { align: 'center', width: 225, height: 8 })
        .text('CANT.', cantidadX, tableTop, { align: 'center', width: 50, height: 8 })
        .text('U.M.', unidadMedidaX, tableTop, { align: 'center', width: 50, height: 8 })
        .text('DEP.', depositoX, tableTop, { align: 'center', width: 50, height: 8 })
        .text('LOTE', loteX, tableTop, { align: 'center', width: 70, height: 8 })
        .text('VTO', vencimientoX, tableTop, { align: 'center', width: 50, height: 8 })
        .moveTo(20, tableTop + 11).lineTo(580, tableTop + 11).stroke();

}

const addCliente = (doc, datos) => {

    drawRoundedRect(doc, 20, 129, 560, 80);
    doc.fontSize(10).font('Helvetica')
        .text('Señores:', 30, 140)
        .text('Dirección:', 30, 157)
        .text('I.V.A.:', 30, 176)
        .text('Contacto:', 30, 194)

        .text('Localidad:', 290, 157)
        .text('Provincia:', 290, 176)
        .text('C.U.I.T:', 290, 194);

    const contacto = (datos.telefono ? datos.telefono : '') + ((datos.telefono && datos.correo) ? '/' : '') + (datos.correo ? datos.correo : '')

    drawTextWithBorder(doc, `(${datos.codigo}) ${datos.razon_social}`, 80, 140, 500, 14, 'left', 'Helvetica-Bold', 10)
    drawTextWithBorder(doc, datos.direccion, 80, 157, 205, 14, 'left', 'Helvetica', 10)
    drawTextWithBorder(doc, '', 80, 176, 205, 14, 'left', 'Helvetica', 10)
    drawTextWithBorder(doc, contacto, 80, 194, 205, 14, 'left', 'Helvetica', 10)

    drawTextWithBorder(doc, `${datos.localidad} (${datos.codigo_postal})`, 340, 157, 240, 14, 'left', 'Helvetica', 10)
    drawTextWithBorder(doc, datos.provincia, 340, 176, 240, 14, 'left', 'Helvetica', 10)
    drawTextWithBorder(doc, datos.cuit ? datos.cuit : '', 340, 194, 240, 14, 'left', 'Helvetica-Bold', 10)

}

const addTransporte = (doc, datos) => {
    drawRoundedRect(doc, 20, 214, 560, 60);

    transporte = datos.transporte_transporte;
    domicilio = '';
    cuit = datos.transporte_cuit_transporte || '';

    conductor = datos.transporte_chofer;
    patente_chasis = datos.transporte_patente_chasis;
    patente_acoplado = datos.transporte_patente_acoplado;

    doc.fontSize(10).font('Helvetica')
        .text('Transporte:', 30, 225)
        .text('Domicilio:', 30, 242)
        .text('C.U.I.T:', 30, 259)

        .text('Conductor:', 290, 225)
        .text('Patente Chasis:', 290, 242)
        .text('Patente Acoplado:', 290, 259);

    drawTextWithBorder(doc, transporte, 83, 225, 205, 14, 'left', 'Helvetica', 10)
    drawTextWithBorder(doc, domicilio, 83, 242, 205, 14, 'left', 'Helvetica', 10)
    drawTextWithBorder(doc, cuit, 83, 259, 205, 14, 'left', 'Helvetica', 10)

    drawTextWithBorder(doc, conductor, 344, 225, 236, 14, 'left', 'Helvetica', 10)
    drawTextWithBorder(doc, patente_chasis, 365, 242, 205, 14, 'left', 'Helvetica', 10)
    drawTextWithBorder(doc, patente_acoplado, 375, 259, 205, 14, 'left', 'Helvetica', 10)

}

const addPie = (doc, datos, pagina, cantidadPaginas) => {

    total_unidades = datos.total_unidades
    observaciones = datos.observaciones

    drawRoundedRect(doc, 20, 634, 560, 70);
    doc.fontSize(8)
        .text('TOTAL DE UNIDADES:', 25, 637)
        .moveTo(20, 647).lineTo(580, 647).stroke()
        .text('Observaciones:', 25, 650);

    drawTextWithBorder(doc, total_unidades, 115, 637, 465, 10, 'left', 'Helvetica', 9)

    doc.fontSize(8).font('Helvetica')
        .text(observaciones, 25, 660, {
            align: 'left',
            width: 550,
            height: 40,
            ellipsis: false
        });

    // Firma del Cliente
    drawRoundedRect(doc, 20, 709, 560, 90);

    doc.fontSize(8)
        .text('Entregó', 110, 750)
        .text('Controló', 109, 790)
        .moveTo(40, 748).lineTo(205, 748).stroke()
        .moveTo(40, 788).lineTo(205, 788).stroke()
        .moveTo(225, 709).lineTo(225, 799).stroke()

        .text('He recibido de conformidad las mercaderias detalladas', 225, 713, { align: 'center', width: 355 })

        .moveTo(245, 788).lineTo(470, 788).stroke()
        .moveTo(480, 788).lineTo(560, 788).stroke()

        .text('Firma / Aclaración', 235, 790, { align: 'center', width: 245 })
        .text('Fecha', 480, 790, { align: 'center', width: 80 });

    doc.fontSize(20).font('Helvetica')
        .text('/   /', 480, 770, { align: 'center', width: 80, height: 17 });

    doc.fontSize(8).font('Helvetica')
        .text(`Pág ${pagina}/${cantidadPaginas}`, 0, 805, { align: 'center' })
}

router.get('/:id/:cant', async (req, res) => {

    const remitoId = req.params.id;
    const cantidadCopias = req.params.cant;

    try {
        const devolucion = await Devolucion.findOne({
            where: {
                id: remitoId
            }
        })
        const articulos = await ArticuloAsociado.findAll({
            where: {
                estado: 1,
                id_documento: remitoId
            }
        })
        const unidadesMedidas = await UnidadMedida.findAll({
            where: {
                estado: 1
            }
        })
        const depositos = await Deposito.findAll({
            where: {
                estado: 1
            }
        })

        if (!devolucion) {
            return res.status(404).json({ message: 'Devolucion no encontrada' });
        }

        const doc = new PDFDocument({ margin: 0, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=remito.pdf');

        doc.pipe(res);

        tiposCopias = ['ORIGINAL', 'DUPLICADO', 'TRIPLICADO', 'CUADRIPLICADO', 'QUINTUPLICADO', 'COPIA']

        var Articulos = articulos.map(articulo => {
            return {
                codigo: articulo.dataValues.codigo,
                descripcion: articulo.dataValues.descripcion,
                cantidad: articulo.dataValues.cantidad,
                unidad: unidadesMedidas.some(e => e.dataValues.id == articulo.dataValues.id_unidadMedida) ? unidadesMedidas.find(e => e.dataValues.id == articulo.dataValues.id_unidadMedida).descripcion : '-',
                deposito: depositos.some(e => e.dataValues.id == articulo.dataValues.id_deposito) ? depositos.find(e => e.dataValues.id == articulo.dataValues.id_deposito).descripcion : '-',
                lote: articulo.dataValues.lote || '-',
                vencimiento: vencimientoFormato(articulo.dataValues.vencimiento)
            }
        })

        for (let copia = 0; copia < cantidadCopias; copia++) {
            if(copia) doc.addPage();

            var pagina = 1
            let cantidadPaginas = Math.ceil(Articulos.length / 19);

            addEncabezado(doc, devolucion.dataValues, tiposCopias[copia] ?  tiposCopias[copia] : 'COPIA');
            addCliente(doc, devolucion.dataValues);
            addTransporte(doc, devolucion.dataValues);
            addPie(doc, devolucion.dataValues, pagina, cantidadPaginas);

            const rowHeight = 16;

            let y = tableTop + rowHeight;
            let cantidadRegistros = 1

            Articulos.forEach(articulo => {

                if (cantidadRegistros >= 20) {
                    pagina++;

                    doc.addPage();
                    addEncabezado(doc, devolucion.dataValues, tiposCopias[copia] ?  tiposCopias[copia] : 'COPIA');
                    addCliente(doc, devolucion.dataValues);
                    addTransporte(doc, devolucion.dataValues);
                    addPie(doc, devolucion.dataValues, pagina, cantidadPaginas);

                    cantidadRegistros = 1
                    y = tableTop + rowHeight
                }

                var cantidad = ''
                try {
                    cantidad = articulo.cantidad.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })
                } catch {
                    cantidad = articulo.cantidad
                }

                drawTextWithBorder(doc, articulo.codigo, codigoX, y, 61, rowHeight, 'left');
                drawTextWithBorder(doc, articulo.descripcion, descripcionX, y, 225, rowHeight, 'left');
                drawTextWithBorder(doc, cantidad, cantidadX, y, 50, rowHeight, 'right');
                drawTextWithBorder(doc, articulo.unidad, unidadMedidaX, y, 50, rowHeight, 'center');
                drawTextWithBorder(doc, articulo.deposito, depositoX, y, 50, rowHeight, 'center');
                drawTextWithBorder(doc, articulo.lote, loteX, y, 70, rowHeight, 'center');
                drawTextWithBorder(doc, articulo.vencimiento, vencimientoX, y, 50, rowHeight, 'center');

                y += rowHeight;
                cantidadRegistros++;

            });
        }

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar el PDF' });
    }

});

module.exports = router;