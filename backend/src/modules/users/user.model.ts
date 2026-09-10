import { Schema, model } from "mongoose";

export type UserRole = "customer" | "admin";

const addressSchema = new Schema({
  label: { type: String, trim: true, default: "Home" },
  recipientName: { type: String, trim: true },
  phone: { type: String, trim: true },
  line1: { type: String, required: true, trim: true },
  line2: { type: String, trim: true },
  area: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  district: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const transactionSchema = new Schema({
  type: { type: String, enum: ["points_earn", "points_spend", "credit_add", "credit_spend", "refund", "adjustment"], required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  reference: String,
  note: String,
}, { timestamps: true, _id: true });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true, index: true },
  avatar: String,
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["customer", "admin"], default: "customer", index: true },
  isActive: { type: Boolean, default: true, index: true },
  addresses: { type: [addressSchema], default: [] },
  wishlist: { type: [String], default: [] },
  starPoints: { type: Number, default: 0, min: 0 },
  storeCredit: { type: Number, default: 0, min: 0 },
  transactions: { type: [transactionSchema], default: [] },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
}, { timestamps: true });

userSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    delete ret.passwordResetTokenHash;
    delete ret.passwordResetExpiresAt;
    delete ret.__v;
    return ret;
  },
});

export const User = model("User", userSchema);
