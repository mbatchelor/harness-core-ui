/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiTypeInputType } from '@wings-software/uicore'
import type { AbstractStepFactory } from '@pipeline/components/AbstractSteps/AbstractStepFactory'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import type {
  ArtifactListConfig,
  ManifestConfig,
  ManifestConfigWrapper,
  PrimaryArtifact,
  ServiceDefinition,
  ServiceSpec,
  SidecarArtifact
} from 'services/cd-ng'
import type { ArtifactSourceBaseFactory } from '@cd/factory/ArtifactSourceFactory/ArtifactSourceBaseFactory'
import type { ManifestSourceBaseFactory } from '@cd/factory/ManifestSourceFactory/ManifestSourceBaseFactory'
export interface K8SDirectServiceStep extends ServiceSpec {
  stageIndex?: number
  setupModeType?: string
  handleTabChange?: (tab: string) => void
  customStepProps?: Record<string, any>
  deploymentType?: ServiceDefinition['type']
  isReadonlyServiceMode?: boolean
}
export interface KubernetesServiceInputFormProps {
  initialValues: K8SDirectServiceStep
  onUpdate?: ((data: ServiceSpec) => void) | undefined
  stepViewType?: StepViewType
  template?: ServiceSpec
  allValues?: ServiceSpec
  readonly?: boolean
  factory?: AbstractStepFactory
  path?: string
  stageIdentifier: string
  formik?: any
  allowableTypes: MultiTypeInputType[]
}

export interface LastQueryData {
  path?: string
  imagePath?: string
  connectorRef?: string
  connectorType?: string
  registryHostname?: string
  region?: string
  repository?: string
}

export interface KubernetesArtifactsProps {
  type?: string
  template: ServiceSpec
  stepViewType?: StepViewType
  artifactSourceBaseFactory: ArtifactSourceBaseFactory
  stageIdentifier: string
  serviceIdentifier?: string
  artifacts?: ArtifactListConfig
  formik?: any
  path?: string
  initialValues: K8SDirectServiceStep
  readonly: boolean
  allowableTypes: MultiTypeInputType[]
  fromTrigger?: boolean
  artifact?: PrimaryArtifact | SidecarArtifact
  isSidecar?: boolean
  artifactPath?: string
}

export interface KubernetesManifestsProps {
  template: ServiceSpec
  path?: string
  stepViewType?: StepViewType
  manifestSourceBaseFactory: ManifestSourceBaseFactory
  manifests?: ManifestConfigWrapper[]
  initialValues: K8SDirectServiceStep
  readonly: boolean
  stageIdentifier: string
  serviceIdentifier?: string
  formik?: any
  fromTrigger?: boolean
  allowableTypes: MultiTypeInputType[]
  manifest?: ManifestConfig
  manifestPath?: string
}
