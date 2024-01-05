//class that assins part of errors to specific variables that allow for creating
//more descriptive error messages while debugging
class ExpressError extends Error {
    constructor(message, statusCode) {
        super();
        this.message = message;
        this.statusCode = statusCode;
    }
}

module.exports = ExpressError;