import mongoose, { Model, Schema, Types } from 'mongoose';

//Interfaces - no Document extension
export interface ISpecification {
  label: string;
  value: string;
}

export interface IProductImage {
  url: string;
  publicId: string;
  alt?: string;
  isPrimary: boolean;
}

//Plain interface - safe for Frontend
export interface IProduct {
  _id: string | Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string | Types.ObjectId | { _id: string; name: string; slug: string };
  brand: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  images: IProductImage[];
  specifications: ISpecification[];
  metaTitle?: string;
  metaDescription?: string;
  averageRating: number;
  reviewCount: number;
  soldCount: number;
  viewCount: number;
  status: 'draft' | 'active' | 'archived';
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

//Mongoose Document type
export interface IProductDocument extends Omit<IProduct, '_id' | 'category'>, mongoose.Document {
  category: Types.ObjectId;
}

// Model type
//export interface IProductModel extends Model<IProductDocument> {}

//enhanced interface with static methods
export interface IProductModel extends Model<IProductDocument> {
  findBySlug(slug: string): Promise<IProductDocument | null>;
  findActiveProducts(): Promise<IProductDocument[]>;
  findFeaturedProducts(limit?: number): Promise<IProductDocument[]>;
  searchProducts(query: string, limit?: number): Promise<IProductDocument[]>;
  updateStock(productId: string | Types.ObjectId, quantity: number): Promise<IProductDocument | null>;
  getRelatedProducts(productId: string | Types.ObjectId, limit?: number): Promise<IProductDocument[]>;
  incrementViewCount(productId: string | Types.ObjectId): Promise<void>;
}

//Schemas
const SpecificationSchema = new Schema<ISpecification>({
  label: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const ProductImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  alt: { type: String },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

const ProductSchema = new Schema<IProductDocument, IProductModel>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters']
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
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters']
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare at price cannot be negative']
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative']
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Threshold cannot be negative']
    },
    images: {
      type: [ProductImageSchema],
      validate: {
        validator: function(images: IProductImage[]) {
          return images.length > 0;
        },
        message: 'At least one image is required'
      }
    },
    specifications: {
      type: [SpecificationSchema],
      default: []
    },
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative']
    },
    soldCount: {
      type: Number,
      default: 0,
      min: [0, 'Sold count cannot be negative']
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative']
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft'
    },
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

//Indexes
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ brand: 1, status: 1 });
ProductSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });
ProductSchema.index({ name: 'text', description: 'text' });

//fixed Middleware
// Auto-generate slug from name if not provided
ProductSchema.pre('save', function(this: IProductDocument) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

//ensure at least one primary image
ProductSchema.pre('save', function(this: IProductDocument) {
  if (this.images && this.images.length > 0) {
    const hasPrimary = this.images.some(img => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }
});

//Model
const Product = (mongoose.models.Product as IProductModel) || 
  mongoose.model<IProductDocument, IProductModel>('Product', ProductSchema);

export default Product;

//Utility functions - type conversion
export function toPlainProduct(doc: IProductDocument | null): IProduct | null {
  if (!doc) return null;
  
  const obj = doc.toObject();
  
  return {
    _id: obj._id.toString(),
    name: obj.name,
    slug: obj.slug,
    description: obj.description,
    shortDescription: obj.shortDescription,
    category: obj.category,
    brand: obj.brand,
    price: obj.price,
    compareAtPrice: obj.compareAtPrice,
    costPrice: obj.costPrice,
    sku: obj.sku,
    stock: obj.stock,
    lowStockThreshold: obj.lowStockThreshold,
    images: obj.images,
    specifications: obj.specifications,
    metaTitle: obj.metaTitle,
    metaDescription: obj.metaDescription,
    averageRating: obj.averageRating,
    reviewCount: obj.reviewCount,
    soldCount: obj.soldCount,
    viewCount: obj.viewCount,
    status: obj.status,
    isFeatured: obj.isFeatured,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export function toPlainProducts(docs: IProductDocument[]): IProduct[] {
  return docs.map(doc => toPlainProduct(doc)).filter((p): p is IProduct => p !== null);
}