const { Sequelize, DataTypes, Model } = require("sequelize");

const sequelize = new Sequelize('stock', 'root', '', {
    host: '127.0.0.1',
    dialect: 'mysql',
    port: 3306
})

class Autorizado extends Model {}

Autorizado.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    id_cliente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    documento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cargo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contacto: {
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
    modelName: 'Autorizado'
})

module.exports = Autorizado