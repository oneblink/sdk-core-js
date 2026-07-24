import { FormTypes, SubmissionTypes } from '@oneblink/types'

/**
 * Parse a date/datetime string into a `Date`. Callers supply timezone-aware
 * parsing (e.g. treating `YYYY-MM-DD` as the start of day in an organisation
 * timezone).
 */
export type ParseDate = (value: string) => Date

/**
 * Add an offset to a date. Callers supply timezone-aware calendar arithmetic.
 */
export type AddOffsetToDate = (date: Date, offset: number) => Date

export type FormElementsCtrl = {
  model: SubmissionTypes.S3SubmissionData['submission'] | undefined
  flattenedElements: FormTypes.FormElement[]
  parentFormElementsCtrl?: FormElementsCtrl
}
