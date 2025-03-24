import { TransactionEmptyState } from "@/components/ui/empty-states/transaction";
import PleaseWaitModal from "@/components/ui/modal/please-wait";
import { getTransactionIcon, getTransactionStatus } from "@/helpers/transaction-helper";
import { DashboardLayoutWrapper } from "@/layouts/DashboardLayout";
import { convertToNaira, goBack, cn } from "@/lib/utils";
import { useFetchCompleteTransactionsQuery } from "@/redux/redux-api/accountTransactionsApi";
import { WalletTransaction } from "@/types/transaction";
import { Head, router } from "@inertiajs/react";
import { Avatar, Button as NextUIButton, ScrollShadow, Spinner } from "@heroui/react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { TransactionStatus } from "@/enums/transaction";

const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
        case TransactionStatus.Pending:
            return "bg-yellow-100 text-yellow-800";
        case TransactionStatus.Failed:
            return "bg-red-100 text-red-800";
        case TransactionStatus.Successful:
            return "bg-green-100 text-green-800";
        case TransactionStatus.Cancelled:
            return "bg-gray-100 text-gray-800";
        case TransactionStatus.Initiated:
            return "bg-blue-100 text-blue-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

const getStatusLabel = (status: TransactionStatus) => {
    switch (status) {
        case TransactionStatus.Pending:
            return "Processing";
        case TransactionStatus.Failed:
            return "Failed";
        case TransactionStatus.Successful:
            return "Successful";
        case TransactionStatus.Cancelled:
            return "Cancelled";
        case TransactionStatus.Initiated:
            return "Started";
        default:
            return status;
    }
};

const getTotalTransactionCount = (transactions: { [group: string]: WalletTransaction[] }) => {
    return Object.values(transactions).reduce((total, group) => total + group.length, 0);
};

export default function TransactionsHistory() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [page, setPage] = useState(1);

    const {
        data: queryData,
        isLoading,
        isFetching,
    } = useFetchCompleteTransactionsQuery(
        { page },
        {
            skipPollingIfUnfocused: true,
            pollingInterval: 10000,
        },
    );

    const transactionsData = useMemo(() => {
        if (!queryData) {
            return {
                transactions: {},
                meta: {
                    has_more: false,
                },
            };
        }

        return queryData;
    }, [queryData]);

    const loadMore = () => {
        if (!isFetching) {
            setPage((prevPage) => prevPage + 1);
        }
    };

    const onSelectTransaction = (transaction: WalletTransaction) => {
        router.visit(route("transaction.view", { id: transaction.id }), {
            onStart: () => {
                setIsProcessing(true);
            },
            onFinish: () => {
                setIsProcessing(false);
            },
        });
    };

    const dynamicContent = useMemo(() => {
        if (Object.entries(transactionsData.transactions).length === 0) {
            return <TransactionEmptyState />;
        }

        return (
            <ScrollShadow
                className="flex flex-col w-full max-w-xl"
                id="transactions-container"
                style={{
                    height: 600,
                }}
                orientation="vertical"
                hideScrollBar>
                <InfiniteScroll
                    scrollableTarget="transactions-container"
                    dataLength={getTotalTransactionCount(transactionsData.transactions)}
                    next={loadMore}
                    hasMore={transactionsData.meta.has_more}
                    loader={
                        <div>
                            <Spinner size="sm" /> <span className="text-sm text-gray-400">Fetching history...</span>
                        </div>
                    }
                    endMessage={
                        <p className="text-gray-500 text-sm font-light p-4">
                            <b>You have reached the end of the transaction history.</b>
                        </p>
                    }>
                    {Object.entries(transactionsData.transactions).map(([group, transactions]) => (
                        <div className="flex flex-col w-full" key={group}>
                            <p className="text-xl font-bold">{group}</p>
                            <div className="divide-y-1 divide-gray/80">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        onClick={() => onSelectTransaction(transaction)}
                                        className="flex flex-row items-center justify-between gap-4 py-5 cursor-pointer">
                                        <Avatar
                                            src={getTransactionIcon(transaction)}
                                            alt="Transaction Image"
                                            className="flex-shrink-0 bg-transparent"
                                            size="lg"
                                        />
                                        <div className="flex justify-between items-center w-full">
                                            <div className="w-full max-w-[70%]">
                                                <h2 className="text-gray-900 text-lg line-clamp-2 font-medium">
                                                    {transaction?.meta?.description}
                                                </h2>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-gray-500 text-sm">
                                                        {format(transaction.created_at, "MMM dd, yyyy h:mm a")}
                                                    </p>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                                        getStatusColor(getTransactionStatus(transaction))
                                                    )}>
                                                        {getStatusLabel(getTransactionStatus(transaction))}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-sm md:text-xl font-bold flex-shrink-0">
                                                {convertToNaira(transaction.amount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </InfiniteScroll>
            </ScrollShadow>
        );
    }, [transactionsData]);

    return (
        <DashboardLayoutWrapper hideBackButton>
            <Head title="Transactions History" />
            <div className="flex justify-center items-center">
                <div className="w-full max-w-screen-md  mx-auto flex flex-col justify-center items-center p-4 md:px-24 md:pt-11 md:pb-16 border-3 border-primary-50 rounded-3xl bg-center bg-cover bg-no-repeat bg-[url('/assets/images/backgrounds/card-waves.svg')]">
                    <div className="w-full flex justify-between items-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-left text-gray-800">Transactions History</h1>
                        <NextUIButton
                            color="default"
                            variant="bordered"
                            size="lg"
                            className="h-9 md:h-14 w-20 md:w-48 max-w-0 border-[#111827]"
                            onClick={goBack}>
                            Back
                        </NextUIButton>
                    </div>

                    {dynamicContent}
                </div>
            </div>
            <PleaseWaitModal visible={isLoading || isProcessing} />
        </DashboardLayoutWrapper>
    );
}
