/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  ButtonVariation,
  Container,
  Formik,
  FormikForm,
  FormInput,
  Heading,
  Layout,
  Text,
  Accordion
} from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import * as yup from 'yup'
import { useStrings } from 'framework/strings'
import type { SLOErrorBudgetResetDTO } from 'services/cv'
import { getRiskColorValue } from '@cv/utils/CommonUtils'
import ErrorBudgetResetHistory from '@cv/hooks/useErrorBudgetRestHook/views/ErrorBudgetResetHistory'
import {
  calculateErrorBudgetByIncrement,
  calculateRemainingErrorBudgetByIncrement
} from '../useErrorBudgetRestHook.utils'
import type { ErrorBudgetResetFormProps } from '../useErrorBudgetRestHook.types'

const ErrorBudgetResetForm: React.FC<ErrorBudgetResetFormProps> = ({ serviceLevelObjective, onSubmit, onCancel }) => {
  const { getString } = useStrings()

  return (
    <Container width={650}>
      <Text font={{ variation: FontVariation.BODY }} color={Color.BLACK}>
        {getString('cv.yourExistingErrorBudgetIs')}{' '}
        <Text tag="span" font={{ variation: FontVariation.BODY, weight: 'bold' }} data-testid="existing-error-budget">
          {serviceLevelObjective.totalErrorBudget.toLocaleString()} {getString('cv.minutes')}
        </Text>
        , {getString('cv.andYouHave')}{' '}
        <Text
          tag="span"
          font={{ variation: FontVariation.BODY, weight: 'bold' }}
          color={getRiskColorValue(serviceLevelObjective.errorBudgetRisk, false)}
          data-testid="remaining-error-budget"
        >
          {serviceLevelObjective.errorBudgetRemaining.toLocaleString()} {getString('cv.minutes')}
        </Text>{' '}
        {getString('cv.left')}.
      </Text>
      <Text font={{ variation: FontVariation.BODY }} color={Color.BLACK}>
        {getString('cv.adjustTheErrorBudgetToContinueWithDeployments')}
      </Text>

      <Accordion>
        <Accordion.Panel
          id="error-budget-reset-history"
          summary={
            <Text font={{ variation: FontVariation.BODY }} color={Color.PRIMARY_7}>
              {getString('cv.previousErrorBudgetResetHistory')}
            </Text>
          }
          details={<ErrorBudgetResetHistory serviceLevelObjectiveIdentifier={serviceLevelObjective.sloIdentifier} />}
        />
      </Accordion>

      <Formik<SLOErrorBudgetResetDTO>
        formName="errorBudgetReset"
        initialValues={{}}
        validationSchema={yup.object().shape({
          errorBudgetIncrementMinutes: yup
            .number()
            .typeError(getString('cv.increaseErrorBudgetByIsRequired'))
            .min(1, getString('common.validation.valueMustBeGreaterThanOrEqualToN', { n: 1 }))
            .required(getString('cv.increaseErrorBudgetByIsRequired')),
          reason: yup.string().trim().required(getString('cv.reasonIsRequired'))
        })}
        onSubmit={values => {
          onSubmit({
            ...values,
            errorBudgetAtReset: serviceLevelObjective.totalErrorBudget,
            remainingErrorBudgetAtReset: serviceLevelObjective.errorBudgetRemaining
          })
        }}
      >
        {formik => (
          <FormikForm>
            <Layout.Horizontal>
              <Container width={325} padding={{ right: 'xxxlarge' }} border={{ right: true }}>
                <FormInput.Text
                  name="errorBudgetIncrementMinutes"
                  label={getString('cv.increaseErrorBudgetBy')}
                  inputGroup={{
                    type: 'number',
                    min: 1,
                    rightElement: (
                      <Text
                        color={Color.GREY_600}
                        font={{ variation: FontVariation.BODY }}
                        padding={{ top: 'xsmall', right: 'small' }}
                      >
                        {getString('cv.minutes')}
                      </Text>
                    )
                  }}
                />
                <FormInput.TextArea name="reason" label={getString('reason')} />
              </Container>
              <Layout.Vertical spacing="xxxlarge">
                <div>
                  <Text font={{ variation: FontVariation.FORM_LABEL }}>{getString('cv.updatedErrorBudget')}</Text>
                  <Heading
                    inline
                    level={2}
                    color={Color.GREY_800}
                    font={{ variation: FontVariation.H4 }}
                    data-testid="updated-error-budget"
                  >
                    {calculateErrorBudgetByIncrement(
                      serviceLevelObjective.totalErrorBudget,
                      formik.values.errorBudgetIncrementMinutes
                    )}
                  </Heading>
                  <Text inline font={{ variation: FontVariation.FORM_HELP }}>
                    {' '}
                    {getString('cv.mins')}
                  </Text>
                </div>
                <div>
                  <Text font={{ variation: FontVariation.FORM_LABEL }}>
                    {getString('cv.updatedRemainingErrorBudget')}
                  </Text>
                  <Heading
                    inline
                    level={2}
                    color={Color.GREY_800}
                    font={{ variation: FontVariation.H4 }}
                    data-testid="updated-remaining-error-budget"
                  >
                    {calculateRemainingErrorBudgetByIncrement(
                      serviceLevelObjective.totalErrorBudget,
                      serviceLevelObjective.errorBudgetRemaining,
                      formik.values.errorBudgetIncrementMinutes
                    )}
                  </Heading>
                  <Text inline font={{ variation: FontVariation.FORM_HELP }} padding={{ right: 'small' }}>
                    {' '}
                    {getString('cv.mins')}
                  </Text>
                  <Heading
                    inline
                    level={2}
                    color={Color.GREY_800}
                    font={{ variation: FontVariation.H4 }}
                    data-testid="updated-remaining-error-budget-percentage"
                    border={{ left: true }}
                    padding={{ left: 'small' }}
                  >
                    {calculateRemainingErrorBudgetByIncrement(
                      serviceLevelObjective.totalErrorBudget,
                      serviceLevelObjective.errorBudgetRemaining,
                      formik.values.errorBudgetIncrementMinutes,
                      true
                    )}
                  </Heading>
                  <Text inline font={{ variation: FontVariation.FORM_HELP }}>
                    &nbsp;%
                  </Text>
                </div>
              </Layout.Vertical>
            </Layout.Horizontal>

            <Layout.Horizontal spacing="small" margin={{ top: 'xxxlarge' }}>
              <Button type="submit" text={getString('save')} variation={ButtonVariation.PRIMARY} />
              <Button text={getString('cancel')} variation={ButtonVariation.TERTIARY} onClick={onCancel} />
            </Layout.Horizontal>
          </FormikForm>
        )}
      </Formik>
    </Container>
  )
}

export default ErrorBudgetResetForm
