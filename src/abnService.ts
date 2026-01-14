import { MiscTypes } from '@oneblink/types'

const createLegalName = ({
  familyName,
  givenName,
  otherGivenName,
}: NonNullable<MiscTypes.ABNRecord['legalName']>) => {
  let legalName = ''
  // Concat last name
  if (familyName) legalName += `${familyName}, `
  // Concat first name
  if (givenName) legalName += `${givenName} `
  // Concat middle name
  if (otherGivenName) legalName += `${otherGivenName}`

  return legalName
}

/**
 * Attempts to get the most relevant business name from the data returned in an
 * `ABNRecord`. Will return `undefined` if a suitable name is not found.
 *
 * #### Example
 *
 * ```js
 * const businessName = abnService.getBusinessNameFromABNRecord(abnRecord)
 * ```
 *
 * @param abnRecord
 * @returns
 */
export const getBusinessNameFromABNRecord = (
  abnRecord: MiscTypes.ABNRecord,
): string | undefined => {
  if (abnRecord.entityType.entityTypeCode === 'IND' && abnRecord.legalName) {
    const legalName = createLegalName(abnRecord.legalName)
    if (legalName) return legalName.trim()
  }

  if (abnRecord.mainName?.organisationName) {
    return abnRecord.mainName.organisationName
  }
  if (abnRecord.mainTradingName?.organisationName) {
    return abnRecord.mainTradingName.organisationName
  }
  if (abnRecord.legalName) {
    const legalName = createLegalName(abnRecord.legalName)
    if (legalName) return legalName.trim()
  }
}

/**
 * Get the most relevant business name from the data returned in an `ABNRecord`.
 * Will return "Unknown Business Name" if a suitable name is not found.
 *
 * #### Example
 *
 * ```js
 * const businessName =
 *   abnService.displayBusinessNameFromABNRecord(abnRecord)
 * ```
 *
 * @param abnRecord
 * @returns
 */
export const displayBusinessNameFromABNRecord = (
  abnRecord: MiscTypes.ABNRecord,
): string => {
  const businessName = getBusinessNameFromABNRecord(abnRecord)
  return businessName || 'ABN Details Suppressed'
}

/**
 * Attempts to get the most recent ABN number from the data returned in an
 * `ABNRecord`. Will return `undefined` if an ABN is not found.
 *
 * #### Example
 *
 * ```js
 * const ABN = abnService.getABNNumberFromABNRecord(abnRecord)
 * ```
 *
 * @param abnRecord
 * @returns
 */
export const getABNNumberFromABNRecord = (
  abnRecord: MiscTypes.ABNRecord,
): string | undefined => {
  if (!abnRecord.ABN) return
  if (Array.isArray(abnRecord.ABN)) {
    const relevantABN = abnRecord.ABN.find(
      (abn) => abn.isCurrentIndicator === 'Y',
    )
    return relevantABN?.identifierValue
  }
  return abnRecord.ABN.identifierValue
}

/**
 * Attempts to get the most recent ABN number from the data returned in an
 * `ABNRecord`. Will return "Unknown ABN Number" if an ABN is not found.
 *
 * #### Example
 *
 * ```js
 * const ABN = abnService.displayABNNumberFromABNRecord(abnRecord)
 * ```
 *
 * @param abnRecord
 * @returns
 */
export const displayABNNumberFromABNRecord = (
  abnRecord: MiscTypes.ABNRecord,
): string => {
  const abnNumber = getABNNumberFromABNRecord(abnRecord)
  return abnNumber || 'Unknown ABN Number'
}
