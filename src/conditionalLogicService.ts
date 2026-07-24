import evaluateFormElementConditionalPredicate from './conditionalLogicService/evaluateFormElementConditionalPredicate.js'
import evaluateConditionalSubmissionTimestampPredicate from './conditionalLogicService/evaluateConditionalSubmissionTimestampPredicate.js'
import { flattenFormElements } from './formElementsService.js'
import { ConditionTypes, FormTypes, SubmissionTypes } from '@oneblink/types'
import { AddOffsetToDate, ParseDate } from './conditionalLogicService/types.js'

export * from './conditionalLogicService/generateFormElementsConditionallyShown.js'
export type { AddOffsetToDate, ParseDate } from './conditionalLogicService/types.js'

/**
 * Given a set of form elements and submission data, evaluate if predicates are
 * met or not.
 *
 * #### Example
 *
 * ```js
 * const evaluation = conditionalLogicService.evaluateConditionalPredicates(
 *   {
 *     isConditional: true,
 *     requiresAllConditionalPredicates: false,
 *     conditionalPredicates: [
 *       {
 *         type: 'OPTIONS',
 *         elementId: '3534abe4-b0b5-4ffa-a216-49c223ab6f95',
 *         optionIds: ['9ce633dd-22d6-4e0e-a9e0-1aa62d435e72'],
 *       },
 *     ],
 *     submission: {
 *       checkboxes: ['a'],
 *     },
 *     formElements: [
 *       {
 *         name: 'checkboxes',
 *         label: 'Checkboxes',
 *         type: 'checkboxes',
 *         required: false,
 *         id: '3534abe4-b0b5-4ffa-a216-49c223ab6f95',
 *         options: [
 *           {
 *             id: '9ce633dd-22d6-4e0e-a9e0-1aa62d435e72',
 *             label: 'First',
 *             value: 'a',
 *           },
 *           {
 *             id: '5850b32c-3833-4498-a072-47fcc8122242',
 *             label: 'Second',
 *             value: 'b',
 *           },
 *           {
 *             id: 'ab363e9f-a63f-4923-ba0d-47892fc26a93',
 *             label: 'Third',
 *             value: 'c',
 *           },
 *         ],
 *         readOnly: false,
 *         buttons: false,
 *         optionsType: 'CUSTOM',
 *         conditionallyShowOptions: false,
 *         isDataLookup: false,
 *         isElementLookup: false,
 *         conditionallyShow: false,
 *         requiresAllConditionallyShowPredicates: false,
 *       },
 *     ],
 *     submissionTimestamp: new Date().toISOString(),
 *     parseDate: (value) => new Date(value),
 *     addDaysToDate: (date, days) => {
 *       date.setUTCDate(date.getUTCDate() + days)
 *       return date
 *     },
 *   },
 * )
 * ```
 *
 * @param options
 * @returns
 */
export function evaluateConditionalPredicates({
  isConditional,
  requiresAllConditionalPredicates,
  conditionalPredicates,
  formElements,
  submission,
  submissionTimestamp,
  parseDate,
  addDaysToDate,
}: {
  isConditional: boolean
  requiresAllConditionalPredicates: boolean
  conditionalPredicates: ConditionTypes.ConditionalPredicate[]
  formElements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
  /** ISO timestamp the form was submitted. When evaluating during submission, pass `new Date().toISOString()`. */
  submissionTimestamp: string
  /** Parse date/datetime strings when evaluating date based predicates */
  parseDate: ParseDate
  /** Add days to a date when evaluating date based predicates */
  addDaysToDate: AddOffsetToDate
}): boolean {
  if (!isConditional || !conditionalPredicates.length) {
    return true
  }
  const formElementsCtrl = {
    flattenedElements: flattenFormElements(formElements),
    model: submission,
  }

  const predicateFn = (predicate: ConditionTypes.ConditionalPredicate) => {
    if (predicate.type === 'SUBMISSION_TIMESTAMP') {
      return evaluateConditionalSubmissionTimestampPredicate({
        predicate,
        formElementsCtrl,
        submissionTimestamp,
        parseDate,
        addDaysToDate,
      })
    }

    return !!evaluateFormElementConditionalPredicate({
      predicate,
      formElementsCtrl,
    })
  }
  if (requiresAllConditionalPredicates) {
    return conditionalPredicates.every(predicateFn)
  } else {
    return conditionalPredicates.some(predicateFn)
  }
}
