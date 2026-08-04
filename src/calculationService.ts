import morphExpressions from 'morph-expressions'
// morph-expressions is CommonJS and assigns `exports.default`, which Node's ESM
// interop exposes as the whole `module.exports` rather than the constructor.
const ExpressionParser =
  (morphExpressions as unknown as { default?: typeof morphExpressions })
    .default ?? morphExpressions
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import {
  findFormElement,
  flattenFormElements,
  matchElementsTagRegex,
} from './formElementsService.js'
import {
  DATE_ONLY_PATTERN,
  type ParseDayOnlyDate,
} from './conditionalLogicService/types.js'

export type { ParseDayOnlyDate } from './conditionalLogicService/types.js'

export type EvaluateExpressionResult =
  | { type: 'RESULT'; value: number }
  | { type: 'MISSING_VALUES' }
  | { type: 'INVALID_EXPRESSION'; error: Error }

const isUnenteredValue = (value: unknown | undefined) => {
  return !value && value !== 0
}

const isObjectWithValue = (obj: unknown): obj is { value: unknown } => {
  return typeof obj === 'object' && obj !== null && 'value' in obj
}

/**
 * Escape special RegExp characters in a string so it can be used as a literal
 * pattern.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Workaround for `.toFixed()` not rounding floating point numbers correctly.
 */
function roundToFixed(number: number, decimals: number) {
  const multiplier = Math.pow(10, decimals)
  const roundedNumber = Math.round(number * multiplier) / multiplier
  return roundedNumber.toFixed(decimals)
}

function findFormElementByNamePath(
  formElements: FormTypes.FormElement[],
  elementName: string,
): FormTypes.FormElement | undefined {
  const parts = elementName.split('|')
  let searchElements = formElements
  let found: FormTypes.FormElement | undefined

  for (let i = 0; i < parts.length; i++) {
    const name = parts[i]
    // Match flattenFormElements: page/section are transparent for naming, but
    // form/repeatableSet/infoPage require an explicit parent path segment.
    found = flattenFormElements(searchElements).find(
      (element) => 'name' in element && element.name === name,
    )
    if (!found) {
      return
    }

    if (i < parts.length - 1) {
      if (!('elements' in found) || !found.elements) {
        return
      }
      searchElements = found.elements
    }
  }

  return found
}

/**
 * Find `{ELEMENT:...}` references in an expression whose name paths do not
 * exist in the form definition.
 *
 * Intended for server-side payment validation. Skip this on the client during
 * interactive calculation evaluation — it walks the form definition for every
 * referenced element and is unnecessary for display.
 *
 * @returns Missing element name paths (e.g. `Amount` or `Items|Amount`), or an
 *   empty array when every referenced element exists.
 */
export function findMissingFormElementsInExpression({
  expression,
  formElements,
}: {
  expression: string
  formElements: FormTypes.FormElement[]
}): string[] {
  if (!expression) {
    return []
  }

  const elementNames: string[] = []
  matchElementsTagRegex(expression, ({ elementName }) => {
    elementNames.push(elementName)
  })

  const missingFormElementNames: string[] = []
  const seen = new Set<string>()
  for (const elementName of elementNames) {
    if (seen.has(elementName)) {
      continue
    }
    seen.add(elementName)
    if (!findFormElementByNamePath(formElements, elementName)) {
      missingFormElementNames.push(elementName)
    }
  }
  return missingFormElementNames
}

