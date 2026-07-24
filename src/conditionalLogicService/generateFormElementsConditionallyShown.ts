import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { FormElementsCtrl } from './types.js'
import { flattenFormElements } from '../formElementsService.js'
import conditionallyShowElement from './conditionallyShowElement.js'
import conditionallyShowOption, {
  ShouldShowOption,
} from './conditionallyShowOption.js'
import { typeCastService } from '../index.js'
import evaluateFormElementConditionalPredicate from './evaluateFormElementConditionalPredicate.js'

export type FormElementsConditionallyShown = Record<
  string,
  FormElementConditionallyShown
>

export type FormElementConditionallyShownElement = {
  type: 'formElement'
  isHidden: boolean
  options?: FormTypes.ChoiceElementOption[]
  dependencyIsLoading?: boolean
}

export type FormElementConditionallyShown =
  | undefined
  | FormElementConditionallyShownElement
  | {
      type: 'formElements'
      isHidden: boolean
      formElements: FormElementsConditionallyShown | undefined
    }
  | {
      type: 'repeatableSet'
      isHidden: boolean
      entries: Record<string, FormElementsConditionallyShown | undefined>
    }

export type ErrorCallback = (error: Error) => void

const handleConditionallyShowElement = ({
  formElementsCtrl,
  element,
  errorCallback,
}: {
  formElementsCtrl: FormElementsCtrl
  element: FormTypes.FormElement
  errorCallback: ErrorCallback | undefined
}) => {
  try {
    return conditionallyShowElement({
      formElementsCtrl,
      elementToEvaluate: element,
      elementsEvaluated: [],
    })
  } catch (error) {
    errorCallback?.(error as Error)
    return false
  }
}

const handleConditionallyShowOption = ({
  formElementsCtrl,
  element,
  option,
  errorCallback,
}: {
  formElementsCtrl: FormElementsCtrl
  element: FormTypes.FormElementWithOptions
  option: FormTypes.ChoiceElementOption
  errorCallback: ErrorCallback | undefined
}): ShouldShowOption => {
  try {
    return conditionallyShowOption({
      formElementsCtrl,
      elementToEvaluate: element,
      optionToEvaluate: option,
      optionsEvaluated: [],
    })
  } catch (error) {
    errorCallback?.(error as Error)
    return 'HIDE'
  }
}

export type FormElementsConditionallyShownParameters = {
  /** Form elements to evaluate */
  formElements: FormTypes.FormElement[]
  /** Current submission data */
  submission: SubmissionTypes.S3SubmissionData['submission']
  /** Optional callback for handling errors caught during the evaluation */
  errorCallback?: ErrorCallback
  /** Conditionally enable form submission based on predicates */
  enableSubmission: FormTypes.Form['enableSubmission'] | undefined
}

export type FormElementsConditionallyShownResult = {
  formElementsConditionallyShown: FormElementsConditionallyShown
  isSubmissionEnabled: boolean
}

