/**
 * The regex used for matching `{ELEMENT:<elementName>}` tags in the OneBlink
 * platform. Ignores nested elements based on the '|' character. Will match
 * `"{ELEMENT:Parent_Name}"` but will NOT match `"{ELEMENT:Children|Name}"`.
 */
export const RootElementRegex = /({ELEMENT:)([^|}]+)(})/g
/**
 * The regex used for matching `{ELEMENT:<elementName>|<nestedElementName>}`
 * tags in the OneBlink platform. Includes nested elements based on the '|'
 * character. {ELEMENT:Children|Name} would be matched. Will match
 * `"{ELEMENT:Parent_Name}"` and `"{ELEMENT:Children|Name}"`.
 */
export const NestedElementRegex = /({ELEMENT:)([^}]+)(})/g

/**
 * The regex used for matching `{ELEMENT_VALUE:<elementName>}` tags in the OneBlink
 * platform. Ignores nested elements based on the '|' character. Will match
 * `"{ELEMENT_VALUE:Parent_Name}"` but will NOT match `"{ELEMENT_VALUE:Children|Name}"`.
 */
export const RootSubmissionValueElementRegex = /({ELEMENT_VALUE:)([^|}]+)(})/g
/**
 * The regex used for matching `{ELEMENT_VALUE:<elementName>|<nestedElementName>}`
 * tags in the OneBlink platform. Includes nested elements based on the '|'
 * character. {ELEMENT_VALUE:Children|Name} would be matched. Will match
 * `"{ELEMENT_VALUE:Parent_Name}"` and `"{ELEMENT_VALUE:Children|Name}"`.
 */
export const NestedSubmissionValueElementRegex = /({ELEMENT_VALUE:)([^}]+)(})/g

/**
 * Takes a string and calls a provided handler function for each found instance
 * of `{ELEMENT:<elementName>}` in the string. Used to replace values in
 * OneBlink calculation and info (HTML) elements.
 *
 * #### Example
 *
 * ```js
 * formElementsService.matchElementsTagRegex(
 *   myString,
 *   ({ elementName, elementMatch }) => {
 *     const v = submission[elementName]
 *     myString = myString.replace(elementMatch, v)
 *   },
 * )
 * ```
 *
 * Or
 *
 * ```js
 * formElementsService.matchElementsTagRegex(
 *   {
 *     text: myString,
 *     excludeNestedElements: true,
 *   },
 *   ({ elementName, elementMatch }) => {
 *     const v = submission[elementName]
 *     myString = myString.replace(elementMatch, v)
 *   },
 * )
 * ```
 *
 * @param options
 * @param handler
 * @returns
 */
export function matchElementsTagRegex(
  options:
    | string
    | {
        text: string
        /**
         * Determine if only root level elements should be matched.
         *
         * `false` will match `"{ELEMENT:Parent_Name}"` and
         * `"{ELEMENT:Children|Name}"`.
         *
         * `true` will match `"{ELEMENT:Parent_Name}"` but will NOT replace
         * `{ELEMENT:Children|Name}`.
         */
        excludeNestedElements: boolean
        /** Use the submission value instead of labels for elements with optionsets */
        useSubmissionValue?: boolean
      },
  matchHandler: (options: {
    elementName: string
    elementMatch: string
  }) => void,
) {
  const text = typeof options === 'string' ? options : options.text
  const excludeNestedElements =
    typeof options !== 'string' && !!options.excludeNestedElements
  const useSubmissionValue =
    typeof options !== 'string' && !!options.useSubmissionValue
  let matches
  const rootRegex = useSubmissionValue
    ? RootSubmissionValueElementRegex
    : RootElementRegex
  const nestedRegex = useSubmissionValue
    ? NestedSubmissionValueElementRegex
    : NestedElementRegex
  while (
    (matches = (excludeNestedElements ? rootRegex : nestedRegex).exec(text)) !==
    null
  ) {
    if (matches?.length < 3) continue

    const elementName = matches[2]
    matchHandler({ elementName, elementMatch: matches[0] })
  }
}
