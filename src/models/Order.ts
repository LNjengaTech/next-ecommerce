import mongoose, { Model, Schema, Types } from 'mongoose';

// INTERFACES
export interface IOrderItem {
  product: string | Types.ObjectId;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  subtotal: number;
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface IShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

export interface IPaymentDetails {
  method: 'credit_card' | 'paypal';
  cardLast4?: string;
  cardBrand?: string;
  paypalEmail?: string;
  paypalTransactionId?: string;
  transactionId?: string;
  paidAt?: Date;
}

//Plain interface
export interface IOrder {
  _id: string | Types.ObjectId;
  orderNumber: string;
  user: string | Types.ObjectId | { _id: string; firstName: string; lastName: string; email: string };
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  shippingMethod: IShippingMethod;
  paymentDetails: IPaymentDetails;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  carrier?: string;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  customerNote?: string;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

//Mongoose Document type
export interface IOrderDocument extends Omit<IOrder, '_id' | 'user'>, mongoose.Document {
  user: Types.ObjectId;
}

//Schemas
const OrderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
  subtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const ShippingAddressSchema = new Schema<IShippingAddress>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'USA' },
  phone: { type: String, required: true }
}, { _id: false });

const ShippingMethodSchema = new Schema<IShippingMethod>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  estimatedDays: { type: String, required: true }
}, { _id: false });

const PaymentDetailsSchema = new Schema<IPaymentDetails>({
  method: {
    type: String,
    enum: ['credit_card', 'paypal'],
    required: true
  },
  cardLast4: { type: String },
  cardBrand: { type: String },
  paypalEmail: { type: String },
  paypalTransactionId: { type: String },
  transactionId: { type: String },
  paidAt: { type: Date }
}, { _id: false });

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    items: {
      type: [OrderItemSchema],
      validate: {
        validator: function(items: IOrderItem[]) {
          return items.length > 0;
        },
        message: 'Order must have at least one item'
      }
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: [true, 'Shipping address is required']
    },
    shippingMethod: {
      type: ShippingMethodSchema,
      required: [true, 'Shipping method is required']
    },
    paymentDetails: {
      type: PaymentDetailsSchema,
      required: [true, 'Payment details are required']
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    shippingCost: {
      type: Number,
      required: true,
      min: [0, 'Shipping cost cannot be negative'],
      default: 0
    },
    tax: {
      type: Number,
      required: true,
      min: [0, 'Tax cannot be negative'],
      default: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    trackingNumber: { type: String, trim: true },
    carrier: { type: String, trim: true },
    paidAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    customerNote: { type: String, maxlength: 500 },
    adminNote: { type: String, maxlength: 1000 }
  },
  {
    timestamps: true
  }
);

//Indexes
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'paymentDetails.transactionId': 1 });

//the MIDDLEWARE 
//Auto-generate order number
OrderSchema.pre('save', async function(this: IOrderDocument) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const year = new Date().getFullYear();
    this.orderNumber = `ORD-${year}-${String(count + 1).padStart(5, '0')}`;
  }
});

//calculate totals
OrderSchema.pre('save', function(this: IOrderDocument) {
  //calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  
  //calculate total
  this.total = this.subtotal + this.shippingCost + this.tax - this.discount;
});

//Model
const Order = (mongoose.models.Order as Model<IOrderDocument>) || 
  mongoose.model<IOrderDocument>('Order', OrderSchema);

export default Order;

//Utility Function
export function toPlainOrder(doc: IOrderDocument | null): IOrder | null {
  if (!doc) return null;
  
  const obj = doc.toObject();
  
  return {
    _id: obj._id.toString(),
    orderNumber: obj.orderNumber,
    user: obj.user,
    items: obj.items,
    shippingAddress: obj.shippingAddress,
    shippingMethod: obj.shippingMethod,
    paymentDetails: obj.paymentDetails,
    subtotal: obj.subtotal,
    shippingCost: obj.shippingCost,
    tax: obj.tax,
    discount: obj.discount,
    total: obj.total,
    status: obj.status,
    trackingNumber: obj.trackingNumber,
    carrier: obj.carrier,
    paidAt: obj.paidAt,
    shippedAt: obj.shippedAt,
    deliveredAt: obj.deliveredAt,
    cancelledAt: obj.cancelledAt,
    customerNote: obj.customerNote,
    adminNote: obj.adminNote,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export function toPlainOrders(docs: IOrderDocument[]): IOrder[] {
  return docs.map(doc => toPlainOrder(doc)).filter((o): o is IOrder => o !== null);
}