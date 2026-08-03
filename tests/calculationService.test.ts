import { describe, expect, test, vi } from 'vitest'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import {
  evaluateExpression,
  ParseDayOnlyDate,
} from '../src/calculationService'

const parseDayOnlyDate: ParseDayOnlyDate = (value) =>
  new Date(`${value}T00:00:00.000Z`)

const createNumberElement = (name: string): FormTypes.NumberElement => ({
  id: name,
  name,
  type: 'number',
  conditionallyShow: false,
  isDataLookup: false,
  isElementLookup: false,
  label: name,
  readOnly: false,
  required: false,
  requiresAllConditionallyShowPredicates: false,
  isSlider: false,
})

describe('evaluateExpression()', () => {
  test('evaluates a simple arithmetic expression', () => {
    const result = evaluateExpression({
      expression: '1 + 2 * 3',
      submission: {},
      formElements: [],
      parseDayOnlyDate,
    })
    expect(result).toBe(7)
  })

  test('resolves {ELEMENT:...} references from submission', () => {
    const result = evaluateExpression({
      expression: '{ELEMENT:Quantity} * {ELEMENT:Price}',
      submission: {
        Quantity: 3,
        Price: 12.5,
      },
      formElements: [
        createNumberElement('Quantity'),
        createNumberElement('Price'),
      ],
      parseDayOnlyDate,
    })
    expect(result).toBe(37.5)
  })

  test('ROUND rounds floating point numbers correctly', () => {
    const result = evaluateExpression({
      expression: 'ROUND({ELEMENT:Amount} * 1.1, 2)',
      submission: { Amount: 100 },
      formElements: [createNumberElement('Amount')],
      parseDayOnlyDate,
    })
    expect(result).toBe(110)
  })

  test('ROUND_DOWN and ROUND_UP', () => {
    expect(
      evaluateExpression({
        expression: 'ROUND_DOWN(1.9)',
        submission: {},
        formElements: [],
        parseDayOnlyDate,
      }),
    ).toBe(1)

    expect(
      evaluateExpression({
        expression: 'ROUND_UP(1.1)',
        submission: {},
        formElements: [],
        parseDayOnlyDate,
      }),
    ).toBe(2)
  })

  test('ISNULL returns default for unentered values', () => {
    const result = evaluateExpression({
      expression: 'ISNULL({ELEMENT:Optional}, 10) + {ELEMENT:Required}',
      submission: {
        Required: 5,
      } as SubmissionTypes.S3SubmissionData['submission'],
      formElements: [
        createNumberElement('Optional'),
        createNumberElement('Required'),
      ],
      parseDayOnlyDate,
    })
    expect(result).toBe(15)
  })

  test('parses day-only dates via injected parseDayOnlyDate as timestamps', () => {
    const parseDayOnlyDateSpy = vi.fn(parseDayOnlyDate)
    const result = evaluateExpression({
      expression: '{ELEMENT:End} - {ELEMENT:Start}',
      submission: {
        Start: '2024-01-01',
        End: '2024-01-02',
      },
      formElements: [],
      parseDayOnlyDate: parseDayOnlyDateSpy,
    })

    expect(parseDayOnlyDateSpy).toHaveBeenCalledWith('2024-01-01')
    expect(parseDayOnlyDateSpy).toHaveBeenCalledWith('2024-01-02')
    expect(result).toBe(24 * 60 * 60 * 1000)
  })

  test('parses ISO datetime strings with new Date without calling parseDayOnlyDate', () => {
    const parseDayOnlyDateSpy = vi.fn(parseDayOnlyDate)
    const start = '2024-01-01T00:00:00.000Z'
    const end = '2024-01-02T00:00:00.000Z'
    const result = evaluateExpression({
      expression: '{ELEMENT:End} - {ELEMENT:Start}',
      submission: {
        Start: start,
        End: end,
      },
      formElements: [],
      parseDayOnlyDate: parseDayOnlyDateSpy,
    })

    expect(parseDayOnlyDateSpy).not.toHaveBeenCalled()
    expect(result).toBe(24 * 60 * 60 * 1000)
  })

  test('falls back to parseFloat when value is not a date', () => {
    const result = evaluateExpression({
      expression: '{ELEMENT:A} + {ELEMENT:B}',
      submission: {
        A: '10',
        B: '2.5',
      },
      formElements: [],
      parseDayOnlyDate,
    })
    expect(result).toBe(12.5)
  })

  test('sums checkbox-style numeric arrays', () => {
    const result = evaluateExpression({
      expression: '{ELEMENT:Options}',
      submission: {
        Options: ['1', '2', '3'],
      },
      formElements: [],
      parseDayOnlyDate,
    })
    expect(result).toBe(6)
  })

  test('sums values across repeatable set entries', () => {
    const result = evaluateExpression({
      expression: '{ELEMENT:Items|Amount}',
      submission: {
        Items: [{ Amount: 10 }, { Amount: 15 }, { Amount: 5 }],
      },
      formElements: [],
      parseDayOnlyDate,
    })
    expect(result).toBe(30)
  })

  test('resolves nested form element values', () => {
    const formElements: FormTypes.FormElement[] = [
      {
        id: 'nested-form',
        name: 'Nested',
        type: 'form',
        formId: 1,
        conditionallyShow: false,
        requiresAllConditionallyShowPredicates: false,
        elements: [createNumberElement('Child')],
      },
    ]
    const result = evaluateExpression({
      expression: '{ELEMENT:Nested|Child}',
      submission: {
        Nested: {
          Child: 42,
        },
      },
      formElements,
      parseDayOnlyDate,
    })
    expect(result).toBe(42)
  })

  test('parses compliance element value property', () => {
    const result = evaluateExpression({
      expression: '{ELEMENT:Compliance}',
      submission: {
        Compliance: {
          value: '7',
        },
      },
      formElements: [],
      parseDayOnlyDate,
    })
    expect(result).toBe(7)
  })

  test('throws for invalid expressions', () => {
    expect(() =>
      evaluateExpression({
        expression: '1 +',
        submission: {},
        formElements: [],
        parseDayOnlyDate,
      }),
    ).toThrow()
  })

  test('throws for empty expressions', () => {
    expect(() =>
      evaluateExpression({
        expression: '',
        submission: {},
        formElements: [],
        parseDayOnlyDate,
      }),
    ).toThrow('Expression is required.')
  })

  test('returns undefined when result is not a number', () => {
    const result = evaluateExpression({
      expression: 'true',
      submission: {},
      formElements: [],
      parseDayOnlyDate,
    })
    expect(result).toBeUndefined()
  })

  test('returns undefined when referenced element has no numeric value', () => {
    const result = evaluateExpression({
      expression: '{ELEMENT:Missing}',
      submission: {},
      formElements: [],
      parseDayOnlyDate,
    })
    expect(result).toBeUndefined()
  })
})
