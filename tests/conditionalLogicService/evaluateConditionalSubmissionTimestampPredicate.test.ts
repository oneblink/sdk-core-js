import { describe, expect, test, vi } from 'vitest'
import { ConditionTypes, FormTypes } from '@oneblink/types'
import evaluateConditionalSubmissionTimestampPredicate from '../../src/conditionalLogicService/evaluateConditionalSubmissionTimestampPredicate'
import { evaluateConditionalPredicates } from '../../src/conditionalLogicService'
import { flattenFormElements } from '../../src/formElementsService'
import {
  AddOffsetToDate,
  EndOfDay,
  ParseDayOnlyDate,
  StartOfDay,
} from '../../src/conditionalLogicService/types'

const parseDayOnlyDate: ParseDayOnlyDate = (value) =>
  new Date(`${value}T00:00:00.000Z`)

const addDaysToDate: AddOffsetToDate = (date, offset) => {
  const result = new Date(date.getTime())
  result.setUTCDate(result.getUTCDate() + offset)
  return result
}

const startOfDay: StartOfDay = (date) => {
  const result = new Date(date.getTime())
  result.setUTCHours(0, 0, 0, 0)
  return result
}

const endOfDay: EndOfDay = (date) => {
  const result = new Date(date.getTime())
  result.setUTCHours(23, 59, 59, 999)
  return result
}

/** Treat `YYYY-MM-DD` as the start of day in America/New_York (EDT for July). */
const parseDayOnlyDateInNewYork: ParseDayOnlyDate = (value) =>
  new Date(`${value}T04:00:00.000Z`)

/** NY midnight is already encoded by `parseDayOnlyDateInNewYork` for July dates. */
const startOfDayInNewYork: StartOfDay = (date) => new Date(date.getTime())

/** End of NY day for July (EDT) test dates: start + 24h - 1ms. */
const endOfDayInNewYork: EndOfDay = (date) =>
  new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1)

const dateHelpers = {
  parseDayOnlyDate,
  addDaysToDate,
  startOfDay,
  endOfDay,
}

const newYorkDateHelpers = {
  parseDayOnlyDate: parseDayOnlyDateInNewYork,
  addDaysToDate,
  startOfDay: startOfDayInNewYork,
  endOfDay: endOfDayInNewYork,
}

