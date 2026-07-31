import { SubmissionTypes } from '@oneblink/types'
import { PaymentProvider } from './types.js'
import bpointPaymentProvider from './providers/bpoint.js'
import cpPayPaymentProvider from './providers/cpPay.js'
import nswGovPayPaymentProvider from './providers/nswGovPay.js'
import westpacQuickStreamPaymentProvider from './providers/westpacQuickStream.js'

const paymentProvidersMap: Record<
  SubmissionTypes.FormSubmissionPayment['type'],
  PaymentProvider<SubmissionTypes.FormSubmissionPayment>
> = {
  BPOINT: bpointPaymentProvider,
  CP_PAY: cpPayPaymentProvider,
  NSW_GOV_PAY: nswGovPayPaymentProvider,
  WESTPAC_QUICK_STREAM: westpacQuickStreamPaymentProvider,
}

/**
 * Resolve the pure payment provider implementation for a payment type.
 *
 * @param type
 * @returns
 */
export default function getPaymentProvider(
  type: SubmissionTypes.FormSubmissionPayment['type'],
): PaymentProvider<SubmissionTypes.FormSubmissionPayment> {
  return paymentProvidersMap[type]
}
