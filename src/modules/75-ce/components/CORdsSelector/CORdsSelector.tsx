/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty as _isEmpty, defaultTo as _defaultTo } from 'lodash-es'
import {
  Button,
  Container,
  ExpandingSearchInput,
  Icon,
  Layout,
  Select,
  Text,
  Radio,
  ButtonVariation,
  useToaster,
  TableV2
} from '@wings-software/uicore'
import type { CellProps } from 'react-table'
import type { SelectOption } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { Region, useAllRegions, ContainerServiceServiceMinimal, useAllResourcesOfAccount, Resource } from 'services/lw'
import { useStrings } from 'framework/strings'
import type { GatewayDetails } from '../COCreateGateway/models'
import css from './CORdsSelector.module.scss'

interface CORdsSelectorProps {
  gatewayDetails: GatewayDetails
  setGatewayDetails: (details: GatewayDetails) => void
  onDbAddSuccess: () => void
}

const TOTAL_ITEMS_PER_PAGE = 5

const CORdsSelector: React.FC<CORdsSelectorProps> = props => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()

  const [allRegions, setAllRegions] = useState<SelectOption[]>([])
  const [selectedRegion, setSelectedRegion] = useState<SelectOption>()
  const [selectedDatabase, setSelectedDatabase] = useState<Resource>()
  const [allDatabases, setAllDatabases] = useState<Resource[]>([])
  const [databasesToShow, setDatabasesToShow] = useState<Resource[]>([])
  const [pageIndex, setPageIndex] = useState<number>(0)

  const { data: regions, loading: regionsLoading } = useAllRegions({
    account_id: accountId, // eslint-disable-line
    queryParams: {
      cloud_account_id: props.gatewayDetails.cloudAccount.id, // eslint-disable-line
      accountIdentifier: accountId
    }
  })

  const { mutate: fetchDatabases, loading: loadingDatabases } = useAllResourcesOfAccount({
    account_id: accountId, // eslint-disable-line
    queryParams: {
      cloud_account_id: props.gatewayDetails.cloudAccount.id, // eslint-disable-line
      type: 'database',
      accountIdentifier: accountId
    }
  })

  useEffect(() => {
    setRegionsForSelection(regions?.response)
  }, [regions?.response])

  useEffect(() => {
    fetchAndSetDatabses()
  }, [selectedRegion])

  const setRegionsForSelection = (regionsData: Region[] = []) => {
    const loaded =
      regionsData.map(r => {
        return {
          label: r.label as string,
          value: r.name as string
        }
      }) || []
    setAllRegions(loaded)
  }

  const fetchAndSetDatabses = async () => {
    if (selectedRegion) {
      try {
        const databases = await fetchDatabases({
          Text: `regions = ['${selectedRegion?.label}']`
        })
        const result = _defaultTo(databases.response, [])
        setAllDatabases(result)
        setDatabasesToShow(result)
      } catch (e) {
        showError(e?.data?.message || e?.message)
      }
    }
  }

  const refreshPageParams = () => {
    setPageIndex(0)
  }

  const handleRefresh = () => {
    refreshPageParams()
    fetchAndSetDatabses()
  }

  const handleSearch = (text: string) => {
    const filteredDatabases = _defaultTo(
      allDatabases?.filter(db => db.name?.toLowerCase().includes(text)),
      []
    )
    setDatabasesToShow(filteredDatabases)
  }

  const handleAddSelection = () => {
    if (!_isEmpty(selectedDatabase)) {
      const updatedGatewayDetails: GatewayDetails = {
        ...props.gatewayDetails,
        routing: {
          ...props.gatewayDetails.routing,
          database: { id: _defaultTo(selectedDatabase?.id, ''), region: _defaultTo(selectedDatabase?.region, '') }
        }
      }
      props.setGatewayDetails(updatedGatewayDetails)
      props.onDbAddSuccess?.()
    }
  }

  const loading = regionsLoading || loadingDatabases

  const isDisabled = _isEmpty(selectedDatabase)

  return (
    <Container>
      <Layout.Vertical spacing="xlarge">
        <Container>
          <Text font={{ variation: FontVariation.H3 }}>
            {getString('ce.co.autoStoppingRule.configuration.rdsModal.title')}
          </Text>
        </Container>
        <div className={css.sectionSeparator} />
        <Layout.Vertical style={{ paddingTop: 20 }}>
          <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing={'large'} style={{ maxWidth: '40%' }}>
            <div>
              <Text font={{ variation: FontVariation.FORM_LABEL }} className={css.filterLabel}>
                {getString('ce.co.autoStoppingRule.configuration.instanceModal.labels.selectRegion')}
              </Text>
              <Select
                items={allRegions}
                onChange={item => setSelectedRegion(item)}
                disabled={regionsLoading}
                value={selectedRegion}
                name={'rdsRegion'}
              />
            </div>
          </Layout.Horizontal>
        </Layout.Vertical>
        <div className={css.sectionSeparator} />
        <Container style={{ minHeight: 250 }}>
          <Layout.Horizontal className={css.searchAndFilterWrapper}>
            <ExpandingSearchInput className={css.searchContainer} onChange={handleSearch} alwaysExpanded />
          </Layout.Horizontal>
          {loading && (
            <Layout.Horizontal flex={{ justifyContent: 'center' }}>
              <Icon name="spinner" size={24} color="blue500" />
            </Layout.Horizontal>
          )}
          {!loading && !selectedRegion && (
            <Layout.Horizontal flex={{ justifyContent: 'center' }}>
              <Text icon={'execution-warning'} font={{ size: 'medium' }} iconProps={{ size: 20 }}>
                {getString('ce.co.autoStoppingRule.configuration.rdsModal.emptyDescription')}
              </Text>
            </Layout.Horizontal>
          )}
          {!loading && selectedRegion && (
            <RDSServicesTable
              data={databasesToShow}
              pageIndex={pageIndex}
              selectedDb={selectedDatabase}
              setSelectedDb={setSelectedDatabase}
              setPageIndex={setPageIndex}
            />
          )}
        </Container>
        <Layout.Horizontal flex={{ alignItems: 'center' }} spacing={'large'}>
          <Button onClick={handleAddSelection} disabled={isDisabled} variation={ButtonVariation.PRIMARY}>
            {getString('ce.co.autoStoppingRule.configuration.addSelectedBtnText')}
          </Button>
          <div onClick={handleRefresh}>
            <Icon name="refresh" color="primary7" size={14} />
            <span style={{ color: 'var(--primary-7)', margin: '0 5px', cursor: 'pointer' }}>
              {getString('ce.common.refresh')}
            </span>
          </div>
        </Layout.Horizontal>
      </Layout.Vertical>
    </Container>
  )
}

