const validateId = (id) => {
    if (!id || typeof NaN(Number(id))){
        console.log(`Invalid ID`)
        return false;
    }
    else {
        console.log('ID validated')
        return true;
    }
}

module.exports = validateId;