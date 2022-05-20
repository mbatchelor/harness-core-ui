/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useState } from 'react'
import {
  Layout,
  Text,
  Icon,
  StepWizard,
  StepProps,
  Button,
  MultiTypeInputType,
  getMultiTypeFromValue,
  ButtonSize,
  ButtonVariation,
  Container
} from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { FontVariation, Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { Dialog, IDialogProps, Classes } from '@blueprintjs/core'
import { get, set } from 'lodash-es'

import type { IconProps } from '@harness/icons'
import produce from 'immer'
import { useStrings } from 'framework/strings'

import ConnectorDetailsStep from '@connectors/components/CreateConnector/commonSteps/ConnectorDetailsStep'
import GitDetailsStep from '@connectors/components/CreateConnector/commonSteps/GitDetailsStep'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import StepGitAuthentication from '@connectors/components/CreateConnector/GitConnector/StepAuth/StepGitAuthentication'
import StepHelmAuth from '@connectors/components/CreateConnector/HelmRepoConnector/StepHelmRepoAuth'
import type {
  ConnectorConfigDTO,
  ConnectorInfoDTO,
  ManifestConfig,
  ManifestConfigWrapper,
  StageElementConfig
} from 'services/cd-ng'
import StepAWSAuthentication from '@connectors/components/CreateConnector/AWSConnector/StepAuth/StepAWSAuthentication'
import StepGithubAuthentication from '@connectors/components/CreateConnector/GithubConnector/StepAuth/StepGithubAuthentication'
import StepBitbucketAuthentication from '@connectors/components/CreateConnector/BitbucketConnector/StepAuth/StepBitbucketAuthentication'
import StepGitlabAuthentication from '@connectors/components/CreateConnector/GitlabConnector/StepAuth/StepGitlabAuthentication'
import { Connectors, CONNECTOR_CREDENTIALS_STEP_IDENTIFIER } from '@connectors/constants'
import {
  buildAWSPayload,
  buildBitbucketPayload,
  buildGcpPayload,
  buildGithubPayload,
  buildGitlabPayload,
  buildGitPayload,
  buildHelmPayload
} from '@connectors/pages/connectors/utils/ConnectorUtils'
import DelegateSelectorStep from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelectorStep'
import GcpAuthentication from '@connectors/components/CreateConnector/GcpConnector/StepAuth/GcpAuthentication'

import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { ManifestActions } from '@common/constants/TrackingConstants'

import { ManifestWizard } from '../ManifestWizard/ManifestWizard'
import { getStatus, getConnectorNameFromValue } from '../../PipelineStudio/StageBuilder/StageBuilderUtil'
import { useVariablesExpression } from '../../PipelineStudio/PiplineHooks/useVariablesExpression'
import {
  ManifestIconByType,
  ManifestDataType,
  ManifestToConnectorMap,
  ManifestStoreMap,
  manifestTypeIcons,
  manifestTypeLabels,
  allowedManifestTypes,
  ManifestTypetoStoreMap,
  ManifestToPathKeyMap
} from '../Manifesthelper'
import type { ConnectorRefLabelType } from '../../ArtifactsSelection/ArtifactInterface'
import type {
  ManifestStepInitData,
  ManifestTypes,
  ManifestListViewProps,
  ManifestLastStepProps,
  ManifestStores,
  PrimaryManifestType
} from '../ManifestInterface'
import K8sValuesManifest from '../ManifestWizardSteps/K8sValuesManifest/K8sValuesManifest'
import HelmWithGIT from '../ManifestWizardSteps/HelmWithGIT/HelmWithGIT'
import HelmWithHttp from '../ManifestWizardSteps/HelmWithHttp/HelmWithHttp'
import OpenShiftTemplateWithGit from '../ManifestWizardSteps/OSTemplateWithGit/OSTemplateWithGit'
import HelmWithGcs from '../ManifestWizardSteps/HelmWithGcs/HelmWithGcs'
import HelmWithS3 from '../ManifestWizardSteps/HelmWithS3/HelmWithS3'
import KustomizeWithGIT from '../ManifestWizardSteps/KustomizeWithGIT/KustomizeWithGIT'
import OpenShiftParamWithGit from '../ManifestWizardSteps/OpenShiftParam/OSWithGit'
import KustomizePatchDetails from '../ManifestWizardSteps/KustomizePatchesDetails/KustomizePatchesDetails'
import ServerlessAwsLambdaManifest from '../ManifestWizardSteps/ServerlessAwsLambdaManifest/ServerlessAwsLambdaManifest'
import AttachPathYamlFlow from './AttachPathYamlFlow'
import InheritFromManifest from '../ManifestWizardSteps/InheritFromManifest/InheritFromManifest'
import css from '../ManifestSelection.module.scss'

const showAddManifestBtn = (isReadonly: boolean, allowOnlyOne: boolean, listOfManifests: Array<any>): boolean => {
  if (allowOnlyOne && listOfManifests.length === 1) {
    return false
  }
  return !isReadonly
}

function ManifestListView({
  updateStage,
  stage,
  isPropagating,
  connectors,
  refetchConnectors,
  listOfManifests,
  deploymentType,
  isReadonly,
  allowableTypes,
  allowOnlyOne = false
}: ManifestListViewProps): JSX.Element {
  const [selectedManifest, setSelectedManifest] = useState<ManifestTypes | null>(null)
  const [connectorView, setConnectorView] = useState(false)
  const [manifestStore, setManifestStore] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [manifestIndex, setEditIndex] = useState(0)
  const { trackEvent } = useTelemetry()

  const DIALOG_PROPS: IDialogProps = {
    isOpen: true,
    usePortal: true,
    autoFocus: true,
    canEscapeKeyClose: false,
    canOutsideClickClose: false,
    enforceFocus: false,
    style: { width: 1175, minHeight: 640, borderLeft: 0, paddingBottom: 0, position: 'relative', overflow: 'hidden' }
  }

  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  const removeManifestConfig = (index: number): void => {
    listOfManifests.splice(index, 1)

    if (stage) {
      const newStage = produce(stage, draft => {
        set(draft, 'stage.spec.serviceConfig.serviceDefinition.spec.manifests', listOfManifests)
      }).stage

      if (newStage) {
        updateStage(newStage)
      }
    }
  }

  const addNewManifest = (): void => {
    setEditIndex(listOfManifests.length)
    setSelectedManifest(
      allowedManifestTypes[deploymentType]?.length === 1 ? allowedManifestTypes[deploymentType][0] : null
    )
    showConnectorModal()
  }

  const editManifest = (manifestType: ManifestTypes, store: ManifestStores, index: number): void => {
    setSelectedManifest(manifestType)
    setManifestStore(store)
    setConnectorView(false)
    setEditIndex(index)
    showConnectorModal()
  }

  const getLastStepInitialData = (): ManifestConfig => {
    const initValues = get(listOfManifests[manifestIndex], 'manifest', null)
    if (initValues?.type && initValues?.type !== selectedManifest) {
      return null as unknown as ManifestConfig
    }
    return initValues
  }

  const getInitialValues = (): ManifestStepInitData => {
    const initValues = get(listOfManifests[manifestIndex], 'manifest.spec.store.spec', null)

    if (initValues) {
      const values = {
        ...initValues,
        store: listOfManifests[manifestIndex]?.manifest.spec?.store?.type,
        connectorRef: initValues?.connectorRef,
        selectedManifest: get(listOfManifests[manifestIndex], 'manifest.type', null)
      }
      return values
    }
    return {
      store: manifestStore,
      connectorRef: undefined,
      selectedManifest: selectedManifest
    }
  }

  const updateStageData = (): void => {
    const path = isPropagating
      ? 'stage.spec.serviceConfig.stageOverrides.manifests'
      : 'stage.spec.serviceConfig.serviceDefinition.spec.manifests'

    if (stage) {
      updateStage(
        produce(stage, draft => {
          set(draft, path, listOfManifests)
        }).stage as StageElementConfig
      )
    }
  }

  const handleSubmit = (manifestObj: ManifestConfigWrapper): void => {
    const isNewManifest = manifestIndex === listOfManifests.length
    if (isPropagating) {
      if (listOfManifests?.length > 0) {
        listOfManifests.splice(manifestIndex, 1, manifestObj)
      } else {
        listOfManifests.push(manifestObj)
      }
    } else {
      if (listOfManifests?.length > 0) {
        listOfManifests.splice(manifestIndex, 1, manifestObj)
      } else {
        listOfManifests.push(manifestObj)
      }
    }

    updateStageData()
    trackEvent(
      isNewManifest ? ManifestActions.SaveManifestOnPipelinePage : ManifestActions.UpdateManifestOnPipelinePage,
      {
        manifest: manifestObj?.manifest?.type || selectedManifest || '',
        storeType: manifestObj?.manifest?.spec?.store?.type || ''
      }
    )

    hideConnectorModal()
    setConnectorView(false)
    setSelectedManifest(null)
    setManifestStore('')
    refetchConnectors()
  }

  const attachPathYaml = useCallback(
    (manifestPathData: any, manifestId: string, manifestType: PrimaryManifestType): void => {
      const manifestData = listOfManifests.find(manifestObj => manifestObj.manifest.identifier === manifestId)
      set(manifestData, `manifest.spec.${ManifestToPathKeyMap[manifestType]}`, manifestPathData)
      updateStageData()
    },
    []
  )

  const removeValuesYaml = useCallback(
    (valuesYamlIndex: number, manifestId: string, manifestType: PrimaryManifestType): void => {
      const manifestData = listOfManifests.find(manifestObj => manifestObj.manifest.identifier === manifestId)
      manifestData.manifest.spec[ManifestToPathKeyMap[manifestType]].splice(valuesYamlIndex, 1)
      updateStageData()
    },
    []
  )

  const changeManifestType = (selected: ManifestTypes | null): void => {
    setSelectedManifest(selected)
  }
  const handleConnectorViewChange = (isConnectorView: boolean): void => {
    setConnectorView(isConnectorView)
    setIsEditMode(false)
  }
  const handleStoreChange = (store?: ManifestStores): void => {
    setManifestStore(store || '')
  }

  const lastStepProps = useCallback((): ManifestLastStepProps => {
    const manifestDetailsProps: ManifestLastStepProps = {
      key: getString('pipeline.manifestType.manifestDetails'),
      name: getString('pipeline.manifestType.manifestDetails'),
      expressions,
      allowableTypes,
      stepName: getString('pipeline.manifestType.manifestDetails'),
      initialValues: getLastStepInitialData(),
      handleSubmit: handleSubmit,
      selectedManifest,
      manifestIdsList: listOfManifests.map((item: ManifestConfigWrapper) => item.manifest?.identifier as string),
      isReadonly: isReadonly
    }
    if (selectedManifest === ManifestDataType.HelmChart) {
      manifestDetailsProps.deploymentType = deploymentType
    }
    return manifestDetailsProps
  }, [selectedManifest, manifestStore, getLastStepInitialData])

  const getLabels = (): ConnectorRefLabelType => {
    return {
      firstStepName: getString('pipeline.manifestType.specifyManifestRepoType'),
      secondStepName: `${getString('common.specify')} ${
        selectedManifest && getString(manifestTypeLabels[selectedManifest])
      } ${getString('store')}`
    }
  }

  const getIconProps = (): IconProps => {
    const iconProps: IconProps = {
      name: manifestTypeIcons[selectedManifest as ManifestTypes]
    }

    if (selectedManifest === ManifestDataType.HelmChart) {
      iconProps.color = Color.WHITE
    }
    return iconProps
  }

  const getBuildPayload = (type: ConnectorInfoDTO['type']) => {
    if (type === Connectors.GIT) {
      return buildGitPayload
    }
    if (type === Connectors.GITHUB) {
      return buildGithubPayload
    }
    if (type === Connectors.BITBUCKET) {
      return buildBitbucketPayload
    }
    if (type === Connectors.GITLAB) {
      return buildGitlabPayload
    }
    return () => ({})
  }

  const getLastSteps = useCallback((): Array<React.ReactElement<StepProps<ConnectorConfigDTO>>> => {
    const arr: Array<React.ReactElement<StepProps<ConnectorConfigDTO>>> = []
    let manifestDetailStep = null

    switch (true) {
      case selectedManifest === ManifestDataType.HelmChart &&
        [ManifestStoreMap.Git, ManifestStoreMap.Github, ManifestStoreMap.GitLab, ManifestStoreMap.Bitbucket].includes(
          manifestStore as ManifestStores
        ):
        manifestDetailStep = <HelmWithGIT {...lastStepProps()} />
        break
      case selectedManifest === ManifestDataType.HelmChart && manifestStore === ManifestStoreMap.Http:
        manifestDetailStep = <HelmWithHttp {...lastStepProps()} />
        break

      case selectedManifest === ManifestDataType.HelmChart && manifestStore === ManifestStoreMap.S3:
        manifestDetailStep = <HelmWithS3 {...lastStepProps()} />
        break
      case selectedManifest === ManifestDataType.HelmChart && manifestStore === ManifestStoreMap.Gcs:
        manifestDetailStep = <HelmWithGcs {...lastStepProps()} />
        break
      case selectedManifest === ManifestDataType.OpenshiftTemplate:
        manifestDetailStep = <OpenShiftTemplateWithGit {...lastStepProps()} />
        break
      case selectedManifest === ManifestDataType.Kustomize:
        manifestDetailStep = <KustomizeWithGIT {...lastStepProps()} />
        break
      case selectedManifest === ManifestDataType.OpenshiftParam &&
        [ManifestStoreMap.Git, ManifestStoreMap.Github, ManifestStoreMap.GitLab, ManifestStoreMap.Bitbucket].includes(
          manifestStore as ManifestStores
        ):
        manifestDetailStep = <OpenShiftParamWithGit {...lastStepProps()} />
        break

      case selectedManifest === ManifestDataType.KustomizePatches &&
        [ManifestStoreMap.Git, ManifestStoreMap.Github, ManifestStoreMap.GitLab, ManifestStoreMap.Bitbucket].includes(
          manifestStore as ManifestStores
        ):
        manifestDetailStep = <KustomizePatchDetails {...lastStepProps()} />
        break
      case selectedManifest === ManifestDataType.ServerlessAwsLambda:
        manifestDetailStep = <ServerlessAwsLambdaManifest {...lastStepProps()} />
        break
      case selectedManifest === ManifestDataType.Values && manifestStore === ManifestStoreMap.InheritFromManifest:
        manifestDetailStep = <InheritFromManifest {...lastStepProps()} />
        break
      case [ManifestDataType.Values, ManifestDataType.OpenshiftParam, ManifestDataType.KustomizePatches].includes(
        selectedManifest as ManifestTypes
      ) && manifestStore === ManifestStoreMap.InheritFromManifest:
        manifestDetailStep = <InheritFromManifest {...lastStepProps()} />
        break
      case [ManifestDataType.K8sManifest, ManifestDataType.Values].includes(selectedManifest as ManifestTypes) &&
        [ManifestStoreMap.Git, ManifestStoreMap.Github, ManifestStoreMap.GitLab, ManifestStoreMap.Bitbucket].includes(
          manifestStore as ManifestStores
        ):
      default:
        manifestDetailStep = <K8sValuesManifest {...lastStepProps()} />
        break
    }

    arr.push(manifestDetailStep)
    return arr
  }, [manifestStore, selectedManifest, lastStepProps])

  const getNewConnectorSteps = useCallback((): JSX.Element => {
    const buildPayload = getBuildPayload(ManifestToConnectorMap[manifestStore])
    switch (manifestStore) {
      case ManifestStoreMap.Http:
        return (
          <StepWizard title={getString('connectors.createNewConnector')}>
            <ConnectorDetailsStep
              type={ManifestToConnectorMap[manifestStore]}
              name={getString('overview')}
              isEditMode={isEditMode}
              gitDetails={{ repoIdentifier, branch, getDefaultFromOtherRepo: true }}
            />
            <StepHelmAuth
              name={getString('details')}
              identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
              accountId={accountId}
              orgIdentifier={orgIdentifier}
              projectIdentifier={projectIdentifier}
              isEditMode={isEditMode}
              connectorInfo={undefined}
              setIsEditMode={setIsEditMode}
            />
            <DelegateSelectorStep
              name={getString('delegate.DelegateselectionLabel')}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
              connectorInfo={undefined}
              buildPayload={buildHelmPayload}
            />

            <VerifyOutOfClusterDelegate
              name={getString('connectors.stepThreeName')}
              connectorInfo={undefined}
              isStep={true}
              isLastStep={false}
              type={ManifestToConnectorMap[manifestStore]}
            />
          </StepWizard>
        )
      case ManifestStoreMap.S3:
        return (
          <StepWizard iconProps={{ size: 37 }} title={getString('connectors.createNewConnector')}>
            <ConnectorDetailsStep
              type={ManifestToConnectorMap[manifestStore]}
              name={getString('overview')}
              isEditMode={isEditMode}
              gitDetails={{ repoIdentifier, branch, getDefaultFromOtherRepo: true }}
            />
            <StepAWSAuthentication
              name={getString('credentials')}
              identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
              accountId={accountId}
              orgIdentifier={orgIdentifier}
              projectIdentifier={projectIdentifier}
              connectorInfo={undefined}
              onConnectorCreated={() => {
                //TO BE Removed
              }}
            />
            <DelegateSelectorStep
              name={getString('delegate.DelegateselectionLabel')}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
              buildPayload={buildAWSPayload}
              connectorInfo={undefined}
            />
            <VerifyOutOfClusterDelegate
              name={getString('connectors.stepThreeName')}
              connectorInfo={undefined}
              isStep={true}
              isLastStep={false}
              type={ManifestToConnectorMap[manifestStore]}
            />
          </StepWizard>
        )
      case ManifestStoreMap.Gcs:
        return (
          <StepWizard iconProps={{ size: 37 }} title={getString('connectors.createNewConnector')}>
            <ConnectorDetailsStep
              type={Connectors.GCP}
              name={getString('overview')}
              isEditMode={isEditMode}
              connectorInfo={undefined}
              gitDetails={{ repoIdentifier, branch, getDefaultFromOtherRepo: true }}
            />
            <GcpAuthentication
              name={getString('details')}
              identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
              accountId={accountId}
              orgIdentifier={orgIdentifier}
              projectIdentifier={projectIdentifier}
              onConnectorCreated={() => {
                //TO BE Removed
              }}
              connectorInfo={undefined}
            />
            <DelegateSelectorStep
              name={getString('delegate.DelegateselectionLabel')}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
              buildPayload={buildGcpPayload}
              onConnectorCreated={() => {
                //TO BE Removed
              }}
              connectorInfo={undefined}
            />
            <VerifyOutOfClusterDelegate
              name={getString('connectors.stepThreeName')}
              connectorInfo={undefined}
              isStep={true}
              isLastStep={false}
              type={Connectors.GCP}
            />
          </StepWizard>
        )

      default:
        return (
          <StepWizard title={getString('connectors.createNewConnector')}>
            <ConnectorDetailsStep
              type={ManifestToConnectorMap[manifestStore]}
              name={getString('overview')}
              isEditMode={isEditMode}
              gitDetails={{ repoIdentifier, branch, getDefaultFromOtherRepo: true }}
            />
            <GitDetailsStep
              type={ManifestToConnectorMap[manifestStore]}
              name={getString('details')}
              isEditMode={isEditMode}
              connectorInfo={undefined}
            />
            {ManifestToConnectorMap[manifestStore] === Connectors.GIT ? (
              <StepGitAuthentication
                name={getString('credentials')}
                onConnectorCreated={() => {
                  // Handle on success
                }}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                connectorInfo={undefined}
                accountId={accountId}
                orgIdentifier={orgIdentifier}
                projectIdentifier={projectIdentifier}
              />
            ) : null}
            {ManifestToConnectorMap[manifestStore] === Connectors.GITHUB ? (
              <StepGithubAuthentication
                name={getString('credentials')}
                onConnectorCreated={() => {
                  // Handle on success
                }}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                connectorInfo={undefined}
                accountId={accountId}
                orgIdentifier={orgIdentifier}
                projectIdentifier={projectIdentifier}
              />
            ) : null}
            {ManifestToConnectorMap[manifestStore] === Connectors.BITBUCKET ? (
              <StepBitbucketAuthentication
                name={getString('credentials')}
                onConnectorCreated={() => {
                  // Handle on success
                }}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                connectorInfo={undefined}
                accountId={accountId}
                orgIdentifier={orgIdentifier}
                projectIdentifier={projectIdentifier}
              />
            ) : null}
            {ManifestToConnectorMap[manifestStore] === Connectors.GITLAB ? (
              <StepGitlabAuthentication
                name={getString('credentials')}
                identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
                onConnectorCreated={() => {
                  // Handle on success
                }}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                connectorInfo={undefined}
                accountId={accountId}
                orgIdentifier={orgIdentifier}
                projectIdentifier={projectIdentifier}
              />
            ) : null}
            <DelegateSelectorStep
              name={getString('delegate.DelegateselectionLabel')}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
              buildPayload={buildPayload}
              connectorInfo={undefined}
            />
            <VerifyOutOfClusterDelegate
              name={getString('connectors.stepThreeName')}
              connectorInfo={undefined}
              isStep={true}
              isLastStep={false}
              type={ManifestToConnectorMap[manifestStore]}
            />
          </StepWizard>
        )
    }
  }, [connectorView, manifestStore, isEditMode])

  const [showConnectorModal, hideConnectorModal] = useModalHook(() => {
    const onClose = (): void => {
      setConnectorView(false)
      hideConnectorModal()
      setManifestStore('')
      setIsEditMode(false)
      setSelectedManifest(null)
    }

    return (
      <Dialog onClose={onClose} {...DIALOG_PROPS} className={cx(css.modal, Classes.DIALOG)}>
        <div className={css.createConnectorWizard}>
          <ManifestWizard
            types={allowedManifestTypes[deploymentType]}
            manifestStoreTypes={ManifestTypetoStoreMap[selectedManifest as ManifestTypes]}
            labels={getLabels()}
            selectedManifest={selectedManifest}
            newConnectorView={connectorView}
            expressions={expressions}
            allowableTypes={allowableTypes}
            changeManifestType={changeManifestType}
            handleConnectorViewChange={handleConnectorViewChange}
            handleStoreChange={handleStoreChange}
            initialValues={getInitialValues()}
            newConnectorSteps={getNewConnectorSteps()}
            lastSteps={getLastSteps()}
            iconsProps={getIconProps()}
            isReadonly={isReadonly}
          />
        </div>
        <Button minimal icon="cross" onClick={onClose} className={css.crossIcon} />
      </Dialog>
    )
  }, [
    selectedManifest,
    connectorView,
    manifestIndex,
    manifestStore,
    expressions.length,
    expressions,
    allowableTypes,
    isEditMode
  ])

  return (
    <Layout.Vertical style={{ width: '100%' }}>
      <Layout.Vertical spacing="small" style={{ flexShrink: 'initial' }}>
        {!!listOfManifests?.length && (
          <div className={cx(css.manifestList, css.listHeader)}>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('common.ID')}</Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>
              {getString('pipelineSteps.serviceTab.manifestList.manifestType')}
            </Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>
              {getString('pipelineSteps.serviceTab.manifestList.manifestStore')}
            </Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('location')}</Text>
            <span></span>
          </div>
        )}
        <Layout.Vertical style={{ flexShrink: 'initial' }}>
          <section>
            {listOfManifests &&
              listOfManifests.map((data: ManifestConfigWrapper, index: number) => {
                const manifest = data['manifest']

                const { color } = getStatus(manifest?.spec?.store?.spec?.connectorRef, connectors, accountId)
                const connectorName = getConnectorNameFromValue(manifest?.spec?.store?.spec?.connectorRef, connectors)

                return (
                  <div className={css.rowItem} key={`${manifest?.identifier}-${index}`}>
                    <section className={css.manifestList}>
                      <div className={css.columnId}>
                        <Icon inline name={manifestTypeIcons[manifest?.type as ManifestTypes]} size={20} />
                        <Text inline width={150} className={css.type} color={Color.BLACK} lineClamp={1}>
                          {manifest?.identifier}
                        </Text>
                      </div>
                      <div>{getString(manifestTypeLabels[manifest?.type as ManifestTypes])}</div>
                      <div className={css.connectorNameField}>
                        {!!manifest?.spec?.store?.spec.connectorRef && (
                          <>
                            <Icon
                              padding={{ right: 'small' }}
                              name={ManifestIconByType[manifest?.spec?.store.type as ManifestStores]}
                              size={18}
                            />
                            <Text
                              tooltip={
                                <Container className={css.borderRadius} padding="medium">
                                  <div>
                                    <Text font="small" color={Color.GREY_100}>
                                      {connectorName}
                                    </Text>
                                    <Text font="small" color={Color.GREY_300}>
                                      {manifest?.spec?.store?.spec.connectorRef}
                                    </Text>
                                  </div>
                                </Container>
                              }
                              tooltipProps={{ isDark: true }}
                              alwaysShowTooltip
                              className={css.connectorName}
                              lineClamp={1}
                            >
                              {connectorName ?? manifest?.spec?.store?.spec.connectorRef}
                            </Text>
                            {getMultiTypeFromValue(manifest?.spec?.store?.spec.connectorRef) ===
                              MultiTypeInputType.FIXED && <Icon name="full-circle" size={8} color={color} />}
                          </>
                        )}
                      </div>

                      {!!manifest?.spec?.store?.spec.paths?.length && (
                        <span>
                          <Text lineClamp={1} width={200}>
                            <span className={css.noWrap}>
                              {typeof manifest?.spec?.store?.spec.paths === 'string'
                                ? manifest?.spec?.store?.spec.paths
                                : manifest?.spec?.store?.spec.paths.join(', ')}
                            </span>
                          </Text>
                        </span>
                      )}
                      {!!manifest?.spec?.paths?.length && (
                        <span>
                          <Text lineClamp={1} width={200}>
                            <span className={css.noWrap}>
                              {typeof manifest?.spec.paths === 'string'
                                ? manifest?.spec.paths
                                : manifest?.spec.paths.join(', ')}
                            </span>
                          </Text>
                        </span>
                      )}
                      {!!manifest?.spec?.store?.spec.folderPath && (
                        <span>
                          <Text lineClamp={1} width={200}>
                            <span className={css.noWrap}>{manifest.spec.store?.spec?.folderPath}</span>
                          </Text>
                        </span>
                      )}

                      {!!(manifest?.spec?.chartName && !manifest?.spec?.store?.spec.folderPath) && (
                        <span>
                          <Text lineClamp={1} width={200}>
                            <span className={css.noWrap}>{manifest.spec.chartName}</span>
                          </Text>
                        </span>
                      )}

                      {!isReadonly && (
                        <span>
                          <Layout.Horizontal>
                            <Button
                              icon="Edit"
                              iconProps={{ size: 18 }}
                              onClick={() =>
                                editManifest(
                                  manifest?.type as ManifestTypes,
                                  manifest?.spec?.store?.type as ManifestStores,
                                  index
                                )
                              }
                              minimal
                            />

                            <Button
                              iconProps={{ size: 18 }}
                              icon="main-trash"
                              onClick={() => removeManifestConfig(index)}
                              minimal
                            />
                          </Layout.Horizontal>
                        </span>
                      )}
                    </section>
                    <AttachPathYamlFlow
                      manifestType={manifest?.type as PrimaryManifestType}
                      valuesPaths={manifest?.spec[ManifestToPathKeyMap[manifest?.type as PrimaryManifestType]]}
                      expressions={expressions}
                      allowableTypes={allowableTypes}
                      attachPathYaml={formData =>
                        attachPathYaml(formData, manifest?.identifier as string, manifest?.type as PrimaryManifestType)
                      }
                      removeValuesYaml={valuesYamlIndex =>
                        removeValuesYaml(
                          valuesYamlIndex,
                          manifest?.identifier as string,
                          manifest?.type as PrimaryManifestType
                        )
                      }
                    />
                  </div>
                )
              })}
          </section>
        </Layout.Vertical>
      </Layout.Vertical>
      <Layout.Vertical spacing={'medium'} flex={{ alignItems: 'flex-start' }}>
        {showAddManifestBtn(isReadonly, allowOnlyOne, listOfManifests) && (
          <Button
            className={css.addManifest}
            id="add-manifest"
            size={ButtonSize.SMALL}
            variation={ButtonVariation.LINK}
            data-test-id="addManifest"
            onClick={addNewManifest}
            text={getString('pipelineSteps.serviceTab.manifestList.addManifest')}
          />
        )}
      </Layout.Vertical>
    </Layout.Vertical>
  )
}

export default ManifestListView
