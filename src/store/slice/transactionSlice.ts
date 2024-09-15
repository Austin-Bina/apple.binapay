import { TransactionForm } from "@enum/transaction";
import { createSlice, createEntityAdapter, PayloadAction } from "@reduxjs/toolkit";

interface Transaction {
  id: TransactionForm;
  data: any & {
    success?: {
      title: string;
      description?: string;
      logo?: any;
      details?: {
        [index: string]: string;
      };
    };
  };
}

interface ErrorState {
  code: string;
  status: string;
  title: string;
  description: string;
}

interface TransactionState {
  ids: TransactionForm[];
  entities: Record<TransactionForm, Transaction>;
  error: ErrorState | null;
}

const transactionAdapter = createEntityAdapter<Transaction, TransactionForm>({
  selectId: (transaction) => transaction.id,
});

export const initialTransactionState: TransactionState = {
  ...transactionAdapter.getInitialState(),
  error: null,
};

export const transactionSlice = createSlice({
  name: "transaction",
  initialState: initialTransactionState,
  reducers: {
    addPendingTransaction: (state, action: PayloadAction<Transaction>) => {
      transactionAdapter.removeAll(state);
      transactionAdapter.addOne(state, action.payload);
      state.error = null;
    },
    removePendingTransaction: (state) => {
      transactionAdapter.removeAll(state);
      state.error = null;
    },
    updatePendingTransaction: (state, action: PayloadAction<Transaction>) => {
      transactionAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload,
      });
      state.error = null;
    },
    setTransactionError: (state, action: PayloadAction<ErrorState>) => {
      state.error = action.payload;
    },
    clearTransactionError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addPendingTransaction,
  removePendingTransaction,
  updatePendingTransaction,
  setTransactionError,
  clearTransactionError,
} = transactionSlice.actions;

export const { selectById: getPendingTransaction } = transactionAdapter.getSelectors();
