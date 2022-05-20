/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { IconName, MultiTypeInputType } from '@wings-software/uicore'
import type { FormikErrors } from 'formik'
import type { StepProps, ValidateInputSetProps } from '@pipeline/components/AbstractSteps/Step'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { validateInputSet } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { getFormValuesInCorrectFormat } from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import type {
  MultiTypeMapType,
  MultiTypeMapUIType,
  MultiTypeListType,
  MultiTypeListUIType,
  MultiTypeConnectorRef,
  Resources
} from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type { StringsMap } from 'stringTypes'
import { ECRStepBaseWithRef } from './ECRStepBase'
import { ECRStepInputSet } from './ECRStepInputSet'
import { ECRStepVariables, ECRStepVariablesProps } from './ECRStepVariables'
import { getInputSetViewValidateFieldsConfig, transformValuesFieldsConfig } from './ECRStepFunctionConfigs'

export interface ECRStepSpec {
  connectorRef: string
  region: string
  account: string
  imageName: string
  tags: MultiTypeListType
  baseImageConnectorRefs?: MultiTypeListType
  optimize?: boolean
  dockerfile?: string
  context?: string
  labels?: MultiTypeMapType
  buildArgs?: MultiTypeMapType
  target?: string
  remoteCacheImage?: string
  // TODO: Right now we do not support Image Pull Policy but will do in the future
  // pull?: MultiTypePullOption
  resources?: Resources
  runAsUser?: string
}

export interface ECRStepData {
  identifier: string
  name?: string
  type: string
  timeout?: string
  spec: ECRStepSpec
}

export interface ECRStepSpecUI
  extends Omit<ECRStepSpec, 'connectorRef' | 'tags' | 'labels' | 'buildArgs' | 'pull' | 'resources'> {
  connectorRef: MultiTypeConnectorRef
  tags: MultiTypeListUIType
  labels?: MultiTypeMapUIType
  buildArgs?: MultiTypeMapUIType
  // TODO: Right now we do not support Image Pull Policy but will do in the future
  // pull?: MultiTypeSelectOption
  runAsUser?: string
  limitMemory?: string
  limitCPU?: string
}

// Interface for the form
export interface ECRStepDataUI extends Omit<ECRStepData, 'spec'> {
  spec: ECRStepSpecUI
}

export interface ECRStepProps {
  initialValues: ECRStepData
  template?: ECRStepData
  path?: string
  readonly?: boolean
  isNewStep?: boolean
  stepViewType: StepViewType
  onUpdate?: (data: ECRStepData) => void
  onChange?: (data: ECRStepData) => void
  allowableTypes: MultiTypeInputType[]
  formik?: any
}

export class ECRStep extends PipelineStep<ECRStepData> {
  constructor() {
    super()
    this._hasStepVariables = true
  }

  protected type = StepType.ECR
  protected stepName = 'Build and Push to ECR'
  protected stepIcon: IconName = 'ecr-step'
  protected stepDescription: keyof StringsMap = 'pipeline.stepDescription.ECR'
  protected stepPaletteVisible = false

  protected defaultValues: ECRStepData = {
    identifier: '',
    type: StepType.ECR as string,
    spec: {
      connectorRef: '',
      region: '',
      account: '',
      imageName: '',
      remoteCacheImage: '',
      tags: []
    }
  }

  processFormData<T>(data: T): ECRStepData {
    return getFormValuesInCorrectFormat<T, ECRStepData>(data, transformValuesFieldsConfig)
  }

  validateInputSet({
    data,
    template,
    getString,
    viewType
  }: ValidateInputSetProps<ECRStepData>): FormikErrors<ECRStepData> {
    const isRequired = viewType === StepViewType.DeploymentForm || viewType === StepViewType.TriggerForm
    if (getString) {
      return validateInputSet(data, template, getInputSetViewValidateFieldsConfig(isRequired), { getString }, viewType)
    }

    return {}
  }

  renderStep(props: StepProps<ECRStepData>): JSX.Element {
    const {
      initialValues,
      onUpdate,
      stepViewType,
      inputSetData,
      formikRef,
      customStepProps,
      isNewStep,
      readonly,
      onChange,
      allowableTypes
    } = props

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <ECRStepInputSet
          initialValues={initialValues}
          template={inputSetData?.template}
          path={inputSetData?.path || ''}
          readonly={!!inputSetData?.readonly}
          stepViewType={stepViewType}
          onUpdate={onUpdate}
          onChange={onChange}
          allowableTypes={allowableTypes}
        />
      )
    } else if (stepViewType === StepViewType.InputVariable) {
      return (
        <ECRStepVariables
          {...(customStepProps as ECRStepVariablesProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
        />
      )
    }

    return (
      <ECRStepBaseWithRef
        initialValues={initialValues}
        allowableTypes={allowableTypes}
        onChange={onChange}
        stepViewType={stepViewType || StepViewType.Edit}
        onUpdate={onUpdate}
        readonly={readonly}
        isNewStep={isNewStep}
        ref={formikRef}
      />
    )
  }
}
