const { Sequelize } = require("sequelize");

const sequelize = new Sequelize('sistema', 'root', '1!Norte?', {
    host: '154.49.246.119',
    dialect: 'mysql',
    port: 3306
})

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('conectado');
    }
    catch (err) {
        console.error(err);
    }
}

testConnection()