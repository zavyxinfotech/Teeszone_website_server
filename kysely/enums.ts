export const Role = {
    CUSTOMER: "CUSTOMER",
    ADMIN: "ADMIN"
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const EnquiryStatus = {
    NEW: "NEW",
    CONTACTED: "CONTACTED",
    CLOSED: "CLOSED"
} as const;
export type EnquiryStatus = (typeof EnquiryStatus)[keyof typeof EnquiryStatus];
export const PromotionType = {
    PERCENT: "PERCENT",
    FLAT: "FLAT"
} as const;
export type PromotionType = (typeof PromotionType)[keyof typeof PromotionType];
export const PromotionScope = {
    ALL: "ALL",
    PRODUCTS: "PRODUCTS",
    COLLECTIONS: "COLLECTIONS"
} as const;
export type PromotionScope = (typeof PromotionScope)[keyof typeof PromotionScope];
export const AddressType = {
    HOME: "HOME",
    WORK: "WORK",
    OTHER: "OTHER"
} as const;
export type AddressType = (typeof AddressType)[keyof typeof AddressType];
