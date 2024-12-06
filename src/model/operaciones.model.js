const { Sequelize, DataTypes, Model } = require("sequelize");

require('dotenv').config({override: true});
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT
})

class Operaciones extends Model {}

Operaciones.init({
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
    tipo: {
        type: DataTypes.STRING,
        allowNull: true
    },


    id_cliente_egreso: {
        type: DataTypes.STRING,
        allowNull: false
    },
    codigo_egreso: {
        type: DataTypes.STRING,
        allowNull: true
    },
    razon_social_egreso: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cuit_egreso: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    alias_egreso: {
        type: DataTypes.STRING,
        allowNull: true
    },


    id_cliente_ingreso: {
        type: DataTypes.STRING,
        allowNull: false
    },
    codigo_ingreso: {
        type: DataTypes.STRING,
        allowNull: true
    },
    razon_social_ingreso: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cuit_ingreso: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    alias_ingreso: {
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
    modelName: 'Operaciones'
})

module.exports = Operaciones