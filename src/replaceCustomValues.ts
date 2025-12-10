import {
  APINSWTypes,
  CivicaTypes,
  FormTypes,
  GeoscapeTypes,
  GoogleTypes,
  MiscTypes,
  PointTypes,
  ScheduledTasksTypes,
  SubmissionTypes,
} from '@oneblink/types'
import { getABNNumberFromABNRecord } from './abnService'
import {
  RootElementRegex,
  NestedElementRegex,
  matchElementsTagRegex,
  RootSubmissionValueElementRegex,
  NestedSubmissionValueElementRegex,
} from './form-elements-regex'
import { findFormElement, flattenFormElements } from './formElementsService'

export type ReplaceInjectablesFormatters = {
  /** A function to format any date/times. */
  formatDateTime: (value: string) => string
  /** A function to format any dates. */
  formatDate: (value: string) => string
  /** A function to format any times. */
  formatTime: (value: string) => string
  /** A function to format any numbers. */
  formatNumber: (value: number) => string
  /** A function to format any numbers as currency. */
  formatCurrency: (value: number) => string
}

export type ReplaceInjectablesBaseOptions = ReplaceInjectablesFormatters & {
  submission: SubmissionTypes.S3SubmissionData['submission']
  userProfile: MiscTypes.UserProfile | undefined
  task: ScheduledTasksTypes.Task | undefined
  taskGroup: ScheduledTasksTypes.TaskGroup | undefined
  taskGroupInstance: ScheduledTasksTypes.TaskGroupInstance | undefined
  /**
   * Determine if only root level elements should be replaced.
   *
   * `false` will replace `"{ELEMENT:Parent_Name}"` and
   * `"{ELEMENT:Children|Name}"`.
   *
   * `true` will replace `"{ELEMENT:Parent_Name}"` but will NOT replace
   * `{ELEMENT:Children|Name}`.
   */
  excludeNestedElements?: boolean
}

export type ReplaceInjectablesOptions = ReplaceInjectablesBaseOptions & {
  form: FormTypes.Form
  submissionId: string
  submissionTimestamp: string
  externalId: string | undefined
  previousApprovalId: string | undefined
}

const SUBMISSION_VALUES: Array<{
  string: string
  value: (options: ReplaceInjectablesOptions) => string | undefined
}> = [
  {
    string: '{INFO_PAGE_ID}',
    value: ({ form }: ReplaceInjectablesOptions) => form.id.toString(),
  },
  {
    string: '{INFO_PAGE_NAME}',
    value: ({ form }: ReplaceInjectablesOptions) => form.name,
  },
  {
    string: '{FORM_ID}',
    value: ({ form }: ReplaceInjectablesOptions) => form.id.toString(),
  },
  {
    string: '{FORM_NAME}',
    value: ({ form }: ReplaceInjectablesOptions) => form.name,
  },
  {
    string: '{DATE}',
    value: ({
      submissionTimestamp,
      formatDateTime,
    }: ReplaceInjectablesOptions) => {
      if (!submissionTimestamp) {
        return undefined
      }
      return formatDateTime(submissionTimestamp)
    },
  },
  {
    string: '{TIMESTAMP}',
    value: ({ submissionTimestamp }: ReplaceInjectablesOptions) =>
      submissionTimestamp,
  },
  {
    string: '{SUBMISSION_ID}',
    value: ({ submissionId }: ReplaceInjectablesOptions) => submissionId,
  },
  {
    string: '{EXTERNAL_ID}',
    value: ({ externalId }: ReplaceInjectablesOptions) => externalId,
  },
  {
    string: '{PREVIOUS_APPROVAL_ID}',
    value: ({ previousApprovalId }: ReplaceInjectablesOptions) =>
      previousApprovalId,
  },
]

const ELEMENT_VALUES: Array<{
  string: string
  value: (options: ReplaceInjectablesBaseOptions) => string | undefined
}> = [
  {
    string: '{USER:email}',
    value: ({ userProfile }) => userProfile?.email,
  },
  {
    string: '{USER:username}',
    value: ({ userProfile }) => userProfile?.username,
  },
  {
    string: '{TASK_NAME}',
    value: ({ task }) => task?.name,
  },
  {
    string: '{TASK_GROUP_NAME}',
    value: ({ taskGroup }) => taskGroup?.name,
  },
  {
    string: '{TASK_GROUP_INSTANCE_LABEL}',
    value: ({ taskGroupInstance }) => taskGroupInstance?.label,
  },
]

