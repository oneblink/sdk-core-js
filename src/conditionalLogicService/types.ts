import { FormTypes, SubmissionTypes } from '@oneblink/types'

/**
 * Matches day-only (`YYYY-MM-DD`) date strings. Used to decide when to call
 * `parseDayOnlyDate` instead of `new Date(value)`.
 */
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * Parse a day-only (`YYYY-MM-DD`) string into a `Date`. Callers supply
 * timezone-aware parsing (e.g. start of day in an organisation timezone).
 * sdk-core only invokes this for values that match `YYYY-MM-DD`.
 */
export type ParseDayOnlyDate = (value: string) => Date

/**
 * Add an offset to a date. Callers supply timezone-aware calendar arithmetic.
 */
export type AddOffsetToDate = (date: Date, offset: number) => Date

/**
 * Move a date to the start of its calendar day. Callers supply timezone-aware
 * behaviour (e.g. organisation timezone on the server, local timezone in the
 * browser).
 */
export type StartOfDay = (date: Date) => Date

/**
 * Move a date to the end of its calendar day (last millisecond). Callers supply
 * timezone-aware behaviour (e.g. organisation timezone on the server, local
 * timezone in the browser).
 */
export type EndOfDay = (date: Date) => Date

export type FormElementsCtrl = {
  model: SubmissionTypes.S3SubmissionData['submission'] | undefined
  flattenedElements: FormTypes.FormElement[]
  parentFormElementsCtrl?: FormElementsCtrl
}
