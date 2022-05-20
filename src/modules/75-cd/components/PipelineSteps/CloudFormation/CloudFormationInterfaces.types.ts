/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import type { MultiTypeInputType } from '@harness/uicore'
import type { Scope } from '@common/interfaces/SecretsInterface'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type { SelectOption } from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import type {
  CloudformationRollbackStepInfo,
  StepElementConfig,
  CloudformationDeleteStackStepInfo
} from 'services/cd-ng'
import type { VariableMergeServiceResponse } from 'services/pipeline-ng'

export interface RollbackStackData {
  type: string
  name: string
  identifier: string
  spec: {
    configuration: {
      provisionerIdentifier: string
    }
  }
  timeout: string
}

export interface RollbackStackProps<T = RollbackStackData> {
  initialValues: T
  onUpdate?: (data: T) => void
  onChange?: (data: T) => void
  allowableTypes: MultiTypeInputType[]
  stepViewType?: StepViewType
  configTypes?: SelectOption[]
  isNewStep?: boolean
  inputSetData?: {
    template?: T
    path?: string
  }
  readonly?: boolean
  path?: string
  stepType?: string
  allValues?: T
}

export interface RollbackStackStepInfo {
  spec: CloudformationRollbackStepInfo
  name: string
  identifier: string
  timeout: string
  type: string
}

export interface RollbackVariableStepProps {
  initialValues: RollbackStackData
  originalData?: RollbackStackData
  stageIdentifier?: string
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData?: RollbackStackData
  stepType?: string
}

export const StoreTypes = {
  Inline: 'Inline',
  Remote: 'Remote'
}

export interface Connector {
  label: string
  value: string
  scope: Scope
  live: boolean
  connector: {
    type: string
    identifier: string
    name: string
    spec: { val: string; url: string; connectionType?: string; type?: string }
  }
}

export enum DeleteStackTypes {
  Inline = 'Inline',
  Inherited = 'Inherited'
}

export interface DeleteStackData extends StepElementConfig {
  type: string
  name: string
  identifier: string
  timeout: string
  spec: {
    configuration: {
      type: string
      spec: {
        connectorRef?: Connector | string
        region?: string
        roleArn?: string
        stackName?: string
        provisionerIdentifier?: string
      }
    }
  }
}

export interface CFDeleteStackStepInfo extends StepElementConfig {
  spec: CloudformationDeleteStackStepInfo
  name: string
  identifier: string
  timeout: string
  type: string
}

export interface CloudFormationDeleteStackProps {
  allowableTypes: MultiTypeInputType[]
  isNewStep: boolean | undefined
  readonly: boolean | undefined
  initialValues: any
  onUpdate: (values: any) => void
  onChange: (values: any) => void
  stepViewType: StepViewType | undefined
}

export interface DeleteStackProps<T = DeleteStackData> {
  initialValues: T
  onUpdate?: (data: T) => void
  onChange?: (data: T) => void
  allowableTypes: MultiTypeInputType[]
  stepViewType?: StepViewType
  configTypes?: SelectOption[]
  isNewStep?: boolean
  inputSetData?: {
    template?: T
    path?: string
  }
  readonly?: boolean
  path?: string
  stepType?: string
  allValues?: T
}

export interface DeleteStackVariableStepProps {
  initialValues: DeleteStackData
  originalData?: DeleteStackData
  stageIdentifier?: string
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
  variablesData?: DeleteStackData
  stepType?: string
}
