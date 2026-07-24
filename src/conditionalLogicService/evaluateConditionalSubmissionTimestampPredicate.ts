import { ConditionTypes } from '@oneblink/types'
import { AddOffsetToDate, FormElementsCtrl, ParseDate } from './types.js'
import { getElementAndValue } from './evaluateFormElementConditionalPredicate.js'

function resolveDateValue(
  dateValue: ConditionTypes.ConditionalPredicateDateValue,
  formElementsCtrl: FormElementsCtrl,
  parseDate: ParseDate,
  addDaysToDate: AddOffsetToDate,
): Date | undefined {
  let dateString: string | undefined

  if (dateValue.compareWith === 'ELEMENT') {
    const elementAndValue = getElementAndValue(
      formElementsCtrl,
      dateValue.elementId,
    )
    if (typeof elementAndValue.value === 'string' && elementAndValue.value) {
      dateString = elementAndValue.value
    }
    if (!dateString) {
      return undefined
    }
  } else {
    dateString = dateValue.value
  }

  const date = parseDate(dateString)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  if (
    typeof dateValue.daysOffset !== 'number' ||
    Number.isNaN(dateValue.daysOffset)
  ) {
    return date
  }

  return addDaysToDate(date, dateValue.daysOffset)
}

/**
 * Evaluate a `SUBMISSION_TIMESTAMP` conditional predicate against the form
 * submission timestamp.
 *
 * - `AFTER` — submission timestamp is after (exclusive) the comparison date
 * - `BEFORE` — submission timestamp is before (exclusive) the comparison date
 * - `BETWEEN` — submission timestamp is between `min` and `max` (inclusive)
 *
 * Date strings are parsed via `parseDate`. Day offsets are applied via
 * `addDaysToDate(date, offset)`.
 */
export default function evaluateConditionalSubmissionTimestampPredicate({
  predicate,
  formElementsCtrl,
  submissionTimestamp,
  parseDate,
  addDaysToDate,
}: {
  predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp
  formElementsCtrl: FormElementsCtrl
  submissionTimestamp: string
  parseDate: ParseDate
  addDaysToDate: AddOffsetToDate
}): boolean {
  const submissionDate = new Date(submissionTimestamp)
  if (Number.isNaN(submissionDate.getTime())) {
    return false
  }

  const submissionTime = submissionDate.getTime()

  switch (predicate.operator) {
    case 'BETWEEN': {
      const min = resolveDateValue(
        predicate.min,
        formElementsCtrl,
        parseDate,
        addDaysToDate,
      )
      const max = resolveDateValue(
        predicate.max,
        formElementsCtrl,
        parseDate,
        addDaysToDate,
      )
      if (!min || !max) {
        return false
      }
      return submissionTime >= min.getTime() && submissionTime <= max.getTime()
    }
    default: {
      const compareDate = resolveDateValue(
        predicate,
        formElementsCtrl,
        parseDate,
        addDaysToDate,
      )
      if (!compareDate) {
        return false
      }

      switch (predicate.operator) {
        case 'AFTER':
          return submissionTime > compareDate.getTime()
        case 'BEFORE':
          return submissionTime < compareDate.getTime()
        default: {
          const n: never = predicate
          console.warn('Unhandled predicate operator', n)
          return false
        }
      }
    }
  }
}