/**
 * Function to get the display value of a property in submission, if elementId
 * is provided propertyName will be ignored
 *
 * #### Example
 *
 * ```typescript
 * const result = submissionService.getElementSubmissionValue({
 *   propertyName: 'search',
 *   submission: {
 *     search: 'Entered By User',
 *   },
 *   formElements: [
 *     {
 *       id: 'd4135b47-9004-4d75-aeb3-d2f6232da111',
 *       name: 'search',
 *       type: 'text',
 *       label: 'Search',
 *       readOnly: false,
 *       required: false,
 *       conditionallyShow: false,
 *       requiresAllConditionallyShowPredicates: false,
 *       isElementLookup: false,
 *       isDataLookup: false,
 *     },
 *   ],
 *   formatDate: (value) => new Date(value).toDateString(),
 *   formatDateTime: (value) => new Date(value).toString(),
 *   formatTime: (value) => new Date(value).toTimeString(),
 *   formatNumber: (value) => Number(value).toString(),
 *   formatCurrency: (value) => Number(value).toFixed(2),
 * })
 * ```
 *
 * @param options
 * @returns
 */
export function getElementSubmissionValue({
  propertyName,
  submission,
  formElements,
  useSubmissionValue,
  formatDate,
  formatDateTime,
  formatTime,
  formatNumber,
  formatCurrency,
}: {
  propertyName: string
  formElements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
  useSubmissionValue?: boolean
} & ReplaceInjectablesFormatters):
  | {
      element: FormTypes.FormElement | undefined
      value: unknown
    }
  | undefined
export function getElementSubmissionValue({
  elementId,
  submission,
  formElements,
  useSubmissionValue,
  formatDate,
  formatDateTime,
  formatTime,
  formatNumber,
  formatCurrency,
}: {
  elementId: string
  formElements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
  useSubmissionValue?: boolean
} & ReplaceInjectablesFormatters):
  | {
      element: FormTypes.FormElement | undefined
      value: unknown
    }
  | undefined
export function getElementSubmissionValue({
  elementId,
  propertyName,
  submission,
  formElements,
  useSubmissionValue,
  formatDate,
  formatDateTime,
  formatTime,
  formatNumber,
  formatCurrency,
}: {
  elementId?: string
  propertyName?: string
  formElements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
  useSubmissionValue?: boolean
} & ReplaceInjectablesFormatters) {
  if (elementId === undefined && propertyName === undefined) {
    return undefined
  }

  let result: ReturnType<typeof getElementSubmissionValueByName> | undefined =
    undefined
  if (elementId) {
    result = getElementSubmissionValueById({
      elementId,
      formElements,
      submission,
    })
  } else if (propertyName) {
    result = getElementSubmissionValueByName({
      propertyName,
      formElements,
      submission,
    })
  }
  if (!result) {
    return
  }
  return formatValue({
    element: result.formElement,
    unknownValue: result.unknownValue,
    useSubmissionValue,
    formatDate,
    formatTime,
    formatDateTime,
    formatCurrency,
    formatNumber,
  })
}

function getElementSubmissionValueByName({
  propertyName,
  formElements,
  submission,
}: {
  propertyName: string
  formElements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
}):
  | { formElement: FormTypes.FormElement | undefined; unknownValue: unknown }
  | undefined {
  const unknownValue = submission[propertyName]
  if (unknownValue === undefined || unknownValue === null) {
    return undefined
  }

  const formElement = findFormElement(
    formElements,
    (element) =>
      element.type !== 'page' &&
      element.type !== 'section' &&
      element.name === propertyName,
  )

  return { formElement, unknownValue }
}