function resolveElementValue({
  submission,
  nestedElementNames,
  formElements,
  parseDayOnlyDate,
}: {
  submission: SubmissionTypes.S3SubmissionData['submission']
  nestedElementNames: string[]
  formElements: FormTypes.FormElement[]
  parseDayOnlyDate: ParseDayOnlyDate
}): unknown {
  const defaultAccumulator = submission[nestedElementNames[0]]
  return nestedElementNames.reduce(
    (elementValue: unknown | undefined, elementName: string, index: number) => {
      // Numbers can just be returned as is
      if (typeof elementValue === 'number') {
        return elementValue
      }

      // Attempt to get a number from the element value as a string.
      // NaN is accounted for in the calculation so we can return that from here.
      if (typeof elementValue === 'string') {
        // Day-only (`YYYY-MM-DD`) strings are parsed via parseDayOnlyDate so
        // callers control timezone. Other date strings use `new Date(value)`.
        // Numeric strings (e.g. `"10"`) fall through to parseFloat — `Date`
        // can otherwise treat them as valid dates.
        const isDayOnly = DATE_ONLY_PATTERN.test(elementValue)
        if (isDayOnly) {
          const parsedDate = parseDayOnlyDate(elementValue)
          if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate.getTime()
          }
        } else if (Number.isNaN(Number(elementValue))) {
          const parsedDate = new Date(elementValue)
          if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate.getTime()
          }
        }

        return parseFloat(elementValue)
      }

      if (Array.isArray(elementValue)) {
        // If there are no entries, return NaN to prevent the calculation from
        // running.
        if (!elementValue.length) {
          return NaN
        }

        // An array could be an element that allows multiple values e.g.
        // checkboxes. If that is the case, add them all together and move on.
        const elementValues = elementValue.map((entry) => parseFloat(entry))
        if (elementValues.every((entry) => !Number.isNaN(entry))) {
          return elementValues.reduce((number, entry) => number + entry, 0)
        }

        // Otherwise attempt to process it as a repeatable set. If we found
        // another repeatable set to process, pass it to the next element name
        // to iterate over the entries. If we are processing the entries in a
        // repeatable set, we can sum the number elements in the entries.
        const nextElementName = nestedElementNames[index + 1]

        let isNestedRepeatableSet = false
        const nestedElementValues = elementValue.reduce(
          (nestedElementValues, entry) => {
            if (entry) {
              const nextElementValue = entry[nextElementName]
              if (Array.isArray(nextElementValue)) {
                if (nextElementValue.length) {
                  nestedElementValues.push(...nextElementValue)
                  isNestedRepeatableSet = true
                }
              } else {
                nestedElementValues.push(nextElementValue)
              }
            }
            return nestedElementValues
          },
          [] as unknown[],
        )

        // If the nested element values are all arrays, pass them on to the
        // next iteration.
        if (isNestedRepeatableSet) {
          return nestedElementValues
        }

        return nestedElementValues.reduce(
          (total: number, nestedElementValue: unknown | undefined) => {
            if (Number.isNaN(total)) {
              return NaN
            }
            const value = parseFloat(nestedElementValue as string)
            if (Number.isNaN(value)) {
              return NaN
            }
            return total + value
          },
          0,
        )
      }

      // If the value is an object, take the element name and check to see if
      // this element is a nested form element. If so, take the next nested
      // element name, find its value in the object and return it for the next
      // iteration to handle.
      if (typeof elementValue === 'object') {
        const formFormElement = findFormElement(
          formElements,
          (e) => e.type === 'form' && e.name === nestedElementNames[index],
        )
        const nextElementName = nestedElementNames[index + 1]
        if (formFormElement && nextElementName) {
          return (elementValue as Record<string, unknown>)[nextElementName]
        }
      }

      // "compliance" form element has an object value with a "value" property.
      if (
        isObjectWithValue(elementValue) &&
        typeof elementValue.value === 'string'
      ) {
        return parseFloat(elementValue.value)
      }

      // We did not find a number value from the known elements, assume we are
      // at the end of the line.
      return NaN
    },
    defaultAccumulator,
  )
}

