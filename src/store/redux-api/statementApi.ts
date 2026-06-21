import { route } from "@helpers/route";
import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";

export interface StatementPreviewResponse {
  period:               string;
  opening_balance:      string;
  closing_balance:      string;
  total_credit:         string;
  total_debit:          string;
  total_transactions:   number;
  credit_transactions:  number;
  debit_transactions:   number;
  recent_transactions:  StatementRow[];
}

export interface StatementRow {
  date:        string;
  time:        string;
  description: string;
  reference:   string;
  type:        "Credit" | "Debit";
  amount:      string;
  currency:    string;   // "NGN", "USDT", "BTC", etc.
  is_credit:   boolean;
  form:        string;
}

export interface CategorySummary {
  category:   string;
  count:      number;
  percentage: number;
}

export interface StatementGenerateResponse {
  delivery:          "download" | "email";
  statement_id:      string;
  generated_at:      string;
  filename:          string;
  period:            string;
  from:              string;
  to:                string;
  summary: {
    opening_balance: string;
    closing_balance: string;
    total_credit:    string;
    total_debit:     string;
  };
  user: {
    name:           string;
    email:          string;
    account_number: string;
    bank_name:      string;
  };
  transactions:      StatementRow[];
  category_summary:  CategorySummary[];
  format:            "pdf" | "csv";
  message?:          string;
}

export interface StatementPreviewParams {
  from_date: string;
  to_date:   string;
  type:      "full" | "credit" | "debit";
}

export interface StatementGenerateParams {
  from_date: string;
  to_date:   string;
  type:      "full" | "credit" | "debit";
  format:    "pdf" | "csv";
  delivery:  "download" | "email";
}

export const statementApi = createApi({
  reducerPath: "statementApi",
  baseQuery:   axiosBaseQuery(),
  tagTypes:    ["Statement"],
  endpoints:   (builder) => ({
    previewStatement: builder.query<StatementPreviewResponse, StatementPreviewParams>({
      query: (params) => ({
        url:    route("account.statement.preview"),
        params,
      }),
    }),
    generateStatement: builder.mutation<StatementGenerateResponse, StatementGenerateParams>({
      query: (body) => ({
        url:    route("account.statement.generate"),
        method: "POST",
        data:   body,
      }),
    }),
    sendStatementEmail: builder.mutation<{ message: string }, {
      pdf_base64:   string;
      filename:     string;
      statement_id: string;
      period:       string;
    }>({
      query: (body) => ({
        url:    route("account.statement.sendEmail"),
        method: "POST",
        data:   body,
      }),
    }),
  }),
});

export const {
  usePreviewStatementQuery,
  useGenerateStatementMutation,
  useSendStatementEmailMutation,
} = statementApi;
