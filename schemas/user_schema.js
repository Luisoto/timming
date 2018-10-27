const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uuidv1 = require('uuid/v1');
const bcrypt = require('bcrypt-nodejs');

const UserSchema = new Schema({
    email: {type: String, unique: true},
    password:String,
    api_id: {type: String, default: uuidv1()},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
});

UserSchema.pre('save', function(next) {
    const user = this;
    user.updatedAt = Date.now;
    if (!user.isModified('password')) return next();
    user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(8), null);
    next();

});

UserSchema.methods.verifyPassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

mongoose.model('_User', UserSchema, "_User");