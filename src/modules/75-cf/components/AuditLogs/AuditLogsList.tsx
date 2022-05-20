/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { CellProps, Column, Renderer } from 'react-table'
import { Button, Container, Layout, Text, PageError, TableV2 } from '@wings-software/uicore'
import type { IconName } from '@blueprintjs/core'
import type { HarnessIconName } from '@harness/icons'
import type { ContainerProps } from '@wings-software/uicore/dist/components/Container/Container'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { AuditTrail, Feature, useGetAuditByParams } from 'services/cf'
import { formatDate, formatTime, AuditLogAction, CF_DEFAULT_PAGE_SIZE, getErrorMessage } from '@cf/utils/CFUtils'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import { useStrings } from 'framework/strings'
import { EventSummary } from './EventSummary'
import { translateEvents } from './AuditLogsUtils'

const RenderCellTime: Renderer<CellProps<AuditTrail>> = ({ row }) => {
  const data = row.original
  return (
    <Text flex style={{ flexDirection: 'column', alignItems: 'baseline' }} padding={{ left: 'xsmall' }}>
      <span>{formatTime(data.executedOn)}</span>
      <span>{formatDate(data.executedOn)}</span>
    </Text>
  )
}

const RenderCellUser: Renderer<CellProps<AuditTrail>> = ({ row }) => {
  const data = row.original
  return (
    <Text icon="person" padding={{ right: 'small' }} lineClamp={1}>
      {data.actor}
    </Text>
  )
}

const RenderCellAction: Renderer<CellProps<AuditTrail>> = ({ row }) => {
  const { getString } = useStrings()
  const data = row.original
  let text = getString('cf.auditLogs.unknown')
  let icon: IconName | HarnessIconName = 'audit-log-created'
  let color = 'var(--purple-600)'
  const eventStrings = translateEvents(data.instructionSet, getString)

  switch (data.action) {
    case AuditLogAction.FeatureActivationCreated:
      text = getString('cf.auditLogs.flagCreated')
      break
    case AuditLogAction.SegmentCreated:
      text = getString('cf.auditLogs.segmentCreated')
      break
    case AuditLogAction.FeatureActivationPatched:
      text = getString('cf.auditLogs.flagUpdated')
      icon = 'symbol-triangle-up'
      color = 'var(--sea-green-500)'
      break
  }

  return (
    <Layout.Vertical spacing="xsmall" padding={{ right: 'small' }}>
      {!eventStrings.length && (
        <Text icon={icon} lineClamp={1} iconProps={{ style: { color } }}>
          {text}
        </Text>
      )}
      {eventStrings.map(message => (
        <Text
          key={message}
          icon="symbol-triangle-up"
          lineClamp={1}
          iconProps={{ style: { color: 'var(--sea-green-500)' } }}
        >
          {message}
        </Text>
      ))}
    </Layout.Vertical>
  )
}

const RenderCellDetails = (onViewButtonClick: (data: AuditTrail) => void) => {
  return (({ row }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { getString } = useStrings()
    const auditItem = row.original

    return (
      <Container flex>
        {/*<Layout.Vertical spacing="xsmall" padding={{ left: 'small', right: 'small' }}>
         Note: These below are for future use
         <Text font={{ weight: 'bold' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 5px',
              background: 'var(--grey-250)',
              borderRadius: '4px',
              fontSize: 'var(--font-size-xsmall)'
            }}
          >
            Published
          </span>
          <Text
            padding={{ left: 'xxxlarge' }}
            inline
            color={Color.RED_500}
            icon="warning-sign"
            iconProps={{ color: Color.RED_500 }}
          >
            (2)
          </Text>
        </Text>
        <Text icon="trigger-schedule">
          <strong style={{ display: 'inline-block', paddingRight: 'var(--spacing-xsmall' }}>Approver:</strong>
          Olivia Dunham
        </Text>
        </Layout.Vertical>*/}
        <Button
          minimal
          icon="main-notes"
          tooltip={getString('cf.auditLogs.viewEventSummary')}
          onClick={() => onViewButtonClick(auditItem)}
        />
      </Container>
    )
  }) as Renderer<CellProps<AuditTrail>>
}