/**
 * Evaluate a OneBlink calculation expression against form submission data.
 *
 * Day-only (`YYYY-MM-DD`) date parsing is injected via `parseDayOnlyDate` so
 * callers control timezone-aware behaviour (client vs server), matching the
 * pattern used by `conditionalLogicService`. Other date strings use
 * `new Date(value)`.
 *
 * #### Expression syntax
 *
 * Expressions are mathematical / logical formulas. Form element values are
 * referenced with `{ELEMENT:<elementName>}` tags (including nested paths via
 * `|`, e.g. `{ELEMENT:Children|Age}`).
 *
 * ##### Literals
 *
 * - **Numbers** — e.g. `0`, `5`, `5.4`
 * - **Strings** — single or double quoted, e.g. `"abc"`, `'abc'`
 * - **Booleans** — `true`, `false`
 *
 * ##### Arithmetic operators
 *
 * | Operator | Description                          | Example        |
 * | -------- | ------------------------------------ | -------------- |
 * | `+`      | Addition (also unary plus)           | `1 + 2` → `3`  |
 * | `-`      | Subtraction (also unary minus)       | `1 - 2` → `-1` |
 * | `*`      | Multiplication                       | `4 * 2` → `8`  |
 * | `/`      | Division                             | `4 / 2` → `2`  |
 * | `%`      | Remainder                            | `8 % 3` → `2`  |
 * | `++`     | Unary increment                      | `++2` → `3`    |
 * | `--`     | Unary decrement                      | `--2` → `1`    |
 *
 * Standard operator precedence applies. Use parentheses to override it, e.g.
 * `3 * (2 + 1)` → `9`.
 *
 * ##### Comparison operators
 *
 * | Operator | Description           | Example             |
 * | -------- | --------------------- | ------------------- |
 * | `==`     | Equal                 | `2 == 2` → `true`   |
 * | `!=`     | Not equal             | `2 != 3` → `true`   |
 * | `>`      | Greater than          | `2 > 1` → `true`    |
 * | `>=`     | Greater than or equal | `2 >= 2` → `true`   |
 * | `<`      | Less than             | `2 < 3` → `true`    |
 * | `<=`     | Less than or equal    | `2 <= 2` → `true`   |
 *
 * ##### Logical operators
 *
 * | Operator | Description                          | Example                    |
 * | -------- | ------------------------------------ | -------------------------- |
 * | `&&`     | Logical AND (returns last operand)   | `true && false` → `false`  |
 * | `\|\|`   | Logical OR (returns first truthy)    | `false \|\| true` → `true` |
 * | `!`      | Logical NOT                          | `!false` → `true`          |
 *
 * ##### Element references
 *
 * - `{ELEMENT:Number}` — value of the root element named `Number`
 * - `{ELEMENT:Set\|Child}` — value of `Child` within repeatable set / nested
 *   form element `Set`
 * - Nested paths may include multiple segments:
 *   `{ELEMENT:Parents\|Children\|Age}`
 *
 * How values are coerced for evaluation:
 *
 * - Numbers are used as-is
 * - Day-only (`YYYY-MM-DD`) strings are parsed via `parseDayOnlyDate`; other
 *   non-numeric date strings use `new Date(value)`. Valid dates use
 *   `Date#getTime()`, otherwise the string is parsed as a float via
 *   `parseFloat`
 * - Arrays of numeric strings (e.g. checkboxes) are summed
 * - Repeatable set entries sum the referenced nested numeric values
 * - Empty arrays yield `NaN` (result type `MISSING_VALUES`)
 * - Compliance element objects use their `value` property
 *
 * ##### Built-in functions
 *
 * | Function                         | Description                                                                 | Example                         |
 * | -------------------------------- | --------------------------------------------------------------------------- | ------------------------------- |
 * | `ROUND(value, precision)`        | Round `value` to `precision` decimal places (correct floating-point rounds) | `ROUND(1.255, 2)` → `1.26`      |
 * | `ROUND_DOWN(value)`              | Round down to the nearest integer (`Math.floor`)                            | `ROUND_DOWN(1.9)` → `1`         |
 * | `ROUND_UP(value)`                | Round up to the nearest integer (`Math.ceil`)                               | `ROUND_UP(1.1)` → `2`           |
 * | `ISNULL(value, defaultValue)`    | If `value` is unentered (`null`/`undefined`/`""`), return `defaultValue` or `0`; otherwise return `value` | `ISNULL({ELEMENT:A}, 10)` |
 *
 * `ROUND`, `ROUND_DOWN`, and `ROUND_UP` return `null` when `value` is `NaN` or
 * not finite.
 *
 * ##### Examples
 *
 * ```js
 * const result = calculationService.evaluateExpression({
 *   expression: '{ELEMENT:Quantity} * {ELEMENT:Price}',
 *   submission: { Quantity: 3, Price: 12.5 },
 *   formElements: form.elements,
 *   // Client: local timezone. Server: organisation timezone.
 *   parseDayOnlyDate: (value) => new Date(`${value}T00:00:00.000Z`),
 * })
 * // result === { type: 'RESULT', value: 37.5 }
 * ```
 *
 * ```js
 * calculationService.evaluateExpression({
 *   expression: 'ROUND({ELEMENT:Amount} * 1.1, 2)',
 *   submission: { Amount: 100 },
 *   formElements: form.elements,
 *   parseDayOnlyDate: (value) => new Date(`${value}T00:00:00.000Z`),
 * })
 * // { type: 'RESULT', value: 110 }
 * ```
 *
 * ```js
 * calculationService.evaluateExpression({
 *   expression: 'ISNULL({ELEMENT:Optional}, 0) + {ELEMENT:Required}',
 *   submission: { Required: 5 },
 *   formElements: form.elements,
 *   parseDayOnlyDate: (value) => new Date(`${value}T00:00:00.000Z`),
 * })
 * // { type: 'RESULT', value: 5 }
 * ```
 *
 * @param options
 * @returns A discriminated result describing the outcome of evaluation. Empty
 *   expressions and parse failures return
 *   `{ type: 'INVALID_EXPRESSION', error }`. Unexpected runtime errors are
 *   rethrown.
 */
