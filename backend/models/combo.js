import mongoose from "mongoose";

const comboSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    image_url: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: {
            values: ["active", "inactive"],
            message: "Status must be 'active' or 'inactive'. Value received: '{VALUE}'"
        },
        default: "active",
        lowercase: true,
        trim: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Combo = mongoose.model("Combo", comboSchema);

export default Combo;
