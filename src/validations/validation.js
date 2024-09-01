const jwt = require('jsonwebtoken');

const secret = process.env.CLAVE_SECRETA;

const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const payload = jwt.verify(token, secret);

        if(Date.now() > payload.exp){
            return res.status(401).send({ error: "Token expiro" });
        }

        next();
    } catch (error) {
        res.status(401).send({ error: error.message });
    }
}

module.exports = verifyToken;