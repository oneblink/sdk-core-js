import { describe, expect, it } from 'vitest'
import {
  FormTypes,
  SubmissionEventTypes,
  SubmissionTypes,
} from '@oneblink/types'
import { paymentService } from '../src'

describe('checkForPaymentEvent', () => {
  const amountElementId = 'amount-element-id'
  const amountElement: FormTypes.NumberElement = {
    id: amountElementId,
    name: 'Amount',
    type: 'number',
    label: 'Amount',
    readOnly: false,
    required: false,
    conditionallyShow: false,
    requiresAllConditionallyShowPredicates: false,
    isElementLookup: false,
    isDataLookup: false,
    isSlider: false,
  }

  const createForm = (
    paymentEvent: SubmissionEventTypes.FormPaymentEvent,
    elements: FormTypes.FormElement[] = [amountElement],
  ): FormTypes.Form =>
    ({
      id: 1,
      name: 'Payment Form',
      description: '',
      organisationId: 'org',
      formsAppEnvironmentId: 1,
      formsAppIds: [],
      elements,
      isAuthenticated: false,
      isMultiPage: false,
      postSubmissionAction: 'CLOSE',
      cancelAction: 'CLOSE',
      submissionEvents: [],
      tags: [],
      paymentEvents: [paymentEvent],
      publishStartDate: undefined,
      publishEndDate: undefined,
      unpublishedUserMessage: undefined,
      createdAt: '2024-09-11T12:00:00.000Z',
      updatedAt: '2024-09-11T12:00:00.000Z',
    }) satisfies FormTypes.Form

  const dateHelpers = {
    submissionTimestamp: '2024-09-11T12:00:00.000Z',
    parseDayOnlyDate: (value: string) => new Date(`${value}T00:00:00.000Z`),
    addDaysToDate: (date: Date, days: number) => {
      date.setUTCDate(date.getUTCDate() + days)
      return date
    },
    startOfDay: (date: Date) => {
      date.setUTCHours(0, 0, 0, 0)
      return date
    },
    endOfDay: (date: Date) => {
      date.setUTCHours(23, 59, 59, 999)
      return date
    },
  }

  it('resolves amount from elementId', () => {
    const paymentSubmissionEvent: SubmissionEventTypes.FormPaymentEvent = {
      type: 'CP_PAY',
      configuration: {
        amountType: 'FORM_ELEMENT',
        elementId: amountElementId,
        gatewayId: 'gateway-id',
      },
    }
    const result = paymentService.checkForPaymentEvent({
      definition: createForm(paymentSubmissionEvent),
      submission: { Amount: 42.5 },
      ...dateHelpers,
    })
    expect(result).toEqual({
      paymentSubmissionEvent,
      amount: 42.5,
    })
  })

  it('resolves amount from paymentAmount', () => {
    const paymentSubmissionEvent: SubmissionEventTypes.FormPaymentEvent = {
      type: 'CP_PAY',
      configuration: {
        amountType: 'NUMBER',
        paymentAmount: 99.95,
        gatewayId: 'gateway-id',
      },
    }
    const result = paymentService.checkForPaymentEvent({
      definition: createForm(paymentSubmissionEvent, []),
      submission: {},
      ...dateHelpers,
    })
    expect(result).toEqual({
      paymentSubmissionEvent,
      amount: 99.95,
    })
  })

  it('resolves amount from paymentCalculation', () => {
    const quantityElement: FormTypes.NumberElement = {
      ...amountElement,
      id: 'quantity-element-id',
      name: 'Quantity',
      label: 'Quantity',
    }
    const priceElement: FormTypes.NumberElement = {
      ...amountElement,
      id: 'price-element-id',
      name: 'Price',
      label: 'Price',
    }
    const paymentSubmissionEvent: SubmissionEventTypes.FormPaymentEvent = {
      type: 'CP_PAY',
      configuration: {
        amountType: 'EXPRESSION',
        paymentCalculation: '{ELEMENT:Quantity} * {ELEMENT:Price}',
        gatewayId: 'gateway-id',
      },
    }
    const result = paymentService.checkForPaymentEvent({
      definition: createForm(paymentSubmissionEvent, [
        quantityElement,
        priceElement,
      ]),
      submission: { Quantity: 3, Price: 12.5 },
      ...dateHelpers,
    })
    expect(result).toEqual({
      paymentSubmissionEvent,
      amount: 37.5,
    })
  })

  it('returns undefined when amount is 0', () => {
    const result = paymentService.checkForPaymentEvent({
      definition: createForm({
        type: 'CP_PAY',
        configuration: {
          amountType: 'NUMBER',
          paymentAmount: 0,
          gatewayId: 'gateway-id',
        },
      }),
      submission: {},
      ...dateHelpers,
    })
    expect(result).toBeUndefined()
  })

  it('throws when amountType and elementId are not set', () => {
    expect(() =>
      paymentService.checkForPaymentEvent({
        definition: createForm({
          type: 'CP_PAY',
          configuration: {
            gatewayId: 'gateway-id',
          } as SubmissionEventTypes.CPPaySubmissionEvent['configuration'],
        }),
        submission: {},
        ...dateHelpers,
      }),
    ).toThrow(
      'We could not find the configuration required to make a payment. Please contact your administrator to ensure your application configuration has been completed successfully.',
    )
  })

  it('returns undefined when there is no payment event', () => {
    const result = paymentService.checkForPaymentEvent({
      definition: {
        ...createForm({
          type: 'CP_PAY',
          configuration: {
            amountType: 'NUMBER',
            paymentAmount: 10,
            gatewayId: 'gateway-id',
          },
        }),
        paymentEvents: [],
      },
      submission: {},
      ...dateHelpers,
    })
    expect(result).toBeUndefined()
  })
})

