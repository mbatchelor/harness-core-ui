/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { Schema } from 'yup'
import type { IconName } from '@wings-software/uicore'
import { Connectors } from '@connectors/constants'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import { StringKeys, useStrings } from 'framework/strings'
import { IdentifierSchemaWithOutName } from '@common/utils/Validation'
import type { HelmVersionOptions, ManifestStores, ManifestTypes, PrimaryManifestType } from './ManifestInterface'

export const ManifestDataType: Record<ManifestTypes, ManifestTypes> = {
  K8sManifest: 'K8sManifest',
  Values: 'Values',
  HelmChart: 'HelmChart',
  Kustomize: 'Kustomize',
  OpenshiftTemplate: 'OpenshiftTemplate',
  OpenshiftParam: 'OpenshiftParam',
  KustomizePatches: 'KustomizePatches',
  ServerlessAwsLambda: 'ServerlessAwsLambda'
}

export const ManifestToPathMap: Record<PrimaryManifestType, string> = {
  K8sManifest: 'Values',
  HelmChart: 'Values',
  OpenshiftTemplate: 'OpenshiftParam',
  Kustomize: 'KustomizePatches'
}
export const ManifestToPathLabelMap: Record<PrimaryManifestType, StringKeys> = {
  K8sManifest: 'pipeline.manifestType.valuesYamlPath',
  HelmChart: 'pipeline.manifestType.valuesYamlPath',
  OpenshiftTemplate: 'pipeline.manifestType.paramsYamlPath',
  Kustomize: 'pipeline.manifestTypeLabels.KustomizePatches'
}
export const ManifestToPathKeyMap: Record<PrimaryManifestType, string> = {
  K8sManifest: 'valuesPaths',
  HelmChart: 'valuesPaths',
  OpenshiftTemplate: 'paramsPaths',
  Kustomize: 'patchesPaths'
}

export const ManifestStoreMap: { [key: string]: ManifestStores } = {
  Git: 'Git',
  Github: 'Github',
  GitLab: 'GitLab',
  Bitbucket: 'Bitbucket',
  Http: 'Http',
  S3: 'S3',
  Gcs: 'Gcs',
  InheritFromManifest: 'InheritFromManifest'
}

export const allowedManifestTypes: Record<string, Array<ManifestTypes>> = {
  Kubernetes: [
    ManifestDataType.K8sManifest,
    ManifestDataType.Values,
    ManifestDataType.HelmChart,
    ManifestDataType.OpenshiftTemplate,
    ManifestDataType.OpenshiftParam,
    ManifestDataType.Kustomize,
    ManifestDataType.KustomizePatches
  ],
  NativeHelm: [ManifestDataType.Values, ManifestDataType.HelmChart],
  ServerlessAwsLambda: [ManifestDataType.ServerlessAwsLambda]
}

export const manifestStoreTypes: Array<ManifestStores> = [
  ManifestStoreMap.Git,
  ManifestStoreMap.Github,
  ManifestStoreMap.GitLab,
  ManifestStoreMap.Bitbucket
]
export const ManifestTypetoStoreMap: Record<ManifestTypes, ManifestStores[]> = {
  K8sManifest: manifestStoreTypes,
  Values: [...manifestStoreTypes, ManifestStoreMap.InheritFromManifest],
  HelmChart: [...manifestStoreTypes, ManifestStoreMap.Http, ManifestStoreMap.S3, ManifestStoreMap.Gcs],
  Kustomize: manifestStoreTypes,
  OpenshiftTemplate: manifestStoreTypes,
  OpenshiftParam: [...manifestStoreTypes, ManifestStoreMap.InheritFromManifest],
  KustomizePatches: [...manifestStoreTypes, ManifestStoreMap.InheritFromManifest],
  ServerlessAwsLambda: manifestStoreTypes
}

