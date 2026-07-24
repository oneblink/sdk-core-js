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
      dateValue.formElementId,
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

  if (predicate.operator === 'BETWEEN') {
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

  const compareDate = resolveDateValue(
    predicate,
    formElementsCtrl,
    parseDate,
    addDaysToDate,
  )
  if (!compareDate) {
    return false
  }

  if (predicate.operator === 'AFTER') {
    return submissionTime > compareDate.getTime()
  }

  return submissionTime < compareDate.getTime()
}
