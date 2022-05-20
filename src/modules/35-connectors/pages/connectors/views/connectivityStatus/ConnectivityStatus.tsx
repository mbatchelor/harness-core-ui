/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { MouseEvent, ReactElement, useState } from 'react'
import {
  Text,
  Layout,
  Button,
  Popover,
  StepsProgress,
  ButtonVariation,
  ButtonSize,
  IconName
} from '@wings-software/uicore'
import { Position, Intent, PopoverInteractionKind } from '@blueprintjs/core'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import ReactTimeago from 'react-timeago'
import type { IconProps } from '@harness/icons'
import defaultTo from 'lodash-es/defaultTo'
import { useStrings } from 'framework/strings'
import {
  useGetTestConnectionResult,
  ConnectorConnectivityDetails,
  ConnectorValidationResult,
  ConnectorResponse,
  ErrorDetail
} from 'services/cd-ng'

import { StepIndex, STEP } from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import type { StepDetails } from '@connectors/interfaces/ConnectorInterface'
import { ConnectorStatus } from '@connectors/constants'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import useTestConnectionErrorModal from '@connectors/common/useTestConnectionErrorModal/useTestConnectionErrorModal'
import { GetTestConnectionValidationTextByType, showCustomErrorSuggestion } from '../../utils/ConnectorUtils'

import css from '../ConnectorsListView.module.scss'

export type ErrorMessage = ConnectorValidationResult & { useErrorHandler?: boolean }

export interface ConnectivityStatusProps {
  data: ConnectorResponse
}

interface WarningTooltipProps {
  errorSummary?: string
  errors?: ErrorDetail[]
  onClick: (event: MouseEvent<HTMLDivElement>) => void
  errorDeatailsText: string
  noDetailsText: string
}

const WarningTooltip: React.FC<WarningTooltipProps> = ({
  errorSummary,
  errors,
  onClick,
  errorDeatailsText,
  noDetailsText
}) => {
  if (errorSummary) {
    return (
      <Layout.Vertical font={{ size: 'small' }} spacing="small" padding="small">
        <Text font={{ size: 'small' }} color={Color.WHITE}>
          {errorSummary}
        </Text>
        {errors ? (
          <Text color={Color.BLUE_400} onClick={onClick} className={css.viewDetails}>
            {errorDeatailsText}
          </Text>
        ) : null}
      </Layout.Vertical>
    )
  }
  return (
    <Text padding="small" color={Color.WHITE}>
      {noDetailsText}
    </Text>
  )
}

const renderReactTimeAgo = (
  connectorStatus?: string,
  lastTestedAt?: number,
  testedAt?: number
): ReactElement | undefined => {
  if (connectorStatus) {
    return (
      <Text font={{ size: 'small' }} color={Color.GREY_400}>
        {<ReactTimeago date={lastTestedAt || testedAt || ''} />}
      </Text>
    )
  }
  return undefined
}

const shouldExecuteStepVerify = (stepDetails: StepDetails): boolean =>
  stepDetails.step === StepIndex.get(STEP.TEST_CONNECTION) && stepDetails.status === 'PROCESS'

