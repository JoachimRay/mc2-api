export type Customer = {
  id: string;
  name: string;
  balance: number;
  lastPaid: string;
};

export const ROWS: Customer[] = [
  { id: "c1", name: "Aling Nena", balance: 340, lastPaid: "Sep 9" },
  { id: "c2", name: "Mang Tomas", balance: 1250.5, lastPaid: "Aug 30" },
  { id: "c3", name: "Ate Joy", balance: 0, lastPaid: "Sep 12" },
];