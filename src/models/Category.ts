import mongoose, { Model, Schema, Types } from 'mongoose';

//Plain interface
export interface ICategory {
  _id: string | Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    publicId: string;
  };
  icon?: string;
  parent?: string | Types.ObjectId | null;
  order: number;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

//Document interface
export interface ICategoryDocument extends Omit<ICategory, '_id' | 'parent'>, mongoose.Document {
  parent?: Types.ObjectId | null;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    image: {
      url: { type: String },
      publicId: { type: String }
    },
    icon: {
      type: String,
      trim: true
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    productCount: {
      type: Number,
      default: 0,
      min: [0, 'Product count cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

CategorySchema.index({ slug: 1 });
CategorySchema.index({ parent: 1, order: 1 });
CategorySchema.index({ isActive: 1 });

//auto-generate slug - FIXED middleware
CategorySchema.pre('save', function(this: ICategoryDocument) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

const Category = (mongoose.models.Category as Model<ICategoryDocument>) || 
  mongoose.model<ICategoryDocument>('Category', CategorySchema);

export default Category;

//utility functions
export function toPlainCategory(doc: ICategoryDocument | null): ICategory | null {
  if (!doc) return null;
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    name: obj.name,
    slug: obj.slug,
    description: obj.description,
    image: obj.image,
    icon: obj.icon,
    parent: obj.parent ? obj.parent.toString() : null,
    order: obj.order,
    isActive: obj.isActive,
    productCount: obj.productCount,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export function toPlainCategories(docs: ICategoryDocument[]): ICategory[] {
  return docs.map(doc => toPlainCategory(doc)).filter((c): c is ICategory => c !== null);
}