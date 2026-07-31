import { SubmissionTypes } from '@oneblink/types'
import {
  FormStorePayment,
  PaymentDisplayDetailsResult,
  PaymentDisplayFormatters,
  PaymentProvider,
} from '../types.js'

type BPOINTFormSubmissionPayment = Extract<
  SubmissionTypes.FormSubmissionPayment,
  { type: 'BPOINT' }
>

function getFormStorePayment(
  formSubmissionPayment: BPOINTFormSubmissionPayment,
): FormStorePayment {
  const providerTransactionId =
    formSubmissionPayment.paymentTransaction?.TxnNumber
  const providerReceiptNumber =
    formSubmissionPayment.paymentTransaction?.ReceiptNumber

  return {
    status: formSubmissionPayment.status,
    ...(providerTransactionId ? { providerTransactionId } : {}),
    ...(providerReceiptNumber ? { providerReceiptNumber } : {}),
  }
}

function getDisplayDetails(
  formSubmissionPayment: BPOINTFormSubmissionPayment,
  {
    formatCurrency,
    formatDateTime,
  }: PaymentDisplayFormatters,
): PaymentDisplayDetailsResult | undefined {
  const { paymentTransaction } = formSubmissionPayment
  if (!paymentTransaction) {
    return
  }
  const amountValue = paymentTransaction.Amount / 100
  const amount = {
    value: amountValue,
    formatted: formatCurrency(amountValue),
  }
  return {
    amount,
    paymentDisplayDetails: [
      {
        key: 'BPOINT_RECEIPT_NUMBER',
        label: 'Receipt Number',
        value: paymentTransaction.ReceiptNumber,
      },
      {
        key: 'BPOINT_CRN1',
        label: 'CRN 1',
        value: paymentTransaction.Crn1,
      },
      {
        key: 'BPOINT_CRN2',
        label: 'CRN 2',
        value: paymentTransaction.Crn2,
      },
      {
        key: 'BPOINT_CRN3',
        label: 'CRN 3',
        value: paymentTransaction.Crn3,
      },
      {
        key: 'BPOINT_BILLER_CODE',
        label: 'Biller Code',
        value: paymentTransaction.BillerCode,
      },
      {
        key: 'BPOINT_CREDIT_CARD_MASK',
        label: 'Card Number',
        value: paymentTransaction.CardDetails.MaskedCardNumber,
      },
      {
        key: 'BPOINT_AMOUNT',
        label: 'Amount',
        value: amount.formatted,
      },
      {
        key: 'BPOINT_SURCHARGE_AMOUNT',
        label: 'Surcharge Amount',
        value: formatCurrency(paymentTransaction.AmountSurcharge / 100),
      },
      {
        key: 'BPOINT_PROCESSED_DATE_TIME',
        label: 'Processed Date Time',
        value: formatDateTime(paymentTransaction.ProcessedDateTime),
      },
    ],
  }
}

const bpointPaymentProvider: PaymentProvider<BPOINTFormSubmissionPayment> = {
  getFormStorePayment,
  getDisplayDetails,
}

export default bpointPaymentProvider
