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
import { PipelineStep } from '../../PipelineStep'
import { StepType } from '../../PipelineStepInterface'
import { flatObject } from '../Common/ApprovalCommons'
import type { ServiceNowCreateData, ServiceNowCreateVariableListModeProps } from './types'
import { FieldType } from './types'
import { processFormData, processInitialValues } from './helper'
import ServiceNowCreateStepModeWithRef from './ServiceNowCreateStepMode'
import ServiceNowCreateDeploymentMode from './ServiceNowCreateDeploymentMode'
import pipelineVariablesCss from '../../../PipelineStudio/PipelineVariables/PipelineVariables.module.scss'

const ServiceNowCreateDeploymentModeWithFormik = connect(ServiceNowCreateDeploymentMode)
export class ServiceNowCreate extends PipelineStep<ServiceNowCreateData> {
  constructor() {
    super()
    this._hasStepVariables = true
    this._hasDelegateSelectionVisible = true
  }

  protected isHarnessSpecific = true
  protected type = StepType.ServiceNowCreate
  protected stepName = 'ServiceNow Create'
  protected stepIcon: IconName = 'servicenow-create'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.ServiceNowApproval'
  // initialValues on mount
  protected defaultValues: ServiceNowCreateData = {
    identifier: '',
    timeout: '1d',
    name: '',
    type: StepType.ServiceNowCreate,
    spec: {
      connectorRef: '',
      ticketType: '',
      fieldType: FieldType.ConfigureFields,
      useServiceNowTemplate: false,
      fields: [],
      selectedFields: [],
      templateFields: [],
      description: '',
      shortDescription: ''
    }
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<ServiceNowCreateData>): FormikErrors<ServiceNowCreateData> {
    const errors: FormikErrors<ServiceNowCreateData> = {}
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

  processFormData(values: ServiceNowCreateData): ServiceNowCreateData {
    return processFormData(values)
  }

  renderStep(this: ServiceNowCreate, props: StepProps<ServiceNowCreateData>): JSX.Element {
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
        <ServiceNowCreateDeploymentModeWithFormik
          stepViewType={stepViewType}
          initialValues={initialValues}
          allowableTypes={allowableTypes}
          onUpdate={(values: ServiceNowCreateData) => onUpdate?.(values)}
          inputSetData={inputSetData}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      const customStepPropsTyped = customStepProps as ServiceNowCreateVariableListModeProps
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
      <ServiceNowCreateStepModeWithRef
        ref={formikRef}
        stepViewType={stepViewType || StepViewType.Edit}
        allowableTypes={allowableTypes}
        onChange={(values: ServiceNowCreateData) => onChange?.(values)}
        initialValues={processInitialValues(initialValues)}
        onUpdate={(values: ServiceNowCreateData) => onUpdate?.(values)}
        isNewStep={isNewStep}
        readonly={readonly}
      />
    )
  }
}