describe('evaluateConditionalSubmissionTimestampPredicate', () => {
  const dateElement: FormTypes.FormElement = {
    id: 'agm-date-id',
    name: 'agmDate',
    label: 'AGM Date',
    type: 'date',
    required: false,
    readOnly: false,
    conditionallyShow: false,
    requiresAllConditionallyShowPredicates: false,
    isDataLookup: false,
    isElementLookup: false,
  }

  const datetimeElement: FormTypes.FormElement = {
    id: 'agm-datetime-id',
    name: 'agmDateTime',
    label: 'AGM Date Time',
    type: 'datetime',
    required: false,
    readOnly: false,
    conditionallyShow: false,
    requiresAllConditionallyShowPredicates: false,
    isDataLookup: false,
    isElementLookup: false,
  }

  const formElementsCtrl = {
    flattenedElements: flattenFormElements([dateElement]),
    model: {
      agmDate: '2026-07-01',
    },
  }

  const datetimeFormElementsCtrl = {
    flattenedElements: flattenFormElements([datetimeElement]),
    model: {
      agmDateTime: '2026-07-01T12:00:00.000Z',
    },
  }

  test('BEFORE with custom date and daysOffset uses start of day (exclusive)', () => {
    // AGM (2026-07-01) + 30 days = 2026-07-31 start of day
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BEFORE',
      compareWith: 'VALUE',
      value: '2026-07-01',
      daysOffset: 30,
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-30T12:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T00:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(false)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-08-01T00:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(false)
  })

  test('daysOffset of 0 still calls addDaysToDate', () => {
    const addDaysToDateSpy = vi.fn(addDaysToDate)
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BEFORE',
      compareWith: 'VALUE',
      value: '2026-08-01',
      daysOffset: 0,
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-15T00:00:00.000Z',
        ...dateHelpers,
        addDaysToDate: addDaysToDateSpy,
      }),
    ).toBe(true)

    expect(addDaysToDateSpy).toHaveBeenCalledTimes(1)
    expect(addDaysToDateSpy).toHaveBeenCalledWith(expect.any(Date), 0)
  })

  test('BEFORE with date element and daysOffset uses start of day', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BEFORE',
      compareWith: 'ELEMENT',
      elementId: 'agm-date-id',
      daysOffset: 30,
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-15T00:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-08-01T00:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(false)
  })

  test('date element values are parsed via injected parseDayOnlyDate with timezone start of day', () => {
    // AGM 2026-07-01 + 30 days = 2026-07-31, parsed as NY start of day
    // = 2026-07-31T04:00:00.000Z
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BEFORE',
      compareWith: 'ELEMENT',
      elementId: 'agm-date-id',
      daysOffset: 30,
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T03:00:00.000Z',
        ...newYorkDateHelpers,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T04:00:00.000Z',
        ...newYorkDateHelpers,
      }),
    ).toBe(false)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T03:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(false)
  })

  test('AFTER with date-only value uses end of day', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'AFTER',
      compareWith: 'VALUE',
      value: '2026-07-01',
    }
    const startOfDaySpy = vi.fn(startOfDay)
    const endOfDaySpy = vi.fn(endOfDay)

    // Still on 2026-07-01 — not after end of day
    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-01T12:00:00.000Z',
        ...dateHelpers,
        startOfDay: startOfDaySpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(false)

    // Exactly end of day — exclusive, so false
    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-01T23:59:59.999Z',
        ...dateHelpers,
        startOfDay: startOfDaySpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(false)

    // After end of day
    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-02T00:00:00.000Z',
        ...dateHelpers,
        startOfDay: startOfDaySpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(true)

    expect(endOfDaySpy).toHaveBeenCalled()
    expect(startOfDaySpy).not.toHaveBeenCalled()
  })

  test('AFTER with date element uses end of day in organisation timezone', () => {
    // 2026-07-01 NY end of day = 2026-07-02T03:59:59.999Z
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'AFTER',
      compareWith: 'ELEMENT',
      elementId: 'agm-date-id',
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-02T03:59:59.999Z',
        ...newYorkDateHelpers,
      }),
    ).toBe(false)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-02T04:00:00.000Z',
        ...newYorkDateHelpers,
      }),
    ).toBe(true)
  })

  test('AFTER with full ISO timestamp compares exact instant', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'AFTER',
      compareWith: 'VALUE',
      value: '2026-07-01T00:00:00.000Z',
    }
    const parseDayOnlyDateSpy = vi.fn(parseDayOnlyDate)
    const endOfDaySpy = vi.fn(endOfDay)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-01T00:00:00.001Z',
        ...dateHelpers,
        parseDayOnlyDate: parseDayOnlyDateSpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-01T00:00:00.000Z',
        ...dateHelpers,
        parseDayOnlyDate: parseDayOnlyDateSpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(false)

    expect(parseDayOnlyDateSpy).not.toHaveBeenCalled()
    expect(endOfDaySpy).not.toHaveBeenCalled()
  })

  test('AFTER with datetime element compares exact instant', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'AFTER',
      compareWith: 'ELEMENT',
      elementId: 'agm-datetime-id',
    }
    const endOfDaySpy = vi.fn(endOfDay)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl: datetimeFormElementsCtrl,
        submissionTimestamp: '2026-07-01T12:00:00.001Z',
        ...dateHelpers,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl: datetimeFormElementsCtrl,
        submissionTimestamp: '2026-07-01T12:00:00.000Z',
        ...dateHelpers,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(false)

    expect(endOfDaySpy).not.toHaveBeenCalled()
  })

  test('AFTER with negative daysOffset uses end of day for date element', () => {
    // 2026-07-01 - 14 days = 2026-06-17 end of day
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'AFTER',
      compareWith: 'ELEMENT',
      elementId: 'agm-date-id',
      daysOffset: -14,
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-06-17T12:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(false)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-06-18T00:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(true)
  })

  test('BETWEEN inclusive uses start of min day and end of max day for date-only values', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BETWEEN',
      min: {
        compareWith: 'VALUE',
        value: '2026-07-01',
      },
      max: {
        compareWith: 'VALUE',
        value: '2026-07-31',
      },
    }
    const startOfDaySpy = vi.fn(startOfDay)
    const endOfDaySpy = vi.fn(endOfDay)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-01T00:00:00.000Z',
        ...dateHelpers,
        startOfDay: startOfDaySpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-15T12:00:00.000Z',
        ...dateHelpers,
        startOfDay: startOfDaySpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T23:59:59.999Z',
        ...dateHelpers,
        startOfDay: startOfDaySpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-06-30T23:59:59.999Z',
        ...dateHelpers,
        startOfDay: startOfDaySpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(false)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-08-01T00:00:00.000Z',
        ...dateHelpers,
        startOfDay: startOfDaySpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(false)

    expect(startOfDaySpy).toHaveBeenCalled()
    expect(endOfDaySpy).toHaveBeenCalled()
  })

  test('BETWEEN with datetime ISO bounds compares exact instants', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BETWEEN',
      min: {
        compareWith: 'VALUE',
        value: '2026-07-01T00:00:00.000Z',
      },
      max: {
        compareWith: 'VALUE',
        value: '2026-07-31T00:00:00.000Z',
      },
    }
    const startOfDaySpy = vi.fn(startOfDay)
    const endOfDaySpy = vi.fn(endOfDay)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T00:00:00.000Z',
        ...dateHelpers,
        startOfDay: startOfDaySpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T00:00:00.001Z',
        ...dateHelpers,
        startOfDay: startOfDaySpy,
        endOfDay: endOfDaySpy,
      }),
    ).toBe(false)

    expect(startOfDaySpy).not.toHaveBeenCalled()
    expect(endOfDaySpy).not.toHaveBeenCalled()
  })

  test('BETWEEN with element and daysOffset uses day boundaries', () => {
    // min: 2026-07-01 - 30 = 2026-06-01 start
    // max: 2026-07-01 - 14 = 2026-06-17 end
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BETWEEN',
      min: {
        compareWith: 'ELEMENT',
        elementId: 'agm-date-id',
        daysOffset: -30,
      },
      max: {
        compareWith: 'ELEMENT',
        elementId: 'agm-date-id',
        daysOffset: -14,
      },
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-06-10T00:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-06-17T23:59:59.999Z',
        ...dateHelpers,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-06-18T00:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(false)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-05-31T00:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(false)
  })

  test('returns false when submissionTimestamp is invalid', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BEFORE',
      compareWith: 'VALUE',
      value: '2026-07-01',
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: 'not-a-date',
        ...dateHelpers,
      }),
    ).toBe(false)
  })

  test('returns false when comparison date element has no value', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BEFORE',
      compareWith: 'ELEMENT',
      elementId: 'agm-date-id',
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl: {
          flattenedElements: flattenFormElements([dateElement]),
          model: {},
        },
        submissionTimestamp: '2026-07-15T00:00:00.000Z',
        ...dateHelpers,
      }),
    ).toBe(false)
  })
})

