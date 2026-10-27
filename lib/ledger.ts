export type LedgerAccount = {
  id: string;
  name: string;
  balance: number;
  lastPaid: string;
  slug: string;
  title: string;
  year: string;
  summary: string;
};

export type Project = LedgerAccount;

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
