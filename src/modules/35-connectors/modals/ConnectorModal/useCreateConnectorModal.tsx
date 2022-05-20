/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { Dialog, IDialogProps } from '@blueprintjs/core'
import { useParams } from 'react-router-dom'
import { CreateConnectorWizard } from '@connectors/components/CreateConnectorWizard/CreateConnectorWizard'
import { Connectors, CONNECTOR_MODAL_MIN_WIDTH } from '@connectors/constants'
import type { ConnectorInfoDTO, ConnectorRequestBody } from 'services/cd-ng'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import { ConnectivityModeType } from '@common/components/ConnectivityMode/ConnectivityMode'
import { getConnectivityMode } from '@connectors/pages/connectors/utils/ConnectorUtils'
import css from '../../components/CreateConnectorWizard/CreateConnectorWizard.module.scss'

export interface UseCreateConnectorModalProps {
  onSuccess?: (data?: ConnectorRequestBody) => void
  onClose?: () => void
}

export interface ConnectorModaldata {
  connectorInfo?: ConnectorInfoDTO
  gitDetails?: IGitContextFormProps
}

export interface UseCreateConnectorModalReturn {
  openConnectorModal: (
    isEditMode: boolean,
    type: ConnectorInfoDTO['type'],
    connector?: ConnectorModaldata,
    modalProps?: IDialogProps
  ) => void
  hideConnectorModal: () => void
}

const useCreateConnectorModal = (props: UseCreateConnectorModalProps): UseCreateConnectorModalReturn => {
  const [isEditMode, setIsEditMode] = useState(false)
  const [type, setType] = useState(Connectors.KUBERNETES_CLUSTER)
  const [connectorInfo, setConnectorInfo] = useState<ConnectorInfoDTO | undefined>()
  const [gitDetails, setGitDetails] = useState<IGitContextFormProps | undefined>()
  const [connectivityMode, setConnectivityMode] = useState<ConnectivityModeType | undefined>(
    ConnectivityModeType.Manager
  )
  const [modalProps, setModalProps] = useState<IDialogProps>({
    isOpen: true,
    enforceFocus: false,
    style: {
      width: 'auto',
      minWidth: CONNECTOR_MODAL_MIN_WIDTH,
      minHeight: 640,
      borderLeft: 0,
      paddingBottom: 0,
      position: 'relative',
      overflow: 'auto'
    }
  })
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  const handleSuccess = (data?: ConnectorRequestBody): void => {
    props.onSuccess?.(data)
  }

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog {...modalProps}>
        <CreateConnectorWizard
          accountId={accountId}
          orgIdentifier={(connectorInfo ? connectorInfo.orgIdentifier : orgIdentifier) as string} //For create take scope from url else from entities
          projectIdentifier={(connectorInfo ? connectorInfo.projectIdentifier : projectIdentifier) as string}
          type={type}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          connectivityMode={connectivityMode}
          setConnectivityMode={setConnectivityMode}
          connectorInfo={connectorInfo}
          gitDetails={gitDetails}
          onSuccess={data => {
            handleSuccess(data)
          }}
          onClose={() => {
            props.onClose?.()
            hideModal()
          }}
        />
        <Button
          minimal
          icon="cross"
          iconProps={{ size: 18 }}
          onClick={() => {
            props.onClose?.()
            hideModal()
          }}
          className={css.crossIcon}
        />
      </Dialog>
    ),
    [type, isEditMode, connectorInfo, gitDetails, connectivityMode]
  )

  return {
    openConnectorModal: (
      isEditing: boolean,
      connectorType: ConnectorInfoDTO['type'],
      connector?: ConnectorModaldata,
      _modalProps?: IDialogProps
    ) => {
      setConnectorInfo(connector?.connectorInfo)
      setGitDetails(connector?.gitDetails)
      setIsEditMode(isEditing)
      setType(connectorType)
      setConnectivityMode(
        isEditing ? getConnectivityMode(connector?.connectorInfo?.spec?.executeOnDelegate) : undefined
      )
      setModalProps(_modalProps || modalProps)
      showModal()
    },
    hideConnectorModal: hideModal
  }
}

export default useCreateConnectorModal
