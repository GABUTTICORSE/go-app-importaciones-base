import mongoose from 'mongoose';
const supplierSchema = new mongoose.Schema({ name: { type: String, required: true }, country: String, contactName: String, email: String, phone: String, notes: String }, { timestamps: true });
export default mongoose.model('Supplier', supplierSchema);
