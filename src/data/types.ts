export type PurchaseType = 'store' | 'thirdParty' | 'subscription';
export type PurchaseStatus = 'ordered' | 'delivered';
export type SubscriptionFrequency =
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'biannual'
  | 'annual';

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
  currency?: string;
  baseTotalCost?: number;
  coverUrl?: string;
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
  cost: number;
  frequency: SubscriptionFrequency;
  billingDay: number;
  paymentMethod: string;
  startDate: string;
  active: boolean;
  notes: string;
}

export interface Settings {
  baseCurrency: string;
  themeColor: string;
}

export interface AppData {
  purchases: Purchase[];
  subscriptions: Subscription[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  baseCurrency: 'USD',
  themeColor: '#6d4aff',
};

export const PURCHASE_TYPE_LABELS: Record<PurchaseType, string> = {
  store: 'Store purchase',
  thirdParty: '3rd-party purchase',
  subscription: 'Subscription',
};

export const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  monthly: 'Monthly',
  bimonthly: 'Bi-monthly',
  quarterly: 'Quarterly',
  biannual: 'Bi-annual',
  annual: 'Annual',
};

const FREQUENCY_MONTHS: Record<SubscriptionFrequency, number> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  biannual: 6,
  annual: 12,
};

export function monthlyEquivalent(sub: Subscription): number {
  return sub.cost / FREQUENCY_MONTHS[sub.frequency];
}
