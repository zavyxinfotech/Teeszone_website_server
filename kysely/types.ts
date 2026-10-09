import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { Role, EnquiryStatus, PromotionType, PromotionScope, AddressType } from "./enums";

export type Address = {
    id: string;
    userId: string;
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    type: Generated<AddressType>;
    isDefault: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type Collection = {
    id: string;
    slug: string;
    name: string;
    description: string;
    isVirtual: Generated<number>;
    segmentId: string;
    groupId: string;
    sortOrder: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type Enquiry = {
    id: string;
    name: string;
    company: string | null;
    phone: string;
    productId: string | null;
    productName: string | null;
    quantity: string | null;
    message: string | null;
    status: Generated<EnquiryStatus>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type Fabric = {
    id: string;
    key: string;
    name: string;
    description: string;
    fit: string;
    highlights: unknown;
    image: string;
    sortOrder: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type NewsletterSubscriber = {
    id: string;
    email: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type PasswordResetToken = {
    id: string;
    tokenHash: string;
    userId: string;
    expiresAt: Timestamp;
    usedAt: Timestamp | null;
    createdAt: Generated<Timestamp>;
};
export type Product = {
    id: string;
    slug: string;
    name: string;
    description: string;
    fit: string;
    fabric: string;
    gsm: number;
    mrp: number;
    price: number;
    sizes: unknown;
    features: unknown;
    isNew: Generated<number>;
    bestSeller: Generated<number>;
    megaSale: Generated<number>;
    isActive: Generated<number>;
    sortOrder: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type ProductCollection = {
    id: string;
    productId: string;
    collectionId: string;
    sortOrder: Generated<number>;
    createdAt: Generated<Timestamp>;
};
export type ProductColor = {
    id: string;
    productId: string;
    name: string;
    hex: string;
    image: string;
    backImage: string | null;
    chestImage: string | null;
    detailImage: string | null;
    image4: string | null;
    image5: string | null;
    sortOrder: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type ProductQtyDiscount = {
    id: string;
    productId: string;
    minQty: number;
    offPct: number;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type Promotion = {
    id: string;
    name: string;
    code: string | null;
    type: PromotionType;
    value: number;
    scope: Generated<PromotionScope>;
    minQty: number | null;
    minOrderValue: number | null;
    startsAt: Timestamp | null;
    endsAt: Timestamp | null;
    isActive: Generated<number>;
    sortOrder: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type PromotionCollection = {
    id: string;
    promotionId: string;
    collectionId: string;
    createdAt: Generated<Timestamp>;
};
export type PromotionProduct = {
    id: string;
    promotionId: string;
    productId: string;
    createdAt: Generated<Timestamp>;
};
export type Review = {
    id: string;
    stars: number;
    quote: string;
    author: string;
    productName: string;
    isPublished: Generated<number>;
    sortOrder: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type Segment = {
    id: string;
    slug: string;
    name: string;
    isNav: Generated<number>;
    sortOrder: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type SegmentGroup = {
    id: string;
    segmentId: string;
    title: string;
    sortOrder: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type User = {
    id: string;
    email: string | null;
    name: string | null;
    phone: string | null;
    passwordHash: string | null;
    googleId: string | null;
    role: Generated<Role>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    deletedAt: Timestamp | null;
};
export type DB = {
    Address: Address;
    Collection: Collection;
    Enquiry: Enquiry;
    Fabric: Fabric;
    NewsletterSubscriber: NewsletterSubscriber;
    PasswordResetToken: PasswordResetToken;
    Product: Product;
    ProductCollection: ProductCollection;
    ProductColor: ProductColor;
    ProductQtyDiscount: ProductQtyDiscount;
    Promotion: Promotion;
    PromotionCollection: PromotionCollection;
    PromotionProduct: PromotionProduct;
    Review: Review;
    Segment: Segment;
    SegmentGroup: SegmentGroup;
    User: User;
};
