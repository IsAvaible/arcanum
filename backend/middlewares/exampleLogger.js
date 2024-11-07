module.exports = function (req, res, next) {
    console.log( `Hallo from Middelware: ${req.method} ${req.url}`);
    next();
};