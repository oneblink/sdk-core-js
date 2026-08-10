import { FormTypes } from '@oneblink/types'
import { typeCastService } from './index.js'
export { matchElementsTagRegex } from './form-elements-regex.js'

/**
 * Iterate over all form elements, also iterating over nested form element (e.g.
 * page elements).
 *
 * #### Example
 *
 * ```js
 * formElementsService.forEachFormElement(form.elements, (formElement) => {
 *   // do something with formElement
 * })
 * ```
 *
 * @param elements The form elements to iterate over
 * @param forEach Function to execute on each form element
 */
function forEachFormElement(
  elements: FormTypes.FormElement[],
  forEach: (
    element: FormTypes.FormElement,
    elements: FormTypes.FormElement[],
  ) => void,
): void {
  findFormElement(elements, (formElement, parentElements) => {
    forEach(formElement, parentElements)
    return false
  })
}

/**
 * Iterate over all form elements that have options (e.g. `'select'` type
 * elements), also iterating over nested form element (e.g. page elements).
 *
 * #### Example
 *
 * ```js
 * formElementsService.forEachFormElementWithOptions(
 *   form.elements,
 *   (formElementWithOptions) => {
 *     // do something with formElementWithOptions
 *   },
 * )
 * ```
 *
 * @param elements The form elements to iterate over
 * @param forEach Function to execute on each form element with options
 */
function forEachFormElementWithOptions(
  elements: FormTypes.FormElement[],
  forEach: (
    elementWithOptions: FormTypes.FormElementWithOptions,
    elements: FormTypes.FormElement[],
  ) => void,
): void {
  findFormElement(elements, (formElement, parentElements) => {
    const optionsFormElement =
      typeCastService.formElements.toOptionsElement(formElement)
    if (optionsFormElement) {
      forEach(optionsFormElement, parentElements)
    }
    return false
  })
}

/**
 * Iterate over all form elements and return an element that matches a
 * predicate, also iterating over nested form element (e.g. page elements). Will
 * return `undefined` if no matching element is found.
 *
 * #### Example
 *
 * ```js
 * const formElement = formElementsService.findFormElement(
 *   form.elements,
 *   (formElement) => {
 *     return formElement.id === '123-abc'
 *   },
 * )
 * ```
 *
 * @param elements The form elements to iterate over
 * @param predicate Predicate function to execute on each form element
 * @param parentElements
 * @returns
 */
function findFormElement(
  elements: FormTypes.FormElement[],
  predicate: (
    element: FormTypes.FormElement,
    elements: FormTypes.FormElement[],
  ) => boolean,
  parentElements: FormTypes.FormElement[] = [],
): FormTypes.FormElement | undefined {
  for (const element of elements) {
    if (predicate(element, parentElements)) {
      return element
    }

    if (
      (element.type === 'repeatableSet' ||
        element.type === 'page' ||
        element.type === 'form' ||
        element.type === 'infoPage' ||
        element.type === 'section') &&
      Array.isArray(element.elements)
    ) {
      const nestedElement = findFormElement(element.elements, predicate, [
        ...parentElements,
        element,
      ])

      if (nestedElement) {
        return nestedElement
      }
    }
  }
}

/**
 * Parse unknown data as valid dynamic options for a forms element. This will
 * always return an Array of valid dynamic options.
 *
 * #### Example
 *
 * ```js
 * const options = formElementsService.parseDynamicFormElementOptions(data)
 * // "options" are valid for a form element
 * ```
 *
 * @param data
 * @returns
 */
function parseDynamicFormElementOptions(
  data: unknown,
): FormTypes.DynamicChoiceElementOption[] {
  if (!Array.isArray(data)) {
    return []
  }
  return data.reduce<FormTypes.DynamicChoiceElementOption[]>(
    (options, record, index) => {
      if (typeof record === 'string') {
        options.push({
          value: record,
          label: record,
        })
      } else if (typeof record === 'object') {
        const option = record as Record<string, unknown>
        const value =
          typeof option.value === 'string' && option.value
            ? option.value
            : index.toString()
        const label =
          typeof option.label === 'string' && option.label
            ? option.label
            : value
        const colour =
          typeof option.colour === 'string' && option.colour
            ? option.colour
            : undefined
        const displayAlways =
          typeof option.displayAlways === 'boolean'
            ? option.displayAlways
            : undefined
        const imageUrl =
          typeof option.imageUrl === 'string' && option.imageUrl
            ? option.imageUrl
            : undefined
        const attributes = Array.isArray(option.attributes)
          ? option.attributes.reduce<
              FormTypes.DynamicChoiceElementOptionAttribute[]
            >((memo, attribute: unknown) => {
              if (
                typeof attribute === 'object' &&
                attribute &&
                'value' in attribute &&
                typeof attribute.value === 'string' &&
                'label' in attribute &&
                typeof attribute.label === 'string'
              ) {
                memo.push({
                  value: attribute.value,
                  label: attribute.label,
                })
              }
              return memo
            }, [])
          : undefined
        options.push({
          value,
          label,
          colour,
          attributes,
          displayAlways,
          imageUrl,
          options: Array.isArray(option.options)
            ? parseDynamicFormElementOptions(option.options)
            : undefined,
        })
      }
      return options
    },
    [],
  )
}

