import { SubmissionEventTypes, SubmissionTypes } from '@oneblink/types'
import { ReplaceInjectablesFormatters } from '../submissionService.js'

export type FormStorePayment = NonNullable<
  SubmissionTypes.FormStoreRecord['payment']
>

export type PaymentDisplayDetail = {
  label: string
  value: string
  /** A unique key across payment providers to identify the detail */
  key: SubmissionEventTypes.PaymentDisplayDetailKey
}

export type PaymentDisplayDetailsResult = {
  amount: {
    value: number
    formatted: string
  }
  paymentDisplayDetails: PaymentDisplayDetail[]
}

export type PaymentDisplayFormatters = Pick<
  ReplaceInjectablesFormatters,
  'formatCurrency' | 'formatDate' | 'formatDateTime'
>

/**
 * Pure transforms for a payment provider. Implementations must not perform
 * HTTP or other I/O — they only accept known types and return values.
 */
export interface PaymentProvider<
  T extends SubmissionTypes.FormSubmissionPayment,
> {
  getFormStorePayment(formSubmissionPayment: T): FormStorePayment
  getDisplayDetails(
    formSubmissionPayment: T,
    formatters: PaymentDisplayFormatters,
  ): PaymentDisplayDetailsResult | undefined
}
