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

const Operacion = require('../../model/operaciones.model');
const ArticuloAsociado = require('../../model/articulosAsociados.model');
const Deposito = require('../../model/depositos.model');
const UnidadMedida = require('../../model/unidadMedidas.model');
const Users = require('../../model/users');

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

const tableTop = 284-74;
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

    doc.fontSize(12).text(datos.tipo.toUpperCase(), 350, 30);
    doc.fontSize(14).font('Helvetica-Bold').text(`OPERACION N°: ${numero}`, 350, 50, {
        font: 'Courier-Bold'
    })
    doc.fontSize(12).text(`Fecha: ${fecha}`, 350, 70);

    doc.fontSize(10).font('Helvetica')
        .text(`CUIT: ${cuit}`, 350, 92)
        .text(`Ingresos Brutos: ${iibb}`, 350, 105);


    //#############################################
    //                TABLA ARTICULOS
    //############################################# +74

    drawRoundedRect(doc, 20, 205, 560, 510);

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

const addClienteEgreso = (doc, datos) => {

    drawRoundedRect(doc, 20, 129, 560, 30);

    doc.fontSize(10).font('Helvetica')
        .text('EGRESO DE:', 30, 140)
        .text('C.U.I.T:', 400, 140);


    drawTextWithBorder(doc, `(${datos.codigo_egreso}) ${datos.razon_social_egreso}`, 95, 140, 300, 14, 'left', 'Helvetica-Bold', 10)
    drawTextWithBorder(doc, datos.cuit_egreso ? datos.cuit_egreso : '', 440, 140, 120, 14, 'left', 'Helvetica-Bold', 10)
}

const addClienteIngreso = (doc, datos) => {
    drawRoundedRect(doc, 20, 165, 560, 30);

    doc.fontSize(10).font('Helvetica')
        .text('INGRESO DE:', 30, 176)
        .text('C.U.I.T:', 400, 176);


    drawTextWithBorder(doc, `(${datos.codigo_ingreso}) ${datos.razon_social_ingreso}`, 95, 176, 300, 14, 'left', 'Helvetica-Bold', 10)
    drawTextWithBorder(doc, datos.cuit_ingreso ? datos.cuit_ingreso : '', 440, 176, 120, 14, 'left', 'Helvetica-Bold', 10)
}

const addPie = (doc, datos, pagina, cantidadPaginas, createdAt) => {

    total_unidades = datos.total_unidades
    observaciones = datos.observaciones

    drawRoundedRect(doc, 20, 724, 560, 70);

    doc.fontSize(8)
        .text('Observaciones:', 25, 727);

    doc.fontSize(8).font('Helvetica')
        .text(observaciones, 25, 735, {
            align: 'left',
            width: 550,
            height: 60,
            ellipsis: false
        });

    doc.fontSize(8).font('Helvetica')
        .text(`Pág ${pagina}/${cantidadPaginas}`, 0, 805, { align: 'center' })
        .text(`Creado por: ${createdAt}`, 20, 805, { align: 'left' })
}

router.get('/:id/:cant', async (req, res) => {

    const operacionId = req.params.id;
    const cantidadCopias = req.params.cant;

    try {
        const operacion = await Operacion.findOne({
            where: {
                id: operacionId
            }
        })
        const articulosAsociados = await ArticuloAsociado.findAll({
            where: {
                estado: 1,
                id_documento: operacionId
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

        if (!operacion) {
            return res.status(404).json({ message: 'Operacion no encontrado' });
        }

        const user = await Users.findOne({
            where: {
                id: operacion.dataValues.createdBy
            }
        })

        const doc = new PDFDocument({ margin: 0, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=operacion.pdf');

        doc.pipe(res);

        tiposCopias = ['ORIGINAL', 'DUPLICADO', 'TRIPLICADO', 'CUADRIPLICADO', 'QUINTUPLICADO', 'COPIA']

        var Articulos = articulosAsociados.map(articulo => {
            return {
                codigo: articulo.dataValues.codigo,
                descripcion: articulo.dataValues.descripcion,
                cantidad: articulo.dataValues.cantidad,
                unidad: unidadesMedidas.some(e => e.dataValues.id == articulo.dataValues.id_unidadMedida) ? unidadesMedidas.find(e => e.dataValues.id == articulo.dataValues.id_unidadMedida).descripcion : '-',
                deposito: depositos.some(e => e.dataValues.id == articulo.dataValues.id_deposito) ? depositos.find(e => e.dataValues.id == articulo.dataValues.id_deposito).descripcion : '-',
                lote: articulo.dataValues.lote || '-',
                vencimiento: vencimientoFormato(articulo.dataValues.vencimiento),
                separador: false,
                ajuste: articulo.dataValues.ajuste
            }
        })
        var ArticulosIngreso = Articulos.filter(e => e.ajuste == 'positivo')
        var ArticulosEgreso = Articulos.filter(e => e.ajuste == 'negativo')

        var separadorEntradas = {
            codigo: '',
            descripcion: '______________________ MERCADERIA A ACREDITAR DEL STOCK: ______________________',
            cantidad: '',
            unidad: '',
            deposito: '',
            lote: '',
            vencimiento: '',
            separador: true
        }
        var separadorSalidas = {
            codigo: '',
            descripcion: '______________________ MERCADERIA A DESCONTAR EN EL STOCK: ______________________',
            cantidad: '',
            unidad: '',
            deposito: '',
            lote: '',
            vencimiento: '',
            separador: true
        }
        var separador = {
            codigo: '',
            descripcion: '',
            cantidad: '',
            unidad: '',
            deposito: '',
            lote: '',
            vencimiento: '',
            separador: true
        }
        var ArticulosTabla = [ separadorSalidas, ...ArticulosEgreso, separador, separadorEntradas, ...ArticulosIngreso ]

        for (let copia = 0; copia < cantidadCopias; copia++) {
            if (copia) doc.addPage();

            var pagina = 1
            let cantidadPaginas = Math.ceil(Articulos.length / 27);

            addEncabezado(doc, operacion.dataValues, tiposCopias[copia] ? tiposCopias[copia] : 'COPIA');
            addClienteEgreso(doc, operacion.dataValues);
            addClienteIngreso(doc, operacion.dataValues);
            addPie(doc, operacion.dataValues, pagina, cantidadPaginas, `${user ? user.dataValues.alias : ''} (${operacion.dataValues.createdAt.toLocaleString()})`);

            const rowHeight = 16;

            let y = tableTop + rowHeight;
            let cantidadRegistros = 1

            ArticulosTabla.forEach(articulo => {

                if (cantidadRegistros >= 28) {
                    pagina++;

                    doc.addPage();
                    addEncabezado(doc, operacion.dataValues, tiposCopias[copia] ? tiposCopias[copia] : 'COPIA');
                    addClienteEgreso(doc, operacion.dataValues);
                    addClienteIngreso(doc, operacion.dataValues);
                    addPie(doc, operacion.dataValues, pagina, cantidadPaginas, `${user ? user.dataValues.alias : ''} (${operacion.dataValues.createdAt.toLocaleString()})`);

                    cantidadRegistros = 1
                    y = tableTop + rowHeight
                }

                if(articulo.separador){
                    drawTextWithBorder(doc, articulo.descripcion, 24, y, 552, rowHeight, 'center', 'Helvetica-Bold', 10);
                } else {
                    var cantidad = ''
                    try {
                        cantidad = articulo.cantidad.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                            useGrouping: true
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
                }

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