import { FormTypes, SubmissionTypes } from '@oneblink/types'

export * from './replaceCustomValues'

/**
 * Takes a form element's id, the form elements and the submission data to
 * return a value from the submission.
 *
 * #### Example
 *
 * ```js
 * const value = submissionService.getRootElementById(
 *   formElementId,
 *   form.elements,
 *   submission,
 * )
 * ```
 *
 * @param formElementId
 * @param formElements
 * @param submission
 * @returns
 */
export function getRootElementValueById(
  formElementId: string,
  formElements: FormTypes.FormElement[],
  submission: SubmissionTypes.S3SubmissionData['submission'] | undefined,
): unknown {
  for (const formElement of formElements) {
    switch (formElement.type) {
      case 'section':
      case 'page': {
        const value = getRootElementValueById(
          formElementId,
          formElement.elements,
          submission,
        )
        if (value !== undefined) {
          return value
        }
        break
      }
      case 'form': {
        const value = getRootElementValueById(
          formElementId,
          formElement.elements || [],
          submission?.[
            formElement.name
          ] as SubmissionTypes.S3SubmissionData['submission'],
        )
        if (value !== undefined) {
          return value
        }
        break
      }
      default: {
        if (formElement.id === formElementId) {
          return submission?.[formElement.name]
        }
      }
    }
  }
}
