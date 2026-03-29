import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "organization" | "user";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  organization?: string;
  organizationDetails?: {
    name: string;
    address: string;
    contact: string;
    website: string;
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
      minlength: 0,
    },
    role: {
      type: String,
      enum: ["admin", "organization", "user"],
      default: "user",
    },
    organization: {
      type: String,
      trim: true,
    },
    organizationDetails: {
      name: { type: String },
      address: { type: String },
      contact: { type: String },
      website: { type: String },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ role: 1 });

const User = mongoose.model<IUser>("User", userSchema);

export default User;