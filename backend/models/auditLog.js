import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    table_name: {
        type: String,
        required: true
    },
    field_name: {
        type: String,
        required: true
    },
    record_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    old_value: {
        type: String
    },
    new_value: {
        type: String
    }
}, { timestamps: { createdAt: false, updatedAt: 'updated_at' } });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;


