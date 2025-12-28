import mongoose, { Model, Schema, Types } from 'mongoose';

export interface IReviewImage {
  url: string;
  publicId: string;
}

//plain interface
export interface IReview {
  _id: string | Types.ObjectId;
  product: string | Types.ObjectId;
  user: string | Types.ObjectId | { _id: string; firstName: string; lastName: string; avatar?: string };
  order: string | Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  images: IReviewImage[];
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

//Document interface
export interface IReviewDocument extends Omit<IReview, '_id' | 'product' | 'user' | 'order'>, mongoose.Document {
  product: Types.ObjectId;
  user: Types.ObjectId;
  order: Types.ObjectId;
}

const ReviewImageSchema = new Schema<IReviewImage>({
  url: { type: String, required: true },
  publicId: { type: String, required: true }
}, { _id: false });

const ReviewSchema = new Schema<IReviewDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required']
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    images: {
      type: [ReviewImageSchema],
      validate: {
        validator: function(images: IReviewImage[]) {
          return images.length <= 5;
        },
        message: 'Cannot upload more than 5 images'
      },
      default: []
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    adminNote: {
      type: String,
      maxlength: [500, 'Admin note cannot exceed 500 characters']
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count cannot be negative']
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
      min: [0, 'Not helpful count cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

ReviewSchema.index({ product: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ order: 1 });
ReviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

//update product rating
ReviewSchema.post('save', async function(doc: IReviewDocument) {
  if (doc.status === 'approved') {
    await updateProductRating(doc.product);
  }
});

ReviewSchema.post('findOneAndUpdate', async function(doc: IReviewDocument | null) {
  if (doc) {
    await updateProductRating(doc.product);
  }
});

ReviewSchema.post('findOneAndDelete', async function(doc: IReviewDocument | null) {
  if (doc) {
    await updateProductRating(doc.product);
  }
});

//helper function
async function updateProductRating(productId: Types.ObjectId) {
  const Review = mongoose.model('Review');
  const Product = mongoose.model('Product');
  
  const stats = await Review.aggregate([
    {
      $match: {
        product: productId,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].count
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      reviewCount: 0
    });
  }
}

const Review = (mongoose.models.Review as Model<IReviewDocument>) || 
  mongoose.model<IReviewDocument>('Review', ReviewSchema);

export default Review;

//Utility functions
export function toPlainReview(doc: IReviewDocument | null): IReview | null {
  if (!doc) return null;
  const obj = doc.toObject();
  return {
    _id: obj._id.toString(),
    product: obj.product.toString(),
    user: obj.user,
    order: obj.order.toString(),
    rating: obj.rating,
    title: obj.title,
    comment: obj.comment,
    images: obj.images,
    isVerifiedPurchase: obj.isVerifiedPurchase,
    status: obj.status,
    adminNote: obj.adminNote,
    helpfulCount: obj.helpfulCount,
    notHelpfulCount: obj.notHelpfulCount,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export function toPlainReviews(docs: IReviewDocument[]): IReview[] {
  return docs.map(doc => toPlainReview(doc)).filter((r): r is IReview => r !== null);
}