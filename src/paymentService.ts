import {
  FormTypes,
  SubmissionEventTypes,
  SubmissionTypes,
} from '@oneblink/types'
import {
  calculationService,
  conditionalLogicService,
  formElementsService,
} from './index.js'
import { getRootElementValueById } from './submissionService.js'
import {
  AddOffsetToDate,
  EndOfDay,
  ParseDayOnlyDate,
  StartOfDay,
} from './conditionalLogicService/types.js'
import getPaymentProvider from './paymentService/getPaymentProvider.js'
import type {
  FormStorePayment,
  PaymentDisplayDetail,
  PaymentDisplayFormatters,
  PaymentDisplayDetailsResult,
} from './paymentService/types.js'

export {
  FormStorePayment,
  PaymentDisplayDetail,
  PaymentDisplayDetailsResult,
  PaymentDisplayFormatters,
}

/**
 * Examine a submission and its form definition to validate whether a payment
 * workflow event needs to run.
 *
 * #### Example
 *
 * ```js
 * const result = paymentService.checkForPaymentEvent({
 *   definition: form,
 *   submission,
 *   submissionTimestamp,
 *   parseDayOnlyDate: (value) => new Date(`${value}T00:00:00.000Z`),
 *   addDaysToDate: (date, days) => {
 *     date.setUTCDate(date.getUTCDate() + days)
 *     return date
 *   },
 *   startOfDay: (date) => {
 *     date.setUTCHours(0, 0, 0, 0)
 *     return date
 *   },
 *   endOfDay: (date) => {
 *     date.setUTCHours(23, 59, 59, 999)
 *     return date
 *   },
 * })
 * ```
 *
 * @param options
 * @returns
 */
export function checkForPaymentEvent({
  definition,
  submission,
  submissionTimestamp,
  parseDayOnlyDate,
  addDaysToDate,
  startOfDay,
  endOfDay,
}: {
  definition: FormTypes.Form
  submission: SubmissionTypes.S3SubmissionData['submission']
  /** ISO timestamp the form was submitted. When evaluating during submission, pass `new Date().toISOString()`. */
  submissionTimestamp: string
  /** Parse `YYYY-MM-DD` strings when evaluating date based predicates */
  parseDayOnlyDate: ParseDayOnlyDate
  /** Add days to a date when evaluating date based predicates */
  addDaysToDate: AddOffsetToDate
  /** Start of calendar day when evaluating date (not datetime) based predicates */
  startOfDay: StartOfDay
  /** End of calendar day when evaluating date (not datetime) based predicates */
  endOfDay: EndOfDay
}):
  | {
      paymentSubmissionEvent: SubmissionEventTypes.FormPaymentEvent
      amount: number
    }
  | undefined {
  const paymentSubmissionEvents = definition.paymentEvents || []
  const paymentSubmissionEvent = paymentSubmissionEvents.find(
    (paymentSubmissionEvent) => {
      return (
        paymentSubmissionEvent &&
        conditionalLogicService.evaluateConditionalPredicates({
          isConditional: !!paymentSubmissionEvent.conditionallyExecute,
          requiresAllConditionalPredicates:
            !!paymentSubmissionEvent.requiresAllConditionallyExecutePredicates,
          conditionalPredicates:
            paymentSubmissionEvent.conditionallyExecutePredicates || [],
          submission: submission,
          formElements: definition.elements,
          submissionTimestamp,
          parseDayOnlyDate,
          addDaysToDate,
          startOfDay,
          endOfDay,
        })
      )
    },
  )

  if (!paymentSubmissionEvent) {
    return
  }
  console.log(
    'Checking if submission with payment submission event needs processing',
  )

  const amount = resolvePaymentEventAmount({
    configuration: paymentSubmissionEvent.configuration,
    definition,
    submission,
    parseDayOnlyDate,
  })

  if (!amount) {
    console.log(
      'Form has a payment submission event but the amount has been entered as 0 or not at all, finishing as normal submission',
    )
    return
  }

  if (typeof amount !== 'number') {
    console.log(
      'Form has a payment submission event but the amount is not a number, throwing error',
    )
    throw new Error(
      'The configuration required to make a payment is incorrect. Please contact your administrator to ensure your application configuration has been completed successfully.',
    )
  }

  return {
    paymentSubmissionEvent,
    amount,
  }
}

function resolvePaymentEventAmount({
  configuration,
  definition,
  submission,
  parseDayOnlyDate,
}: {
  configuration: SubmissionEventTypes.FormPaymentEvent['configuration']
  definition: FormTypes.Form
  submission: SubmissionTypes.S3SubmissionData['submission']
  parseDayOnlyDate: ParseDayOnlyDate
}): unknown {
  if ('paymentAmount' in configuration) {
    console.log(
      'Using fixed payment amount from payment submission event configuration',
      configuration.paymentAmount,
    )
    return configuration.paymentAmount
  }

  if ('paymentCalculation' in configuration) {
    console.log(
      'Evaluating payment calculation from payment submission event configuration',
      configuration.paymentCalculation,
    )
    return calculationService.evaluateExpression({
      expression: configuration.paymentCalculation,
      submission,
      formElements: definition.elements,
      parseDayOnlyDate,
    })
  }

  if ('elementId' in configuration) {
    const amountElement = formElementsService.findFormElement(
      definition.elements,
      (element) => element.id === configuration.elementId,
    )
    if (!amountElement || amountElement.type === 'page') {
      console.log(
        'Form has a payment submission event but the amount element does not exist, throwing error',
      )
      throw new Error(
        'We could not find the configuration required to make a payment. Please contact your administrator to ensure your application configuration has been completed successfully.',
      )
    }

    console.log(
      'Found form element for payment submission event',
      amountElement,
    )

    return getRootElementValueById(
      amountElement.id,
      definition.elements,
      submission,
    )
  }

  console.log(
    'Form has a payment submission event but the amount configuration is missing, throwing error',
  )
  throw new Error(
    'We could not find the configuration required to make a payment. Please contact your administrator to ensure your application configuration has been completed successfully.',
  )
}

/**
 * Retrieve an array of detail items from a form submission payment.
 *
 * #### Example
 *
 * ```js
 * const detailItems =
 *   paymentService.getDisplayDetailsFromFormSubmissionPayment(
 *     formSubmissionPayment,
 *     {
 *       formatCurrency,
 *       formatDateTime,
 *       formatDate,
 *     },
 *   )
 * ```
 *
 * @param formSubmissionPayment
 * @param options
 * @returns
 */
export const getDisplayDetailsFromFormSubmissionPayment = (
  /** The form submission payment to get the details from */
  formSubmissionPayment: SubmissionTypes.FormSubmissionPayment,
  formatters: PaymentDisplayFormatters,
): PaymentDisplayDetailsResult | undefined => {
  return getPaymentProvider(formSubmissionPayment.type).getDisplayDetails(
    formSubmissionPayment,
    formatters,
  )
}

/**
 * Map a form submission payment to the Form Store payment property.
 *
 * #### Example
 *
 * ```js
 * const formStorePayment =
 *   paymentService.getFormStorePaymentFromFormSubmissionPayment(
 *     formSubmissionPayment,
 *   )
 * ```
 *
 * @param formSubmissionPayment
 * @returns
 */
export function getFormStorePaymentFromFormSubmissionPayment(
  formSubmissionPayment: SubmissionTypes.FormSubmissionPayment,
): FormStorePayment {
  return getPaymentProvider(formSubmissionPayment.type).getFormStorePayment(
    formSubmissionPayment,
  )
}