describe('getDisplayDetailsFromFormSubmissionPayment', () => {
  const formatters = {
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
    formatDateTime: () => '11/09/2024 12:00:00 PM',
    formatDate: () => '11/09/2024',
  }

  describe('NSW Gov Pay', () => {
    const formSubmissionPayment: SubmissionTypes.FormSubmissionPayment = {
      type: 'NSW_GOV_PAY',
      id: '1',
      createdAt: '2024-09-11T12:00:00.000Z',
      formId: 1,
      status: 'SUCCEEDED',
      submissionId: '111111111111',
      updatedAt: '2024-09-11T12:00:00.000Z',
      paymentTransaction: {
        agencyCompletionPayment: {
          paymentCompletionReference: '111111111111',
          paymentReference: '222222222222',
          bankReference: '333333333333',
          paymentMethod: 'CARD',
          amount: 123.45,
          surcharge: 12.34,
          surchargeGst: 2.34,
          agencyTransactionId: 'agencyTransactionId',
          bPay: {
            billerCode: 'billerCode',
            crn: 'crn',
            processingDate: '2024-09-11T12:00:00.000Z',
          },
          card: {
            last4Digits: '4242',
            cardPresent: true,
            cardType: 'VISA',
          },
        },
        integrationPrimaryAgencyId: '1',
        nswGovPayPaymentReference: 'nswGovPayPaymentReference',
        redirectUrl: 'redirectUrl',
      },
    }

    it('gets the correct details', () => {
      const details = paymentService.getDisplayDetailsFromFormSubmissionPayment(
        formSubmissionPayment,
        formatters,
      )
      expect(details).toMatchSnapshot()
    })

    it('using BPAY', () => {
      const paymentTransaction = formSubmissionPayment.paymentTransaction
      if (!paymentTransaction?.agencyCompletionPayment) {
        throw new Error('Expected NSW GovPay paymentTransaction')
      }

      const details = paymentService.getDisplayDetailsFromFormSubmissionPayment(
        {
          ...formSubmissionPayment,
          paymentTransaction: {
            ...paymentTransaction,
            agencyCompletionPayment: {
              ...paymentTransaction.agencyCompletionPayment,
              paymentMethod: 'BPAY',
            },
          },
        },
        formatters,
      )

      expect(
        details?.paymentDisplayDetails.find(
          (d) => d.key === 'NSW_GOV_PAY_BPAY_BILLER_CODE',
        )?.value,
      ).toBe('billerCode')
    })
  })
  describe('Bpoint', () => {
    const formSubmissionPayment: SubmissionTypes.FormSubmissionPayment = {
      type: 'BPOINT',
      id: '1',
      createdAt: '2024-09-11T12:00:00.000Z',
      formId: 1,
      status: 'SUCCEEDED',
      submissionId: '111111111111',
      updatedAt: '2024-09-11T12:00:00.000Z',
      paymentTransaction: {
        Amount: 12345,
        AmountSurcharge: 1234,
        Action: 'PAYMENT',
        AmountOriginal: 12345,
        ReceiptNumber: 'receiptNumber',
        BillerCode: 'billerCode',
        Crn1: 'crn1',
        Crn2: 'crn2',
        Crn3: 'crn3',
        // @ts-expect-error incomplete because type is large
        CardDetails: {
          MaskedCardNumber: 'creditCardMask',
        },
        ProcessedDateTime: '2024-09-11T12:00:00.000Z',
      },
    }
    it('gets the correct details', () => {
      const details = paymentService.getDisplayDetailsFromFormSubmissionPayment(
        formSubmissionPayment,
        formatters,
      )
      expect(details).toMatchSnapshot()
    })
  })
  describe('CP Pay', () => {
    const formSubmissionPaymentv1: SubmissionTypes.FormSubmissionPayment = {
      type: 'CP_PAY',
      id: '1',
      createdAt: '2024-09-11T12:00:00.000Z',
      formId: 1,
      status: 'SUCCEEDED',
      submissionId: '111111111111',
      updatedAt: '2024-09-11T12:00:00.000Z',
      // @ts-expect-error incomplete because type is large
      paymentTransaction: {
        cpPayVersion: 'v1',
        transactionId: '123',
        orderNumber: 'orderNumber',
        paymentTypeId: 1,
        lastFour: '1234',
        amount: 123.45,
        createdAt: '2024-09-11T12:00:00.000Z',
      },
    }
    const formSubmissionPaymentv2: SubmissionTypes.FormSubmissionPayment = {
      type: 'CP_PAY',
      id: '1',
      createdAt: '2024-09-11T12:00:00.000Z',
      formId: 1,
      status: 'SUCCEEDED',
      submissionId: '111111111111',
      updatedAt: '2024-09-11T12:00:00.000Z',
      // @ts-expect-error incomplete because type is large
      paymentTransaction: {
        cpPayVersion: 'v2',
        result: {
          id: '123',
          externalReferenceId: 'externalReferenceId',
          paymentType: 'CreditDebitCard',
          lastFour: '1234',
          amount: 123.45,
          createdOnUtc: '2024-09-11T12:00:00.000Z',
        },
      },
    }

    it('gets the correct details - v1', () => {
      const details = paymentService.getDisplayDetailsFromFormSubmissionPayment(
        formSubmissionPaymentv1,
        formatters,
      )
      expect(details).toMatchSnapshot()
    })

    it('gets the correct details - v2', () => {
      const details = paymentService.getDisplayDetailsFromFormSubmissionPayment(
        formSubmissionPaymentv2,
        formatters,
      )
      expect(details).toMatchSnapshot()
    })
  })

  describe('Westpac', () => {
    const formSubmissionPayment: SubmissionTypes.FormSubmissionPayment = {
      type: 'WESTPAC_QUICK_STREAM',
      id: '1',
      createdAt: '2024-09-11T12:00:00.000Z',
      formId: 1,
      status: 'SUCCEEDED',
      submissionId: '111111111111',
      updatedAt: '2024-09-11T12:00:00.000Z',
      // @ts-expect-error unfinished because type is large
      paymentTransaction: {
        receiptNumber: 'receiptNumber',
        paymentReferenceNumber: 'paymentReferenceNumber',
        customerReferenceNumber: 'customerReferenceNumber',
        totalAmount: {
          amount: 123.45,
          displayAmount: '123.45',
          currency: 'AUD',
        },
        surchargeAmount: {
          amount: 12.34,
          currency: 'AUD',
          displayAmount: '12.34',
        },
        settlementDate: '2024-09-11T12:00:00.000Z',
      },
    }

    it('gets the correct details', () => {
      const details = paymentService.getDisplayDetailsFromFormSubmissionPayment(
        formSubmissionPayment,
        formatters,
      )
      expect(details).toMatchSnapshot()
    })
  })
})

