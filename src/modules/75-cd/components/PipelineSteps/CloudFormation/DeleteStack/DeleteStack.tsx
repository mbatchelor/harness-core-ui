/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { forwardRef } from 'react'
import * as Yup from 'yup'
import { isEmpty, set, unset } from 'lodash-es'
import { IconName, getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import { yupToFormErrors, FormikErrors } from 'formik'
import { StepViewType, StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import {
  DeleteStackData,
  DeleteStackTypes,
  CFDeleteStackStepInfo,
  DeleteStackVariableStepProps,
  Connector
} from '../CloudFormationInterfaces.types'
import { CloudFormationDeleteStack } from './DeleteStackRef'
import DeleteStackInputStep from './DeleteStackInputSteps'
import { DeleteStackVariableStep } from './DeleteStackVariableView'
const DeleteStackWithRef = forwardRef(CloudFormationDeleteStack)

export class CFDeleteStack extends PipelineStep<CFDeleteStackStepInfo> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  protected type = StepType.CloudFormationDeleteStack
  protected stepIcon: IconName = 'cloud-formation-delete'
  protected stepName = 'Cloud Formation Delete Stack'

  protected defaultValues = {
    type: StepType.CloudFormationDeleteStack,
    name: '',
    identifier: '',
    timeout: '10m',
    spec: {
      configuration: {
        type: DeleteStackTypes.Inherited,
        spec: {
          provisionerIdentifier: ''
        }
      }
    }
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<CFDeleteStackStepInfo>): FormikErrors<CFDeleteStackStepInfo> {
    /* istanbul ignore next */
    const errors = {} as any
    /* istanbul ignore next */
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    /* istanbul ignore next */
    if (getMultiTypeFromValue(template?.timeout) === MultiTypeInputType.RUNTIME) {
      let timeoutSchema = getDurationValidationSchema({ minimum: '10s' })
      /* istanbul ignore next */
      if (isRequired) {
        timeoutSchema = timeoutSchema.required(getString?.('validation.timeout10SecMinimum'))
      }
      const timeout = Yup.object().shape({
        timeout: timeoutSchema
      })
      /* istanbul ignore next */
      try {
        timeout.validateSync(data)
      } /* istanbul ignore next */ catch (e) {
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)

          Object.assign(errors, err)
        }
      }
    }
    /* istanbul ignore next */
    if (isEmpty(errors.spec)) {
      delete errors.spec
    }
    /* istanbul ignore next */
    return errors
  }

  processFormData(data: DeleteStackData): CFDeleteStackStepInfo {
    /* istanbul ignore next */
    if (data?.spec?.configuration?.type === DeleteStackTypes.Inherited) {
      unset(data?.spec?.configuration?.spec, 'connectorRef')
      unset(data?.spec?.configuration?.spec, 'region')
      unset(data?.spec?.configuration?.spec, 'stackName')
      unset(data?.spec?.configuration?.spec, 'roleArn')
      /* istanbul ignore next */
    } else {
      const connectorRef = data?.spec?.configuration?.spec?.connectorRef as Connector
      unset(data?.spec?.configuration?.spec, 'provisionerIdentifier')
      set(data, 'spec.configuration.spec.connectorRef', connectorRef?.value || connectorRef)
      if (isEmpty(data?.spec?.configuration?.spec?.roleArn)) {
        unset(data?.spec?.configuration?.spec, 'roleArn')
      }
    }
    /* istanbul ignore next */
    return data
  }

  private getInitialValues(data: CFDeleteStackStepInfo) {
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
        <DeleteStackInputStep
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
      return (
        <DeleteStackVariableStep {...(customStepProps as DeleteStackVariableStepProps)} initialValues={initialValues} />
      )
    }

    return (
      <DeleteStackWithRef
        initialValues={this.getInitialValues(initialValues)}
        onUpdate={(data: any) => onUpdate?.(this.processFormData(data))}
        onChange={(data: any) => onChange?.(this.processFormData(data))}
        allowableTypes={allowableTypes}
        isNewStep={isNewStep}
        ref={formikRef}
        readonly={readonly}
        stepViewType={stepViewType}
      />
    )
  }
}
