import { FormTypes, SubmissionTypes } from '@oneblink/types'
import evaluateConditionalOptionsPredicate from './evaluateConditionalOptionsPredicate'
import { FormElementsCtrl } from '../types'
import { typeCastService } from '..'
import conditionallyShowElement from './conditionallyShowElement'

const handleAttributePredicate = (
  predicate: FormTypes.ChoiceElementOptionAttribute,
  model: SubmissionTypes.S3SubmissionData['submission'],
  predicateElement: FormTypes.FormElementWithOptions,
) => {
  const values = model[predicateElement.name]
  if (!values) return true

  if (
    Array.isArray(values) &&
    (!values.length ||
      !values.filter((value) => typeof value !== 'undefined').length)
  ) {
    return true
  }

  return evaluateConditionalOptionsPredicate({
    predicate: {
      type: 'OPTIONS',
      elementId: predicate.elementId,
      optionIds: predicate.optionIds,
    },
    predicateValue: values,
    predicateElement,
  })
}

const conditionallyShowOptionByPredicate = (
  formElementsCtrl: FormElementsCtrl,
  predicate: FormTypes.ChoiceElementOptionAttribute,
  elementsEvaluated: string[],
): boolean => {
  // Validate the predicate data, if it is invalid,
  // we will always show the field
  if (
    !predicate ||
    !predicate.elementId ||
    !predicate.optionIds ||
    !predicate.optionIds.length
  ) {
    return true
  }

  const predicateElement = formElementsCtrl.flattenedElements.find(
    (element) => {
      return element.id === predicate.elementId
    },
  )

  // If we cant find the element used for the predicate,
  // we can check to see if the element being evaluated
  // is in a repeatable set and the predicate element is
  // in a parent list of elements.
  if (!predicateElement) {
    if (formElementsCtrl.parentFormElementsCtrl) {
      return conditionallyShowOptionByPredicate(
        formElementsCtrl.parentFormElementsCtrl,
        predicate,
        elementsEvaluated,
      )
    } else {
      return false
    }
  }

  const optionsPredicateElement =
    typeCastService.formElements.toOptionsElement(predicateElement)
  if (!optionsPredicateElement) {
    return false
  }

  // If the predicate element does not have any options to evaluate,
  // we will show the element.
  // Unless the predicate element has dynamic options and
  // options have not been fetched yet.
  if (!Array.isArray(optionsPredicateElement.options)) {
    return optionsPredicateElement.optionsType !== 'DYNAMIC'
  }

  const everyOptionIsShowing = predicate.optionIds.every((id) => {
    const predicateOption = optionsPredicateElement.options?.find(
      (o) => o.id === id,
    )
    if (!predicateOption) return false

    return conditionallyShowOption(
      { model: formElementsCtrl.model, flattenedElements: [] },
      optionsPredicateElement,
      predicateOption,
      elementsEvaluated,
    )
  })

  if (!everyOptionIsShowing) {
    return false
  }

  // Check to see if the model has one of the valid values to show the element
  return handleAttributePredicate(
    predicate,
    formElementsCtrl.model,
    optionsPredicateElement,
  )
}

const isAttributeFilterValid = (
  formElementsCtrl: FormElementsCtrl,
  predicate: FormTypes.ChoiceElementOptionAttribute,
  elementsEvaluated: string[],
): boolean => {
  const predicateElement = formElementsCtrl.flattenedElements.find(
    (element) => {
      return element.id === predicate.elementId
    },
  )

  // If we cant find the element used for the predicate,
  // we can check to see if the element being evaluated
  // is in a repeatable set and the predicate element is
  // in a parent list of elements.
  if (!predicateElement) {
    if (formElementsCtrl.parentFormElementsCtrl) {
      return isAttributeFilterValid(
        formElementsCtrl.parentFormElementsCtrl,
        predicate,
        elementsEvaluated,
      )
    } else {
      return false
    }
  }

  // now we have the model and predicate element, verify that the predicate element
  // is not hidden
  if (
    // Will never be a page, just making typescript happy :)
    predicateElement.type === 'page' ||
    predicateElement.type === 'section' ||
    !conditionallyShowElement(formElementsCtrl, predicateElement, [])
  ) {
    return false
  }

  // verify that at least one option is selected
  const values = formElementsCtrl.model[predicateElement.name]
  if (!values) return false
  // if the model value is an array, verify that it has a selection
  if (
    Array.isArray(values) &&
    (!values.length ||
      !values.filter((value) => typeof value !== 'undefined').length)
  ) {
    return false
  }

  return true
}

export default function conditionallyShowOption(
  formElementsCtrl: FormElementsCtrl,
  elementToEvaluate: FormTypes.FormElementWithOptions,
  optionToEvaluate: FormTypes.ChoiceElementOption,
  optionsEvaluated: string[],
): boolean {
  // If the element does not have the `conditionallyShow` flag set,
  // we can always show the element.

  if (
    !elementToEvaluate.conditionallyShowOptions ||
    !optionToEvaluate ||
    !optionToEvaluate.attributes ||
    !Array.isArray(optionToEvaluate.attributes) ||
    !optionToEvaluate.attributes.length
  ) {
    return true
  }

  // Check to see if this element has already been used to evaluate
  // if the element should be shown based on parent element conditional logic
  if (optionsEvaluated.some((optionId) => optionId === optionToEvaluate.id)) {
    throw new Error(
      'Your conditional logic has caused an infinite loop. Check the following Fields to ensure element A does not rely on element B if element B also relies on element A.',
    )
  } else {
    optionsEvaluated.push(optionToEvaluate.id)
  }

  const validPredicates = (optionToEvaluate.attributes || []).filter(
    (predicate) => {
      return isAttributeFilterValid(
        formElementsCtrl,
        predicate,
        optionsEvaluated,
      )
    },
  )

  if (!validPredicates.length) return true
  return validPredicates.some((predicate) =>
    conditionallyShowOptionByPredicate(
      formElementsCtrl,
      predicate,
      optionsEvaluated,
    ),
  )
}
