const { Sequelize, DataTypes, Model } = require("sequelize");

require('dotenv').config({override: true});
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT
})

class Transporte extends Model {}

Transporte.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    id_cliente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    transporte: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cuit_transporte: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    chofer: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cuit_chofer: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    patente_chasis: {
        type: DataTypes.STRING,
        allowNull: true
    },
    patente_acoplado: {
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
    modelName: 'Transporte'
})

module.exports = Transporte