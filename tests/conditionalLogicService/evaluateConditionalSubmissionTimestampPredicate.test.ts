import { describe, expect, test, vi } from 'vitest'
import { ConditionTypes, FormTypes } from '@oneblink/types'
import evaluateConditionalSubmissionTimestampPredicate from '../../src/conditionalLogicService/evaluateConditionalSubmissionTimestampPredicate'
import { evaluateConditionalPredicates } from '../../src/conditionalLogicService'
import { flattenFormElements } from '../../src/formElementsService'
import { AddOffsetToDate, ParseDate } from '../../src/conditionalLogicService/types'

const parseDate: ParseDate = (value) => new Date(value)

const addDaysToDate: AddOffsetToDate = (date, offset) => {
  const result = new Date(date.getTime())
  result.setUTCDate(result.getUTCDate() + offset)
  return result
}


/**
 * Treat `YYYY-MM-DD` as the start of day in America/New_York; otherwise parse
 * as an absolute instant.
 */
const parseDateInNewYork: ParseDate = (value) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    // EDT (UTC-4) for July test dates
    return new Date(`${value}T04:00:00.000Z`)
  }
  return new Date(value)
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

  const formElementsCtrl = {
    flattenedElements: flattenFormElements([dateElement]),
    model: {
      agmDate: '2026-07-01',
    }
  }

  test('BEFORE with custom date and daysOffset (exclusive)', () => {
    // AGM (2026-07-01) + 30 days = 2026-07-31
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
        parseDate,
        addDaysToDate,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T00:00:00.000Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(false)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-08-01T00:00:00.000Z',
        parseDate,
        addDaysToDate,
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
        parseDate,
        addDaysToDate: addDaysToDateSpy,
      }),
    ).toBe(true)

    expect(addDaysToDateSpy).toHaveBeenCalledTimes(1)
    expect(addDaysToDateSpy).toHaveBeenCalledWith(expect.any(Date), 0)
  })

  test('BEFORE with date element and daysOffset', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BEFORE',
      compareWith: 'ELEMENT',
      formElementId: 'agm-date-id',
      daysOffset: 30,
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-15T00:00:00.000Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-08-01T00:00:00.000Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(false)
  })

  test('date element values are parsed via injected parseDate', () => {
    // AGM 2026-07-01 + 30 days = 2026-07-31, parsed as NY start of day
    // = 2026-07-31T04:00:00.000Z
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BEFORE',
      compareWith: 'ELEMENT',
      formElementId: 'agm-date-id',
      daysOffset: 30,
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T03:00:00.000Z',
        parseDate: parseDateInNewYork,
      addDaysToDate,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T04:00:00.000Z',
        parseDate: parseDateInNewYork,
      addDaysToDate,
      }),
    ).toBe(false)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T03:00:00.000Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(false)
  })

  test('AFTER with custom date-only value uses parseDate', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'AFTER',
      compareWith: 'VALUE',
      value: '2026-07-01',
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-01T04:00:00.001Z',
        parseDate: parseDateInNewYork,
      addDaysToDate,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-01T04:00:00.000Z',
        parseDate: parseDateInNewYork,
      addDaysToDate,
      }),
    ).toBe(false)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-01T03:59:59.999Z',
        parseDate: parseDateInNewYork,
      addDaysToDate,
      }),
    ).toBe(false)
  })

  test('AFTER with full ISO timestamp', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'AFTER',
      compareWith: 'VALUE',
      value: '2026-07-01T00:00:00.000Z',
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-01T00:00:00.001Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-01T00:00:00.000Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(false)
  })

  test('AFTER with negative daysOffset', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'AFTER',
      compareWith: 'ELEMENT',
      formElementId: 'agm-date-id',
      daysOffset: -14,
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-06-18T00:00:00.000Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-06-17T00:00:00.000Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(false)
  })

  test('BETWEEN inclusive with custom dates', () => {
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

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-01T00:00:00.000Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-15T12:00:00.000Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T00:00:00.000Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-06-30T23:59:59.999Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(false)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-07-31T00:00:00.001Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(false)
  })

  test('BETWEEN with element and daysOffset', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BETWEEN',
      min: {
        compareWith: 'ELEMENT',
        formElementId: 'agm-date-id',
        daysOffset: -30,
      },
      max: {
        compareWith: 'ELEMENT',
        formElementId: 'agm-date-id',
        daysOffset: -14,
      },
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-06-10T00:00:00.000Z',
        parseDate,
        addDaysToDate,
      }),
    ).toBe(true)

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp: '2026-05-31T00:00:00.000Z',
        parseDate,
        addDaysToDate,
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
        parseDate,
        addDaysToDate,
      }),
    ).toBe(false)
  })

  test('returns false when comparison date element has no value', () => {
    const predicate: ConditionTypes.ConditionalPredicateSubmissionTimestamp = {
      type: 'SUBMISSION_TIMESTAMP',
      operator: 'BEFORE',
      compareWith: 'ELEMENT',
      formElementId: 'agm-date-id',
    }

    expect(
      evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl: {
          flattenedElements: flattenFormElements([dateElement]),
          model: {}
        },
        submissionTimestamp: '2026-07-15T00:00:00.000Z',
        parseDate,
        addDaysToDate,
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
      parseDate,
      addDaysToDate,
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
      parseDate,
      addDaysToDate,
    })
    expect(result).toBe(false)
  })
})