interface RDSServicesTableProps {
  data: ContainerServiceServiceMinimal[]
  pageIndex: number
  selectedDb?: Resource
  setSelectedDb: (db: Resource) => void
  setPageIndex: (index: number) => void
}

const RDSServicesTable: React.FC<RDSServicesTableProps> = props => {
  const { pageIndex, data } = props
  const { getString } = useStrings()
  const TableCheck = (tableProps: CellProps<Resource>) => {
    return (
      <Radio
        checked={props.selectedDb?.id === tableProps.row.original.id}
        onClick={_ => props.setSelectedDb(tableProps.row.original)}
        className={css.radioBtn}
      />
    )
  }

  const TableCell = (tableProps: CellProps<Resource>) => {
    return (
      <Text lineClamp={1} color={Color.BLACK}>
        {`${tableProps.value || '-'}`}
      </Text>
    )
  }
  return (
    <TableV2<Resource>
      data={data.slice(pageIndex * TOTAL_ITEMS_PER_PAGE, pageIndex * TOTAL_ITEMS_PER_PAGE + TOTAL_ITEMS_PER_PAGE)}
      pagination={{
        pageSize: TOTAL_ITEMS_PER_PAGE,
        pageIndex: pageIndex,
        pageCount: Math.ceil(data.length / TOTAL_ITEMS_PER_PAGE),
        itemCount: data.length,
        gotoPage: (newPageIndex: number) => props.setPageIndex(newPageIndex)
      }}
      columns={[
        {
          Header: '',
          id: 'selected',
          Cell: TableCheck,
          width: '5%',
          disableSortBy: true
        },
        {
          accessor: 'id',
          Header: 'ID',
          width: '25%',
          Cell: TableCell,
          disableSortBy: true
        },
        {
          accessor: 'name',
          Header: getString('name'),
          width: '25%',
          Cell: TableCell,
          disableSortBy: true
        },
        {
          accessor: 'status',
          Header: getString('status'),
          width: '25%',
          Cell: TableCell,
          disableSortBy: true
        },
        {
          accessor: 'type',
          Header: 'TYPE',
          width: '25%',
          Cell: TableCell,
          disableSortBy: true
        }
      ]}
    />
  )
}

export default CORdsSelector
