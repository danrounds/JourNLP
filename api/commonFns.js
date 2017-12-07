function isFieldMissing(body, fields) {
    // Checks for presence of fields[i] in our request body
    for (let field of fields) {
        if (!body.hasOwnProperty(field))
            return `Missing "${field}" in request body`;
    }
    return false;
}

module.exports = { isFieldMissing };