export const manifestTypeIcons: Record<ManifestTypes, IconName> = {
  K8sManifest: 'service-kubernetes',
  Values: 'functions',
  HelmChart: 'service-helm',
  Kustomize: 'kustamize',
  OpenshiftTemplate: 'openshift',
  OpenshiftParam: 'openshift-params',
  KustomizePatches: 'kustomizeparam',
  ServerlessAwsLambda: 'service-serverless-aws'
}

export const manifestTypeLabels: Record<ManifestTypes, StringKeys> = {
  K8sManifest: 'pipeline.manifestTypeLabels.K8sManifest',
  Values: 'pipeline.manifestTypeLabels.ValuesYaml',
  HelmChart: 'pipeline.manifestTypeLabels.HelmChartLabel',
  Kustomize: 'pipeline.manifestTypeLabels.KustomizeLabel',
  OpenshiftTemplate: 'pipeline.manifestTypeLabels.OpenshiftTemplate',
  OpenshiftParam: 'pipeline.manifestTypeLabels.OpenshiftParam',
  KustomizePatches: 'pipeline.manifestTypeLabels.KustomizePatches',
  ServerlessAwsLambda: 'pipeline.manifestTypeLabels.ServerlessAwsLambda'
}

export const helmVersions: Array<{ label: string; value: HelmVersionOptions }> = [
  { label: 'Version 2', value: 'V2' },
  { label: 'Version 3', value: 'V3' }
]

export const ManifestIconByType: Record<ManifestStores, IconName> = {
  Git: 'service-github',
  Github: 'github',
  GitLab: 'service-gotlab',
  Bitbucket: 'bitbucket',
  Http: 'service-helm',
  S3: 'service-service-s3',
  Gcs: 'gcs-step',
  InheritFromManifest: 'custom-artifact'
}

export const ManifestStoreTitle: Record<ManifestStores, StringKeys> = {
  Git: 'pipeline.manifestType.gitConnectorLabel',
  Github: 'common.repo_provider.githubLabel',
  GitLab: 'common.repo_provider.gitlabLabel',
  Bitbucket: 'pipeline.manifestType.bitBucketLabel',
  Http: 'pipeline.manifestType.httpHelmRepoConnectorLabel',
  S3: 'connectors.S3',
  Gcs: 'connectors.GCS.fullName',
  InheritFromManifest: 'pipeline.manifestType.InheritFromManifest'
}

export const ManifestToConnectorMap: Record<ManifestStores | string, ConnectorInfoDTO['type']> = {
  Git: Connectors.GIT,
  Github: Connectors.GITHUB,
  GitLab: Connectors.GITLAB,
  Bitbucket: Connectors.BITBUCKET,
  Http: Connectors.HttpHelmRepo,
  S3: Connectors.AWS,
  Gcs: Connectors.GCP
}

export const ManifestToConnectorLabelMap: Record<Exclude<ManifestStores, 'InheritFromManifest'>, StringKeys> = {
  Git: 'pipeline.manifestType.gitConnectorLabel',
  Github: 'common.repo_provider.githubLabel',
  GitLab: 'common.repo_provider.gitlabLabel',
  Bitbucket: 'pipeline.manifestType.bitBucketLabel',
  Http: 'connectors.title.helmConnector',
  S3: 'pipeline.manifestToConnectorLabelMap.AWSLabel',
  Gcs: 'common.gcp'
}

export enum GitRepoName {
  Account = 'Account',
  Repo = 'Repo'
}

export enum GitFetchTypes {
  Branch = 'Branch',
  Commit = 'Commit'
}

export const gitFetchTypeList = [
  { label: 'Latest from Branch', value: 'Branch' },
  { label: 'Specific Commit Id / Git Tag', value: 'Commit' }
]

export const ManifestIdentifierValidation = (
  manifestIdentifiers: Array<string>,
  id: string | undefined,
  validationMsg: string
): { identifier: Schema<unknown> } => {
  const { getString } = useStrings()

  if (!id) {
    return {
      identifier: IdentifierSchemaWithOutName(getString).notOneOf(manifestIdentifiers, validationMsg)
    }
  }
  return {
    identifier: IdentifierSchemaWithOutName(getString)
  }
}
