/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@harness/uicore'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import { Connectors } from '@connectors/constants'

import type { StringKeys } from 'framework/strings'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'

import type { ConfigFileType, ConfigFileStepTitle, ConfigFileHarnessDataType } from './ConfigFilesInterface'

export const ConfigFilesMap: { [key: string]: ConfigFileType } = {
  Git: 'Git',
  Github: 'Github',
  Gitlab: 'Gitlab',
  Bitbucket: 'Bitbucket',
  Harness: 'Harness'
}

export const ConfigFileIconByType: Record<ConfigFileType, IconName> = {
  Git: 'service-github',
  Github: 'github',
  Gitlab: 'gitlab',
  Bitbucket: 'bitbucket-blue',
  Harness: 'harness'
}

export const ConfigFileTypeTitle: Record<ConfigFileType, StringKeys> = {
  Git: 'pipeline.manifestType.gitConnectorLabel',
  Github: 'common.repo_provider.githubLabel',
  Gitlab: 'common.repo_provider.gitlabLabel',
  Bitbucket: 'pipeline.manifestType.bitBucketLabel',
  Harness: 'dashboards.modules.harness'
}

export const allowedConfigFilesTypes: Record<string, Array<ConfigFileType>> = {
  Kubernetes: [],
  NativeHelm: [],
  ServerlessAwsLambda: [],
  Ssh: [ConfigFilesMap.Harness],
  WinRm: [ConfigFilesMap.Harness]
}

export const getIconAndTitleByDeploymentType = (deploymentType: string): ConfigFileStepTitle => {
  switch (deploymentType) {
    case ServiceDeploymentType.Ssh:
      return {
        icon: 'secret-ssh',
        label: 'SSH'
      }
    case ServiceDeploymentType.WinRm:
      return {
        icon: 'command-winrm',
        label: 'WinRm'
      }
    default:
      return {
        icon: '' as IconName,
        label: ''
      }
  }
}

export const ConfigFilesToConnectorLabelMap: Record<ConfigFileType, StringKeys> = {
  Git: 'pipeline.manifestType.gitConnectorLabel',
  Github: 'common.repo_provider.githubLabel',
  Gitlab: 'common.repo_provider.gitlabLabel',
  Bitbucket: 'pipeline.manifestType.bitBucketLabel',
  Harness: 'dashboards.modules.harness'
}

export const ConfigFilesToConnectorMap: Record<ConfigFileType | string, ConnectorInfoDTO['type']> = {
  Git: Connectors.GIT,
  Github: Connectors.GITHUB,
  GitLab: Connectors.GITLAB,
  Bitbucket: Connectors.BITBUCKET,
  Harness: 'Harness' as ConnectorInfoDTO['type']
}

export enum FILE_TYPE_VALUES {
  ENCRYPTED = 'encrypted',
  FILE_STORE = 'fileStore'
}

export const prepareConfigFilesValue = (formData: ConfigFileHarnessDataType & { store?: string }) => {
  const { fileType } = formData

  const filesData: any = {
    files: [],
    secretFiles: []
  }
  if (fileType === FILE_TYPE_VALUES.FILE_STORE) {
    filesData.files = formData?.files
  }
  if (fileType === FILE_TYPE_VALUES.ENCRYPTED) {
    filesData.secretFiles = formData?.files
  }

  return filesData
}

export const ENABLE_CONFIG_FILES = {
  Harness: 'Harness'
}
