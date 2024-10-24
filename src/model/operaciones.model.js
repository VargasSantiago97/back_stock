const { Sequelize, DataTypes, Model } = require("sequelize");

const sequelize = new Sequelize('stock', 'root', '', {
    host: '127.0.0.1',
    dialect: 'mysql',
    port: 3306
})

class Operacion extends Model {}

Operacion.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    fechaFecha: {
        type: DataTypes.DATE,
        allowNull: true
    },
    fecha: {
        type: DataTypes.STRING,
        allowNull: true
    },
    numero: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    punto: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    modelo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_cliente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    codigo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    razon_social: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cuit: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    alias: {
        type: DataTypes.STRING,
        allowNull: true
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    localidad: {
        type: DataTypes.STRING,
        allowNull: true
    },
    provincia: {
        type: DataTypes.STRING,
        allowNull: true
    },
    codigo_postal: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    correo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_autorizado: {
        type: DataTypes.STRING,
        allowNull: true
    },
    autorizado_descripcion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    autorizado_documento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    autorizado_contacto: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_transporte: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transporte_transporte: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transporte_cuit_transporte: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    transporte_chofer: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transporte_cuit_chofer: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    transporte_patente_chasis: {
        type: DataTypes.STRING,
        allowNull: true
    },
    transporte_patente_acoplado: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_establecimiento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    establecimiento_descripcion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    establecimiento_localidad: {
        type: DataTypes.STRING,
        allowNull: true
    },
    establecimiento_provincia: {
        type: DataTypes.STRING,
        allowNull: true
    },
    observaciones: {
        type: DataTypes.STRING,
        allowNull: true
    },
    observaciones_sistema: {
        type: DataTypes.STRING,
        allowNull: true
    },
    total_unidades: {
        type: DataTypes.STRING,
        allowNull: true
    },

    datos: {
        type: DataTypes.JSON
    },
    estado: {
        type: DataTypes.INTEGER
    },
    createdBy: {
        type: DataTypes.STRING
    },
    updatedBy: {
        type: DataTypes.STRING
    }
}, {
    sequelize,
    modelName: 'Operacion'
})

module.exports = Operacion