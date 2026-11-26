import { SubmissionTypes } from '@oneblink/types'
import {
  FormStorePayment,
  PaymentDisplayDetail,
  PaymentDisplayDetailsResult,
  PaymentDisplayFormatters,
  PaymentFailureDetail,
  PaymentProvider,
} from '../types.js'

type StripeFormSubmissionPayment = Extract<
  SubmissionTypes.FormSubmissionPayment,
  { type: 'STRIPE' }
>

function getFormStorePayment(
  formSubmissionPayment: StripeFormSubmissionPayment,
): FormStorePayment {
  const paymentIntent =
    formSubmissionPayment.paymentTransaction?.checkoutSession?.payment_intent
  const providerTransactionId =
    paymentIntent?.id ??
    formSubmissionPayment.paymentTransaction?.checkoutSessionId
  const providerReceiptNumber = paymentIntent?.latest_charge.id

  return {
    status: formSubmissionPayment.status,
    ...(providerTransactionId ? { providerTransactionId } : {}),
    ...(providerReceiptNumber ? { providerReceiptNumber } : {}),
  }
}

function getDisplayDetails(
  formSubmissionPayment: StripeFormSubmissionPayment,
  { formatCurrency, formatDateTime }: PaymentDisplayFormatters,
): PaymentDisplayDetailsResult | undefined {
  const checkoutSession =
    formSubmissionPayment.paymentTransaction?.checkoutSession
  if (typeof checkoutSession?.amount_total !== 'number') {
    return
  }

  // Stripe amounts are in the smallest currency unit (e.g. cents)
  const amountValue = checkoutSession.amount_total / 100
  const amount = {
    value: amountValue,
    formatted: formatCurrency(amountValue),
  }
  const paymentIntent = checkoutSession.payment_intent
  const card = paymentIntent.latest_charge.payment_method_details?.card

  const paymentDisplayDetails: PaymentDisplayDetail[] = [
    {
      key: 'STRIPE_CHECKOUT_SESSION_ID',
      label: 'Checkout Session ID',
      value: checkoutSession.id,
    },
    {
      key: 'STRIPE_PAYMENT_INTENT_ID',
      label: 'Payment Intent ID',
      value: paymentIntent.id,
    },
  ]
  if (checkoutSession.customer_details?.email) {
    paymentDisplayDetails.push({
      key: 'STRIPE_CUSTOMER_EMAIL',
      label: 'Customer Email',
      value: checkoutSession.customer_details.email,
    })
  }
  if (card?.brand) {
    paymentDisplayDetails.push({
      key: 'STRIPE_CARD_BRAND',
      label: 'Card Brand',
      value: card.brand,
    })
  }
  if (card?.last4) {
    paymentDisplayDetails.push({
      key: 'STRIPE_CREDIT_CARD_MASK',
      label: 'Card Number',
      value: `xxxx xxxx xxxx ${card.last4}`,
    })
  }
  paymentDisplayDetails.push(
    {
      key: 'STRIPE_AMOUNT',
      label: 'Amount',
      value: amount.formatted,
    },
    {
      key: 'STRIPE_CREATED_DATE_TIME',
      label: 'Created Date Time',
      // Stripe timestamps are in seconds since the Unix epoch
      value: formatDateTime(
        new Date(checkoutSession.created * 1000).toISOString(),
      ),
    },
  )

  return {
    amount,
    paymentDisplayDetails,
  }
}

/**
 * The Checkout Session is only stored once the payment completes, so there are
 * no provider response fields for a failed payment.
 */
function getFailureDetails(): PaymentFailureDetail[] {
  return []
}

const stripePaymentProvider: PaymentProvider<StripeFormSubmissionPayment> = {
  getFormStorePayment,
  getDisplayDetails,
  getFailureDetails,
}

export default stripePaymentProvider
