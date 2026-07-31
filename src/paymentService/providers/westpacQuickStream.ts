import { SubmissionTypes } from '@oneblink/types'
import {
  FormStorePayment,
  PaymentDisplayDetailsResult,
  PaymentDisplayFormatters,
  PaymentProvider,
} from '../types.js'

type WestpacQuickStreamFormSubmissionPayment = Extract<
  SubmissionTypes.FormSubmissionPayment,
  { type: 'WESTPAC_QUICK_STREAM' }
>

function getFormStorePayment(
  formSubmissionPayment: WestpacQuickStreamFormSubmissionPayment,
): FormStorePayment {
  const providerTransactionId =
    formSubmissionPayment.paymentTransaction?.paymentReferenceNumber
  const providerReceiptNumber =
    formSubmissionPayment.paymentTransaction?.receiptNumber

  return {
    status: formSubmissionPayment.status,
    ...(providerTransactionId ? { providerTransactionId } : {}),
    ...(providerReceiptNumber ? { providerReceiptNumber } : {}),
  }
}

function getDisplayDetails(
  formSubmissionPayment: WestpacQuickStreamFormSubmissionPayment,
  { formatCurrency, formatDate }: PaymentDisplayFormatters,
): PaymentDisplayDetailsResult | undefined {
  const { paymentTransaction } = formSubmissionPayment
  if (!paymentTransaction) {
    return
  }

  const amount = {
    value: paymentTransaction.totalAmount.amount,
    formatted: formatCurrency(
      parseFloat(paymentTransaction.totalAmount.amount.toString()),
    ),
  }

  return {
    amount,
    paymentDisplayDetails: [
      {
        key: 'WESTPAC_QUICK_STREAM_RECEIPT_NUMBER',
        label: 'Receipt Number',
        value: paymentTransaction.receiptNumber,
      },
      {
        key: 'WESTPAC_QUICK_STREAM_PAYMENT_REFERENCE_NUMBER',
        label: 'Payment Reference',
        value: paymentTransaction.paymentReferenceNumber,
      },
      {
        key: 'WESTPAC_QUICK_STREAM_CUSTOMER_REFERENCE_NUMBER',
        label: 'Customer Reference Number',
        value: paymentTransaction.customerReferenceNumber,
      },
      {
        key: 'WESTPAC_QUICK_STREAM_AMOUNT',
        label: 'Amount',
        value: amount.formatted,
      },
      ...(paymentTransaction.surchargeAmount.amount
        ? [
            {
              key: 'WESTPAC_QUICK_STREAM_SURCHARGE_AMOUNT' as const,
              label: 'Surcharge Amount',
              value: formatCurrency(
                parseFloat(
                  paymentTransaction.surchargeAmount.amount.toString(),
                ),
              ),
            },
          ]
        : []),
      {
        key: 'WESTPAC_QUICK_STREAM_SETTLEMENT_DATE',
        label: 'Settlement Date',
        value: formatDate(paymentTransaction.settlementDate),
      },
    ],
  }
}

const westpacQuickStreamPaymentProvider: PaymentProvider<WestpacQuickStreamFormSubmissionPayment> =
  {
    getFormStorePayment,
    getDisplayDetails,
  }

export default westpacQuickStreamPaymentProvider
