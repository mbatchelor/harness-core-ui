/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useState } from 'react'
import { Layout, Text, StepWizard, StepProps, Button, ButtonSize, ButtonVariation, Icon } from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'
import { FontVariation } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { Dialog, IDialogProps, Classes } from '@blueprintjs/core'
import { get, isEmpty, set } from 'lodash-es'

import produce from 'immer'
import { useStrings } from 'framework/strings'

import ConnectorDetailsStep from '@connectors/components/CreateConnector/commonSteps/ConnectorDetailsStep'
import GitDetailsStep from '@connectors/components/CreateConnector/commonSteps/GitDetailsStep'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import StepGitAuthentication from '@connectors/components/CreateConnector/GitConnector/StepAuth/StepGitAuthentication'
import type { ConnectorConfigDTO, ConnectorInfoDTO, StageElementConfig, StoreConfigWrapper } from 'services/cd-ng'
import StepGithubAuthentication from '@connectors/components/CreateConnector/GithubConnector/StepAuth/StepGithubAuthentication'
import StepBitbucketAuthentication from '@connectors/components/CreateConnector/BitbucketConnector/StepAuth/StepBitbucketAuthentication'
import StepGitlabAuthentication from '@connectors/components/CreateConnector/GitlabConnector/StepAuth/StepGitlabAuthentication'
import { Connectors, CONNECTOR_CREDENTIALS_STEP_IDENTIFIER } from '@connectors/constants'
import {
  buildBitbucketPayload,
  buildGithubPayload,
  buildGitlabPayload,
  buildGitPayload
} from '@connectors/pages/connectors/utils/ConnectorUtils'
import DelegateSelectorStep from '@connectors/components/CreateConnector/commonSteps/DelegateSelectorStep/DelegateSelectorStep'

import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'

import { StartupScriptActions } from '@common/constants/TrackingConstants'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { getStatus, getConnectorNameFromValue } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import ConnectorField from './StartupScriptConnectorField'
import StartupScriptWizardStepTwo from './StartupScriptWizardStepTwo'
import {
  ConnectorMap,
  AllowedTypes,
  ConnectorTypes,
  ConnectorIcons,
  StartupScriptListViewProps,
  StartupScriptWizardInitData,
  StartupScriptLastStepProps
} from './StartupScriptInterface.types'
import { StartupScriptWizard } from './StartupScriptWizard'

import css from './StartupScriptSelection.module.scss'

