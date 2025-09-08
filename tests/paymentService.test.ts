import { SubmissionTypes } from '@oneblink/types'
import { paymentService } from '../src'

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
      const details = paymentService.getDisplayDetailsFromFormSubmissionPayment(
        {
          ...formSubmissionPayment,
          paymentTransaction: {
            ...formSubmissionPayment.paymentTransaction,
            // @ts-expect-error Wrong
            agencyCompletionPayment: {
              ...formSubmissionPayment.paymentTransaction
                .agencyCompletionPayment,
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
