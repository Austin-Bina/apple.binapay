import { createSelector } from "@reduxjs/toolkit";
import { accountsApi } from "../redux-api/accountsApi";

const listAccountsResult = accountsApi.endpoints.listAccounts.select;

const selectCanCreateMoreAccounts = () =>
    createSelector([listAccountsResult()], (result) => {
        if (result.data) {
            return result.data.canCreateMore;
        }

        return false;
    });

export { selectCanCreateMoreAccounts };
