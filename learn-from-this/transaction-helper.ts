import { TransactionStatus } from "@/enums/transaction";
import { convertToNaira, upperCaseFirst } from "@/lib/utils";
import { TransactionResponse } from "@/types";
import {
    UtilityTransaction,
    ViewTransaction,
    WalletTransaction,
} from "@/types/transaction";
import { format } from "date-fns";
import { P, match } from "ts-pattern";

const defaultTransactionResponse: TransactionResponse = {
    error: true,
    error_code: "default_transaction_failed",
    code: 400,
    title: "Transaction Failed 😢",
    description:
        "We could not make that purchase, please try again or contact support.",
    transaction_info: {
        transaction: null,
        was_billed: false,
        billed_amount: 0,
        was_refunded: false,
    },
    errorFields: [],
};

type Args = {
    details: Record<string, any>;
};

const getTransactionDetails = ({ details }: Args) => {
    return Object.keys(details).map((label) => {
        const formattedValue =
            typeof details[label] === "boolean"
                ? details[label]
                    ? "Yes"
                    : "No"
                : details[label];
        const formattedLabel = upperCaseFirst(label.replace(/_/g, " "));

        return {
            label: formattedLabel,
            value: formattedValue,
        };
    });
};

const getTransactionIcon = (
    transaction: WalletTransaction | UtilityTransaction
) => {
    const transactionIcon = match(transaction)
        .with(
            {
                payment_transaction: {
                    utilityTransaction: {
                        provider_logo: P.string,
                    },
                },
            },
            ({
                payment_transaction: {
                    utilityTransaction: { provider_logo },
                },
            }) => provider_logo
        )
        .with(
            {
                payment_transaction: {
                    utilityTransaction: {
                        details: {
                            provider: P.string,
                        },
                    },
                },
            },
            ({
                payment_transaction: {
                    utilityTransaction: {
                        details: { provider },
                    },
                },
            }) => `/assets/images/services/${provider}.png`
        )
        .with(
            { type: P.string },
            ({ type }) => `/assets/icons/notifications/${type}.png`
        )
        // begin utility transaction check
        .with({ provider_logo: P.string }, (utilityTransaction) => {
            if (utilityTransaction.provider_logo) {
                return utilityTransaction.provider_logo;
            }
            return `/assets/images/services/${utilityTransaction.details.provider}.png`;
        })
        .otherwise(() => `/assets/icons/notifications/system.png`);

    return transactionIcon;
};

const getTransactionStatus = (transaction: WalletTransaction | UtilityTransaction) => {
    return match(transaction)
        .with({ payment_transaction: { utilityTransaction: { status: P.string } } }, ({ payment_transaction }) => {
            const { utilityTransaction } = payment_transaction;
            return utilityTransaction.status;
        })
        .otherwise((walletView) => TransactionStatus.Successful);
};

const viewTransactionHelper = (
    transaction: WalletTransaction | null
): ViewTransaction | null => {
    return match(transaction)
        .with({ wallet_id: P.number, meta: {} }, (walletView) => {
            const { meta: details } = walletView;
            const logo = getTransactionIcon(walletView);
            const transactionTitle = details.description;
            const transactionDescription = details.description;

            const transactionReference = match(walletView)
                .with(
                    {
                        payment_transaction: {
                            utilityTransaction: { status: P.string },
                        },
                    },
                    ({ payment_transaction }) => {
                        const { utilityTransaction } = payment_transaction;
                        return utilityTransaction.request_id;
                    }
                )
                .otherwise((walletView) => walletView.payment_transaction?.id || "");

            const transactionStatus = getTransactionStatus(walletView);

            const transactionDetails = match(walletView)
                .with(
                    {
                        payment_transaction: {
                            utilityTransaction: { details: {} },
                        },
                    },
                    ({ payment_transaction }) => {
                        const {
                            utilityTransaction: { details },
                        } = payment_transaction;

                        return getTransactionDetails({ details });
                    }
                )
                .with(
                    {
                        payment_transaction: {
                            utilityTransaction: P.nullish || undefined,
                        },
                    },
                    ({ payment_transaction }) => {
                        // UtilityTransaction is null, it is probably a wallet transaction
                        return getTransactionDetails({
                            details: {
                                "Transaction Amount": convertToNaira(
                                    walletView.amount,
                                    true
                                ),
                                Description: walletView.meta.description,
                                "Transaction Date": format(
                                    new Date(walletView.created_at),
                                    "MMM dd, yyyy h:mm a"
                                ),
                                Destination: "Binapay Wallet",
                                "Transaction ID":
                                    walletView.payment_transaction?.id,
                            },
                        });
                    }
                )
                .otherwise(() => getTransactionDetails({ details: {} }));

            // Try to extract the token from elec or cable subscription
            const withHighlightedResponse = match(walletView)
                .with(
                    {
                        payment_transaction: {
                            utilityTransaction: {
                                details: { Token: P.string.minLength(5) },
                            },
                        },
                    },
                    ({ payment_transaction }) => {
                        const { utilityTransaction } = payment_transaction;
                        const { details } = utilityTransaction;

                        const token = details.Token;

                        return {
                            hasHighlighted: {
                                value: token,
                                copyable: true,
                            },
                        };
                    }
                )
                .with(
                    {
                        payment_transaction: {
                            utilityTransaction: {
                                details: { Token: P.string.minLength(0) },
                            },
                        },
                    },
                    () => ({
                        hasHighlighted: {
                            value: "Please contact support",
                            copyable: false,
                        },
                    })
                )
                .otherwise(() => undefined);

            const withEpinsResponse = match(walletView)
                // Get Epins Token
                .with(
                    {
                        payment_transaction: {
                            utilityTransaction: {
                                details: {
                                    Token: P.array({
                                        serial: P.string,
                                        pin: P.string,
                                    }),
                                },
                            },
                        },
                    },
                    ({ payment_transaction }) => {
                        const { utilityTransaction } = payment_transaction;
                        const { details } = utilityTransaction;

                        return {
                            transactionDetails: [],
                            hasDetails: false,
                            hasHighlighted: undefined,
                            epins: details.Token.map((epin) => ({
                                serial: epin.serial,
                                pin: epin.pin,
                                provider: details.provider,
                                amount: details.amount,
                                business_name:
                                    details.business_name || "Your Company",
                            })),
                        };
                    }
                )
                .otherwise(() => undefined);

            const hasDetails = Object.keys(transactionDetails).length > 0;

            return {
                transactionTitle,
                transactionDescription,
                transactionDetails,
                hasDetails,
                logo,
                status: transactionStatus,
                reference: transactionReference,
                ...(withHighlightedResponse ? withHighlightedResponse : {}),
                ...(withEpinsResponse ? withEpinsResponse : {}),
                transactionDate: format(
                    new Date(walletView.created_at),
                    "MMM dd, yyyy h:mm a"
                ),
            };
        })
        .otherwise(() => null);
};

export {
    defaultTransactionResponse,
    getTransactionDetails,
    getTransactionIcon,
    viewTransactionHelper,
    getTransactionStatus,
};
