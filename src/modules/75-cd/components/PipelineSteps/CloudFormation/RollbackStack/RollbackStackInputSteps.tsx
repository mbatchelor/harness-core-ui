/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { isEmpty } from 'lodash-es'
import cx from 'classnames'
import { FormInput, FormikForm } from '@harness/uicore'
import { connect, FormikContextType } from 'formik'
import { useStrings } from 'framework/strings'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { isRuntime } from '../CloudFormationHelper'
import type { RollbackStackData, RollbackStackProps } from '../CloudFormationInterfaces.types'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export function RollbackStackInputStepRef<T extends RollbackStackData = RollbackStackData>(
  props: RollbackStackProps<T> & { formik?: FormikContextType<any> }
): React.ReactElement {
  const { inputSetData, readonly, path, allowableTypes } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  return (
    <FormikForm>
      {
        /* istanbul ignore next */
        isRuntime(inputSetData?.template?.timeout as string) && (
          <div className={cx(stepCss.formGroup, stepCss.md)}>
            <FormMultiTypeDurationField
              label={getString('pipelineSteps.timeoutLabel')}
              name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}timeout`}
              disabled={readonly}
              multiTypeDurationProps={{
                enableConfigureOptions: false,
                allowableTypes,
                expressions,
                disabled: readonly
              }}
            />
          </div>
        )
      }
      {
        /* istanbul ignore next */
        isRuntime(inputSetData?.template?.spec?.configuration?.provisionerIdentifier as string) && (
          <div className={cx(stepCss.formGroup, stepCss.md)}>
            <FormInput.MultiTextInput
              name={`${path}.spec.configuration.provisionerIdentifier`}
              label={getString('pipelineSteps.provisionerIdentifier')}
              disabled={readonly}
              multiTextInputProps={{
                expressions,
                allowableTypes
              }}
            />
          </div>
        )
      }
    </FormikForm>
  )
}

const RollbackStackInputStep = connect(RollbackStackInputStepRef)
export default RollbackStackInputStep
