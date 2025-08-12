const errorHandlerMiddleware = (err, req, res, next) => {
    const STATUS_CODE = err.statusCode
    console.log(err)
    return res.status(STATUS_CODE || 400).json({
        success: false,
        message: `Something went wrong`,
        errorData: err.message,
    });
}

module.exports = errorHandlerMiddleware;