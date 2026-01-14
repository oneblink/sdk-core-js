import {
  FormTypes,
  SubmissionEventTypes,
  SubmissionTypes,
} from '@oneblink/types'
import { conditionalLogicService } from './index.js'

/**
 * Examine a submission and its form definition to validate whether a scheduling
 * workflow event needs to run.
 *
 * #### Example
 *
 * ```js
 * const result = schedulingService.checkFormSchedulingEvent(
 *   form,
 *   submission,
 * )
 * ```
 *
 * @param definition
 * @param submission
 * @returns
 */
export function checkForSchedulingEvent(
  definition: FormTypes.Form,
  submission: SubmissionTypes.S3SubmissionData['submission'],
): SubmissionEventTypes.FormSchedulingEvent | undefined {
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
    }),
  )
}
