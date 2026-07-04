export type Customer = {
  id: number;
  account_number: string;
  issue_date: string;
  interest_rate: string;
  tenure_months: number;
  emi_due: string;
  paid_installments: number;
  payments_left: number;
  total_amount_to_be_paid: string;
};

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type Payment = {
  id: number;
  customer_id: number;
  transaction_reference: string;
  payment_date: string;
  payment_amount: string;
  status: PaymentStatus;
};
