import { FormTypes, ConditionTypes } from '@oneblink/types'
import { FormElementsCtrl } from './types.js'
import evaluateFormElementConditionalPredicate from './evaluateFormElementConditionalPredicate.js'

// A `FormElementsCtrl` is never mutated after it is created, so results can be
// cached against it. Without caching, forms that chain pages together (e.g.
// page N is shown based on an element on page N - 1) re-evaluate every previous
// page for each predicate, which grows exponentially with the number of pages.
const parentElementsCache = new WeakMap<
  FormElementsCtrl,
  Map<string, FormTypes.SectionElement | FormTypes.PageElement>
>()
const conditionallyShownCache = new WeakMap<
  FormElementsCtrl,
  Map<FormTypes.FormElement, boolean>
>()

const getParentElementsById = (formElementsCtrl: FormElementsCtrl) => {
  let parentElementsById = parentElementsCache.get(formElementsCtrl)
  if (!parentElementsById) {
    parentElementsById = new Map()
    for (const element of formElementsCtrl.flattenedElements) {
      if (element.type === 'page' || element.type === 'section') {
        for (const { id } of element.elements) {
          if (!parentElementsById.has(id)) {
            parentElementsById.set(id, element)
          }
        }
      }
    }
    parentElementsCache.set(formElementsCtrl, parentElementsById)
  }
  return parentElementsById
}

const getParentFormElements = (
  formElementsCtrl: FormElementsCtrl,
  childElement: FormTypes.FormElement,
): Array<FormTypes.SectionElement | FormTypes.PageElement> => {
  const parentElement = getParentElementsById(formElementsCtrl).get(
    childElement.id,
  )
  if (parentElement) {
    return [
      parentElement,
      ...getParentFormElements(formElementsCtrl, parentElement),
    ]
  }
  return []
}

export function conditionallyShowByPredicate({
  formElementsCtrl,
  predicate,
  elementsEvaluated,
}: {
  formElementsCtrl: FormElementsCtrl
  predicate: ConditionTypes.FormElementConditionalPredicate
  elementsEvaluated: Array<{ id: string; label: string }>
}): boolean {
  const predicateElement = evaluateFormElementConditionalPredicate({
    predicate,
    formElementsCtrl,
  })

  if (!predicateElement) {
    return false
  }

  // Here we will also need to check if the predicate element
  // is on a page/section element and the page/section element
  // is also hidden. If it is hidden we will treat this
  // predicate element as hidden as well.
  const parentFormElements = getParentFormElements(
    formElementsCtrl,
    predicateElement,
  )
  for (const parentFormElement of parentFormElements) {
    if (
      !conditionallyShowElement({
        formElementsCtrl,
        elementToEvaluate: parentFormElement,
        elementsEvaluated: [...elementsEvaluated],
      })
    ) {
      return false
    }
  }

  // Check to see if the model has one of the valid values to show the element
  return conditionallyShowElement({
    formElementsCtrl,
    elementToEvaluate: predicateElement,
    elementsEvaluated,
  })
}

export default function conditionallyShowElement({
  formElementsCtrl,
  elementToEvaluate,
  elementsEvaluated,
}: {
  formElementsCtrl: FormElementsCtrl
  elementToEvaluate: FormTypes.FormElement
  elementsEvaluated: Array<{ id: string; label: string }>
}): boolean {
  // If the element does not have the `conditionallyShow` flag set,
  // we can always show the element.
  if (
    !elementToEvaluate ||
    !elementToEvaluate.conditionallyShow ||
    !Array.isArray(elementToEvaluate.conditionallyShowPredicates) ||
    !elementToEvaluate.conditionallyShowPredicates.length
  ) {
    return true
  }
  const conditionallyShowPredicates =
    elementToEvaluate.conditionallyShowPredicates

  let conditionallyShownByElement =
    conditionallyShownCache.get(formElementsCtrl)
  if (!conditionallyShownByElement) {
    conditionallyShownByElement = new Map()
    conditionallyShownCache.set(formElementsCtrl, conditionallyShownByElement)
  }
  const cachedResult = conditionallyShownByElement.get(elementToEvaluate)
  if (cachedResult !== undefined) {
    return cachedResult
  }

  // Check to see if this element has already been used to evaluate
  // if the element should be shown based on parent element conditional logic
  const elementAlreadyEvaluated = elementsEvaluated.find(
    ({ id }) => id === elementToEvaluate.id,
  )
  if (elementAlreadyEvaluated) {
    throw new Error(
      `Your conditional logic has caused an infinite loop. Check the "${elementAlreadyEvaluated.label}" form element to ensure element A does not rely on element B if element B also relies on element A.`,
    )
  } else {
    elementsEvaluated.push({
      id: elementToEvaluate.id,
      label:
        'label' in elementToEvaluate
          ? elementToEvaluate.label
          : elementToEvaluate.name,
    })
  }

  const predicateFunction = (
    predicate: ConditionTypes.FormElementConditionalPredicate,
  ) => {
    // Spread the array of elements evaluated so that each predicate can
    // evaluate the tree without causing false positives for infinite
    // loop conditional logic
    return conditionallyShowByPredicate({
      formElementsCtrl,
      predicate,
      elementsEvaluated: [...elementsEvaluated],
    })
  }

  const result = elementToEvaluate.requiresAllConditionallyShowPredicates
    ? conditionallyShowPredicates.every(predicateFunction)
    : conditionallyShowPredicates.some(predicateFunction)
  conditionallyShownByElement.set(elementToEvaluate, result)
  return result
}
