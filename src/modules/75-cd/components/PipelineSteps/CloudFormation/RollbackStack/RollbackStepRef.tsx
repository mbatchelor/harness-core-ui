/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import * as Yup from 'yup'
import { Formik, FormInput, getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { IdentifierSchemaWithOutName, NameSchema } from '@common/utils/Validation'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { setFormikRef, StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import type { RollbackStackProps } from '../CloudFormationInterfaces.types'
import { isRuntime } from '../CloudFormationHelper'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from '../CloudFormation.module.scss'

export const RollbackStack = (
  { allowableTypes, isNewStep = true, readonly = false, initialValues, onUpdate, onChange }: RollbackStackProps,
  formikRef: StepFormikFowardRef
): JSX.Element => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValues}
      formName="cloudFormationDeleteStack"
      validate={values => {
        const payload = {
          ...values
        }
        /* istanbul ignore next */
        onChange?.(payload)
      }}
      onSubmit={values => {
        const payload = {
          ...values
        }
        /* istanbul ignore next */
        onUpdate?.(payload)
      }}
      validationSchema={Yup.object().shape({
        name: NameSchema({ requiredErrorMsg: getString('pipelineSteps.stepNameRequired') }),
        timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum')),
        spec: Yup.object().shape({
          configuration: Yup.object().shape({
            type: Yup.string(),
            provisionerIdentifier: Yup.lazy((value): Yup.Schema<unknown> => {
              if (getMultiTypeFromValue(value as string) === MultiTypeInputType.FIXED) {
                return IdentifierSchemaWithOutName(getString, {
                  requiredErrorMsg: getString('common.validation.provisionerIdentifierIsRequired'),
                  regexErrorMsg: getString('common.validation.provisionerIdentifierPatternIsNotValid')
                })
              }
              return Yup.string().required(getString('common.validation.provisionerIdentifierIsRequired'))
            })
          })
        })
      })}
    >
      {formik => {
        setFormikRef(formikRef, formik)
        const { values } = formik
        /* istanbul ignore next */
        const config = values?.spec?.configuration
        /* istanbul ignore next */
        const provisionerIdentifier = config?.provisionerIdentifier
        return (
          <>
            <div className={cx(stepCss.formGroup, stepCss.lg)}>
              <FormInput.InputWithIdentifier
                inputLabel={getString('name')}
                isIdentifierEditable={isNewStep}
                inputGroupProps={{
                  disabled: readonly
                }}
              />
            </div>
            <div className={cx(stepCss.formGroup, stepCss.sm)}>
              <FormMultiTypeDurationField
                name="timeout"
                label={getString('pipelineSteps.timeoutLabel')}
                multiTypeDurationProps={{ enableConfigureOptions: false, expressions, allowableTypes }}
                disabled={readonly}
              />
            </div>
            <div className={css.divider} />
            <div className={stepCss.formGroup}>
              <FormInput.MultiTextInput
                name="spec.configuration.provisionerIdentifier"
                label={getString('pipelineSteps.provisionerIdentifier')}
                multiTextInputProps={{ expressions, allowableTypes }}
                disabled={readonly}
                className={css.inputWidth}
              />
              {isRuntime(provisionerIdentifier) && (
                <ConfigureOptions
                  value={provisionerIdentifier as string}
                  type="String"
                  variableName="spec.configuration.provisionerIdentifier"
                  showRequiredField={false}
                  showDefaultField={false}
                  showAdvanced={true}
                  isReadonly={readonly}
                  className={css.inputWidth}
                />
              )}
            </div>
          </>
        )
      }}
    </Formik>
  )
}
