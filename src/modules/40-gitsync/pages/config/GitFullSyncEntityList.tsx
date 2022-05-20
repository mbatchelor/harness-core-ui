/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { CellProps, Column, Renderer } from 'react-table'
import { Icon, Layout, TableV2, Text, Utils } from '@harness/uicore'
import { Color } from '@harness/design-system'
import type { IconProps } from '@harness/icons'
import { useStrings } from 'framework/strings'
import type { PageGitFullSyncEntityInfoDTO, GitFullSyncEntityInfoDTO } from 'services/cd-ng'
import { getEntityIconName } from '../entities/EntityHelper'
import css from './GitSyncConfigTab.module.scss'

interface GitFullSyncEntityListProps {
  data: PageGitFullSyncEntityInfoDTO
  gotoPage: (pageNumber: number) => void
}

interface StatusData {
  iconProp: IconProps
  statusBackground?: Color
  highlightedColor?: Color
}

interface RenderEntityStatusProp {
  status: GitFullSyncEntityInfoDTO['syncStatus']
  errorMessage: GitFullSyncEntityInfoDTO['errorMessage']
}

interface RenderStatusIconProp extends RenderEntityStatusProp {
  iconProp: IconProps
}

const RenderStatusIcon: React.FC<RenderStatusIconProp> = props => {
  const { status, errorMessage, iconProp } = props
  return status === 'FAILED' && errorMessage ? (
    <Utils.WrapOptionalTooltip
      tooltip={errorMessage}
      tooltipProps={{
        isDark: true,
        fill: true,
        position: 'bottom'
      }}
    >
      <Icon {...iconProp} />
    </Utils.WrapOptionalTooltip>
  ) : (
    <Icon {...iconProp} />
  )
}

const RenderEntityStatus: React.FC<RenderEntityStatusProp> = props => {
  const { status, errorMessage } = props
  let data: StatusData

  switch (status) {
    case 'FAILED':
      data = {
        iconProp: { name: 'warning-sign', color: Color.RED_900 },
        statusBackground: Color.RED_100,
        highlightedColor: Color.RED_900
      }
      break
    case 'SUCCESS':
      data = {
        iconProp: { name: 'success-tick' },
        statusBackground: Color.GREEN_100,
        highlightedColor: Color.GREEN_700
      }
      break
    case 'QUEUED':
      data = {
        iconProp: { name: 'queued' },
        statusBackground: Color.GREY_100,
        highlightedColor: Color.GREY_900
      }
      break
    default:
      data = { iconProp: { name: 'placeholder' } }
  }

  const { iconProp, statusBackground, highlightedColor } = data

  return (
    <Layout.Horizontal spacing="small" background={statusBackground} padding={'small'} className={css.syncStatus}>
      {iconProp && <RenderStatusIcon iconProp={iconProp} status={status} errorMessage={errorMessage} />}
      <Text color={highlightedColor}>{status}</Text>
    </Layout.Horizontal>
  )
}

const RenderEntityDetails: Renderer<CellProps<GitFullSyncEntityInfoDTO>> = ({ row }) => {
  const data = row.original
  const { getString } = useStrings()
  return (
    <Layout.Horizontal>
      <Icon
        name={getEntityIconName(data.entityType)}
        size={20}
        flex={{ alignItems: 'center' }}
        margin={{ right: 'medium' }}
      ></Icon>
      <Layout.Vertical className={css.nameIdWrapper}>
        <Text lineClamp={1} color={Color.GREY_900} font={{ weight: 'semi-bold' }}>
          {data.name}
        </Text>
        <Text lineClamp={1}>{`${getString('common.ID')}: ${data.identifier}`}</Text>
      </Layout.Vertical>
    </Layout.Horizontal>
  )
}

const RenderColumnEntityStatus: Renderer<CellProps<GitFullSyncEntityInfoDTO>> = ({ row }) => {
  const data = row.original

  return data?.syncStatus ? <RenderEntityStatus status={data.syncStatus} errorMessage={data.errorMessage} /> : <></>
}

const RenderColumnEntityType: Renderer<CellProps<GitFullSyncEntityInfoDTO>> = ({ row }) => {
  const data = row.original

  return <Text> {data.entityType} </Text>
}

const RenderColumnRepo: Renderer<CellProps<GitFullSyncEntityInfoDTO>> = ({ row }) => {
  const data = row.original

  return (
    <Text margin={{ right: 'small' }} lineClamp={1}>
      {data.repoName}
    </Text>
  )
}

const RenderColumnBranch: Renderer<CellProps<GitFullSyncEntityInfoDTO>> = ({ row }) => {
  const data = row.original

  return <Text lineClamp={1}> {data.branch} </Text>
}

const GitFullSyncEntityList: React.FC<GitFullSyncEntityListProps> = props => {
  const { data, gotoPage } = props
  const { getString } = useStrings()
  const listData: GitFullSyncEntityInfoDTO[] = data?.content || []
  const columns: Column<GitFullSyncEntityInfoDTO>[] = [
    {
      Header: getString('entity'),
      accessor: row => row.name,
      id: 'name',
      width: '30%',
      Cell: RenderEntityDetails
    },
    {
      Header: getString('gitsync.syncStatus'),
      accessor: row => row.syncStatus,
      width: '15%',
      Cell: RenderColumnEntityStatus
    },
    {
      Header: getString('typeLabel'),
      accessor: row => row.entityType,
      id: 'type',
      width: '15%',
      Cell: RenderColumnEntityType
    },
    {
      Header: getString('common.repositoryName'),
      accessor: row => row.repoName,
      id: 'repository',
      width: '15%',
      Cell: RenderColumnRepo
    },
    {
      Header: getString('common.git.branchName'),
      accessor: row => row.branch,
      id: 'branch',
      width: '15%',
      Cell: RenderColumnBranch
    }
  ]

  return (
    <TableV2<GitFullSyncEntityInfoDTO>
      columns={columns}
      data={listData}
      name="GitFullSyncEntityList"
      sortable={true}
      pagination={{
        itemCount: data?.totalItems || 0,
        pageSize: data?.pageSize || 10,
        pageCount: data?.totalPages || -1,
        pageIndex: data?.pageIndex || 0,
        gotoPage
      }}
    />
  )
}

export default GitFullSyncEntityList