function getElementSubmissionValueById({
  elementId,
  formElements,
  submission,
}: {
  elementId: string
  formElements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
}): { formElement: FormTypes.FormElement; unknownValue: unknown } | undefined {
  // make sure submission is an object
  if (Object(submission) !== submission) {
    return undefined
  }
  const flattenedElements = flattenFormElements(formElements)

  let unknown: unknown = undefined
  let formElement: FormTypes.FormElement | undefined = undefined
  for (const element of flattenedElements) {
    if (elementId === element.id) {
      if ('name' in element) {
        unknown = submission[element.name]
        formElement = element
      }
      break
    }
    if (element.type === 'form') {
      const newSubmissionData = submission[element.name]

      const result = getElementSubmissionValueById({
        elementId,
        formElements: element.elements ?? [],
        submission:
          newSubmissionData as SubmissionTypes.S3SubmissionData['submission'],
      })
      if (result) {
        unknown = result.unknownValue
        formElement = result.formElement
        break
      }
    }
  }
  if (unknown === undefined || unknown === null || formElement === undefined) {
    return undefined
  }

  return { unknownValue: unknown, formElement }
}

function formatValue({
  element,
  unknownValue,
  useSubmissionValue,
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
  formatNumber,
}: {
  element: FormTypes.FormElement | undefined
  unknownValue: unknown
  useSubmissionValue?: boolean
} & ReplaceInjectablesFormatters) {
  switch (element?.type) {
    case 'datetime': {
      const value = unknownValue as string
      return { element: element, value: formatDateTime(value) }
    }
    case 'date': {
      const value = unknownValue as string
      return { element: element, value: formatDate(value) }
    }
    case 'time': {
      const value = unknownValue as string
      return { element: element, value: formatTime(value) }
    }
    case 'radio':
    case 'autocomplete': {
      const value = unknownValue as string
      if (useSubmissionValue) {
        return { element: element, value: value }
      }
      const option = element.options?.find((opt) => opt.value === value)
      return { element: element, value: option?.label || value }
    }

    case 'checkboxes': {
      const value = unknownValue as string[]
      if (useSubmissionValue) {
        return { element: element, value: value }
      }
      const options = element.options
      const selectedOptionLabels: string[] = value.reduce(
        (labels: string[], selectedOption: string) => {
          const foundOption = options?.find((o) => o.value === selectedOption)
          if (foundOption) labels.push(foundOption.label)
          return labels
        },
        [],
      )
      return {
        element: element,
        value: selectedOptionLabels.length ? selectedOptionLabels : undefined,
      }
    }
    case 'compliance': {
      const value = unknownValue as {
        value?: string
      }
      if (useSubmissionValue) {
        return { element: element, value: value.value }
      }
      const option = (element.options || []).find(
        (option: FormTypes.ChoiceElementOption) => option.value === value.value,
      )
      return {
        element: element,
        value: {
          ...value,
          value: option?.label || value.value,
        },
      }
    }
    case 'select': {
      if (element.multi) {
        const value = unknownValue as string[]
        if (useSubmissionValue) {
          return { element: element, value: value }
        }
        const options = element.options
        const selectedOptionLabels: string[] = value.reduce(
          (labels: string[], selectedOption: string) => {
            const foundOption = options?.find((o) => o.value === selectedOption)
            if (foundOption) labels.push(foundOption.label)
            return labels
          },
          [],
        )
        return {
          element: element,
          value: selectedOptionLabels.length ? selectedOptionLabels : undefined,
        }
      } else {
        const value = unknownValue as string
        if (useSubmissionValue) {
          return { element: element, value: value }
        }
        const option = element.options?.find((opt) => opt.value === value)
        return { element: element, value: option?.label }
      }
    }
    case 'boolean': {
      const value = unknownValue as boolean
      return { element: element, value: value ? 'Yes' : 'No' }
    }
    case 'calculation':
    case 'number': {
      const getValue = (value: number) => {
        if (element.displayAsCurrency) {
          return formatCurrency(value)
        }
        if (element.type === 'calculation') {
          return formatNumber(value)
        }
        return value
      }

      const value = unknownValue as number
      if (!Number.isNaN(value) && Number.isFinite(value)) {
        const formattedValue = getValue(value)
        return { element, value: formattedValue }
      }
      return undefined
    }
    case 'pointCadastralParcel': {
      const value = unknownValue as PointTypes.PointCadastralParcelResponse
      return {
        element: element,
        value: value?.parcelBundle?.[0]?.parcelId,
      }
    }
    case 'pointAddress':
    case 'geoscapeAddress': {
      const value = unknownValue as
        | PointTypes.PointAddress
        | GeoscapeTypes.GeoscapeAddress
      return {
        element: element,
        value: value?.addressDetails?.formattedAddress || value?.addressId,
      }
    }
    case 'pointAddressV3': {
      const value =
        unknownValue as PointTypes.PointAddressV3GetAddressDetailsResponse
      return {
        element: element,
        value:
          value.properties?.formattedAddress || value.properties?.addressId,
      }
    }
    case 'googleAddress': {
      const value = unknownValue as GoogleTypes.GoogleMapsAddress
      return {
        element: element,
        value: value.formatted_address || value.place_id,
      }
    }
    case 'civicaStreetName': {
      const value = unknownValue as CivicaTypes.CivicaStreetName
      return { element: element, value: value?.formattedStreet }
    }
    case 'civicaNameRecord': {
      const value = unknownValue as CivicaTypes.CivicaNameRecord
      return {
        element: element,
        value:
          [value?.title, value?.givenName1, value?.familyName]
            .filter((t) => t)
            .join(' ') || value?.emailAddress,
      }
    }
    case 'abn': {
      const value = unknownValue as MiscTypes.ABNRecord
      return {
        element: element,
        value: value ? getABNNumberFromABNRecord(value) : undefined,
      }
    }
    case 'apiNSWLiquorLicence': {
      const value = unknownValue as APINSWTypes.LiquorLicenceDetails | undefined
      return {
        element: element,
        value:
          `${value?.licenceDetail?.licenceNumber} | ${value?.licenceDetail?.licenceName}`.trim(),
      }
    }
    case 'freshdeskDependentField': {
      const value =
        unknownValue as FormTypes.FreshdeskDependentFieldElementValue
      return {
        element,
        value:
          [value.category, value.subCategory, value.item]
            .filter((text) => !!text)
            .join(' / ') || undefined,
      }
    }
    default: {
      return { element: element, value: unknownValue }
    }
  }
}

