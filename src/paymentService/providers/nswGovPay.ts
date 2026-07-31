import { SubmissionTypes } from '@oneblink/types'
import {
  FormStorePayment,
  PaymentDisplayDetailsResult,
  PaymentDisplayFormatters,
  PaymentProvider,
} from '../types.js'

type NSWGovPayFormSubmissionPayment = Extract<
  SubmissionTypes.FormSubmissionPayment,
  { type: 'NSW_GOV_PAY' }
>

function getFormStorePayment(
  formSubmissionPayment: NSWGovPayFormSubmissionPayment,
): FormStorePayment {
  const providerTransactionId =
    formSubmissionPayment.paymentTransaction?.nswGovPayPaymentReference
  const providerReceiptNumber =
    formSubmissionPayment.paymentTransaction?.agencyCompletionPayment
      ?.paymentCompletionReference

  return {
    status: formSubmissionPayment.status,
    ...(providerTransactionId ? { providerTransactionId } : {}),
    ...(providerReceiptNumber ? { providerReceiptNumber } : {}),
  }
}

function getDisplayDetails(
  formSubmissionPayment: NSWGovPayFormSubmissionPayment,
  {
    formatCurrency,
    formatDateTime,
  }: PaymentDisplayFormatters,
): PaymentDisplayDetailsResult | undefined {
  const { paymentTransaction } = formSubmissionPayment
  if (!paymentTransaction || !paymentTransaction.agencyCompletionPayment) {
    return
  }

  const amount = {
    value: paymentTransaction.agencyCompletionPayment.amount,
    formatted: formatCurrency(
      paymentTransaction.agencyCompletionPayment.amount,
    ),
  }
  return {
    amount,
    paymentDisplayDetails: [
      {
        key: 'NSW_GOV_PAY_COMPLETION_REFERENCE',
        label: 'Completion Reference',
        value:
          paymentTransaction.agencyCompletionPayment.paymentCompletionReference,
      },
      {
        key: 'NSW_GOV_PAY_PAYMENT_REFERENCE',
        label: 'Payment Reference',
        value: paymentTransaction.agencyCompletionPayment.paymentReference,
      },
      {
        key: 'NSW_GOV_PAY_BANK_REFERENCE',
        label: 'Bank Reference',
        value: paymentTransaction.agencyCompletionPayment.bankReference,
      },
      {
        key: 'NSW_GOV_PAY_PAYMENT_METHOD',
        label: 'Payment Method',
        value: paymentTransaction.agencyCompletionPayment.paymentMethod,
      },
      ...(paymentTransaction.agencyCompletionPayment.paymentMethod === 'BPAY' &&
      paymentTransaction.agencyCompletionPayment.bPay?.billerCode
        ? [
            {
              key: 'NSW_GOV_PAY_BPAY_BILLER_CODE' as const,
              label: 'BPay Biller Code',
              value:
                paymentTransaction.agencyCompletionPayment.bPay.billerCode,
            },
          ]
        : []),
      ...(paymentTransaction.agencyCompletionPayment.paymentMethod === 'CARD'
        ? [
            {
              key: 'NSW_GOV_PAY_CREDIT_CARD_NUMBER' as const,
              label: 'Card Number',
              value: `xxxx xxxx xxxx ${paymentTransaction.agencyCompletionPayment.card?.last4Digits}`,
            },
          ]
        : []),
      {
        key: 'NSW_GOV_PAY_AMOUNT',
        label: 'Amount',
        value: amount.formatted,
      },
      {
        key: 'NSW_GOV_PAY_SURCHARGE_AMOUNT',
        label: 'Surcharge Amount',
        value: formatCurrency(
          paymentTransaction.agencyCompletionPayment.surcharge,
        ),
      },
      {
        key: 'NSW_GOV_PAY_SURCHARGE_GST',
        label: 'Surcharge GST',
        value: formatCurrency(
          paymentTransaction.agencyCompletionPayment.surchargeGst,
        ),
      },
      {
        key: 'NSW_GOV_PAY_CREATED_DATE_TIME',
        label: 'Created Date Time',
        value: formatDateTime(formSubmissionPayment.createdAt),
      },
    ],
  }
}

const nswGovPayPaymentProvider: PaymentProvider<NSWGovPayFormSubmissionPayment> =
  {
    getFormStorePayment,
    getDisplayDetails,
  }

export default nswGovPayPaymentProvider
