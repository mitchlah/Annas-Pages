export type PurchaseType = 'store' | 'thirdParty' | 'subscription';
export type PurchaseStatus = 'ordered' | 'delivered';

export interface Purchase {
  id: string;
  dateOfPurchase: string;
  title: string;
  edition: string;
  author: string;
  genre: string;
  store: string;
  orderNumber: string;
  price: number;
  shipping: number;
  totalCost: number;
  expectedDelivery: string;
  paymentMethod: string;
  notes: string;
  purchaseType: PurchaseType;
  subscriptionId?: string;
  status: PurchaseStatus;
  deliveredDate?: string;
}

export interface Subscription {
  id: string;
  name: string;
  provider: string;
  monthlyCost: number;
  billingDay: number;
  paymentMethod: string;
  startDate: string;
  active: boolean;
  notes: string;
}

export interface AppData {
  purchases: Purchase[];
  subscriptions: Subscription[];
}

export const PURCHASE_TYPE_LABELS: Record<PurchaseType, string> = {
  store: 'Store purchase',
  thirdParty: '3rd-party purchase',
  subscription: 'Subscription',
};
