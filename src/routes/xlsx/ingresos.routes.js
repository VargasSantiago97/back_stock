const express = require('express');
const router = express.Router();
const fs = require('fs');

const ExcelJS = require('exceljs');
const ArticuloAsociado = require('../../model/articulosAsociados.model');
const UnidadMedidas = require('../../model/unidadMedidas.model');
const Rubros = require('../../model/rubros.model');
const Subrubros = require('../../model/subrubros.model');


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

function mostrarDocumento(pto, nro) {
    return `${String(pto).padStart(4, '0')}-${String(nro).padStart(8, '0')}`
}

const sombrearCeldas = (worksheet, number) => {
    // Define el rango de celdas que deseas aplicar el formato
    const range = [
        'A' + number,
        'B' + number,
        'C' + number,
        'D' + number,
        'E' + number,
        'F' + number,
        'G' + number,
        'H' + number,
        'I' + number,
        'J' + number
    ];

    // Itera sobre cada celda en el rango y aplica el formato fill
    range.forEach(cell => {
        worksheet.getCell(cell).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEFEFEF' } // Rojo sólido
        };
    });

}
const separadorCeldas = (worksheet, number) => {
    const range = [
        'A' + number,
        'B' + number,
        'C' + number,
        'D' + number,
        'E' + number,
        'F' + number,
        'G' + number,
        'H' + number,
        'I' + number,
        'J' + number
    ];

    range.forEach(cell => {
        worksheet.getCell(cell).border = {
            bottom: { style: 'double' },
            color: { argb: 'FF888888'}
        };
    });

}

