import { SubmissionTypes } from '@oneblink/types'
import {
  FormStorePayment,
  PaymentDisplayDetail,
  PaymentDisplayDetailsResult,
  PaymentDisplayFormatters,
  PaymentFailureDetail,
  PaymentProvider,
} from '../types.js'

type CPPayFormSubmissionPayment = Extract<
  SubmissionTypes.FormSubmissionPayment,
  { type: 'CP_PAY' }
>

function getFormStorePayment(
  formSubmissionPayment: CPPayFormSubmissionPayment,
): FormStorePayment {
  const paymentTransaction = formSubmissionPayment.paymentTransaction
  const providerTransactionId = !paymentTransaction
    ? undefined
    : paymentTransaction.cpPayVersion === 'v2'
      ? paymentTransaction.result.id
      : paymentTransaction.transactionId
  const providerReceiptNumber = !paymentTransaction
    ? undefined
    : paymentTransaction.cpPayVersion === 'v2'
      ? (paymentTransaction.result.externalReferenceId ?? undefined)
      : (paymentTransaction.orderNumber ?? undefined)

  return {
    status: formSubmissionPayment.status,
    ...(providerTransactionId ? { providerTransactionId } : {}),
    ...(providerReceiptNumber ? { providerReceiptNumber } : {}),
  }
}

function getDisplayDetails(
  formSubmissionPayment: CPPayFormSubmissionPayment,
  { formatCurrency, formatDateTime }: PaymentDisplayFormatters,
): PaymentDisplayDetailsResult | undefined {
  const { paymentTransaction } = formSubmissionPayment
  if (!paymentTransaction) {
    return
  }

  const determineDetails = () => {
    switch (paymentTransaction.cpPayVersion) {
      case 'v2': {
        return {
          transactionId: paymentTransaction.result.id,
          orderNumber:
            paymentTransaction.result.externalReferenceId ?? undefined,
          paymentType: paymentTransaction.result.paymentType,
          creditCardMask: paymentTransaction.result.lastFour
            ? `xxxx xxxx xxxx ${paymentTransaction.result.lastFour}`
            : undefined,
          amount:
            paymentTransaction.result.amount !== undefined
              ? {
                  value: paymentTransaction.result.amount,
                  formatted: formatCurrency(paymentTransaction.result.amount),
                }
              : {
                  value: NaN,
                  formatted: 'Unknown',
                },
          createdDateTime: paymentTransaction.result.createdOnUtc,
        }
      }
      default: {
        return {
          transactionId: paymentTransaction.transactionId,
          orderNumber: paymentTransaction.orderNumber ?? undefined,
          paymentType:
            paymentTransaction.paymentTypeId === 1
              ? 'Credit/Debit Card'
              : paymentTransaction.paymentTypeId === 2
                ? 'ACH'
                : undefined,
          creditCardMask: paymentTransaction.lastFour
            ? `xxxx xxxx xxxx ${paymentTransaction.lastFour}`
            : undefined,
          amount: {
            value: paymentTransaction.amount,
            formatted: formatCurrency(paymentTransaction.amount),
          },
          createdDateTime: paymentTransaction.createdAt,
        }
      }
    }
  }

  const {
    transactionId,
    orderNumber,
    paymentType,
    creditCardMask,
    amount,
    createdDateTime,
  } = determineDetails()
  const paymentDisplayDetails: PaymentDisplayDetail[] = []
  if (transactionId) {
    paymentDisplayDetails.push({
      key: 'CP_PAY_TRANSACTION_ID',
      label: 'Transaction Id',
      value: transactionId,
    })
  }
  if (orderNumber) {
    paymentDisplayDetails.push({
      key: 'CP_PAY_ORDER_NUMBER',
      label: 'Order Number',
      value: orderNumber,
    })
  }
  if (paymentType) {
    paymentDisplayDetails.push({
      key: 'CP_PAY_PAYMENT_TYPE',
      label: 'Payment Type',
      value: paymentType,
    })
  }
  if (creditCardMask) {
    paymentDisplayDetails.push({
      key: 'CP_PAY_CREDIT_CARD_MASK',
      label: 'Card Number',
      value: creditCardMask,
    })
  }
  paymentDisplayDetails.push({
    key: 'CP_PAY_AMOUNT',
    label: 'Amount',
    value: amount.formatted,
  })
  if (createdDateTime) {
    paymentDisplayDetails.push({
      key: 'CP_PAY_CREATED_DATE_TIME',
      label: 'Created At',
      value: formatDateTime(createdDateTime),
    })
  }

  return {
    amount,
    paymentDisplayDetails,
  }
}

function getFailureDetails(
  formSubmissionPayment: CPPayFormSubmissionPayment,
): PaymentFailureDetail[] {
  const { paymentTransaction } = formSubmissionPayment
  if (!paymentTransaction) {
    return []
  }

  const details: PaymentFailureDetail[] = []
  if (paymentTransaction.cpPayVersion === 'v2') {
    const { errorCode } = paymentTransaction.result
    if (errorCode && errorCode !== 'NoError') {
      details.push({
        key: 'CP_PAY_ERROR_CODE',
        label: 'Response Code',
        value: errorCode,
      })
    }
    return details
  }

  if (paymentTransaction.errorMessage) {
    details.push({
      key: 'CP_PAY_ERROR_MESSAGE',
      label: 'Response',
      value: paymentTransaction.errorMessage,
    })
  }
  if (paymentTransaction.errorCode != null) {
    details.push({
      key: 'CP_PAY_ERROR_CODE',
      label: 'Response Code',
      value: String(paymentTransaction.errorCode),
    })
  }
  return details
}

const cpPayPaymentProvider: PaymentProvider<CPPayFormSubmissionPayment> = {
  getFormStorePayment,
  getDisplayDetails,
  getFailureDetails,
}

export default cpPayPaymentProvider
