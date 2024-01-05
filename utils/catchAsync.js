//catch any unhandled promise rejections and forward them to Express's error 
//handling middleware
module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}