/**
 * Replace the `{ELEMENT:<elementName>}` values in text while a form is being
 * filled out. The replacements are suppose to be user friendly and for display
 * purposes, e.g. dates should be displayed in the user's desired format and
 * timezone.
 *
 * #### Example
 *
 * ```js
 * const { text: url } =
 *   submissionService.replaceInjectablesWithElementValues(
 *     'https://example.com/path?search{ELEMENT:search}',
 *     {
 *       formatDate: (value) => new Date(value).toDateString(),
 *       formatDateTime: (value) => new Date(value).toString(),
 *       formatTime: (value) => new Date(value).toTimeString(),
 *       formatNumber: (value) => Number(value).toString(),
 *       formatCurrency: (value) => Number(value).toFixed(2),
 *       submission: {
 *         search: 'Entered By User',
 *       },
 *       elements: [
 *         {
 *           id: 'd4135b47-9004-4d75-aeb3-d2f6232da111',
 *           name: 'search',
 *           type: 'text',
 *           label: 'Search',
 *           readOnly: false,
 *           required: false,
 *           conditionallyShow: false,
 *           requiresAllConditionallyShowPredicates: false,
 *           isElementLookup: false,
 *           isDataLookup: false,
 *         },
 *       ],
 *       userProfile: {
 *         userId: 'abc123',
 *         username: 'john-user',
 *         email: 'john.user@domain.com',
 *       },
 *     },
 *   )
 * ```
 *
 * @param text
 * @param options
 * @returns
 */