export interface AuditLogsListProps extends ContainerProps {
  flagData: Feature
  startDate: Date
  endDate: Date
  objectType: 'FeatureActivation' | 'Segment'
  loadingStyle?: React.CSSProperties
}

export const AuditLogsList: React.FC<AuditLogsListProps> = ({
  startDate,
  endDate,
  flagData,
  objectType,
  loadingStyle,
  ...props
}) => {
  const { projectIdentifier, orgIdentifier, accountId: accountIdentifier } = useParams<Record<string, string>>()
  const { activeEnvironment: environmentIdentifier } = useActiveEnvironment()
  const [pageNumber, setPageNumber] = useState(0)
  const queryParams = useMemo(() => {
    return {
      accountIdentifier,
      orgIdentifier,
      project: projectIdentifier,
      projectIdentifier,
      environmentIdentifier,
      objectType,
      identifier: flagData.identifier,
      pageSize: CF_DEFAULT_PAGE_SIZE,
      pageNumber,
      startTime: startDate.getTime(),
      endTime: endDate.getTime()
    }
  }, [projectIdentifier, environmentIdentifier, accountIdentifier, orgIdentifier, pageNumber, startDate, endDate])
  const { data, loading, error, refetch } = useGetAuditByParams({
    queryParams
  })
  const { getString } = useStrings()
  const [showEventSummary, setShowEventSummary] = useState(false)
  const [auditItemForSummary, setAuditItemForSummary] = useState<AuditTrail>()
  const columns: Column<AuditTrail>[] = useMemo(
    () => [
      {
        Header: getString('cf.auditLogs.timePST'),
        accessor: row => row.executedOn,
        width: '150px',
        Cell: RenderCellTime
      },
      {
        Header: getString('cf.auditLogs.user'),
        accessor: row => row.actor,
        width: 'calc(20% - 50px)',
        Cell: RenderCellUser
      },
      {
        Header: getString('cf.auditLogs.action'),
        accessor: row => row.action,
        width: 'calc(80% - 140px)',
        Cell: RenderCellAction
      },
      {
        Header: '',
        id: 'DETAILS',
        accessor: row => row.objectIdentifier,
        width: '40px',
        Cell: RenderCellDetails(auditItem => {
          setAuditItemForSummary(auditItem)
          setShowEventSummary(true)
        }),
        disableSortBy: true
      }
    ],
    []
  )

  return (
    <Container padding="xlarge" {...props}>
      {!!data?.data?.auditTrails?.length && (
        <TableV2<AuditTrail>
          columns={columns}
          data={data.data.auditTrails as AuditTrail[]}
          pagination={{
            itemCount: data.data.itemCount || 0,
            pageSize: data.data.pageSize || 0,
            pageCount: data.data.pageCount || 0,
            pageIndex: pageNumber,
            gotoPage: index => {
              setPageNumber(index)
              refetch({ queryParams: { ...queryParams, pageNumber: index } })
            }
          }}
        />
      )}

      {data?.data?.auditTrails?.length === 0 && (
        <Text style={{ textAlign: 'center', paddingTop: 'var(--spacing-huge)' }}>
          {getString('cf.auditLogs.empty')}
        </Text>
      )}

      {error && (
        <PageError
          message={getErrorMessage(error)}
          onClick={() => {
            refetch()
          }}
        />
      )}
      {loading && (
        <Container
          style={
            loadingStyle || {
              position: 'fixed',
              top: '200px',
              right: 0,
              width: 'calc(100vw - 720px)',
              height: 'calc(100% - 200px)'
            }
          }
        >
          <ContainerSpinner />
        </Container>
      )}

      {showEventSummary && auditItemForSummary && (
        <EventSummary
          data={auditItemForSummary}
          flagData={flagData}
          onClose={() => {
            setShowEventSummary(false)
          }}
        />
      )}
    </Container>
  )
}
