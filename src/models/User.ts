import mongoose, { Model, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

//interfaces - no Document extension
export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

//plain interface for use anywhere (Frontend, API, etc.)
export interface IUser {
  _id?: string | Types.ObjectId;  //optional since mongoose adds it automatically
  firstName: string;
  lastName: string;
  email: string;
  password?: string; //optional for OAuth users
  role: 'customer' | 'admin';
  phone?: string;
  avatar?: string;
  addresses: IAddress[];
  authProvider?: 'local' | 'google' | 'github'; //track how user signed up
  providerId?: string; //OAuth provider user ID
  createdAt?: Date;    //optional since mongoose adds them automatically
  updatedAt?: Date;
}

//mongoose Document type (only used server-side)
export interface IUserDocument extends IUser, mongoose.Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

//model type with statics
// export interface IUserModel extends Model<IUserDocument> {
//   //static methods here if later needed
//   findByEmail(email: string): Promise<IUserDocument | null>;
//   isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
// }

//SCHEMAS
const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'USA' },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new Schema<IUserDocument>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      //not required - OAuth users won't have passwords
      required: function(this: IUserDocument) {
        return this.authProvider === 'local';
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false //don't return by default
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number']
    },
    avatar: {
      type: String,
      default: null
    },
    addresses: {
      type: [AddressSchema],
      default: []
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local'
    },
    providerId: {
      type: String,
      sparse: true //allow nulls but enforce unique if present
    }
  },
  {
    timestamps: true
  }
);


//middleware

//hash password before saving -if password exists and is modified
UserSchema.pre('save', async function(this: IUserDocument) {
  if (!this.password || !this.isModified('password')) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error}`);
  }
});

//methods
UserSchema.methods.comparePassword = async function(
  this: IUserDocument,
  candidatePassword: string
): Promise<boolean> {
  //if no password (OAuth user), return false
  if (!this.password) {
    return false;
  }

  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error}`);
  }
};

//model
const User = (mongoose.models.User as Model<IUserDocument>) || 
  mongoose.model<IUserDocument>('User', UserSchema);

export default User;

//utility functions for type conversion

//Converting Mongoose Document to plain object safe for client-side. Used when sending data to Frontend components
export function toPlainUser(doc: IUserDocument | null): IUser | null {
  if (!doc) return null;
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    firstName: obj.firstName,
    lastName: obj.lastName,
    email: obj.email,
    role: obj.role,
    phone: obj.phone,
    avatar: obj.avatar,
    addresses: obj.addresses,
    authProvider: obj.authProvider,
    providerId: obj.providerId,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    //never send password to client
  };
}

//convert array of Mongoose Documents to plain objects
export function toPlainUsers(docs: IUserDocument[]): IUser[] {
  return docs.map(doc => toPlainUser(doc)).filter((u): u is IUser => u !== null);
}