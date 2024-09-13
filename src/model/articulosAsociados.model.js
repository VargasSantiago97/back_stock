const { Sequelize, DataTypes, Model } = require("sequelize");

const sequelize = new Sequelize('stock', 'root', '', {
    host: '127.0.0.1',
    dialect: 'mysql',
    port: 3306
})

class ArticuloAsociado extends Model {}

ArticuloAsociado.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    id_articulo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_documento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_rubro: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_subRubro: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_laboratorio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_unidadMedida: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_deposito: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cantidad: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    cantidadUnidadFundamental: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    solicitaLote: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    solicitaVencimiento: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    lote: {
        type: DataTypes.STRING,
        allowNull: true
    },
    vencimiento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    codigo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    observaciones: {
        type: DataTypes.STRING,
        allowNull: true
    },
    unidadFundamental: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cantidadPorUnidadFundamental: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    ajuste: {
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
    },
}, {
    sequelize,
    modelName: 'ArticuloAsociado'
})

module.exports = ArticuloAsociado