import { FormTypes, SubmissionTypes } from '@oneblink/types'

export type FormElementsCtrl = {
  model: SubmissionTypes.S3SubmissionData['submission'] | undefined
  flattenedElements: FormTypes.FormElement[]
  parentFormElementsCtrl?: FormElementsCtrl
}
