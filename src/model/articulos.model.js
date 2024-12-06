const { Sequelize, DataTypes, Model } = require("sequelize");

require('dotenv').config({override: true});
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT
})

class Articulo extends Model {}

Articulo.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    id_rubro: {
        type: DataTypes.STRING,
        allowNull: false
    },
    id_subRubro: {
        type: DataTypes.STRING,
        allowNull: false
    },
    id_laboratorio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    id_unidadMedida: {
        type: DataTypes.STRING,
        allowNull: false
    },

    codigo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    unidadFundamental: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cantidadUnidadFundamental: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    solicitaVencimiento: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    solicitaLote: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
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
    modelName: 'Articulo'
})

module.exports = Articulo