const generateFormElementsConditionallyShownWithParent = ({
  formElements,
  submission,
  parentFormElementsCtrl,
  errorCallback,
}: {
  formElements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
  errorCallback: ErrorCallback | undefined
  parentFormElementsCtrl: FormElementsCtrl['parentFormElementsCtrl'] | undefined
}): FormElementsConditionallyShown => {
  const formElementsCtrl = {
    flattenedElements: flattenFormElements(formElements),
    model: submission,
    parentFormElementsCtrl,
  }
  return formElementsCtrl.flattenedElements.reduce<FormElementsConditionallyShown>(
    (formElementsConditionallyShown, element) => {
      switch (element.type) {
        case 'section':
        case 'page': {
          const formElementConditionallyShown =
            formElementsConditionallyShown[element.id]
          const isHidden = formElementConditionallyShown
            ? formElementConditionallyShown.isHidden
            : !handleConditionallyShowElement({
                formElementsCtrl,
                element,
                errorCallback,
              })

          formElementsConditionallyShown[element.id] = {
            type: 'formElement',
            isHidden,
          }

          // If the parent element is hidden, hide all the child elements
          if (isHidden) {
            element.elements.forEach((childElement) => {
              switch (childElement.type) {
                case 'section':
                case 'page': {
                  formElementsConditionallyShown[childElement.id] = {
                    type: 'formElement',
                    isHidden: true,
                  }
                  break
                }
                default: {
                  formElementsConditionallyShown[childElement.name] = {
                    type: 'formElement',
                    isHidden: true,
                  }
                }
              }
            })
          }
          break
        }
        case 'infoPage':
        case 'form': {
          if (formElementsConditionallyShown[element.name]) {
            break
          }
          const nestedModel = submission[element.name] as
            | SubmissionTypes.S3SubmissionData['submission']
            | undefined
          formElementsConditionallyShown[element.name] = {
            type: 'formElements',
            isHidden: !handleConditionallyShowElement({
              formElementsCtrl,
              element,
              errorCallback,
            }),
            formElements: generateFormElementsConditionallyShownWithParent({
              formElements: element.elements || [],
              submission: nestedModel || {},
              parentFormElementsCtrl: formElementsCtrl,
              errorCallback,
            }),
          }
          break
        }
        case 'repeatableSet': {
          if (formElementsConditionallyShown[element.name]) {
            break
          }
          const entries = formElementsCtrl.model?.[element.name] as
            | Array<SubmissionTypes.S3SubmissionData['submission']>
            | undefined
          formElementsConditionallyShown[element.name] = {
            type: 'repeatableSet',
            isHidden: !handleConditionallyShowElement({
              formElementsCtrl,
              element,
              errorCallback,
            }),
            entries: (entries || []).reduce(
              (
                result: Record<
                  string,
                  FormElementsConditionallyShown | undefined
                >,
                entry,
                index,
              ) => {
                result[index.toString()] =
                  generateFormElementsConditionallyShownWithParent({
                    formElements: element.elements,
                    submission: entry,
                    parentFormElementsCtrl: formElementsCtrl,
                    errorCallback,
                  })
                return result
              },
              {},
            ),
          }
          break
        }
        default: {
          if (formElementsConditionallyShown[element.name]) {
            break
          }
          const formElementConditionallyShown: FormElementConditionallyShown = {
            type: 'formElement',
            isHidden: !handleConditionallyShowElement({
              formElementsCtrl,
              element,
              errorCallback,
            }),
          }

          if (!formElementConditionallyShown.isHidden) {
            const optionsElement =
              typeCastService.formElements.toOptionsElement(element)
            if (
              optionsElement &&
              optionsElement.conditionallyShowOptions &&
              Array.isArray(optionsElement.options)
            ) {
              const newOptions = []
              for (const option of optionsElement.options) {
                const optionPredicatesResult = handleConditionallyShowOption({
                  formElementsCtrl,
                  element: optionsElement,
                  option,
                  errorCallback,
                })
                switch (optionPredicatesResult) {
                  case 'SHOW': {
                    newOptions.push(option)
                    break
                  }
                  case 'LOADING_STATIC_DEPENDENCY': {
                    newOptions.push(option)
                    formElementConditionallyShown.dependencyIsLoading = true
                    break
                  }
                  case 'LOADING_DYNAMIC_DEPENDENCY': {
                    formElementConditionallyShown.dependencyIsLoading = true
                    break
                  }
                }
              }
              formElementConditionallyShown.options = newOptions
            }
          }

          formElementsConditionallyShown[element.name] =
            formElementConditionallyShown
        }
      }

      return formElementsConditionallyShown
    },
    {},
  )
}

