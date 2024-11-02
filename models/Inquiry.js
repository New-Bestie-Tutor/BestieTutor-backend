const mongoose = require('mongoose');


const InquirySchema = new mongoose.Schema({
    inquiryId: { type: Number, unique: true },
    email: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
}, {timestamps: true});


const InquiryModel = mongoose.model('Inquiry', InquirySchema);
module.exports = InquiryModel;