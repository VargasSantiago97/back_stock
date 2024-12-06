const jwt = require('jsonwebtoken');

require('dotenv').config({override: true});
const secret = process.env.CLAVE_SECRETA;

const usersVerifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const payload = jwt.verify(token, secret);

        const permisos = JSON.parse(payload.permisos)

        if(Date.now() > payload.exp){
            return res.status(401).send({ error: "Token expiro" });
        }


        if(req.method === 'GET' && !permisos.users.ver){
            return res.status(401).send({ error: "No tiene permisos GET" });
        }
        if(req.method === 'POST' && !permisos.users.crear){
            return res.status(401).send({ error: "No tiene permisos POST" });
        }
        if(req.method === 'PUT' && !permisos.users.editar){
            return res.status(401).send({ error: "No tiene permisos PUT" });
        }
        if(req.method === 'DELETE' && !permisos.users.editar){
            return res.status(401).send({ error: "No tiene permisos DELETE" });
        }

        next();
    } catch (error) {
        res.status(401).send({ error: error.message });
    }
}

module.exports = usersVerifyToken;