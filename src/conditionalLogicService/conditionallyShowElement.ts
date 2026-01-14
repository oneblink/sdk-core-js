import { FormTypes, ConditionTypes } from '@oneblink/types'
import { FormElementsCtrl } from './types.js'
import evaluateConditionalPredicate from './evaluateConditionalPredicate.js'

const getParentFormElements = (
  formElementsCtrl: FormElementsCtrl,
  childElement: FormTypes.FormElement,
): Array<FormTypes.SectionElement | FormTypes.PageElement> => {
  const parentElement = formElementsCtrl.flattenedElements.find((element) => {
    return (
      (element.type === 'page' || element.type === 'section') &&
      element.elements.some(({ id }) => id === childElement.id)
    )
  })
  if (
    parentElement &&
    (parentElement.type === 'page' || parentElement.type === 'section')
  ) {
    return [
      parentElement,
      ...getParentFormElements(formElementsCtrl, parentElement),
    ]
  }
  return []
}

export function conditionallyShowByPredicate(
  formElementsCtrl: FormElementsCtrl,
  predicate: ConditionTypes.ConditionalPredicate,
  elementsEvaluated: Array<{ id: string; label: string }>,
): boolean {
  const predicateElement = evaluateConditionalPredicate({
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
      !conditionallyShowElement(formElementsCtrl, parentFormElement, [
        ...elementsEvaluated,
      ])
    ) {
      return false
    }
  }

  // Check to see if the model has one of the valid values to show the element
  return conditionallyShowElement(
    formElementsCtrl,
    predicateElement,
    elementsEvaluated,
  )
}

export default function conditionallyShowElement(
  formElementsCtrl: FormElementsCtrl,
  elementToEvaluate: FormTypes.FormElement,
  elementsEvaluated: Array<{ id: string; label: string }>,
): boolean {
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
    predicate: ConditionTypes.ConditionalPredicate,
  ) => {
    // Spread the array of elements evaluated so that each predicate can
    // evaluate the tree without causing false positives for infinite
    // loop conditional logic
    return conditionallyShowByPredicate(formElementsCtrl, predicate, [
      ...elementsEvaluated,
    ])
  }

  if (elementToEvaluate.requiresAllConditionallyShowPredicates) {
    return conditionallyShowPredicates.every(predicateFunction)
  } else {
    return conditionallyShowPredicates.some(predicateFunction)
  }
}
