/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { IconName, MultiTypeInputType } from '@wings-software/uicore'
import type { FormikErrors } from 'formik'
import type { StepViewType, StepProps } from '@pipeline/components/AbstractSteps/Step'
import type { ExecutionElementConfig } from 'services/cd-ng'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { InfraProvisioningBaseWithRef } from './InfraProvisioningBase'

export type ProvisionersOptions = 'TERRAFORM' | 'CLOUD_FORMATION'

export interface InfraProvisioningData {
  provisioner: ExecutionElementConfig
  originalProvisioner?: Partial<ExecutionElementConfig>
  provisionerEnabled: boolean
  provisionerSnippetLoading?: boolean
  selectedProvisioner?: ProvisionersOptions
}

export interface InfraProvisioningDataUI extends Omit<InfraProvisioningData, 'provisioner'> {
  provisioner: {
    stage: {
      spec: {
        execution: ExecutionElementConfig
      }
    }
  }
}

export interface InfraProvisioningProps {
  initialValues: InfraProvisioningData
  template?: InfraProvisioningData
  path?: string
  readonly?: boolean
  stepViewType?: StepViewType
  onUpdate?: (data: InfraProvisioningData) => void
  onChange?: (data: InfraProvisioningData) => void
  allowableTypes: MultiTypeInputType[]
}

export class InfraProvisioning extends PipelineStep<any> {
  protected type = StepType.InfraProvisioning
  protected defaultValues: any = {}

  // TODO: replace with right icon (if needed)
  protected stepIcon: IconName = 'cross'
  protected stepName = 'Infrastructure provisioning'
  protected stepPaletteVisible = false

  constructor() {
    super()
  }

  validateInputSet(): FormikErrors<any> {
    return {}
  }

  renderStep(props: StepProps<any>): JSX.Element {
    const { initialValues, onUpdate, onChange, allowableTypes, stepViewType, formikRef } = props

    return (
      <InfraProvisioningBaseWithRef
        initialValues={initialValues}
        stepViewType={stepViewType}
        onUpdate={onUpdate}
        onChange={onChange}
        allowableTypes={allowableTypes}
        ref={formikRef}
      />
    )
  }
}