/**
 * Takes the nested definition structure and returns all form elements as 1d
 * array.
 *
 * #### Example
 *
 * ```js
 * const flattenedElements = formElementsService.flattenFormElements(
 *   form.elements,
 * )
 * ```
 *
 * @param elements
 * @returns
 */
function flattenFormElements(
  elements: FormTypes.FormElement[],
): FormTypes.FormElement[] {
  return elements.reduce<FormTypes.FormElement[]>(
    (flattenedElements, element) => {
      flattenedElements.push(element)
      switch (element.type) {
        case 'section':
        case 'page': {
          flattenedElements.push(...flattenFormElements(element.elements))
        }
      }
      return flattenedElements
    },
    [],
  )
}

const infoPageElements: FormTypes.FormElementType[] = [
  'heading',
  'html',
  'image',
  'section',
  'page',
  'infoPage',
  'form',
]
/**
 * Determine a form is considered an info page. This means the form does not
 * allow any user input.
 *
 * @param form
 * @returns
 */
function determineIsInfoPage(form: FormTypes.Form): boolean {
  const foundInputElement = findFormElement(form.elements, (e) => {
    return !infoPageElements.includes(e.type)
  })
  return !foundInputElement
}

/**
 * Remove invalid characters from a form element name.
 *
 * @param elementName
 * @returns
 */
const fixElementName = (elementName: string) => {
  // removes characters that aren't letters, numbers, underscores or dashes
  // replaces empty spaces with _
  return elementName
    .replace(/[^-\w\s]/g, '')
    .replace(/\s/g, '_')
    .trim()
}

/**
 * Injects the elements of any elements with type `FORM` or `INFOPAGE` into the
 * form
 *
 * @param form The form to inject elements into
 * @param forms The forms that will be used to inject elements from if
 *   referenced
 * @param injectAuthenticatedForms Indicates whether forms requiring
 *   authentication should be injected, defaults to true
 * @returns
 */
function injectFormElementsIntoForm(
  form: FormTypes.Form,
  forms: FormTypes.Form[],
  injectAuthenticatedForms = true,
): FormTypes.FormElement[] {
  const elementsWithInjectedForms = injectFormElements(
    form.elements,
    forms,
    [form.id],
    injectAuthenticatedForms,
  )
  form.elements = elementsWithInjectedForms
  return form.elements
}

function injectFormElements(
  elements: FormTypes.FormElement[],
  forms: FormTypes.Form[],
  parentIds: number[],
  injectAuthenticatedForms: boolean,
): FormTypes.FormElement[] {
  return elements.reduce<FormTypes.FormElement[]>((newElements, element) => {
    if ('elements' in element && Array.isArray(element.elements)) {
      const childElements = injectFormElements(
        element.elements,
        forms,
        parentIds,
        injectAuthenticatedForms,
      )
      element.elements = childElements
    }

    if (element.type === 'form' || element.type === 'infoPage') {
      const resolved = resolveEmbeddedFormElement(
        element,
        forms.find((form) => element.formId === form.id),
        parentIds,
        injectAuthenticatedForms,
      )

      switch (resolved.type) {
        case 'replace': {
          newElements.push(resolved.element)
          break
        }
        case 'skip': {
          break
        }
        case 'continue': {
          element.elements = injectFormElements(
            resolved.form.elements,
            forms,
            [...parentIds, resolved.form.id],
            injectAuthenticatedForms,
          )
          newElements.push(element)
          break
        }
      }
    } else {
      newElements.push(element)
    }

    return newElements
  }, [])
}

type ResolveEmbeddedFormResult =
  | { type: 'replace'; element: FormTypes.HtmlElement }
  | { type: 'skip' }
  | { type: 'continue'; form: FormTypes.Form }

