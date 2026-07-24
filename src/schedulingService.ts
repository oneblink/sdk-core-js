import {
  FormTypes,
  SubmissionEventTypes,
  SubmissionTypes,
} from '@oneblink/types'
import { conditionalLogicService } from './index.js'
import { AddOffsetToDate, ParseDate } from './conditionalLogicService/types.js'

/**
 * Examine a submission and its form definition to validate whether a scheduling
 * workflow event needs to run.
 *
 * #### Example
 *
 * ```js
 * const result = schedulingService.checkForSchedulingEvent({
 *   definition: form,
 *   submission,
 *   submissionTimestamp,
 *   parseDate: (value) => new Date(value),
 *   addDaysToDate: (date, days) => {
 *     date.setUTCDate(date.getUTCDate() + days)
 *     return date
 *   },
 * })
 * ```
 *
 * @param options
 * @returns
 */
export function checkForSchedulingEvent({
  definition,
  submission,
  submissionTimestamp,
  parseDate,
  addDaysToDate,
}: {
  definition: FormTypes.Form
  submission: SubmissionTypes.S3SubmissionData['submission']
  /** ISO timestamp the form was submitted. When evaluating during submission, pass `new Date().toISOString()`. */
  submissionTimestamp: string
  /** Parse date/datetime strings when evaluating date based predicates */
  parseDate: ParseDate
  /** Add days to a date when evaluating date based predicates */
  addDaysToDate: AddOffsetToDate
}): SubmissionEventTypes.FormSchedulingEvent | undefined {
  const schedulingSubmissionEvents = definition.schedulingEvents || []
  return schedulingSubmissionEvents.find((schedulingSubmissionEvent) =>
    conditionalLogicService.evaluateConditionalPredicates({
      isConditional: !!schedulingSubmissionEvent.conditionallyExecute,
      requiresAllConditionalPredicates:
        !!schedulingSubmissionEvent.requiresAllConditionallyExecutePredicates,
      conditionalPredicates:
        schedulingSubmissionEvent.conditionallyExecutePredicates || [],
      submission: submission,
      formElements: definition.elements,
      submissionTimestamp,
      parseDate,
      addDaysToDate,
    }),
  )
}
