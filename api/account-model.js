// schema and associated methods for our user accounts

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const userAccountSchema = mongoose.Schema({
    account: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true
    }
});

userAccountSchema.methods.validatePassword = (password) => {
    return bcrypt
        .compare(password, this.password)
        .then(isValid => isValid);
};

userAccountSchema.statics.hashPassword = (password) => {
    return bcrypt
        .hash(password, 10)
        .then(hash => hash);
};

const UserAccount = mongoose.model('User', userAccountSchema);

module.exports = {UserAccount};