export function replaceInjectablesWithElementValues(
  text: string,
  options: {
    formElements: FormTypes.FormElement[]
  } & ReplaceInjectablesBaseOptions,
): {
  /**
   * The text passed in with all injectables replaced with their corresponding
   * values or empty strings.
   */
  text: string
  /**
   * Determine if replaceable strings could all be replaced. The `text` property
   * returned will replace all injectable with empty strings if the value cannot
   * be found. Use this boolean to either use the replaced string with missing
   * data or implement some other logic to handle missing injectables.
   */
  hadAllInjectablesReplaced: boolean
} {
  let hadAllInjectablesReplaced = true
  text = ELEMENT_VALUES.reduce((newString, customValue) => {
    if (!newString.includes(customValue.string)) {
      return newString
    }
    const replacedValue = customValue.value(options)
    if (!replacedValue) {
      hadAllInjectablesReplaced = false
    }
    return newString.replaceAll(customValue.string, replacedValue || '')
  }, text)

  const matchesElement = text.match(
    options.excludeNestedElements ? RootElementRegex : NestedElementRegex,
  )
  if (matchesElement) {
    matchElementsTagRegex(
      {
        text,
        excludeNestedElements: !!options.excludeNestedElements,
      },
      ({ elementName, elementMatch }) => {
        const result = getElementSubmissionValue({
          propertyName: elementName,
          ...options,
        })

        const hasNoValue = result === undefined || result.value === undefined
        if (hasNoValue) {
          hadAllInjectablesReplaced = false
        }

        text = text.replace(
          elementMatch,
          hasNoValue ? '' : (result.value as string),
        )
      },
    )
  }

  const valueMatchesElement = text.match(
    options.excludeNestedElements
      ? RootSubmissionValueElementRegex
      : NestedSubmissionValueElementRegex,
  )
  if (valueMatchesElement) {
    matchElementsTagRegex(
      {
        text,
        excludeNestedElements: !!options.excludeNestedElements,
        useSubmissionValue: true,
      },
      ({ elementName, elementMatch }) => {
        const result = getElementSubmissionValue({
          propertyName: elementName,
          ...options,
          useSubmissionValue: true,
        })
        const hasNoValue = result === undefined || result.value === undefined
        if (hasNoValue) {
          hadAllInjectablesReplaced = false
        }

        text = text.replace(
          elementMatch,
          hasNoValue ? '' : (result.value as string),
        )
      },
    )
  }

  return {
    text,
    hadAllInjectablesReplaced,
  }
}

/**
 * Replace the `{ELEMENT:<elementName>}` values in text after a successful form
 * submission as well as other replaceable parameters e.g. `submissionId`. The
 * replacements are suppose to be user friendly and for display purposes, e.g.
 * dates should be displayed in the user's desired format and timezone.
 *
 * #### Example
 *
 * ```js
 * const result = submissionService.replaceInjectablesWithSubmissionValues(
 *   'https://example.com/path?submissionId={SUBMISSION_ID}&externalId={EXTERNAL_ID}&search{ELEMENT:search}',
 *   {
 *     submissionId: 'abc-123',
 *     submissionTimestamp: '2021-07-02T02:19:13.670Z',
 *     formatDate: (value) => new Date(value).toDateString(),
 *     formatDateTime: (value) => new Date(value).toString(),
 *     formatTime: (value) => new Date(value).toTimeString(),
 *     submission: {
 *       search: 'Entered By User',
 *     },
 *     form: {
 *       id: 1,
 *       name: 'Form',
 *       organisationId: '',
 *       formsAppEnvironmentId: 1,
 *       formsAppIds: [],
 *       isAuthenticated: false,
 *       isMultiPage: false,
 *       isInfoPage: false,
 *       postSubmissionAction: 'FORMS_LIBRARY',
 *       cancelAction: 'FORMS_LIBRARY',
 *       submissionEvents: [],
 *       tags: [],
 *       elements: [
 *         {
 *           id: 'd4135b47-9004-4d75-aeb3-d2f6232da111',
 *           name: 'search',
 *           type: 'text',
 *           label: 'Search',
 *           readOnly: false,
 *           required: false,
 *           conditionallyShow: false,
 *           requiresAllConditionallyShowPredicates: false,
 *           isElementLookup: false,
 *           isDataLookup: false,
 *         },
 *       ],
 *     },
 *   },
 * )
 * ```
 *
 * @param text
 * @param options
 * @returns
 */
