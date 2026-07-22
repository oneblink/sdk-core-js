import { ConditionTypes } from '@oneblink/types'
import { typeCastService } from '../index.js'
import {
  AddOffsetToDate,
  FormElementsCtrl,
  ParseDate,
} from './types.js'

function getElementValue(
  formElementsCtrl: FormElementsCtrl,
  elementId: string,
): string | undefined {
  const formElement = formElementsCtrl.flattenedElements.find(
    (element) => element.id === elementId,
  )
  if (formElement) {
    const formElementWithName =
      typeCastService.formElements.toNamedElement(formElement)
    if (formElementWithName) {
      const value = formElementsCtrl.model?.[formElementWithName.name]
      return typeof value === 'string' && value ? value : undefined
    }
  } else if (formElementsCtrl.parentFormElementsCtrl) {
    return getElementValue(
      formElementsCtrl.parentFormElementsCtrl,
      elementId,
    )
  }
  return undefined
}

function resolveDateValue(
  dateValue: ConditionTypes.ConditionalPredicateDateValue,
  formElementsCtrl: FormElementsCtrl,
  parseDate: ParseDate,
  addDaysToDate: AddOffsetToDate,
): Date | undefined {
  let dateString: string | undefined

  if (dateValue.compareWith === 'ELEMENT') {
    dateString = getElementValue(formElementsCtrl, dateValue.formElementId)
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

  if (!dateValue.daysOffset) {
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
