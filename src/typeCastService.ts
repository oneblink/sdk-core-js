import { FormTypes, SubmissionEventTypes } from '@oneblink/types'

const toOptionsElement = (
  e: FormTypes.FormElement,
): FormTypes.FormElementWithOptions | undefined => {
  switch (e.type) {
    case 'freshdeskDependentField':
    case 'select':
    case 'compliance':
    case 'radio':
    case 'autocomplete':
    case 'checkboxes': {
      return e
    }
    default: {
      return
    }
  }
}

const toFormElementWithForm = (
  e: FormTypes.FormElement,
): FormTypes.FormElementWithForm | undefined => {
  switch (e.type) {
    case 'form':
    case 'infoPage': {
      return e
    }
    default: {
      return
    }
  }
}

const toFormElementWithoutForm = (
  e: FormTypes.FormElement,
): FormTypes.FormElementWithoutForm | undefined => {
  switch (e.type) {
    case 'form':
    case 'infoPage': {
      return
    }
    default: {
      return e
    }
  }
}

const toLookupElement = (
  e: FormTypes.FormElement,
): FormTypes.LookupFormElement | undefined => {
  switch (e.type) {
    case 'freshdeskDependentField':
    case 'boolean':
    case 'checkboxes':
    case 'date':
    case 'datetime':
    case 'files':
    case 'location':
    case 'number':
    case 'compliance':
    case 'radio':
    case 'select':
    case 'text':
    case 'textarea':
    case 'time':
    case 'barcodeScanner':
    case 'email':
    case 'telephone':
    case 'pointAddress':
    case 'geoscapeAddress':
    case 'civicaStreetName':
    case 'bsb':
    case 'autocomplete':
    case 'abn':
    case 'apiNSWLiquorLicence':
    case 'googleAddress':
    case 'arcGISWebMap': {
      return e
    }
    default: {
      return
    }
  }
}

const toNestedElementsElement = (
  e: FormTypes.FormElement,
): FormTypes.NestedElementsElement | undefined => {
  switch (e.type) {
    case 'repeatableSet':
    case 'section':
    case 'page': {
      return e
    }
    default: {
      return
    }
  }
}

const toNamelessElement = (
  e: FormTypes.FormElement,
): FormTypes.FormElementWithoutName | undefined => {
  switch (e.type) {
    case 'section':
    case 'page': {
      return e
    }
    default: {
      return
    }
  }
}

function toNamedElement(
  e: FormTypes.FormElement,
): FormTypes.FormElementWithName | undefined {
  switch (e.type) {
    case 'page':
    case 'section': {
      return undefined
    }
    default: {
      return e
    }
  }
}

export type NonNestedElementsFormElement =
  | FormTypes.NonNestedElementsElement
  | FormTypes.FormElementWithForm
const toNonNestedElementsElement = (
  e: FormTypes.FormElement,
): NonNestedElementsFormElement | undefined => {
  switch (e.type) {
    case 'repeatableSet':
    case 'section':
    case 'page': {
      return
    }
    default: {
      return e
    }
  }
}

const toPageElement = (
  e: FormTypes.FormElement,
): FormTypes.PageElement | undefined => {
  switch (e.type) {
    case 'page': {
      return e
    }
    default: {
      return
    }
  }
}

const toRepeatableSetElement = (
  e: FormTypes.FormElement,
): FormTypes.RepeatableSetElement | undefined => {
  switch (e.type) {
    case 'repeatableSet': {
      return e
    }
    default: {
      return
    }
  }
}

const toStorageElement = (
  e: FormTypes.FormElement,
): FormTypes.StorageElement | undefined => {
  switch (e.type) {
    case 'files':
    case 'draw':
    case 'compliance':
    case 'camera': {
      return e
    }
    default: {
      return
    }
  }
}

const toAutoLookupElement = (e: FormTypes.FormElement) => {
  switch (e.type) {
    case 'radio':
    case 'boolean':
    case 'files':
    case 'location':
    case 'geoscapeAddress':
    case 'pointAddress':
    case 'compliance':
    case 'civicaStreetName':
    case 'autocomplete':
    case 'apiNSWLiquorLicence':
    case 'arcGISWebMap': {
      return e
    }
    default: {
      return
    }
  }
}

const formElements = {
  toOptionsElement,
  toFormElementWithForm,
  toFormElementWithoutForm,
  toLookupElement,
  toNestedElementsElement,
  toNamelessElement,
  toNamedElement,
  toNonNestedElementsElement,
  toPageElement,
  toRepeatableSetElement,
  toStorageElement,
  toAutoLookupElement,
}

const toPaymentSubmissionEvent = (
  e: SubmissionEventTypes.FormEvent,
): SubmissionEventTypes.FormPaymentEvent | undefined => {
  switch (e.type) {
    case 'BPOINT':
    case 'CP_PAY':
    case 'WESTPAC_QUICK_STREAM':
    case 'NSW_GOV_PAY': {
      return e
    }
    default: {
      return
    }
  }
}

const submissionEvents = {
  toPaymentSubmissionEvent,
}

export { formElements, submissionEvents }