/**
 * Given form elements and submission data, evaluate which elements are
 * currently shown and whether submission is enabled. The function also takes an
 * optional errorCallback for handling errors caught during the evaluation.
 *
 * #### Example
 *
 * ```js
 * const { formElementsConditionallyShown, isSubmissionEnabled } =
 *   conditionalLogicService.generateFormElementsConditionallyShown({
 *     submission: {
 *       radio: ['hide'],
 *       text: 'hidden text',
 *     },
 *     formElements: [
 *       {
 *         name: 'radio',
 *         label: 'Radio',
 *         type: 'radio',
 *         required: false,
 *         id: '5ef3beb8-8ac8-4c8d-9fd3-d8197113bf54',
 *         conditionallyShow: false,
 *         options: [
 *           {
 *             id: '9a44e15a-5929-419d-825e-b3dc0a29591f',
 *             label: 'Show',
 *             value: 'show',
 *           },
 *           {
 *             id: 'd776ed42-072c-4bf8-9879-874b2bef85d3',
 *             label: 'Hide',
 *             value: 'Hide',
 *           },
 *         ],
 *         readOnly: false,
 *         isDataLookup: false,
 *         isElementLookup: false,
 *         buttons: false,
 *         optionsType: 'CUSTOM',
 *         conditionallyShowOptions: false,
 *       },
 *       {
 *         name: 'text',
 *         label: 'Text',
 *         type: 'text',
 *         required: false,
 *         id: '8fbddb41-348d-494c-904b-56a2c4361f13',
 *         requiresAllConditionallyShowPredicates: false,
 *         conditionallyShow: true,
 *         conditionallyShowPredicates: [
 *           {
 *             elementId: '5ef3beb8-8ac8-4c8d-9fd3-d8197113bf54',
 *             optionIds: ['9a44e15a-5929-419d-825e-b3dc0a29591f'],
 *             type: 'OPTIONS',
 *           },
 *         ],
 *         readOnly: false,
 *         isDataLookup: false,
 *         isElementLookup: false,
 *       },
 *     ],
 *     errorCallback: (error) => {
 *       //do something with the error here
 *       console.error(error)
 *     },
 *   })
 * ```
 *
 * The above example returns an object like below
 *
 * ```json
 * {
 *   "formElementsConditionallyShown": {
 *     "radio": {
 *       "isHidden": false,
 *       "type": "formElement"
 *     },
 *     "text": {
 *       "isHidden": true,
 *       "type": "formElement"
 *     }
 *   },
 *   "isSubmissionEnabled": true
 * }
 * ```
 *
 * @param parameters
 * @returns
 */
export function generateFormElementsConditionallyShown({
  formElements,
  submission,
  errorCallback,
  enableSubmission,
}: FormElementsConditionallyShownParameters): FormElementsConditionallyShownResult {
  const formElementsConditionallyShown =
    generateFormElementsConditionallyShownWithParent({
      formElements,
      submission,
      errorCallback,
      parentFormElementsCtrl: undefined,
    })

  if (!enableSubmission?.conditionalPredicates.length) {
    return {
      formElementsConditionallyShown,
      isSubmissionEnabled: true,
    }
  }

  const formElementsCtrl: FormElementsCtrl = {
    flattenedElements: flattenFormElements(formElements),
    model: submission,
  }

  const predicateFn = (
    predicate: NonNullable<
      FormTypes.Form['enableSubmission']
    >['conditionalPredicates'][number],
  ) => {
    try {
      const predicateElement = evaluateFormElementConditionalPredicate({
        predicate,
        formElementsCtrl,
      })
      if (!predicateElement) {
        return false
      }

      // Reuse visibility already computed above instead of re-evaluating
      // conditionally show predicates for the predicate element / parents.
      const shown = formElementsConditionallyShown[predicateElement.name]
      return !!shown && !shown.isHidden
    } catch (error) {
      errorCallback?.(error as Error)
      return false
    }
  }

  const isSubmissionEnabled = enableSubmission.requiresAllConditionalPredicates
    ? enableSubmission.conditionalPredicates.every(predicateFn)
    : enableSubmission.conditionalPredicates.some(predicateFn)

  return {
    formElementsConditionallyShown,
    isSubmissionEnabled,
  }
}
