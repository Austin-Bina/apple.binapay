import EpinCardSample from "@/components/page-components/transaction/epin-sample-card";
import { CopiedContent, CopyContent } from "@/components/svgs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { defaultTransactionResponse, getTransactionDetails, viewTransactionHelper } from "@/helpers/transaction-helper";
import { useShareTransactionReceipt } from "@/hooks/transaction";
import { DashboardLayoutWrapper } from "@/layouts/DashboardLayout";
import { copyToClipboard, cn } from "@/lib/utils";
import generateEpinsTemplate from "@/templates/print-epins-tempate";
import { PageProps } from "@/types";
import { WalletTransaction } from "@/types/transaction";
import { Head, Link } from "@inertiajs/react";
import { Card, CardBody, CardHeader, Image, Button as NextUIButton, Spinner } from "@heroui/react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { AlertCircle, Mail } from "lucide-react";
import { TransactionStatus } from "@/enums/transaction";

type Page = PageProps<{ payload: WalletTransaction }>;

export default function ViewTransaction({ payload }: Page) {
    const [valueCopied, setValueCopied] = useState(false);
    const [visibleEpins, setVisibleEpins] = useState(10);
    const { shareTransactionReceipt } = useShareTransactionReceipt();

    const pageData = useMemo(() => {
        const data = viewTransactionHelper(payload);
        return {
            ...defaultTransactionResponse,
            transactionTitle: defaultTransactionResponse.title,
            transactionDescription: defaultTransactionResponse.description,
            transactionDetails: [] as ReturnType<typeof getTransactionDetails>,
            transactionDate: format(new Date(), "MMM dd, yyyy h:mm a"),
            appLogo: "https://binapay.co/assets/icons/logo-black.svg",
            promotionalText: `<p style="margin-bottom: 16px;">Unlock exclusive offers and rewards with <strong>BinaPay</strong>. Stay tuned for exciting promotions!</p>`,
            supportEmail: "support@binapay.co",
            hasDetails: false,
            logo: "",
            ...data,
        };
    }, [payload]);

    const isPending = useMemo(() => {
        return pageData.status === TransactionStatus.Pending;
    }, [pageData.status]);

    const printData = {
        pageData: { ...pageData, supportEmail: "" },
    };

    const handleCopyToClipboard = async () => {
        if (pageData.hasHighlighted?.copyable) {
            copyToClipboard(pageData.hasHighlighted.value, (result) => {
                setValueCopied(result);
                setTimeout(() => setValueCopied(false), 2000);
            });
        }
    };

    const handlePrintEpin = () => {
        shareTransactionReceipt({ pageData: printData.pageData, getTemplate: generateEpinsTemplate });
    };

    const loadMoreEpins = () => {
        setVisibleEpins((prev) => prev + 10);
    };

    const handleContactSupport = () => {
        window.location.href = `mailto:${pageData.supportEmail}?subject=Transaction Support - ${pageData.reference}`;
    };

    return (
        <DashboardLayoutWrapper hideBackButton>
            <Head title="Service Purchase Successful" />
            <div className="flex justify-center items-center md:pt-20">
                <div className="w-full max-w-screen-md mx-auto flex flex-col items-center p-6 md:pb-16 border-3 border-primary-50 rounded-3xl bg-center bg-cover bg-no-repeat bg-[url('/assets/images/backgrounds/card-waves.svg')]">
                    <div className="w-full flex justify-end mb-4">
                        <NextUIButton
                            color="default"
                            variant="bordered"
                            size="lg"
                            as={Link}
                            href={route("dashboard")}
                            className="h-9 md:h-14 w-20 md:w-48 border-[#111827]">
                            Back
                        </NextUIButton>
                    </div>

                    {isPending && (
                        <Alert variant="warning" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Transaction Processing</AlertTitle>
                            <AlertDescription>
                                Your transaction is currently being processed. This may take a few minutes.
                                Please wait while we confirm your utility payment.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Card
                        shadow="none"
                        className={cn(
                            "bg-white w-full py-5 rounded-3xl border border-primary-200 max-w-screen-sm transition-all duration-300",
                            isPending && "animate-pulse"
                        )}>
                        <CardHeader>
                            <div className="w-full flex flex-col items-center gap-2">
                                <p className="font-bold text-lg text-center text-primary-900">
                                    {pageData.transactionTitle}
                                </p>
                                {isPending && (
                                    <div className="flex items-center gap-2">
                                        <Spinner size="sm" color="warning" />
                                        <span className="text-sm text-yellow-600">Processing...</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardBody className="flex flex-col items-center p-5">
                            {pageData.logo && <Image width={50} height={50} src={pageData.logo} alt="Provider Logo" />}

                            {pageData.hasDetails ? (
                                <div className="w-full my-5 space-y-4">
                                    {pageData.transactionDetails.map((item) => (
                                        <div key={item.value} className="flex justify-between">
                                            <p className="text-sm text-gray-600">{item.label}:</p>
                                            <p className="text-base font-semibold">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center mt-4">{pageData.transactionDescription}</p>
                            )}

                            {pageData.hasHighlighted && (
                                <div className="flex items-center gap-2 bg-gray-300 px-4 py-2 rounded-md w-full my-5">
                                    <p className="text-lg font-bold text-gray-700">{pageData.hasHighlighted.value}</p>
                                    {pageData.hasHighlighted.copyable && (
                                        <NextUIButton
                                            onClick={handleCopyToClipboard}
                                            isIconOnly
                                            variant="solid"
                                            color="primary"
                                            startContent={
                                                valueCopied ? (
                                                    <CopiedContent className="fill-white" />
                                                ) : (
                                                    <CopyContent className="fill-primary-600" />
                                                )
                                            }
                                        />
                                    )}
                                </div>
                            )}

                            {pageData.epins && pageData.epins.length > 0 && (
                                <div className="mt-8 w-full place-items-center grid gap-2 grid-cols-1 md:grid-cols-2 md:grid-rows-1">
                                    {pageData.epins.slice(0, visibleEpins).map((epin, index) => (
                                        <EpinCardSample key={index} values={epin} />
                                    ))}
                                    {visibleEpins < pageData.epins.length && (
                                        <Button
                                            size="sm"
                                            variant="faded"
                                            onClick={loadMoreEpins}
                                            className="h-[30px] mt-4">
                                            Load More E-Pins
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col w-full gap-3 mt-10">
                                {pageData.hasDetails && (
                                    <Button
                                        className="h-14 w-full"
                                        onClick={() => shareTransactionReceipt(printData)}
                                        variant="flat">
                                        Share Receipt
                                    </Button>
                                )}

                                {pageData.epins && pageData.epins.length > 0 && (
                                    <Button className="w-full" variant="solid" onClick={handlePrintEpin}>
                                        Print E-Pins
                                    </Button>
                                )}

                                <Button
                                    className="w-full bg-primary-50 text-primary-900 hover:bg-primary-100"
                                    variant="ghost"
                                    onClick={handleContactSupport}>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Contact Support
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </DashboardLayoutWrapper>
    );
}
