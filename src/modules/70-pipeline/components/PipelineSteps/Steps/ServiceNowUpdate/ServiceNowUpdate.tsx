/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import { isEmpty } from 'lodash-es'
import { connect, FormikErrors, yupToFormErrors } from 'formik'
import { getMultiTypeFromValue, IconName, MultiTypeInputType } from '@wings-software/uicore'
import { StepProps, StepViewType, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { VariablesListTable } from '@pipeline/components/VariablesListTable/VariablesListTable'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import type { StringsMap } from 'stringTypes'
import ServiceNowUpdateStepModeWithRef from '@pipeline/components/PipelineSteps/Steps/ServiceNowUpdate/ServiceNowUpdateStepMode'
import { FieldType } from '@pipeline/components/PipelineSteps/Steps/ServiceNowCreate/types'
import ServiceNowUpdateDeploymentMode from '@pipeline/components/PipelineSteps/Steps/ServiceNowUpdate/ServiceNowUpdateDeploymentMode'
import { PipelineStep } from '../../PipelineStep'
import { StepType } from '../../PipelineStepInterface'
import { flatObject } from '../Common/ApprovalCommons'
import type { ServiceNowUpdateData, ServiceNowUpdateVariableListModeProps } from './types'

import { processFormData, processInitialValues } from './helper'
import pipelineVariablesCss from '../../../PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

const ServiceNowUpdateDeploymentModeWithFormik = connect(ServiceNowUpdateDeploymentMode)
export class ServiceNowUpdate extends PipelineStep<ServiceNowUpdateData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  protected isHarnessSpecific = true
  protected type = StepType.ServiceNowUpdate
  protected stepName = 'ServiceNow Update'
  protected stepIcon: IconName = 'servicenow-update'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.ServiceNowApproval'
  // initialValues on mount
  protected defaultValues: ServiceNowUpdateData = {
    identifier: '',
    timeout: '1d',
    name: '',
    type: StepType.ServiceNowUpdate,
    spec: {
      connectorRef: '',
      ticketType: '',
      fieldType: FieldType.ConfigureFields,
      fields: [],
      selectedFields: [],
      templateFields: [],
      ticketNumber: '',
      description: '',
      shortDescription: '',
      useServiceNowTemplate: false
    }
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<ServiceNowUpdateData>): FormikErrors<ServiceNowUpdateData> {
    const errors: FormikErrors<ServiceNowUpdateData> = {}
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm

    if (
      typeof template?.spec?.connectorRef === 'string' &&
      isRequired &&
      getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.connectorRef)
    ) {
      errors.spec = {
        connectorRef: getString?.('pipeline.serviceNowApprovalStep.validations.connectorRef')
      }
    }

    if (
      typeof template?.spec?.ticketType === 'string' &&
      isRequired &&
      getMultiTypeFromValue(template?.spec?.ticketType) === MultiTypeInputType.RUNTIME &&
      isEmpty(data?.spec?.ticketType)
    ) {
      errors.spec = {
        ...errors.spec,
        ticketType: getString?.('pipeline.serviceNowApprovalStep.validations.ticketType')
      }
    }

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
        /* istanbul ignore else */
        if (e instanceof Yup.ValidationError) {
          const err = yupToFormErrors(e)
          Object.assign(errors, err)
        }
      }
    }

    return errors
  }

  processFormData(values: ServiceNowUpdateData): ServiceNowUpdateData {
    return processFormData(values)
  }

  renderStep(this: ServiceNowUpdate, props: StepProps<ServiceNowUpdateData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      allowableTypes,
      onChange
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <ServiceNowUpdateDeploymentModeWithFormik
          stepViewType={stepViewType}
          initialValues={initialValues}
          allowableTypes={allowableTypes}
          onUpdate={(values: ServiceNowUpdateData) => onUpdate?.(values)}
          inputSetData={inputSetData}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      const customStepPropsTyped = customStepProps as ServiceNowUpdateVariableListModeProps
      return (
        <VariablesListTable
          data={flatObject(customStepPropsTyped.variablesData)}
          originalData={initialValues as Record<string, any>}
          metadataMap={customStepPropsTyped.metadataMap}
          className={pipelineVariablesCss.variablePaddingL3}
        />
      )
    }
    return (
      <ServiceNowUpdateStepModeWithRef
        ref={formikRef}
        stepViewType={stepViewType || StepViewType.Edit}
        allowableTypes={allowableTypes}
        onChange={(values: ServiceNowUpdateData) => onChange?.(values)}
        initialValues={processInitialValues(initialValues)}
        onUpdate={(values: ServiceNowUpdateData) => onUpdate?.(values)}
        isNewStep={isNewStep}
        readonly={readonly}
      />
    )
  }
}
