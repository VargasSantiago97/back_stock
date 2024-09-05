const { Sequelize, DataTypes, Model } = require("sequelize");

const sequelize = new Sequelize('stock', 'root', '', {
    host: '127.0.0.1',
    dialect: 'mysql',
    port: 3306
})

class Subrubro extends Model {}

Subrubro.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },    
    id_rubro: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    alias: {
        type: DataTypes.STRING,
        allowNull: false
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
    modelName: 'Subrubro'
})

module.exports = Subrubro