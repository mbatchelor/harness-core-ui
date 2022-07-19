/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiTypeInputType, IconName } from '@harness/uicore'
import type { StageElementWrapper } from '@pipeline/utils/pipelineTypes'

import type { ServiceDefinition, StageElementConfig } from 'services/cd-ng'
import type { PipelineInfoConfig } from 'services/pipeline-ng'

export interface ConfigFilesSelectionProps {
  isPropagating?: boolean
  deploymentType: ServiceDefinition['type']
}

export interface ConfigFilesListViewProps {
  isReadonly: boolean
  isPropagating?: boolean
  allowOnlyOne?: boolean
  deploymentType: ServiceDefinition['type']
  allowableTypes: MultiTypeInputType[]
  stage: StageElementWrapper | undefined
  pipeline: PipelineInfoConfig
  updateStage: (stage: StageElementConfig) => Promise<void>
  selectedConfig: ConfigFileType
  setSelectedConfig: (config: ConfigFileType) => void
  selectedServiceResponse: any
}

export type ConfigFileType = 'Harness' | 'Git' | 'Gitlab' | 'Github' | 'Bitbucket'

export interface ConfigFileStepTitle {
  label: string
  icon: IconName
}

export interface ConfigFileHarnessDataType {
  identifier: string
  fileType: string
  files: any[]
  secretFiles: any[]
}

export interface ConfigFileFileStoreNode {
  path: string
  scope: string
}

export interface ConfigInitStepData {
  identifier: string
  store: ConfigFileType
  files: ConfigFileFileStoreNode[] | string[] | string
  fileType: string
}
