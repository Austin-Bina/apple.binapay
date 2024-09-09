import { TransactionForm } from "@enum/transaction";
import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from "@reduxjs/toolkit";

interface Transaction {
  id: TransactionForm;
  data: object;
}

const transactionAdapter = createEntityAdapter<Transaction, TransactionForm>({
  selectId: (transaction) => transaction.id,
});

export const initialTransactionState = transactionAdapter.getInitialState();

export const transactionSlice = createSlice({
  name: "transaction",
  initialState: initialTransactionState,
  reducers: {
    addPendingTransaction: (state, action: PayloadAction<Transaction>) => {
      if (transactionAdapter.getSelectors().selectAll(state).length === 0) {
        transactionAdapter.addOne(state, action.payload);
      }
    },
    removePendingTransaction: (
      state,
      action: PayloadAction<{ id: TransactionForm }>
    ) => {
      transactionAdapter.removeOne(state, action.payload.id);
    },
    updatePendingTransaction: (state, action: PayloadAction<Transaction>) => {
      transactionAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload,
      });
    },
  },
});

export const {
  addPendingTransaction,
  removePendingTransaction,
  updatePendingTransaction,
} = transactionSlice.actions;

export const { selectById: getPendingTransaction } =
  transactionAdapter.getSelectors();
