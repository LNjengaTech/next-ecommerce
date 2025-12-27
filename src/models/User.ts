import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface IUser {
    _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'customer' | 'admin';
  phone?: string;
  avatar?: string;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}

// Define methods for TypeScript
interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Create a type for a "Hydrated" User (Data + Methods + Mongoose logic)
// Use this ONLY inside this file for middleware and methods
type UserDocument = HydratedDocument<IUser, UserMethods>;

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'USA' },
  isDefault: { type: Boolean, default: false }
});

const UserSchema = new Schema<IUser, Model<IUser, {}, UserMethods>, UserMethods>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    phone: { type: String, trim: true },
    avatar: { type: String, default: null },
    addresses: [AddressSchema]
  },
  { timestamps: true }
);

// Password Hashing Middleware
// Note the 'this: UserDocument' - this tells TS what 'this' is
UserSchema.pre('save', async function (this: UserDocument) {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password as string, salt);
});

// Instance Method
UserSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidatePassword: string
): Promise<boolean> {
  // If password isn't selected (due to select: false), this will be undefined
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.password;
    return ret;
  }
});

// Export the model with proper typing 
const User = (mongoose.models.User as Model<IUser, {}, UserMethods>) || 
             mongoose.model<IUser, Model<IUser, {}, UserMethods>>('User', UserSchema);

export default User;