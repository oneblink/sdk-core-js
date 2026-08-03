import { ConditionTypes } from '@oneblink/types'
import {
  AddOffsetToDate,
  DATE_ONLY_PATTERN,
  EndOfDay,
  FormElementsCtrl,
  ParseDayOnlyDate,
  StartOfDay,
} from './types.js'
import { getElementAndValue } from './evaluateFormElementConditionalPredicate.js'

type DayBoundary = 'start' | 'end'

function resolveDateValue(
  dateValue: ConditionTypes.ConditionalPredicateDateValue,
  formElementsCtrl: FormElementsCtrl,
  parseDayOnlyDate: ParseDayOnlyDate,
  addDaysToDate: AddOffsetToDate,
  startOfDay: StartOfDay,
  endOfDay: EndOfDay,
  dayBoundary: DayBoundary,
): Date | undefined {
  let dateString: string | undefined

  if (dateValue.compareWith === 'ELEMENT') {
    const elementAndValue = getElementAndValue(
      formElementsCtrl,
      dateValue.elementId,
    )
    if (typeof elementAndValue.value === 'string' && elementAndValue.value) {
      dateString = elementAndValue.value
    } else {
      return undefined
    }
  } else {
    dateString = dateValue.value
  }

  const isDayOnly = DATE_ONLY_PATTERN.test(dateString)
  const date = isDayOnly ? parseDayOnlyDate(dateString) : new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  const dateWithOffset =
    typeof dateValue.daysOffset !== 'number' ||
    Number.isNaN(dateValue.daysOffset)
      ? date
      : addDaysToDate(date, dateValue.daysOffset)

  if (isDayOnly) {
    if (dayBoundary === 'start') {
      return startOfDay(dateWithOffset)
    } else {
      return endOfDay(dateWithOffset)
    }
  }

  return dateWithOffset
}

/**
 * Evaluate a `SUBMISSION_TIMESTAMP` conditional predicate against the form
 * submission timestamp.
 *
 * - `AFTER` — submission timestamp is after (exclusive) the comparison date
 * - `BEFORE` — submission timestamp is before (exclusive) the comparison date
 * - `BETWEEN` — submission timestamp is between `min` and `max` (inclusive)
 *
 * When the comparison value is a day-only (`YYYY-MM-DD`) string, day
 * boundaries are applied via the injected helpers:
 *
 * - `AFTER` — end of the comparison day
 * - `BEFORE` — start of the comparison day
 * - `BETWEEN` — start of `min` day through end of `max` day
 *
 * Full ISO datetime values compare at the exact instant.
 *
 * Day-only (`YYYY-MM-DD`) strings are parsed via `parseDayOnlyDate`. Other
 * date strings use `new Date(value)`. Day offsets are applied via
 * `addDaysToDate(date, offset)`.
 */
export default function evaluateConditionalSubmissionTimestampPredicate({
  predicate,
  formElementsCtrl,
  submissionTimestamp,
  parseDayOnlyDate,
  addDaysToDate,
  startOfDay,
  endOfDay,
}: {
  predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp
  formElementsCtrl: FormElementsCtrl
  submissionTimestamp: string
  parseDayOnlyDate: ParseDayOnlyDate
  addDaysToDate: AddOffsetToDate
  startOfDay: StartOfDay
  endOfDay: EndOfDay
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
        parseDayOnlyDate,
        addDaysToDate,
        startOfDay,
        endOfDay,
        'start',
      )
      const max = resolveDateValue(
        predicate.max,
        formElementsCtrl,
        parseDayOnlyDate,
        addDaysToDate,
        startOfDay,
        endOfDay,
        'end',
      )
      if (!min || !max) {
        return false
      }
      return submissionTime >= min.getTime() && submissionTime <= max.getTime()
    }
    default: {
      const dayBoundary: DayBoundary =
        predicate.operator === 'AFTER' ? 'end' : 'start'
      const compareDate = resolveDateValue(
        predicate,
        formElementsCtrl,
        parseDayOnlyDate,
        addDaysToDate,
        startOfDay,
        endOfDay,
        dayBoundary,
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