function StartupScriptListView({
  updateStage,
  stage,
  isPropagating,
  connectors,
  startupScript,
  isReadonly,
  allowableTypes
}: StartupScriptListViewProps): JSX.Element {
  const [connectorView, setConnectorView] = useState(false)
  const [connectorType, setConnectorType] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
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

  const removeStartupScript = (): void => {
    if (stage) {
      const newStage = produce(stage, draft => {
        set(draft, 'stage.spec.serviceConfig.serviceDefinition.spec.startupScript', {})
      }).stage

      if (newStage) {
        updateStage(newStage)
      }
    }
  }

  const addStartupScript = (): void => {
    showConnectorModal()
  }

  const editStartupScript = (store: ConnectorTypes): void => {
    setConnectorType(store)
    setConnectorView(false)
    showConnectorModal()
  }

  const getInitialValues = (): StartupScriptWizardInitData => {
    if (startupScript) {
      const values = {
        ...startupScript,
        store: get(startupScript, 'type'),
        connectorRef: get(startupScript, 'spec.connectorRef')
      }
      return values
    }
    return {
      store: '',
      connectorRef: undefined
    }
  }

  /* istanbul ignore next */
  const updateStageData = (script: StoreConfigWrapper): void => {
    const path = isPropagating
      ? 'stage.spec.serviceConfig.stageOverrides.startupScript'
      : 'stage.spec.serviceConfig.serviceDefinition.spec.startupScript'

    if (stage) {
      updateStage(
        produce(stage, draft => {
          set(draft, path, script)
        }).stage as StageElementConfig
      )
    }
  }

  /* istanbul ignore next */
  const handleSubmit = (script: StoreConfigWrapper): void => {
    updateStageData(script)

    trackEvent(StartupScriptActions.SaveStartupScriptOnPipelinePage, { startupScript: startupScript?.type })

    hideConnectorModal()
    setConnectorView(false)
    setConnectorType('')
  }

  /* istanbul ignore next */
  const handleConnectorViewChange = (isConnectorView: boolean): void => {
    setConnectorView(isConnectorView)
    setIsEditMode(false)
  }

  /* istanbul ignore next */
  const handleStoreChange = (type?: ConnectorTypes): void => {
    setConnectorType(type || '')
  }

  const lastStepProps = useCallback((): StartupScriptLastStepProps => {
    return {
      key: getString('pipeline.startupScript.fileDetails'),
      name: getString('pipeline.startupScript.fileDetails'),
      expressions,
      allowableTypes,
      stepName: getString('pipeline.startupScript.fileDetails'),
      initialValues: getLastStepInitialData(),
      handleSubmit: handleSubmit,
      isReadonly: isReadonly
    }
  }, [connectorType])

  /* istanbul ignore next */
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

  const getLastStepInitialData = (): StoreConfigWrapper => {
    const initValues = startupScript
    /* istanbul ignore next */
    if (get(initValues, 'type') && get(initValues, 'type') !== connectorType) {
      return null as unknown as StoreConfigWrapper
    }
    return initValues
  }

  const getLastSteps = useCallback((): React.ReactElement<StepProps<ConnectorConfigDTO>> => {
    return <StartupScriptWizardStepTwo {...lastStepProps()} />
  }, [startupScript, connectorType, lastStepProps])

  const getNewConnectorSteps = useCallback((): JSX.Element | void => {
    const type = ConnectorMap[connectorType]
    if (type) {
      const buildPayload = getBuildPayload(type)
      /* istanbul ignore next */
      return (
        <StepWizard title={getString('connectors.createNewConnector')}>
          <ConnectorDetailsStep
            type={type}
            name={getString('overview')}
            isEditMode={isEditMode}
            gitDetails={{ repoIdentifier, branch, getDefaultFromOtherRepo: true }}
          />
          {connectorType !== Connectors.ARTIFACTORY ? (
            <GitDetailsStep type={type} name={getString('details')} isEditMode={isEditMode} connectorInfo={undefined} />
          ) : null}
          {connectorType === Connectors.GIT ? (
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
          {connectorType === Connectors.GITHUB ? (
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
          {connectorType === Connectors.BITBUCKET ? (
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
          {connectorType === Connectors.GITLAB ? (
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
            type={type}
          />
        </StepWizard>
      )
    }
  }, [connectorView, connectorType, isEditMode])

  const renderStartupScriptList = React.useCallback(
    (script: StoreConfigWrapper): React.ReactElement => {
      const { color } = getStatus(get(script, 'spec.connectorRef'), connectors, accountId)
      const connectorName = getConnectorNameFromValue(get(script, 'spec.connectorRef'), connectors)
      return (
        <div className={css.rowItem}>
          <section className={css.startupScriptList}>
            <div className={css.columnId}>
              <Icon inline name={ConnectorIcons[get(script, 'type') as ConnectorTypes]} size={20} />
              {get(script, 'type') === 'Harness'
                ? getString('harness')
                : renderConnectorField(get(script, 'spec.connectorRef'), connectorName, color)}
            </div>
            {!!get(script, 'spec.paths')?.length && (
              <div className={css.columnId}>
                <Text lineClamp={1} width={300}>
                  <span className={css.noWrap}>
                    {typeof get(script, 'spec.paths') === 'string'
                      ? /* istanbul ignore next */ get(script, 'spec.paths')
                      : get(script, 'spec.paths').join(', ')}
                  </span>
                </Text>
              </div>
            )}
            {get(script, 'spec.files')?.length && (
              <div className={css.columnId}>
                <Text lineClamp={1} width={300}>
                  <span className={css.noWrap}>{get(script, 'spec.files')}</span>
                </Text>
              </div>
            )}
            {get(script, 'spec.secretFiles')?.length && (
              <div className={css.columnId}>
                <Text lineClamp={1} width={300}>
                  <span className={css.noWrap}>{get(script, 'spec.secretFiles')}</span>
                </Text>
              </div>
            )}

            {!isReadonly && (
              <span>
                <Layout.Horizontal className={css.startupScriptListButton}>
                  <Button
                    icon="Edit"
                    iconProps={{ size: 18 }}
                    onClick={() => editStartupScript(script?.type as ConnectorTypes)}
                    minimal
                  />

                  <Button iconProps={{ size: 18 }} icon="main-trash" onClick={() => removeStartupScript()} minimal />
                </Layout.Horizontal>
              </span>
            )}
          </section>
        </div>
      )
    },
    [connectors]
  )

  const [showConnectorModal, hideConnectorModal] = useModalHook(() => {
    const onClose = (): void => {
      setConnectorView(false)
      hideConnectorModal()
      setConnectorType('')
      setIsEditMode(false)
    }

    return (
      <Dialog onClose={onClose} {...DIALOG_PROPS} className={cx(css.modal, Classes.DIALOG)}>
        <div className={css.createConnectorWizard}>
          <StartupScriptWizard
            connectorTypes={AllowedTypes}
            newConnectorView={connectorView}
            expressions={expressions}
            allowableTypes={allowableTypes}
            handleConnectorViewChange={handleConnectorViewChange}
            handleStoreChange={handleStoreChange}
            initialValues={getInitialValues()}
            newConnectorSteps={getNewConnectorSteps()}
            lastSteps={getLastSteps()}
            isReadonly={isReadonly}
          />
        </div>
        <Button minimal icon="cross" onClick={onClose} className={css.crossIcon} />
      </Dialog>
    )
  }, [connectorView, connectorType, expressions.length, expressions, allowableTypes, isEditMode])

  const renderConnectorField = useCallback(
    (connectorRef: string, connectorName: string | undefined, connectorColor: string): JSX.Element => {
      return (
        <ConnectorField connectorRef={connectorRef} connectorName={connectorName} connectorColor={connectorColor} />
      )
    },
    []
  )

  return (
    <Layout.Vertical style={{ width: '100%' }}>
      <Layout.Vertical spacing="small" style={{ flexShrink: 'initial' }}>
        {!isEmpty(startupScript) && (
          <div className={cx(css.startupScriptList, css.listHeader)}>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }} width={200}>
              {getString('store')}
            </Text>
            <Text font={{ variation: FontVariation.TABLE_HEADERS }} width={200}>
              {getString('location')}
            </Text>
            <span></span>
          </div>
        )}
        <Layout.Vertical style={{ flexShrink: 'initial' }}>
          <section>{!isEmpty(startupScript) && renderStartupScriptList(startupScript)}</section>
        </Layout.Vertical>
      </Layout.Vertical>
      <Layout.Vertical spacing={'medium'} flex={{ alignItems: 'flex-start' }}>
        {!isReadonly && isEmpty(startupScript) && (
          <Button
            className={css.addStartupScript}
            id="add-startup-script"
            size={ButtonSize.SMALL}
            variation={ButtonVariation.LINK}
            data-test-id="addStartupScript"
            onClick={addStartupScript}
            text={getString('common.plusAddName', { name: getString('pipeline.startupScript.name') })}
          />
        )}
      </Layout.Vertical>
    </Layout.Vertical>
  )
}

export default StartupScriptListView