fs.readFile('./src/config/xlsx.json', 'utf8', (err, data) => {
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

router.post('/', async (req, res) => {

    const data = req.body.datos
    const fecha = req.body.fecha
    const clientes = req.body.clientes
    // Crea un nuevo workbook y worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hoja 1');

    // Estilo para el encabezado de la tabla
    const headerStyle = {
        font: { bold: true },
        border: {
            top: { style: 'thick' },
            left: { style: 'thick' },
            bottom: { style: 'thick' },
            right: { style: 'thick' }
        },
        alignment: { horizontal: 'center' }
    };

    // Estilo para las celdas de la tabla
    const tableCellStyle = {
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        },
        alignment: { horizontal: 'left' }
    };


    // Información de la empresa y del cliente
    worksheet.getCell('A1').value = modelos.listadoIngresos.razon_social;
    worksheet.getCell('A1').font = { bold: true, size: 16 };

    worksheet.getCell('A2').value = modelos.listadoIngresos.direccion;

    worksheet.getCell('A3').value = modelos.listadoIngresos.localidad;

    // Información del cliente
    worksheet.getCell('A5').value = 'LISTADO DE INGRESOS DE MERCADERÍA Y DEVOLUCIONES';
    worksheet.getCell('A5').font = { bold: true };

    worksheet.getCell('A6').value = 'Fecha: ' + fecha;

    worksheet.getCell('A7').value = 'Clientes: ' + clientes;

    // Espaciado
    worksheet.addRow([]);

    // Agregar encabezado de la tabla
    worksheet.addRow(['Fecha', 'Tipo', 'Pto Vta', 'Numero', 'CLIENTE', 'CUIT', 'AUTORIZADO', 'TRANSPORTE', 'CHOFER', 'PAT CH', 'PAT AC', 'ESTABLECIMIENTO', 'UNIDADES', 'OBS', 'OBS SISTEMA']);
    const headerRow = worksheet.getRow(9);

    headerRow.eachCell((cell, colNumber) => {
        cell.style = headerStyle;
    });


    data.forEach(item => {
        worksheet.addRow([
            item.fecha ? item.fecha : '',
            item.tipo ? item.tipo : '',
            item.punto ? item.punto : '',
            item.numero ? item.numero : '',
            item.razon_social ? item.razon_social : '',
            item.cuit ? item.cuit : '',
            item.autorizado_descripcion ? item.autorizado_descripcion : '',
            item.tansporte_transporte ? item.tansporte_transporte : '',
            item.tansporte_chofer ? item.tansporte_chofer : '',
            item.tansporte_patente_chasis ? item.tansporte_patente_chasis : '',
            item.tansporte_patente_acoplado ? item.tansporte_patente_acoplado : '',
            item.establecimiento_descripcion ? item.establecimiento_descripcion : '',
            item.total_unidades ? item.total_unidades : '',
            item.observaciones ? item.observaciones : '',
            item.observaciones_sistema ? item.observaciones_sistema : ''
        ]);
    });

    // Aplicar estilo a las celdas de la tabla
    const lastRow = worksheet.lastRow;
    for (let rowIndex = 10; rowIndex <= lastRow.number; rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        row.eachCell((cell) => {
            cell.style = tableCellStyle;
        });
    }

    // Ajustar ancho de columnas
    worksheet.columns = [
        { width: 12 },  // fecha
        { width: 12 },  // tipo
        { width: 10 },  // punto
        { width: 10 },  // numero
        { width: 40 },   // razon_social
        { width: 15 },  // cuit
        { width: 30 },  // autorizado_descripcion
        { width: 30 },  // tansporte_transporte
        { width: 30 },  // tansporte_chofer
        { width: 10 },   // tansporte_patente_chasis
        { width: 10 },  // tansporte_patente_acoplado
        { width: 20 },  // establecimiento_descripcion
        { width: 30 },  // total_unidades
        { width: 30 },  // observaciones
        { width: 30 },  // observaciones sis
    ];

    // Especifica los encabezados para la respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=archivo.xlsx');

    // Envía el archivo Excel
    await workbook.xlsx.write(res);
    res.end();
});

router.post('/detalles', async (req, res) => {

    const data = req.body.datos
    const fecha = req.body.fecha
    const clientes = req.body.clientes

    //consulta db variables:
    var unidadMedidas = {}
    var rubros = {}
    var subrubros = {}

    const resultadoUM = await UnidadMedidas.findAll({
        where: {
            estado: 1
        }
    })
    resultadoUM.forEach(um => { unidadMedidas[um.dataValues.id] = um.dataValues.alias });

    const resultadoR = await Rubros.findAll({
        where: {
            estado: 1
        }
    })
    resultadoR.forEach(r => { rubros[r.dataValues.id] = r.dataValues.alias });

    const resultadoSR = await Subrubros.findAll({
        where: {
            estado: 1
        }
    })
    resultadoSR.forEach(sr => { subrubros[sr.dataValues.id] = sr.dataValues.alias });


    // Crea un nuevo workbook y worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hoja 1');

    worksheet.pageSetup.paperSize = 9;  // A4
    worksheet.pageSetup.printArea = 'A:J';

    worksheet.pageSetup.margins = {
        left: 0.25,  // margen izquierdo
        right: 0.25,  // margen derecho
        top: 0.25,  // margen superior
        bottom: 0.25,  // margen inferior
        header: 0.1,  // margen de encabezado
        footer: 0.1   // margen de pie de página
    };

    // Ajustar todas las columnas para que quepan en una página
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToWidth = 1;  // Ajustar a 1 página de ancho
    worksheet.pageSetup.fitToHeight = 0; // Sin límite para la altura (todas las filas pueden expandirse)

    // Estilo para el encabezado de la tabla
    const headerStyle = {
        font: { bold: true },
        border: {
            top: { style: 'medium' },
            left: { style: 'medium' },
            bottom: { style: 'medium' },
            right: { style: 'medium' }
        },
        alignment: { horizontal: 'center' }
    };

    // Estilo para las celdas de la tabla
    const tableCellStyle = {
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        },
        alignment: { horizontal: 'left' }
    };


    // Información de la empresa y del cliente
    worksheet.getCell('A1').value = modelos.listadoIngresos.razon_social;
    worksheet.getCell('A1').font = { bold: true, size: 16 };

    worksheet.getCell('A2').value = modelos.listadoIngresos.direccion;

    worksheet.getCell('A3').value = modelos.listadoIngresos.localidad;

    // Información del cliente
    worksheet.getCell('J1').value = 'INGRESOS DE MERCADERÍA Y DEVOLUCIONES';

    worksheet.getCell('J1').style = {
        font: { bold: true },
        size: 12,
        alignment: { horizontal: 'right', vertical: 'top' }
    };


    worksheet.getCell('A5').value = 'Fecha: ' + fecha;
    worksheet.getCell('A6').value = 'Clientes: ' + clientes;



    for (const documento of data) {
        // Espaciado
        worksheet.addRow([]);
        separadorCeldas(worksheet, worksheet.lastRow.number)
        worksheet.addRow([]);

        worksheet.addRow([
            documento.fecha,
            '',
            documento.tipo,
            '',
            'N° ' + mostrarDocumento(documento.punto, documento.numero),
            '',
            '(' + documento.codigo + ') ' + documento.razon_social,
            'CUIT: ' + documento.cuit
        ]);

        var fila_titulos = worksheet.lastRow.number
        worksheet.mergeCells('A' + fila_titulos, 'B' + fila_titulos);
        worksheet.mergeCells('C' + fila_titulos, 'D' + fila_titulos);
        worksheet.mergeCells('E' + fila_titulos, 'F' + fila_titulos)

        worksheet.getCell('A' + fila_titulos).font = { bold: true, alignment: { horizontal: 'center' } }
        worksheet.getCell('G' + fila_titulos).font = { bold: true, alignment: { horizontal: 'center' } }
        worksheet.getCell('C' + fila_titulos).font = { alignment: { horizontal: 'center' } }
        worksheet.getCell('E' + fila_titulos).font = { alignment: { horizontal: 'center' } }

        var datosDocumento = ''
        var datosEstablecimiento = ''
        if(documento.autorizado_descripcion){
            datosDocumento += "Aut.: " + documento.autorizado_descripcion
        }
        if(documento.transporte_transporte){
            if(datosDocumento != '') datosDocumento += ' - ';
            datosDocumento += "Transp: " + documento.transporte_transporte
        }
        if(documento.transporte_chofer){
            if(datosDocumento != '') datosDocumento += ' - ';
            datosDocumento += "Chofer: " + documento.transporte_chofer
        }
        if(documento.transporte_patente_chasis){
            if(datosDocumento != '') datosDocumento += ' - ';
            datosDocumento += "Pat: " + documento.transporte_patente_chasis + '/' + documento.transporte_patente_acoplado
        }
        if(documento.establecimiento_descripcion){
            datosEstablecimiento = documento.establecimiento_descripcion
        }
        worksheet.addRow([datosDocumento, '', '', '', '', '', '', 'EST:', datosEstablecimiento]);
        var fila_datos = worksheet.lastRow.number
        worksheet.mergeCells('A' + fila_datos, 'G' + fila_datos);
        worksheet.mergeCells('I' + fila_datos, 'J' + fila_datos);

        const resultado = await ArticuloAsociado.findAll({
            where: {
                estado: 1,
                id_documento: documento.id
            }
        })

        const articulosAsociados = resultado.map(articuloAsociado => {
            let datosConvertidos;
            try {
                datosConvertidos = JSON.parse(articuloAsociado.dataValues.datos);
            } catch (error) {
                datosConvertidos = {};
            }
            return {
                ...articuloAsociado.dataValues,
                datos: datosConvertidos
            };
        });

        worksheet.addRow([
            'Rubro',
            'SubRub',
            'Código',
            'Lote',
            'Cantidad',
            'U. Medida',
            'Descripcion',
            'Cant. U.F.',
            'U. Med. F.',
            'F Vto.'
        ]);
        const headerRow = worksheet.getRow(worksheet.lastRow.number);
        headerRow.eachCell((cell) => {
            cell.style = headerStyle;
        });

        sombrearCeldas(worksheet, worksheet.lastRow.number)

        var primerFilaArticulos = worksheet.lastRow.number + 1

        articulosAsociados.forEach(articulosAsociado => {
            worksheet.addRow([
                rubros[articulosAsociado.id_rubro] ? rubros[articulosAsociado.id_rubro] : '-',
                subrubros[articulosAsociado.id_subRubro] ? subrubros[articulosAsociado.id_subRubro] : '-',
                articulosAsociado.codigo,
                articulosAsociado.lote,
                articulosAsociado.cantidad,
                unidadMedidas[articulosAsociado.id_unidadMedida] ? unidadMedidas[articulosAsociado.id_unidadMedida] : '-',
                articulosAsociado.descripcion,
                articulosAsociado.cantidadUnidadFundamental,
                articulosAsociado.unidadFundamental,
                articulosAsociado.vencimiento
            ]);

            const fila = worksheet.lastRow.number

            const row = worksheet.getRow(worksheet.lastRow.number);
            row.eachCell((cell) => {
                cell.style = tableCellStyle;
            });

            worksheet.getCell('E' + fila).numFmt = '#,##0.00';
            worksheet.getCell('H' + fila).numFmt = '#,##0.00';
            worksheet.getCell('E' + fila).alignment = { horizontal: 'right' };
            worksheet.getCell('H' + fila).alignment = { horizontal: 'right' };
        });

        var ultimaFilaArticulos = worksheet.lastRow.number

        worksheet.getCell('A' + (ultimaFilaArticulos + 1)).value = 'TOTALES:'
        worksheet.getCell('E' + (ultimaFilaArticulos + 1)).value = { formula: 'SUM(E' + primerFilaArticulos + ':E' + ultimaFilaArticulos + ')' };
        worksheet.getCell('H' + (ultimaFilaArticulos + 1)).value = { formula: 'SUM(H' + primerFilaArticulos + ':H' + ultimaFilaArticulos + ')' };

        worksheet.getCell('A' + (ultimaFilaArticulos + 1)).font = { bold: true }
        worksheet.getCell('E' + (ultimaFilaArticulos + 1)).font = { bold: true }
        worksheet.getCell('H' + (ultimaFilaArticulos + 1)).font = { bold: true }

        
        worksheet.getCell('E' + (ultimaFilaArticulos + 1)).numFmt = '#,##0.00';
        worksheet.getCell('H' + (ultimaFilaArticulos + 1)).numFmt = '#,##0.00';

        if (documento.total_unidades) {
            var ultimaFilaArticulos = worksheet.lastRow.number
            worksheet.getCell('A' + (ultimaFilaArticulos + 1)).value = 'Total Unidades: ' + documento.total_unidades
        }
        if (documento.datos.documentos) {
            var documentacion = []
            documento.datos.documentos.forEach(doc => {
                documentacion.push(("(" + doc.fecha + ") " + doc.tipo + " " + doc.letra + " " + mostrarDocumento(doc.punto, doc.numero)).toLocaleUpperCase())
            })
            var ultimaFilaArticulos = worksheet.lastRow.number
            worksheet.getCell('A' + (ultimaFilaArticulos + 1)).value = 'Documentacion asociada: ' + documentacion.join('; ')
        }
        if (documento.observaciones_sistema) {
            var ultimaFilaArticulos = worksheet.lastRow.number
            worksheet.getCell('A' + (ultimaFilaArticulos + 1)).value = 'Obs (S): ' + documento.observaciones_sistema
        }
        if (documento.observaciones) {
            var ultimaFilaArticulos = worksheet.lastRow.number
            worksheet.getCell('A' + (ultimaFilaArticulos + 1)).value = 'Observaciones: ' + documento.observaciones
        }
    }


    // Ajustar ancho de columnas
    worksheet.columns = [
        { width: 8 },  // rubro
        { width: 8 },  // subrubro
        { width: 10 },  // codigo
        { width: 10 },  // lote
        { width: 15 },  // cantidad
        { width: 10 },  // um
        { width: 40 },  // desc
        { width: 15 },   // can uf
        { width: 10 },  // uf
        { width: 12 }  // vto
    ];

    // Especifica los encabezados para la respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=archivo.xlsx');

    // Envía el archivo Excel
    await workbook.xlsx.write(res);
    res.end();
});
module.exports = router;