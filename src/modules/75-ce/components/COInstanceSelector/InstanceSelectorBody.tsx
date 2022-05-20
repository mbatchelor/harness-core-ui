/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactNode, useMemo } from 'react'
import { Checkbox, Container, ExpandingSearchInput, Icon, Layout, SelectOption, TableV2, Text } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import type { CellProps, Column } from 'react-table'
import { isEmpty as _isEmpty } from 'lodash-es'
import type { GCPFiltersProps } from '@ce/types'
import { useStrings } from 'framework/strings'
import type { InstanceDetails } from '../COCreateGateway/models'
import css from './COInstanceSelector.module.scss'

interface InstanceSelectorBodyProps {
  isLoading: boolean
  selectedResourceGroup?: SelectOption
  instances: InstanceDetails[]
  pageProps: { index: number; setIndex: (page: number) => void; totalCount: number }
  onCheckboxChange: (e: React.FormEvent<HTMLInputElement>, alreadyChecked: boolean, data: InstanceDetails) => void
  selectedInstances: InstanceDetails[]
  isAzureSelection: boolean
  isGcpSelection: boolean
  selectedGcpFilters?: GCPFiltersProps
  handleSearch: (text: string) => void
}

interface WarningMessageProps {
  messageText: string
}

const WarningMessage = ({ messageText }: WarningMessageProps) => {
  return (
    <Text icon={'execution-warning'} font={{ variation: FontVariation.BODY1 }} iconProps={{ size: 20 }}>
      {messageText}
    </Text>
  )
}

function TableCell(tableProps: CellProps<InstanceDetails>): JSX.Element {
  return (
    <Text lineClamp={3} color={Color.BLACK}>
      {tableProps.value}
    </Text>
  )
}
function NameCell(tableProps: CellProps<InstanceDetails>): JSX.Element {
  return (
    <Text lineClamp={3} color={Color.BLACK} style={{ overflowWrap: 'anywhere', paddingRight: 5 }}>
      {tableProps.value} {tableProps.row.original.id}
    </Text>
  )
}

const TOTAL_ITEMS_PER_PAGE = 5

const InstanceSelectorBody: React.FC<InstanceSelectorBodyProps> = ({
  isLoading,
  selectedResourceGroup,
  instances,
  pageProps,
  onCheckboxChange,
  selectedInstances,
  isAzureSelection,
  isGcpSelection,
  selectedGcpFilters,
  handleSearch
}) => {
  const { getString } = useStrings()

  const isSelectedInstance = (item: InstanceDetails): boolean => {
    return selectedInstances.findIndex(s => s.id === item.id) >= 0
  }

  const TableCheck = (tableProps: CellProps<InstanceDetails>): JSX.Element => {
    const alreadyChecked = isSelectedInstance(tableProps.row.original)
    return (
      <Checkbox checked={alreadyChecked} onChange={e => onCheckboxChange(e, alreadyChecked, tableProps.row.original)} />
    )
  }

  const columns: Column<InstanceDetails>[] = useMemo(
    () => [
      {
        Header: '',
        id: 'selected',
        Cell: TableCheck,
        width: '5%'
      },
      {
        accessor: 'name',
        Header: getString('ce.co.instanceSelector.name'),
        width: '35%',
        Cell: NameCell,
        disableSortBy: true
      },
      {
        accessor: 'ipv4',
        Header: getString('ce.co.instanceSelector.ipAddress'),
        width: '15%',
        Cell: TableCell,
        disableSortBy: true
      },
      {
        accessor: 'region',
        Header: getString('regionLabel'),
        width: '15%',
        Cell: TableCell,
        disableSortBy: true
      },
      {
        accessor: 'type',
        Header: getString('typeLabel'),
        width: '15%',
        Cell: TableCell,
        disableSortBy: true
      },
      {
        accessor: 'status',
        Header: getString('status'),
        width: '10%',
        Cell: TableCell,
        disableSortBy: true
      }
    ],
    [instances, selectedInstances]
  )

  const renderInstancesTable = (): ReactNode => {
    return (
      <TableV2
        className={css.instancesTable}
        data={instances.slice(
          pageProps.index * TOTAL_ITEMS_PER_PAGE,
          pageProps.index * TOTAL_ITEMS_PER_PAGE + TOTAL_ITEMS_PER_PAGE
        )}
        pagination={{
          pageSize: TOTAL_ITEMS_PER_PAGE,
          pageIndex: pageProps.index,
          pageCount: Math.ceil(instances.length / TOTAL_ITEMS_PER_PAGE),
          itemCount: pageProps.totalCount,
          gotoPage: newPageIndex => pageProps.setIndex(newPageIndex)
        }}
        columns={columns}
      />
    )
  }

  const azureBodyRenderer = (): ReactNode => {
    return _isEmpty(selectedResourceGroup) ? (
      <Layout.Horizontal flex={{ justifyContent: 'center' }}>
        <WarningMessage
          messageText={getString('ce.co.autoStoppingRule.configuration.instanceModal.rgEmptyDescription')}
        />
      </Layout.Horizontal>
    ) : _isEmpty(instances) ? (
      <Layout.Horizontal flex={{ justifyContent: 'center' }}>
        <Text font={{ size: 'medium' }} iconProps={{ size: 20 }}>
          {getString('ce.co.autoStoppingRule.configuration.instanceModal.rgEmptyInstancesDescription', {
            region: selectedResourceGroup?.label
          })}
        </Text>
      </Layout.Horizontal>
    ) : (
      renderInstancesTable()
    )
  }

  const gcpBodyRenderer = (): ReactNode => {
    return _isEmpty(selectedGcpFilters?.region) ? (
      <Layout.Horizontal flex={{ justifyContent: 'center' }}>
        <WarningMessage
          messageText={getString('ce.co.autoStoppingRule.configuration.instanceModal.gcpFiltersNotSelectedDescription')}
        />
      </Layout.Horizontal>
    ) : _isEmpty(selectedGcpFilters?.zone) ? (
      <Layout.Horizontal flex={{ justifyContent: 'center' }}>
        <WarningMessage
          messageText={getString(
            'ce.co.autoStoppingRule.configuration.instanceModal.gcpZoneFilterNotSelectedDescription'
          )}
        />
      </Layout.Horizontal>
    ) : _isEmpty(instances) ? (
      <Layout.Horizontal flex={{ justifyContent: 'center' }}>
        <Text font={{ size: 'medium' }} iconProps={{ size: 20 }}>
          {getString('ce.co.autoStoppingRule.configuration.instanceModal.gcpEmptyInstancesDescription')}
        </Text>
      </Layout.Horizontal>
    ) : (
      renderInstancesTable()
    )
  }

  const renderBody = (): ReactNode => {
    let body = null
    if (isAzureSelection) {
      body = azureBodyRenderer()
    } else if (isGcpSelection) {
      body = gcpBodyRenderer()
    } else {
      body = renderInstancesTable()
    }
    return body
  }

  return (
    <Container style={{ minHeight: 250, marginBottom: 'var(--spacing-medium)' }}>
      {isLoading ? (
        <Layout.Horizontal flex={{ justifyContent: 'center' }}>
          <Icon name="spinner" size={24} color="blue500" />
        </Layout.Horizontal>
      ) : (
        <Layout.Vertical spacing={'medium'}>
          <Layout.Horizontal className={css.searchAndFilterWrapper}>
            <ExpandingSearchInput className={css.searchContainer} onChange={handleSearch} alwaysExpanded />
          </Layout.Horizontal>
          {renderBody()}
        </Layout.Vertical>
      )}
    </Container>
  )
}

export default InstanceSelectorBody