export function evaluateExpression({
  expression,
  submission,
  formElements,
  parseDayOnlyDate,
}: {
  /** The calculation expression string to evaluate */
  expression: string
  /** Form submission data used to resolve `{ELEMENT:...}` references */
  submission: SubmissionTypes.S3SubmissionData['submission']
  /**
   * Form elements definition. Used to resolve nested `form` element values
   * referenced in the expression and to validate `{ELEMENT:...}` references.
   */
  formElements: FormTypes.FormElement[]
  /**
   * Parse `YYYY-MM-DD` strings when resolving date element values. sdk-core
   * only calls this for day-only values; other date strings use
   * `new Date(value)`.
   */
  parseDayOnlyDate: ParseDayOnlyDate
}): EvaluateExpressionResult {
  if (!expression) {
    return {
      type: 'INVALID_EXPRESSION',
      error: new Error('Expression is required.'),
    }
  }

  const elementNames: string[] = []
  matchElementsTagRegex(expression, ({ elementName }) => {
    elementNames.push(elementName)
  })

  const exprParser = new ExpressionParser<
    SubmissionTypes.S3SubmissionData['submission']
  >()
  exprParser.registerFunction('ROUND', (value: number, precision: number) => {
    if (!Number.isNaN(value) && Number.isFinite(value)) {
      return parseFloat(roundToFixed(value, precision))
    }
    return null
  })
  exprParser.registerFunction('ROUND_DOWN', (value: number) => {
    if (!Number.isNaN(value) && Number.isFinite(value)) {
      return Math.floor(value)
    }
    return null
  })
  exprParser.registerFunction('ROUND_UP', (value: number) => {
    if (!Number.isNaN(value) && Number.isFinite(value)) {
      return Math.ceil(value)
    }
    return null
  })
  exprParser.registerFunction(
    'ISNULL',
    (value: unknown | undefined, defaultValue: number) => {
      if (isUnenteredValue(value)) {
        return defaultValue || 0
      }
      return value
    },
  )

  const code = elementNames.reduce((code, elementName, index) => {
    const regex = new RegExp(escapeRegExp(`{ELEMENT:${elementName}}`), 'g')
    const replacement = `a${index}`
    exprParser.registerProperty(
      replacement,
      (submissionScope: SubmissionTypes.S3SubmissionData['submission']) =>
        resolveElementValue({
          submission: submissionScope,
          nestedElementNames: elementName.split('|'),
          formElements,
          parseDayOnlyDate,
        }),
    )
    return code.replace(regex, replacement)
  }, expression)

  let parsed
  try {
    parsed = exprParser.parse(code.trim())
  } catch (error) {
    return {
      type: 'INVALID_EXPRESSION',
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }

  const result = parsed.eval(submission)
  // Match historical behaviour: any non-NaN number (including Infinity) is a
  // usable calculation result for display.
  if (typeof result === 'number' && !Number.isNaN(result)) {
    return { type: 'RESULT', value: result }
  }

  // Successfully parsed expressions that do not yield a number (e.g. `true`,
  // non-numeric element values) previously returned `undefined` with no error
  // in the form UI. Treat them the same as missing submission values.
  return { type: 'MISSING_VALUES' }
}