export function replaceInjectablesWithSubmissionValues(
  text: string,
  options: ReplaceInjectablesOptions,
): {
  /**
   * The text passed in with all injectables replaced with their corresponding
   * values or empty strings.
   */
  text: string
  /**
   * Determine if replaceable strings could all be replaced. The `text` property
   * returned will replace all injectable with empty strings if the value cannot
   * be found. Use this boolean to either use the replaced string with missing
   * data or implement some other logic to handle missing injectables.
   */
  hadAllInjectablesReplaced: boolean
} {
  const result = replaceInjectablesWithElementValues(text, {
    formElements: options.form.elements,
    ...options,
  })
  let hadAllInjectablesReplaced = result.hadAllInjectablesReplaced
  const replacedText = SUBMISSION_VALUES.reduce((newString, customValue) => {
    if (!newString.includes(customValue.string)) {
      return newString
    }
    const replacedValue = customValue.value(options)
    if (!replacedValue) {
      hadAllInjectablesReplaced = false
    }
    return newString.replaceAll(customValue.string, replacedValue || '')
  }, result.text)

  return {
    text: replacedText,
    hadAllInjectablesReplaced,
  }
}

/**
 * Process a resource with injectable element values to turn a single resource
 * (could be a single) into multiple resources. e.g.
 * `"{ELEMENT:Children|Child_Name} {ELEMENT:Family_Name}"` with the following
 * submission data:
 *
 * ```json
 * {
 *   "Family_Name": "Smith",
 *   "Children": [
 *     {
 *       "Child_Name": "John"
 *     },
 *     {
 *       "Child_Name": "Jane"
 *     }
 *   ]
 * }
 * ```
 *
 * Would result in the following resources:
 *
 * - `"John Smith"`
 * - `"Jane Smith"`
 *
 * #### Example
 *
 * ```js
 * const emailAddresses = processInjectablesInCustomResource({
 *   resource: '{ELEMENT:People|Email_Address}',
 *   submission: {
 *     People: [
 *       {
 *         Email_Address: 'user@oneblink.io',
 *       },
 *       {
 *         Email_Address: 'admin@oneblink.io',
 *       },
 *     ],
 *   },
 *   formElements: [
 *     {
 *       id: '18dcd3e0-6e2f-462e-803b-e24562d9fa6d',
 *       type: 'repeatableSet',
 *       name: 'People',
 *       label: 'People',
 *       elements: [
 *         {
 *           id: 'd0902113-3f77-4070-adbd-ca3ae95ce091',
 *           type: 'email',
 *           name: 'Email_Address',
 *           label: 'Email_Address',
 *         },
 *       ],
 *     },
 *   ],
 *   replaceRootInjectables: (resource, submission, formElements) => {
 *     const { text } = replaceInjectablesWithElementValues(resource, {
 *       submission,
 *       formElements,
 *       excludeNestedElements: true,
 *       // other options
 *     })
 *     return text
 *   },
 * })
 * // emailAddresses === ["user@oneblink.io", "admin@oneblink.io"]
 * ```
 *
 * @param options
 * @returns
 */
