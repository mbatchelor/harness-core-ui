/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiTypeInputType, SelectOption } from '@wings-software/uicore'
import type { ConnectorSelectedValue } from '@connectors/components/ConnectorReferenceField/ConnectorReferenceField'
import type {
  ManifestConfig,
  ManifestConfigWrapper,
  PageConnectorResponse,
  PipelineInfoConfig,
  StageElementConfig,
  ServiceDefinition
} from 'services/cd-ng'
import type { StageElementWrapper } from '@pipeline/utils/pipelineTypes'

export type ManifestTypes =
  | 'K8sManifest'
  | 'Values'
  | 'HelmChart'
  | 'Kustomize'
  | 'OpenshiftTemplate'
  | 'OpenshiftParam'
  | 'KustomizePatches'
  | 'ServerlessAwsLambda'

export type PrimaryManifestType = 'K8sManifest' | 'HelmChart' | 'OpenshiftTemplate' | 'Kustomize'

export type ManifestStores =
  | 'Git'
  | 'Github'
  | 'GitLab'
  | 'Bitbucket'
  | 'Http'
  | 'OciHelmChart'
  | 'S3'
  | 'Gcs'
  | 'InheritFromManifest'
  | 'Inline'
export type HelmVersionOptions = 'V2' | 'V3'
export type HelmOCIVersionOptions = 'V380'
export interface ManifestSelectionProps {
  isPropagating?: boolean
  deploymentType: ServiceDefinition['type']
  isReadonlyServiceMode: boolean
  readonly: boolean
  gitOpsEnabled?: boolean
}

export interface ManifestListViewProps {
  pipeline: PipelineInfoConfig
  updateStage: (stage: StageElementConfig) => Promise<void>
  stage: StageElementWrapper | undefined
  isPropagating?: boolean
  connectors: PageConnectorResponse | undefined
  refetchConnectors: () => void
  listOfManifests: Array<any>
  isReadonly: boolean
  deploymentType: ServiceDefinition['type']
  allowableTypes: MultiTypeInputType[]
  allowOnlyOne?: boolean
}

export interface ManifestStepInitData {
  connectorRef: string | undefined | ConnectorSelectedValue
  store: ManifestStores | string
  selectedManifest: ManifestTypes | null
}
export interface K8sValuesManifestDataType {
  identifier: string
  branch: string | undefined
  commitId: string | undefined
  gitFetchType: 'Branch' | 'Commit'
  paths: any
  skipResourceVersioning?: boolean
  repoName?: string
  valuesPaths?: any
}
export interface ManifestLastStepProps {
  key: string
  name: string
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  stepName: string
  initialValues: ManifestConfig
  handleSubmit: (data: ManifestConfigWrapper) => void
  selectedManifest: ManifestTypes | null
  manifestIdsList: Array<string>
  isReadonly?: boolean
  deploymentType?: string
}
export interface CommandFlags {
  commandType: string | SelectOption | undefined
  flag: string | undefined
  id?: string
}
export interface HelmWithGITDataType {
  identifier: string
  branch: string | undefined
  commitId: string | undefined
  repoName?: string
  gitFetchType: 'Branch' | 'Commit'
  folderPath: string
  helmVersion: HelmVersionOptions
  valuesPaths?: any
  skipResourceVersioning: boolean
  commandFlags: Array<CommandFlags>
}
export interface HelmWithHTTPDataType {
  identifier: string
  helmVersion: HelmVersionOptions
  skipResourceVersioning: boolean
  chartName: string
  chartVersion: string
  valuesPaths?: any
  commandFlags: Array<CommandFlags>
}

export interface HelmWithOCIDataType {
  identifier: string
  helmVersion: HelmOCIVersionOptions
  skipResourceVersioning: boolean
  basePath: string
  chartName: string
  chartVersion: string
  valuesPaths?: any
  commandFlags: Array<CommandFlags>
}

export interface HelmWithGcsDataType extends HelmWithHTTPDataType {
  bucketName: SelectOption | string
  folderPath: string
}
export interface OpenShiftTemplateGITDataType {
  identifier: string
  branch: string | undefined
  commitId: string | undefined
  repoName?: string
  gitFetchType: 'Branch' | 'Commit'
  path: string
  paramsPaths?: any
  skipResourceVersioning: boolean
}

export interface KustomizePatchDataType {
  identifier: string
  branch: string | undefined
  commitId: string | undefined
  gitFetchType: 'Branch' | 'Commit'
  paths: string[] | any
  repoName?: string | any
}
export interface KustomizeWithGITDataType {
  identifier: string
  branch: string | undefined
  commitId: string | undefined
  repoName?: string
  gitFetchType: 'Branch' | 'Commit'
  skipResourceVersioning: boolean
  folderPath: string
  pluginPath: string
  patchesPaths?: any
}
export interface OpenShiftParamDataType {
  identifier: string
  branch?: string | undefined
  commitId?: string | undefined
  repoName?: string
  gitFetchType?: 'Branch' | 'Commit'
  paths: string[] | any
}
export interface ServerlessManifestDataType extends K8sValuesManifestDataType {
  identifier: string
  branch: string | undefined
  commitId: string | undefined
  gitFetchType: 'Branch' | 'Commit'
  paths: any
  repoName?: string
  configOverridePath?: string
}
export interface InheritFromManifestDataType {
  identifier: string
  paths: any
}

export interface InlineDataType {
  identifier: string
  content: string
}