const ConnectivityStatus: React.FC<ConnectivityStatusProps> = ({ data }) => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const [testing, setTesting] = useState(false)
  const [lastTestedAt, setLastTestedAt] = useState<number>()
  const [status, setStatus] = useState<ConnectorConnectivityDetails['status']>(data.status?.status)

  const [errorMessage, setErrorMessage] = useState<ErrorMessage>()
  const { getString } = useStrings()
  const { gitDetails = {}, connector: { identifier = '' } = {} } = data
  const { branch, repoIdentifier } = gitDetails
  const [stepDetails, setStepDetails] = useState<StepDetails>({
    step: 1,
    intent: Intent.WARNING,
    status: 'PROCESS' // Replace when enum is added in uikit
  })

  const { openErrorModal } = useTestConnectionErrorModal({
    showCustomErrorSuggestion: showCustomErrorSuggestion(data.connector?.type as string),
    connectorInfo: data.connector
  })

  const { mutate: reloadTestConnection } = useGetTestConnectionResult({
    identifier: identifier,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier,
      branch,
      repoIdentifier
    },
    requestOptions: {
      headers: {
        'content-type': 'application/json'
      }
    }
  })

  const executeStepVerify = async (): Promise<void> => {
    if (shouldExecuteStepVerify(stepDetails)) {
      try {
        const result = await reloadTestConnection()
        setStatus(result?.data?.status)
        setLastTestedAt(new Date().getTime())
        if (result?.data?.status === 'SUCCESS') {
          setStepDetails({
            step: 2,
            intent: Intent.SUCCESS,
            status: 'DONE'
          })
        } else {
          setErrorMessage({ ...result.data, useErrorHandler: false })
          setStepDetails({
            step: 1,
            intent: Intent.DANGER,
            status: 'ERROR'
          })
        }
        setTesting(false)
      } catch (err) {
        setLastTestedAt(new Date().getTime())
        setStatus('FAILURE')
        if (err?.data?.responseMessages) {
          setErrorMessage({
            errorSummary: err?.data?.message,
            errors: err?.data?.responseMessages,
            useErrorHandler: true
          })
        } else {
          setErrorMessage({ ...err.message, useErrorHandler: false })
        }
        setStepDetails({
          step: 1,
          intent: Intent.DANGER,
          status: 'ERROR'
        })
        setTesting(false)
      }
    }
  }
  const stepName = GetTestConnectionValidationTextByType(data.connector?.type)

  const renderStatusText = (
    icon: IconName,
    iconProps: Partial<IconProps>,
    tooltip: JSX.Element | string,
    statusText: string
  ): React.ReactElement => {
    return (
      <Text
        inline
        icon={icon}
        iconProps={iconProps}
        tooltip={tooltip}
        tooltipProps={{ isDark: true, position: 'bottom', popoverClassName: css.tooltip }}
      >
        {statusText}
      </Text>
    )
  }

  const connectorStatus = defaultTo(status, data.status?.status)
  const isStatusSuccess = connectorStatus === ConnectorStatus.SUCCESS
  const errorSummary = defaultTo(errorMessage?.errorSummary, data?.status?.errorSummary)

  const renderTooltip = () => {
    return (
      <WarningTooltip
        errorSummary={errorSummary}
        errors={defaultTo(errorMessage?.errors, data?.status?.errors)}
        onClick={e => {
          e.stopPropagation()
          openErrorModal((errorMessage as ErrorMessage) || data?.status)
        }}
        errorDeatailsText={getString('connectors.testConnectionStep.errorDetails')}
        noDetailsText={getString('noDetails')}
      />
    )
  }

  const renderStatus = () => {
    if (!(connectorStatus || errorMessage)) {
      return undefined
    }
    const statusMessageMap = {
      [`${ConnectorStatus.SUCCESS}`]: getString('success'),
      [`${ConnectorStatus.FAILURE}`]: getString('failed')
    }

    const statusMsg = defaultTo(statusMessageMap[`${connectorStatus}`], getString('na'))
    if (isStatusSuccess) {
      return renderStatusText('full-circle', { size: 6, color: Color.GREEN_500 }, '', statusMsg)
    }

    return renderStatusText('warning-sign', { size: 12, color: Color.RED_500 }, renderTooltip(), statusMsg)
  }

  if (testing) {
    return (
      <Layout.Horizontal>
        <Popover interactionKind={PopoverInteractionKind.HOVER} position={Position.LEFT_TOP}>
          <Button intent="primary" minimal loading />
          <div className={css.testConnectionPop}>
            <StepsProgress
              steps={[stepName]}
              intent={stepDetails.intent}
              current={stepDetails.step}
              currentStatus={stepDetails.status}
            />
          </div>
        </Popover>
        <Text style={{ margin: 8 }}>{getString('connectors.testInProgress')}</Text>
      </Layout.Horizontal>
    )
  }

  return (
    <Layout.Horizontal>
      <Layout.Vertical width="100px">
        <Layout.Horizontal spacing="small">{renderStatus()}</Layout.Horizontal>
        {renderReactTimeAgo(connectorStatus, lastTestedAt, data.status?.testedAt)}
      </Layout.Vertical>
      {!isStatusSuccess ? (
        <Button
          variation={ButtonVariation.SECONDARY}
          size={ButtonSize.SMALL}
          text={getString('test')}
          className={css.testBtn}
          onClick={e => {
            e.stopPropagation()
            setTesting(true)
            executeStepVerify()
            setStepDetails({
              step: 1,
              intent: Intent.WARNING,
              status: 'PROCESS' // Replace when enum is added in uikit
            })
          }}
          withoutBoxShadow
        />
      ) : undefined}
    </Layout.Horizontal>
  )
}

export default ConnectivityStatus
