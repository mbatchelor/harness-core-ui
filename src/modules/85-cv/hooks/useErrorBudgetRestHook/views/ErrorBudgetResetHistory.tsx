/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import moment from 'moment'
import type { CellProps, Renderer } from 'react-table'
import { Container, Icon, PageError, TableV2, Text } from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useGetErrorBudgetResetHistory, SLOErrorBudgetResetDTO } from 'services/cv'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import type { ErrorBudgetResetHistoryProps } from '../useErrorBudgetRestHook.types'

const RenderTimeAndDate: Renderer<CellProps<SLOErrorBudgetResetDTO>> = ({ row }) => {
  const { createdAt } = row.original

  return (
    <Text color={Color.BLACK} font={{ variation: FontVariation.SMALL }}>
      {moment(createdAt).format('L LT')}
    </Text>
  )
}

const RenderErrorBudget: Renderer<CellProps<SLOErrorBudgetResetDTO>> = ({ row }) => {
  const { getString } = useStrings()
  const { errorBudgetAtReset } = row.original

  return (
    <Text color={Color.BLACK} font={{ variation: FontVariation.SMALL }}>
      {errorBudgetAtReset} {getString('cv.minutes')}
    </Text>
  )
}

const RenderRemainingErrorBudget: Renderer<CellProps<SLOErrorBudgetResetDTO>> = ({ row }) => {
  const { getString } = useStrings()
  const { remainingErrorBudgetAtReset } = row.original

  return (
    <Text color={Color.BLACK} font={{ variation: FontVariation.SMALL }}>
      {remainingErrorBudgetAtReset} {getString('cv.minutes')}
    </Text>
  )
}

const RenderIncreasedErrorBudget: Renderer<CellProps<SLOErrorBudgetResetDTO>> = ({ row }) => {
  const { getString } = useStrings()
  const { errorBudgetIncrementMinutes } = row.original

  return (
    <Text color={Color.BLACK} font={{ variation: FontVariation.SMALL }}>
      {errorBudgetIncrementMinutes} {getString('cv.minutes')}
    </Text>
  )
}

const RenderReason: Renderer<CellProps<SLOErrorBudgetResetDTO>> = ({ row }) => {
  const { reason } = row.original

  return (
    <Text color={Color.BLACK} font={{ variation: FontVariation.SMALL }} lineClamp={1}>
      {reason}
    </Text>
  )
}

const ErrorBudgetResetHistory: React.FC<ErrorBudgetResetHistoryProps> = ({ serviceLevelObjectiveIdentifier }) => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()

  const { data, loading, error, refetch } = useGetErrorBudgetResetHistory({
    identifier: serviceLevelObjectiveIdentifier,
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  if (loading) {
    return (
      <Container
        height={200}
        flex={{ justifyContent: 'center' }}
        border={{ top: true, bottom: true }}
        style={{ overflow: 'auto' }}
      >
        <Icon name="steps-spinner" color={Color.GREY_400} size={30} />
      </Container>
    )
  }

  if (error) {
    return (
      <Container height={200} border={{ top: true, bottom: true }} style={{ overflow: 'auto' }}>
        <PageError width={400} message={getErrorMessage(error)} onClick={() => refetch()} />
      </Container>
    )
  }

  if (!data?.resource?.length) {
    return (
      <Container
        height={200}
        flex={{ justifyContent: 'center' }}
        border={{ top: true, bottom: true }}
        style={{ overflow: 'auto' }}
      >
        <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_600}>
          {getString('cv.noPreviousErrorBudgetResetHistoryAvailable')}
        </Text>
      </Container>
    )
  }

  return (
    <Container height={200} border={{ top: true, bottom: true }} style={{ overflow: 'auto' }}>
      <TableV2
        minimal
        sortable
        columns={[
          {
            Header: getString('cv.dateAndTime'),
            id: 'createdAt',
            accessor: 'createdAt',
            Cell: RenderTimeAndDate,
            width: 200
          },
          {
            Header: getString('cv.errorBudget'),
            id: 'errorBudgetAtReset',
            accessor: 'errorBudgetAtReset',
            Cell: RenderErrorBudget
          },
          {
            Header: getString('cv.remainingErrorBudget'),
            id: 'remainingErrorBudgetAtReset',
            accessor: 'remainingErrorBudgetAtReset',
            Cell: RenderRemainingErrorBudget
          },
          {
            Header: getString('cv.increaseInMinutes'),
            id: 'errorBudgetIncrementMinutes',
            accessor: 'errorBudgetIncrementMinutes',
            Cell: RenderIncreasedErrorBudget
          },
          {
            Header: getString('reason'),
            id: 'reason',
            accessor: 'reason',
            Cell: RenderReason
          }
        ]}
        data={data?.resource}
      />
    </Container>
  )
}

export default ErrorBudgetResetHistory