function resolveEmbeddedFormElement(
  element: FormTypes.FormFormElement,
  formToInject: FormTypes.Form | undefined,
  parentIds: number[],
  injectAuthenticatedForms: boolean,
): ResolveEmbeddedFormResult {
  if (!formToInject) {
    return {
      type: 'replace',
      element: {
        ...element,
        type: 'html',
        name: 'Form_not_found',
        label: 'Form not found.',
        defaultValue:
          'Unable to display the embedded form for this element, as the form was not found. Please contact your Administrator.',
      },
    }
  }

  if (formToInject.isAuthenticated && !injectAuthenticatedForms) {
    console.log(
      `No form elements injected for element id: ${element.id}, as request was unauthenticated and target form (form id: ${formToInject.id}) requires authentication.`,
    )

    return {
      type: 'replace',
      element: {
        ...element,
        type: 'html',
        name: 'Form_requires_authenticated',
        label: 'Form Requires Authentication.',
        defaultValue:
          'Unable to display the embedded form for this element, as the form requires authentication. Please login and refresh to view this embedded form.',
      },
    }
  }

  const injectingParentForm = parentIds.find((id) => element.formId === id)

  if (injectingParentForm) {
    console.log(
      `Infinite loop was detected while attempting to inject form id: ${injectingParentForm}. Ignoring elements...`,
    )
    return { type: 'skip' }
  }

  return { type: 'continue', form: formToInject }
}

/**
 * Async counterpart to {@link injectFormElementsIntoForm}. Injects embedded
 * `form` / `infoPage` elements for each form in `forms`. Uses `getForm` to load
 * embedded forms and caches results by id for the duration of the call so each
 * form is retrieved at most once across the whole batch.
 *
 * Mutates each form object in `forms` in place (the array entries are updated
 * by reference); nothing is returned.
 *
 * @param forms The forms to inject elements into (mutated in place)
 * @param getForm Retrieves a single form by id when it is referenced by a
 *   `form` / `infoPage` element
 * @param injectAuthenticatedForms Indicates whether forms requiring
 *   authentication should be injected, defaults to true
 */
async function injectFormElementsIntoForms(
  forms: FormTypes.Form[],
  getForm: (
    formId: number,
  ) =>
    | FormTypes.Form
    | undefined
    | void
    | Promise<FormTypes.Form | undefined | void>,
  injectAuthenticatedForms = true,
): Promise<void> {
  const formCache = new Map<number, FormTypes.Form | undefined>()

  const getFormCached = async (formId: number) => {
    if (formCache.has(formId)) {
      return formCache.get(formId)
    }
    const retrieved = (await getForm(formId)) ?? undefined
    formCache.set(formId, retrieved)
    return retrieved
  }

  for (const form of forms) {
    form.elements = await injectFormElementsAsync(
      form.elements,
      getFormCached,
      [form.id],
      injectAuthenticatedForms,
    )
  }
}

async function injectFormElementsAsync(
  elements: FormTypes.FormElement[],
  getForm: (formId: number) => Promise<FormTypes.Form | undefined>,
  parentIds: number[],
  injectAuthenticatedForms: boolean,
): Promise<FormTypes.FormElement[]> {
  const newElements: FormTypes.FormElement[] = []

  for (const element of elements) {
    if ('elements' in element && Array.isArray(element.elements)) {
      element.elements = await injectFormElementsAsync(
        element.elements,
        getForm,
        parentIds,
        injectAuthenticatedForms,
      )
    }

    if (element.type === 'form' || element.type === 'infoPage') {
      const form = await getForm(element.formId)
      const resolved = resolveEmbeddedFormElement(
        element,
        form,
        parentIds,
        injectAuthenticatedForms,
      )

      switch (resolved.type) {
        case 'replace': {
          newElements.push(resolved.element)
          break
        }
        case 'skip': {
          break
        }
        case 'continue': {
          element.elements = await injectFormElementsAsync(
            resolved.form.elements,
            getForm,
            [...parentIds, resolved.form.id],
            injectAuthenticatedForms,
          )
          newElements.push(element)
          break
        }
      }
    } else {
      newElements.push(element)
    }
  }

  return newElements
}

export {
  forEachFormElement,
  forEachFormElementWithOptions,
  findFormElement,
  parseDynamicFormElementOptions,
  flattenFormElements,
  determineIsInfoPage,
  fixElementName,
  injectFormElementsIntoForm,
  injectFormElementsIntoForms,
}