describe('getFormStorePaymentFromFormSubmissionPayment', () => {
  describe('NSW Gov Pay', () => {
    it('returns status, payment reference and completion reference when completed', () => {
      const formStorePayment =
        paymentService.getFormStorePaymentFromFormSubmissionPayment({
          type: 'NSW_GOV_PAY',
          id: '1',
          createdAt: '2024-09-11T12:00:00.000Z',
          formId: 1,
          status: 'SUCCEEDED',
          submissionId: '111111111111',
          updatedAt: '2024-09-11T12:00:00.000Z',
          paymentTransaction: {
            agencyCompletionPayment: {
              paymentCompletionReference: 'completion-ref',
              paymentReference: 'payment-ref',
              bankReference: 'bank-ref',
              paymentMethod: 'CARD',
              amount: 123.45,
              surcharge: 12.34,
              surchargeGst: 2.34,
              agencyTransactionId: 'agencyTransactionId',
            },
            integrationPrimaryAgencyId: '1',
            nswGovPayPaymentReference: 'nswGovPayPaymentReference',
            redirectUrl: 'redirectUrl',
          },
        })

      expect(formStorePayment).toEqual({
        status: 'SUCCEEDED',
        providerTransactionId: 'nswGovPayPaymentReference',
        providerReceiptNumber: 'completion-ref',
      })
    })

    it('returns status and payment reference when not completed', () => {
      const formStorePayment =
        paymentService.getFormStorePaymentFromFormSubmissionPayment({
          type: 'NSW_GOV_PAY',
          id: '1',
          createdAt: '2024-09-11T12:00:00.000Z',
          formId: 1,
          status: 'PENDING',
          submissionId: '111111111111',
          updatedAt: '2024-09-11T12:00:00.000Z',
          paymentTransaction: {
            integrationPrimaryAgencyId: '1',
            nswGovPayPaymentReference: 'nswGovPayPaymentReference',
            redirectUrl: 'redirectUrl',
          },
        })

      expect(formStorePayment).toEqual({
        status: 'PENDING',
        providerTransactionId: 'nswGovPayPaymentReference',
      })
    })
  })

  describe('BPOINT', () => {
    it('returns status, transaction number and receipt number', () => {
      const formStorePayment =
        paymentService.getFormStorePaymentFromFormSubmissionPayment({
          type: 'BPOINT',
          id: '1',
          createdAt: '2024-09-11T12:00:00.000Z',
          formId: 1,
          status: 'SUCCEEDED',
          submissionId: '111111111111',
          updatedAt: '2024-09-11T12:00:00.000Z',
          paymentTransaction: {
            Amount: 12345,
            AmountSurcharge: 1234,
            Action: 'PAYMENT',
            AmountOriginal: 12345,
            ReceiptNumber: 'receiptNumber',
            TxnNumber: 'txnNumber',
            BillerCode: 'billerCode',
            Crn1: 'crn1',
            Crn2: 'crn2',
            Crn3: 'crn3',
            // @ts-expect-error incomplete because type is large
            CardDetails: {
              MaskedCardNumber: 'creditCardMask',
            },
            ProcessedDateTime: '2024-09-11T12:00:00.000Z',
          },
        })

      expect(formStorePayment).toEqual({
        status: 'SUCCEEDED',
        providerTransactionId: 'txnNumber',
        providerReceiptNumber: 'receiptNumber',
      })
    })

    it('returns status only when transaction is missing', () => {
      const formStorePayment =
        paymentService.getFormStorePaymentFromFormSubmissionPayment({
          type: 'BPOINT',
          id: '1',
          createdAt: '2024-09-11T12:00:00.000Z',
          formId: 1,
          status: 'PENDING',
          submissionId: '111111111111',
          updatedAt: '2024-09-11T12:00:00.000Z',
        })

      expect(formStorePayment).toEqual({
        status: 'PENDING',
      })
    })
  })

  describe('CP Pay', () => {
    it('returns transaction id and order number for v1', () => {
      const formStorePayment =
        paymentService.getFormStorePaymentFromFormSubmissionPayment({
          type: 'CP_PAY',
          id: '1',
          createdAt: '2024-09-11T12:00:00.000Z',
          formId: 1,
          status: 'SUCCEEDED',
          submissionId: '111111111111',
          updatedAt: '2024-09-11T12:00:00.000Z',
          // @ts-expect-error incomplete because type is large
          paymentTransaction: {
            cpPayVersion: 'v1',
            transactionId: 'v1-transaction-id',
            orderNumber: 'orderNumber',
            paymentTypeId: 1,
            lastFour: '1234',
            amount: 123.45,
            createdAt: '2024-09-11T12:00:00.000Z',
          },
        })

      expect(formStorePayment).toEqual({
        status: 'SUCCEEDED',
        providerTransactionId: 'v1-transaction-id',
        providerReceiptNumber: 'orderNumber',
      })
    })

    it('returns transaction id and external reference for v2', () => {
      const formStorePayment =
        paymentService.getFormStorePaymentFromFormSubmissionPayment({
          type: 'CP_PAY',
          id: '1',
          createdAt: '2024-09-11T12:00:00.000Z',
          formId: 1,
          status: 'FAILED',
          submissionId: '111111111111',
          updatedAt: '2024-09-11T12:00:00.000Z',
          // @ts-expect-error incomplete because type is large
          paymentTransaction: {
            cpPayVersion: 'v2',
            result: {
              id: 'v2-transaction-id',
              externalReferenceId: 'externalReferenceId',
              paymentType: 'CreditDebitCard',
              lastFour: '1234',
              amount: 123.45,
              createdOnUtc: '2024-09-11T12:00:00.000Z',
            },
          },
        })

      expect(formStorePayment).toEqual({
        status: 'FAILED',
        providerTransactionId: 'v2-transaction-id',
        providerReceiptNumber: 'externalReferenceId',
      })
    })
  })

  describe('Westpac', () => {
    it('returns status, payment reference and receipt number', () => {
      const formStorePayment =
        paymentService.getFormStorePaymentFromFormSubmissionPayment({
          type: 'WESTPAC_QUICK_STREAM',
          id: '1',
          createdAt: '2024-09-11T12:00:00.000Z',
          formId: 1,
          status: 'SUCCEEDED',
          submissionId: '111111111111',
          updatedAt: '2024-09-11T12:00:00.000Z',
          // @ts-expect-error unfinished because type is large
          paymentTransaction: {
            receiptNumber: 'westpac-receipt',
            paymentReferenceNumber: 'paymentReferenceNumber',
            customerReferenceNumber: 'customerReferenceNumber',
            totalAmount: {
              amount: 123.45,
              displayAmount: '123.45',
              currency: 'AUD',
            },
            surchargeAmount: {
              amount: 12.34,
              currency: 'AUD',
              displayAmount: '12.34',
            },
            settlementDate: '2024-09-11T12:00:00.000Z',
          },
        })

      expect(formStorePayment).toEqual({
        status: 'SUCCEEDED',
        providerTransactionId: 'paymentReferenceNumber',
        providerReceiptNumber: 'westpac-receipt',
      })
    })
  })
})
