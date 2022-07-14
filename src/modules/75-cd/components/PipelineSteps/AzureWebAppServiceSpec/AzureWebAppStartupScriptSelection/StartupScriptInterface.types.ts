/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@harness/icons'
import type { MultiTypeInputType, StepProps } from '@harness/uicore'
import { Connectors } from '@connectors/constants'
import type { StringKeys } from 'framework/strings'
import type {
  AzureWebAppServiceSpec,
  ConnectorConfigDTO,
  ConnectorInfoDTO,
  PageConnectorResponse,
  ServiceDefinition,
  StageElementConfig,
  StoreConfigWrapper
} from 'services/cd-ng'
import type { ConnectorSelectedValue } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import type { StageElementWrapper } from '@pipeline/utils/pipelineTypes'

export const AllowedTypes: Array<ConnectorTypes> = ['Git', 'Github', 'GitLab', 'Bitbucket', 'Harness']
export type ConnectorTypes = 'Git' | 'Github' | 'GitLab' | 'Bitbucket' | 'Harness'

export const ConnectorIcons: Record<string, IconName> = {
  Git: 'service-github',
  Github: 'github',
  GitLab: 'service-gotlab',
  Bitbucket: 'bitbucket',
  Harness: 'harness'
}

export const ConnectorMap: Record<string, ConnectorInfoDTO['type']> = {
  Git: Connectors.GIT,
  Github: Connectors.GITHUB,
  GitLab: Connectors.GITLAB,
  Bitbucket: Connectors.BITBUCKET,
  Harness: Connectors.HARNESS
}

export const ConnectorLabelMap: Record<ConnectorTypes, StringKeys> = {
  Git: 'pipeline.manifestType.gitConnectorLabel',
  Github: 'common.repo_provider.githubLabel',
  GitLab: 'common.repo_provider.gitlabLabel',
  Bitbucket: 'pipeline.manifestType.bitBucketLabel',
  Harness: 'pipeline.manifestType.gitConnectorLabel'
}

export interface StartupScriptSelectionProps {
  isPropagating?: boolean
  deploymentType: ServiceDefinition['type']
  isReadonlyServiceMode: boolean
  readonly: boolean
}

export interface StartupScriptDataType {
  branch: string | undefined
  commitId: string | undefined
  gitFetchType: 'Branch' | 'Commit'
  paths: string | string[] | undefined
  repoName?: string | undefined
}

export interface HarnessFileStore {
  fileType: string | undefined
  file: string | undefined
}

export interface StepChangeData<SharedObject> {
  prevStep?: number
  nextStep?: number
  prevStepData: SharedObject
}

export interface StartupScriptWizardInitData {
  connectorRef: string | undefined | ConnectorSelectedValue
  store: ConnectorTypes | string
}

export interface StartupScriptWizardStepsProps<T> {
  handleConnectorViewChange: (isConnectorView: boolean) => void
  initialValues: StartupScriptWizardInitData
  newConnectorView: boolean
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  newConnectorSteps?: any
  lastSteps: React.ReactElement<StepProps<ConnectorConfigDTO>> | null
  isReadonly: boolean
  handleStoreChange: (store?: T) => void
  connectorTypes: Array<ConnectorTypes>
}

export interface StartupScriptWizardStepTwoProps {
  stepName: string
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  initialValues: StoreConfigWrapper
  handleSubmit: (data: StoreConfigWrapper) => void
  isReadonly?: boolean
}

export enum GitFetchTypes {
  Branch = 'Branch',
  Commit = 'Commit'
}

export const gitFetchTypeList = [
  { label: 'Latest from Branch', value: GitFetchTypes.Branch },
  { label: 'Specific Commit Id / Git Tag', value: GitFetchTypes.Commit }
]

export interface AzureWebAppsServiceDefinition {
  spec: AzureWebAppServiceSpec
  type: 'Kubernetes' | 'NativeHelm' | 'Ssh' | 'WinRm' | 'ServerlessAwsLambda' | 'AzureWebApp'
}

export interface StartupScriptListViewProps {
  pipeline: any
  updateStage: (stage: StageElementConfig) => Promise<void>
  stage: StageElementWrapper | undefined
  isPropagating?: boolean
  connectors: PageConnectorResponse | undefined
  refetchConnectors: () => void
  isReadonly: boolean
  allowableTypes: MultiTypeInputType[]
  startupScript: StoreConfigWrapper
}

export interface StartupScriptLastStepProps {
  key: string
  name: string
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  stepName: string
  initialValues: StoreConfigWrapper
  handleSubmit: (data: StoreConfigWrapper) => void
  isReadonly?: boolean
  startupScript?: StoreConfigWrapper
}

export interface StartupScriptPropType {
  stepName: string
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  isReadonly: boolean
  connectorTypes: Array<ConnectorTypes>
  initialValues: StartupScriptWizardInitData
  handleConnectorViewChange: () => void
  handleStoreChange: (store: ConnectorTypes) => void
}

export enum FILE_TYPE_VALUES {
  ENCRYPTED = 'encrypted',
  FILE_STORE = 'fileStore'
}
