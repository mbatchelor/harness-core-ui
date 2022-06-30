/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@harness/uicore'
import type { DeploymentStageConfig, PipelineInfrastructure, ServiceConfig, ServiceDefinition } from 'services/cd-ng'

export interface EnvironmentYamlV2 {
  deployToAll: boolean
  environmentInputs?: {
    [key: string]: { [key: string]: any }
  }
  environmentRef: string
  gitOpsClusters?: ClusterYaml[]
  infrastructureDefinitions?: InfraStructureDefinitionYaml[]
  serviceOverrideInputs?: {
    [key: string]: { [key: string]: any }
  }
}

export interface EnvironmentGroupYaml {
  deployToAll?: boolean
  environments?: EnvironmentYamlV2[]
  envGroupRef: string
  metadata?: string
}

export interface ServiceYamlV2 {
  metadata?: string
  serviceInputs?: {
    [key: string]: { [key: string]: any }
  }
  serviceRef: string
}
export interface InfraStructureDefinitionYaml {
  inputs?: {
    [key: string]: { [key: string]: any }
  }
  metadata?: string
  identifier: string
}

export interface ClusterYaml {
  metadata?: string
  identifier: string
}

export type EnvironmentInEnvGroup = {
  name: string
  deployToAll?: boolean
  clusters?: ClusterYaml[]
}

export interface DeployStageConfig
  extends Omit<DeploymentStageConfig, 'execution' | 'infrastructure' | 'serviceConfig'> {
  infrastructure?: PipelineInfrastructure
  serviceConfig?: ServiceConfig
  environment?: EnvironmentYamlV2
  infrastructureInputs?: any // TODO: Change type on creation
  environmentGroup?: EnvironmentGroupYaml
  gitOpsEnabled?: boolean
  service?: ServiceYamlV2
  infrastructureRef?: string
  environmentOrEnvGroupRef?: SelectOption | string
  environmentOrEnvGroupAsRuntime?: string
  environmentInEnvGroupRef?: SelectOption[] | string
  environmentsInEnvGroup?: EnvironmentInEnvGroup[] | string
  clusterRef?: SelectOption[] | string
  isEnvGroup?: boolean
  deploymentType?: ServiceDefinition['type']
}

export interface ServiceInputsConfig {
  serviceInputs: ServiceDefinition
}
