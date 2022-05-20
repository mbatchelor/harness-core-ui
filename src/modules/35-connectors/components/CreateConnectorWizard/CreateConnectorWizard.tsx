/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { pick } from 'lodash-es'
import { Connectors } from '@connectors/constants'
import type { ConnectorRequestBody, ConnectorInfoDTO } from 'services/cd-ng'
import type { IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import type { ConnectivityModeType } from '@common/components/ConnectivityMode/ConnectivityMode'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import CreateGitConnector from '../CreateConnector/GitConnector/CreateGitConnector'
import CreateGithubConnector from '../CreateConnector/GithubConnector/CreateGithubConnector'
import CreateGitlabConnector from '../CreateConnector/GitlabConnector/CreateGitlabConnector'
import CreateBitbucketConnector from '../CreateConnector/BitbucketConnector/CreateBitbucketConnector'
import CreateK8sConnector from '../CreateConnector/K8sConnector/CreateK8sConnector'
import CreateHashiCorpVault from '../CreateConnector/HashiCorpVault/CreateHashiCorpVault'
import CreateAppDynamicsConnector from '../CreateConnector/AppDynamicsConnector/CreateAppDynamicsConnector'
import CreateSplunkConnector from '../CreateConnector/SplunkConnector/CreateSplunkConnector'
import CreateDockerConnector from '../CreateConnector/DockerConnector/CreateDockerConnector'
import CreateAWSConnector from '../CreateConnector/AWSConnector/CreateAWSConnector'
import CreateAWSCodeCommitConnector from '../CreateConnector/AWSCodeCommitConnector/CreateAWSCodeCommitConnector'
import CreateNexusConnector from '../CreateConnector/NexusConnector/CreateNexusConnector'
import CreateArtifactoryConnector from '../CreateConnector/ArtifactoryConnector/CreateArtifactoryConnector'
import CreateGcpConnector from '../CreateConnector/GcpConnector/CreateGcpConnector'
import HelmRepoConnector from '../CreateConnector/HelmRepoConnector/HemRepoConnector'
import JiraConnector from '../CreateConnector/JiraConnector/JiraConnector'
import ServiceNowConnector from '../CreateConnector/ServiceNowConnector/ServiceNowConnector'
import CreateAwsKmsConnector from '../CreateConnector/AWSKmsConnector/CreateAwsKmsConnector'
import CreateGcpKmsConnector from '../CreateConnector/GcpKmsConnector/CreateGcpKmsConnector'
import CreateAwsSecretManagerConnector from '../CreateConnector/AWSSecretManager/CreateAwsSecretManagerConnector'
import CreateNewRelicConnector from '../CreateConnector/NewRelicConnector/CreateNewRelicConnector'
import CreatePrometheusConnector from '../CreateConnector/PrometheusConnector/CreatePrometheusConnector'
import CreateDataDogConnector from '../CreateConnector/DataDogConnector/CreateDataDogConnector'
import CreatePagerDutyConnector from '../CreateConnector/PagerDutyConnector/CreatePagerDutyConnector'
import CreateCeAzureConnector from '../CreateConnector/CEAzureConnector/CreateCeAzureConnector'
import CreateCEK8sConnector from '../CreateConnector/CEK8sConnector/CreateCEK8sConnector'
import CreateAzureKeyVaultConnector from '../CreateConnector/CreateAzureKeyConnector/CreateAzureKeyVaultConnector'
import CreateDynatraceConnector from '../CreateConnector/DynatraceConnector/CreateDynatraceConnector'
import CreateSumoLogicConnector from '../CreateConnector/SumoLogicConnector/CreateSumoLogicConnector'
import CENGAwsConnector from '../CreateConnector/CENGAwsConnector/CreateCeAwsConnector'
import CreateCeGcpConnector from '../CreateConnector/CEGcpConnector/CreateCeGcpConnector'
import CreateCustomHealthConnector from '../CreateConnector/CustomHealthConnector/CreateCustomHealthConnector'
import CreateErrorTrackingConnector from '../CreateConnector/ErrorTrackingConnector/CreateErrorTrackingConnector'
import CreateAzureConnector from '../CreateConnector/AzureConnector/CreateAzureConnector'
import { ConnectorWizardContextProvider } from './ConnectorWizardContext'

interface CreateConnectorWizardProps {
  accountId: string
  projectIdentifier: string
  orgIdentifier: string
  type: ConnectorInfoDTO['type']
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  connectorInfo: ConnectorInfoDTO | void
  connectivityMode?: ConnectivityModeType
  setConnectivityMode?: (val: ConnectivityModeType) => void
  gitDetails?: IGitContextFormProps
  onClose: () => void
  onSuccess: (data?: ConnectorRequestBody) => void | Promise<void>
}

export const ConnectorWizard: React.FC<CreateConnectorWizardProps> = props => {
  const { type } = props
  const { trackEvent } = useTelemetry()
  const onSuccessWithEventTracking = (data?: ConnectorRequestBody): void | Promise<void> => {
    props.onSuccess(data)
    trackEvent(ConnectorActions.SaveCreateConnector, {
      category: Category.CONNECTOR,
      data
    })
  }

  let commonProps = pick(props, [
    'onSuccess',
    'onClose',
    'isEditMode',
    'setIsEditMode',
    'connectorInfo',
    'gitDetails',
    'accountId',
    'orgIdentifier',
    'projectIdentifier',
    'connectivityMode',
    'setConnectivityMode'
  ])
  commonProps = {
    ...commonProps,
    onSuccess: onSuccessWithEventTracking
  }

  const { ERROR_TRACKING_ENABLED, NG_AZURE } = useFeatureFlags()

  React.useEffect(() => {
    trackEvent(ConnectorActions.StartCreateConnector, {
      category: Category.CONNECTOR
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  switch (type) {
    case Connectors.CUSTOM:
      return <CreateCustomHealthConnector {...commonProps} />
    case Connectors.KUBERNETES_CLUSTER:
      return <CreateK8sConnector {...commonProps} />
    case Connectors.GIT:
      return <CreateGitConnector {...commonProps} />
    case Connectors.GITHUB:
      return <CreateGithubConnector {...commonProps} />
    case Connectors.GITLAB:
      return <CreateGitlabConnector {...commonProps} />
    case Connectors.BITBUCKET:
      return <CreateBitbucketConnector {...commonProps} />
    case Connectors.VAULT:
      return <CreateHashiCorpVault {...commonProps} />
    case Connectors.Jira:
      return <JiraConnector {...commonProps} />
    case Connectors.APP_DYNAMICS:
      return <CreateAppDynamicsConnector {...commonProps} />
    case Connectors.SPLUNK:
      return <CreateSplunkConnector {...commonProps} />
    case Connectors.NEW_RELIC:
      return <CreateNewRelicConnector {...commonProps} />
    case Connectors.PROMETHEUS:
      return <CreatePrometheusConnector {...commonProps} />
    case Connectors.DOCKER:
      return <CreateDockerConnector {...commonProps} />
    case Connectors.HttpHelmRepo:
      return <HelmRepoConnector {...commonProps} />
    case Connectors.AWS:
      return <CreateAWSConnector {...commonProps} />
    case Connectors.AWS_CODECOMMIT:
      return <CreateAWSCodeCommitConnector {...commonProps} />
    case Connectors.NEXUS:
      return <CreateNexusConnector {...commonProps} />
    case Connectors.ARTIFACTORY:
      return <CreateArtifactoryConnector {...commonProps} />
    case Connectors.GCP:
      return <CreateGcpConnector {...commonProps} />
    case Connectors.AWS_KMS:
      return <CreateAwsKmsConnector {...commonProps} />
    case Connectors.AWS_SECRET_MANAGER:
      return <CreateAwsSecretManagerConnector {...commonProps} />
    case Connectors.GCP_KMS:
      return <CreateGcpKmsConnector {...commonProps} />
    case Connectors.CE_AZURE:
      return <CreateCeAzureConnector {...commonProps} />
    case Connectors.CE_KUBERNETES:
      return <CreateCEK8sConnector {...commonProps} />
    case Connectors.DATADOG:
      return <CreateDataDogConnector {...commonProps} />
    case Connectors.AZURE_KEY_VAULT:
      return <CreateAzureKeyVaultConnector {...commonProps} />
    case Connectors.DYNATRACE:
      return <CreateDynatraceConnector {...commonProps} />
    case Connectors.SUMOLOGIC:
      return <CreateSumoLogicConnector {...commonProps} />
    case Connectors.CEAWS:
      return <CENGAwsConnector {...commonProps} />
    case Connectors.CE_GCP:
      return <CreateCeGcpConnector {...commonProps} />
    case Connectors.PAGER_DUTY:
      return <CreatePagerDutyConnector {...commonProps} />
    case Connectors.SERVICE_NOW:
      return <ServiceNowConnector {...commonProps} />
    case Connectors.ERROR_TRACKING:
      return ERROR_TRACKING_ENABLED ? <CreateErrorTrackingConnector {...commonProps} /> : null
    case Connectors.AZURE:
      return NG_AZURE ? <CreateAzureConnector {...commonProps} /> : null
    default:
      return null
  }
}

export const CreateConnectorWizard: React.FC<CreateConnectorWizardProps> = props => {
  return (
    <ConnectorWizardContextProvider>
      <ConnectorWizard {...props} />
    </ConnectorWizardContextProvider>
  )
}
