/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { forwardRef } from 'react'
import * as Yup from 'yup'
import { isEmpty } from 'lodash-es'
import { IconName, getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import { yupToFormErrors, FormikErrors } from 'formik'
import { StepViewType, StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import type {
  RollbackStackData,
  RollbackStackStepInfo,
  RollbackVariableStepProps
} from '../CloudFormationInterfaces.types'
import { RollbackStack } from './RollbackStepRef'
import { RollbackVariableStep } from './RollbackStepVariableView'
import RollbackStackInputStep from './RollbackStackInputSteps'
const RollbackStackWithRef = forwardRef(RollbackStack)

export class CFRollbackStack extends PipelineStep<RollbackStackStepInfo> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  protected type = StepType.CloudFormationRollbackStack
  protected stepIcon: IconName = 'cloud-formation-rollback'
  protected stepName = 'Cloud Formation Rollback Stack'

  protected defaultValues = {
    type: StepType.CloudFormationRollbackStack,
    name: '',
    identifier: '',
    timeout: '10m',
    spec: {
      configuration: {
        provisionerIdentifier: ''
      }
    }
  }

  /* istanbul ignore next */
  validateInputSet({ data, template, getString, viewType }: ValidateInputSetProps<any>): FormikErrors<any> {
    const errors = {} as any
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      let timeoutSchema = getDurationValidationSchema({ minimum: '10s' })
      if (isRequired) {
        timeoutSchema = timeoutSchema.required(getString?.('validation.timeout10SecMinimum'))
      }
      const timeout = Yup.object().shape({
        timeout: timeoutSchema
      })
      try {
        timeout.validateSync(data)
      } catch (e) {
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }
    if (isEmpty(errors.spec)) {
      delete errors.spec
    }
    return errors
  }

  processFormData(data: RollbackStackData): RollbackStackData {
    return data
  }

  private getInitialValues(data: RollbackStackData): RollbackStackData {
    return data
  }

  renderStep(props: StepProps<any, unknown>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      onChange,
      allowableTypes,
      stepViewType,
      formikRef,
      isNewStep,
      readonly,
      inputSetData,
      path,
      customStepProps
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <RollbackStackInputStep
          initialValues={initialValues}
          allowableTypes={allowableTypes}
          allValues={inputSetData?.allValues}
          stepViewType={stepViewType}
          readonly={inputSetData?.readonly}
          inputSetData={inputSetData}
          path={path}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return <RollbackVariableStep {...(customStepProps as RollbackVariableStepProps)} initialValues={initialValues} />
    }

    return (
      <RollbackStackWithRef
        initialValues={this.getInitialValues(initialValues)}
        onUpdate={data => onUpdate?.(this.processFormData(data))}
        onChange={data => onChange?.(this.processFormData(data))}
        allowableTypes={allowableTypes}
        isNewStep={isNewStep}
        ref={formikRef}
        readonly={readonly}
      />
    )
  }
}
