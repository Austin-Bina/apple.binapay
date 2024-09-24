export enum TransactionForm {
  Electricity = "electricity_bill",
  Data = "data_purchase",
  Airtime = "airtime_purchase",
  CableTv = "tv_subscription_renew",
  Education = "education",
  Epins = "epins_purchase",
  Epin = "epins_purchase",
}

export enum TransactionType {
  Debit = "debit",
  Credit = "credit",
}

export enum TransactionStatus {
  Pending = "pending",
  Failed = "failed",
  Cancelled = "cancelled",
  Initiated = "initiated",
  Successful = "successful",
}