describe('evaluateConditionalPredicates SUBMISSION_TIMESTAMP', () => {
  test('evaluates SUBMISSION_TIMESTAMP predicates with submissionTimestamp', () => {
    const result = evaluateConditionalPredicates({
      isConditional: true,
      requiresAllConditionalPredicates: false,
      conditionalPredicates: [
        {
          type: 'SUBMISSION_TIMESTAMP',
          operator: 'BEFORE',
          compareWith: 'VALUE',
          value: '2026-07-01',
          daysOffset: 30,
        },
      ],
      formElements: [],
      submission: {},
      submissionTimestamp: '2026-07-15T00:00:00.000Z',
      ...dateHelpers,
    })
    expect(result).toBe(true)
  })

  test('fails SUBMISSION_TIMESTAMP predicates with invalid submissionTimestamp', () => {
    const result = evaluateConditionalPredicates({
      isConditional: true,
      requiresAllConditionalPredicates: false,
      conditionalPredicates: [
        {
          type: 'SUBMISSION_TIMESTAMP',
          operator: 'BEFORE',
          compareWith: 'VALUE',
          value: '2026-08-01',
        },
      ],
      formElements: [],
      submission: {},
      submissionTimestamp: 'not-a-date',
      ...dateHelpers,
    })
    expect(result).toBe(false)
  })
})