export function processInjectablesInCustomResource<T>({
  resource,
  submission,
  formElements,
  replaceRootInjectables,
  prepareNestedInjectables = (resource, prepare) =>
    prepare(String(resource)) as T,
}: {
  /** The resource that contains properties that support injection or a string */
  resource: T
  /** The form submission data to process */
  submission: SubmissionTypes.S3SubmissionData['submission']
  /** The form elements to process */
  formElements: FormTypes.FormElement[]
  /**
   * A function to inject values, this allows custom formatters to be used.
   * Return `undefined` to prevent the injection from recursively continuing.
   *
   * @param resource The current resource that contains properties that support
   *   injection or a string
   * @param submission The current form submission data to process (may be an
   *   entry in a repeatable set)
   * @param formElements The current form elements to process (may be the
   *   elements from a repeatable set)
   * @returns
   */
  replaceRootInjectables: (
    resource: T,
    submission: SubmissionTypes.S3SubmissionData['submission'],
    formElements: FormTypes.FormElement[],
  ) =>
    | [injectedText: string, resourceKey: string, newResource: T]
    | string
    | undefined
  /**
   * An optional function to replace nested injectables when creating multiple
   * resources from repeatable sets. Only required if the `resource` param is
   * not a `string`.
   *
   * @param resource The current resource that contains properties that support
   *   injection or a string
   * @param prepare A function to prepare the resource string(s) for another
   *   iteration
   * @returns
   */
  prepareNestedInjectables?: (
    resource: T,
    preparer: (resourceText: string) => string,
  ) => T
}): Map<string, T> {
  const newResources: Map<string, T> = new Map<string, T>()

  const injectorResult = replaceRootInjectables(
    resource,
    submission,
    formElements,
  )
  if (!injectorResult) {
    return newResources
  }

  const [text, resourceKey, newResource] =
    typeof injectorResult === 'string'
      ? [injectorResult, injectorResult, injectorResult as T]
      : injectorResult

  // Find nested form elements
  const matches: Map<string, boolean> = new Map()
  matchElementsTagRegex(
    {
      text,
      excludeNestedElements: false,
    },
    ({ elementName }) => {
      const [repeatableSetElementName, ...elementNames] = elementName.split('|')
      matches.set(repeatableSetElementName, !!elementNames.length)
    },
  )

  if (matches.size) {
    matches.forEach((hasNestedFormElements, repeatableSetElementName) => {
      if (hasNestedFormElements) {
        // Attempt to create a new resource for each entry in the repeatable set.
        const entries = submission?.[repeatableSetElementName]
        if (Array.isArray(entries)) {
          const repeatableSetElement = findFormElement(
            formElements,
            (formElement) => {
              return (
                'name' in formElement &&
                formElement.name === repeatableSetElementName
              )
            },
          )
          if (
            repeatableSetElement &&
            'elements' in repeatableSetElement &&
            Array.isArray(repeatableSetElement.elements)
          ) {
            for (const entry of entries) {
              const replacedResource = prepareNestedInjectables(
                newResource,
                (resourceText) => {
                  return resourceText.replaceAll(
                    `{ELEMENT:${repeatableSetElementName}|`,
                    '{ELEMENT:',
                  )
                },
              )
              const nestedResources = processInjectablesInCustomResource<T>({
                resource: replacedResource,
                submission: entry,
                formElements: repeatableSetElement.elements,
                replaceRootInjectables,
                prepareNestedInjectables,
              })
              if (nestedResources.size) {
                nestedResources.forEach((nestedResource, nestedResourceKey) => {
                  if (!newResources.has(nestedResourceKey)) {
                    newResources.set(nestedResourceKey, nestedResource)
                  }
                })
              }
            }
          }
        }
      }
    })
  }

  // Find nested form elements using ELEMENT_VALUE:
  const valueMatches: Map<string, boolean> = new Map()
  matchElementsTagRegex(
    {
      text,
      excludeNestedElements: false,
      useSubmissionValue: true,
    },
    ({ elementName }) => {
      const [repeatableSetElementName, ...elementNames] = elementName.split('|')
      valueMatches.set(repeatableSetElementName, !!elementNames.length)
    },
  )

  if (valueMatches.size) {
    valueMatches.forEach((hasNestedFormElements, repeatableSetElementName) => {
      if (hasNestedFormElements) {
        // Attempt to create a new resource for each entry in the repeatable set.
        const entries = submission?.[repeatableSetElementName]
        if (Array.isArray(entries)) {
          const repeatableSetElement = findFormElement(
            formElements,
            (formElement) => {
              return (
                'name' in formElement &&
                formElement.name === repeatableSetElementName
              )
            },
          )
          if (
            repeatableSetElement &&
            'elements' in repeatableSetElement &&
            Array.isArray(repeatableSetElement.elements)
          ) {
            for (const entry of entries) {
              const replacedResource = prepareNestedInjectables(
                newResource,
                (resourceText) => {
                  return resourceText.replaceAll(
                    `{ELEMENT_VALUE:${repeatableSetElementName}|`,
                    '{ELEMENT_VALUE:',
                  )
                },
              )
              const nestedResources = processInjectablesInCustomResource<T>({
                resource: replacedResource,
                submission: entry,
                formElements: repeatableSetElement.elements,
                replaceRootInjectables,
                prepareNestedInjectables,
              })
              if (nestedResources.size) {
                nestedResources.forEach((nestedResource, nestedResourceKey) => {
                  if (!newResources.has(nestedResourceKey)) {
                    newResources.set(nestedResourceKey, nestedResource)
                  }
                })
              }
            }
          }
        }
      }
    })
  }

  if (!matches.size && !valueMatches.size) {
    newResources.set(resourceKey, newResource)
  }

  return newResources
}
