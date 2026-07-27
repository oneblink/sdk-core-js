import {
  FormTypes,
  SubmissionEventTypes,
  SubmissionTypes,
} from '@oneblink/types'
import { conditionalLogicService } from './index.js'
import {
  AddOffsetToDate,
  EndOfDay,
  ParseDayOnlyDate,
  StartOfDay,
} from './conditionalLogicService/types.js'

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
 *   parseDayOnlyDate: (value) => new Date(`${value}T00:00:00.000Z`),
 *   addDaysToDate: (date, days) => {
 *     date.setUTCDate(date.getUTCDate() + days)
 *     return date
 *   },
 *   startOfDay: (date) => {
 *     date.setUTCHours(0, 0, 0, 0)
 *     return date
 *   },
 *   endOfDay: (date) => {
 *     date.setUTCHours(23, 59, 59, 999)
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
  parseDayOnlyDate,
  addDaysToDate,
  startOfDay,
  endOfDay,
}: {
  definition: FormTypes.Form
  submission: SubmissionTypes.S3SubmissionData['submission']
  /** ISO timestamp the form was submitted. When evaluating during submission, pass `new Date().toISOString()`. */
  submissionTimestamp: string
  /** Parse `YYYY-MM-DD` strings when evaluating date based predicates */
  parseDayOnlyDate: ParseDayOnlyDate
  /** Add days to a date when evaluating date based predicates */
  addDaysToDate: AddOffsetToDate
  /** Start of calendar day when evaluating date (not datetime) based predicates */
  startOfDay: StartOfDay
  /** End of calendar day when evaluating date (not datetime) based predicates */
  endOfDay: EndOfDay
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
      parseDayOnlyDate,
      addDaysToDate,
      startOfDay,
      endOfDay,
    }),
  )
}
