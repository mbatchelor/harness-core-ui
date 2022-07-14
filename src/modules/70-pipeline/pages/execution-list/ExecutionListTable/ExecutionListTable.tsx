/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { TableV2 } from '@harness/uicore'
import React from 'react'
import type { Column } from 'react-table'
import { useStrings } from 'framework/strings'
import type { PagePipelineExecutionSummary, PipelineExecutionSummary } from 'services/pipeline-ng'
import type { SortBy } from '../types'
import {
  CodeSourceCell,
  LastExecutionCell,
  MenuCell,
  PipelineNameCell,
  RecentTenExecutionsCell,
  LastModifiedCell
} from './ExecutionListCells'
import css from './ExecutionListTable.module.scss'

const DEFAULT_PAGE_NUMBER = 0
const DEFAULT_PAGE_SIZE = 20

interface ExecutionListTableProps {
  data?: PagePipelineExecutionSummary
  gotoPage: (pageNumber: number) => void
  onDeletePipeline: (commitMsg: string) => Promise<void>
  onDelete: (pipeline: PipelineExecutionSummary) => void
  setSortBy: (sortBy: string[]) => void
  sortBy?: string[]
}

type CustomColumn<T extends Record<string, any>> = Column<T> & {
  accessor: keyof PipelineExecutionSummary
} & Partial<ExecutionListTableProps>

export function ExecutionListTable({
  data,
  gotoPage,
  onDeletePipeline,
  onDelete,
  sortBy,
  setSortBy
}: ExecutionListTableProps): React.ReactElement {
  const { getString } = useStrings()
  const {
    content = [],
    totalElements = 0,
    totalPages = 0,
    number = DEFAULT_PAGE_NUMBER,
    size = DEFAULT_PAGE_SIZE
  } = data || ({} as PagePipelineExecutionSummary)
  const [currentSort, currentOrder] = sortBy || []
  const getServerSortProps = (accessor: string) => ({
    enableServerSort: true,
    isServerSorted: currentSort === accessor,
    isServerSortedDesc: currentOrder === 'DESC',
    getSortedColumn: ({ sort }: SortBy) => {
      setSortBy([sort, currentOrder === 'DESC' ? 'ASC' : 'DESC'])
    }
  })
  const columns: CustomColumn<PipelineExecutionSummary>[] = React.useMemo(
    () => [
      {
        Header: getString('filters.executions.pipelineName'),
        accessor: 'name',
        width: '20%',
        Cell: PipelineNameCell,
        serverSortProps: getServerSortProps('name')
      },
      {
        Header: getString('pipeline.codeSource'),
        accessor: 'storeType',
        width: '10%',
        disableSortBy: true,
        Cell: CodeSourceCell
      },
      {
        Header: getString('pipeline.recentTenExecutions').toUpperCase(),
        accessor: 'executionSummaryInfo',
        width: '30%',
        Cell: RecentTenExecutionsCell,
        disableSortBy: true
      },
      {
        Header: getString('pipeline.lastExecution').toUpperCase(),
        accessor: 'description',
        width: '20%',
        disableSortBy: true,
        Cell: LastExecutionCell
      },
      {
        Header: getString('pipeline.lastModified').toUpperCase(),
        accessor: 'lastUpdatedAt',
        width: '15%',
        Cell: LastModifiedCell,
        serverSortProps: getServerSortProps('lastUpdatedAt')
      },
      {
        Header: '',
        accessor: 'version',
        width: '5%',
        Cell: MenuCell,
        disableSortBy: true,
        onDeletePipeline,
        onDelete
      }
    ],
    []
  )

  return (
    <TableV2<PagePipelineExecutionSummary>
      className={css.table}
      columns={columns}
      data={content}
      pagination={
        totalElements > size
          ? {
              itemCount: totalElements,
              pageSize: size,
              pageCount: totalPages,
              pageIndex: number,
              gotoPage
            }
          : undefined
      }
      sortable
    />
  )
}
