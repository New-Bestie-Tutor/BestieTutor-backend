const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
    userId: { type: Number, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    nickname: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true }
}, {timestamps: true});


const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;