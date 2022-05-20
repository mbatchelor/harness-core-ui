/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { CellProps, Column } from 'react-table'
import { isEmpty as _isEmpty, defaultTo } from 'lodash-es'
import { Radio } from '@blueprintjs/core'
import {
  Text,
  Container,
  ExpandingSearchInput,
  Layout,
  Button,
  Icon,
  TableV2,
  SelectOption,
  Select
} from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import type { GatewayDetails } from '@ce/components/COCreateGateway/models'
import { useStrings } from 'framework/strings'
import { ASGMinimal, PortConfig, TargetGroupMinimal, useAllZones } from 'services/lw'
import { Utils } from '@ce/common/Utils'
import useRegionsForSelection from '@ce/common/hooks/useRegionsForSelection'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import css from './COAsgSelector.module.scss'

interface COAsgSelectorprops {
  scalingGroups: ASGMinimal[]
  selectedScalingGroup: ASGMinimal | undefined
  setSelectedAsg: (asg: ASGMinimal) => void
  search: (t: string) => void
  gatewayDetails: GatewayDetails
  onAsgAddSuccess?: (updatedGatewayDetails: GatewayDetails) => void
  loading: boolean
  refresh?: (text?: string) => void
}

function TableCell(tableProps: CellProps<ASGMinimal>): JSX.Element {
  return (
    <Text lineClamp={3} color={Color.BLACK}>
      {tableProps.value}
    </Text>
  )
}
function NameCell(tableProps: CellProps<ASGMinimal>): JSX.Element {
  return (
    <Text lineClamp={1} color={Color.BLACK}>
      {`${tableProps.value} ${tableProps.row.original.id}`}
    </Text>
  )
}

const TOTAL_ITEMS_PER_PAGE = 5

const COAsgSelector: React.FC<COAsgSelectorprops> = props => {
  const [selectedAsg, setSelectedAsg] = useState<ASGMinimal | undefined>(props.selectedScalingGroup)
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [gcpFilters, setGcpFilters] = useState<GCPFiltersProps>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const isAsgSelected = !_isEmpty(selectedAsg)
  const { getString } = useStrings()

  const isGcpProvider = Utils.isProviderGcp(props.gatewayDetails.provider)

  function TableCheck(tableProps: CellProps<ASGMinimal>): JSX.Element {
    return (
      <Radio
        checked={selectedAsg?.name === tableProps.row.original.name}
        onClick={_ => setSelectedAsg(tableProps.row.original)}
      />
    )
  }

  const addAsg = () => {
    /**
     * desired capacity can't be 0
     * it can be either > 0 or
     * summation of od + spot or
     * equal to max capacity
     *  */
    const desiredCapacityValue = isGcpProvider
      ? defaultTo(selectedAsg?.desired, 1)
      : selectedAsg?.desired ||
        defaultTo(selectedAsg?.on_demand, 0) + defaultTo(selectedAsg?.spot, 0) ||
        selectedAsg?.max
    const newAsg = {
      ...selectedAsg,
      desired: desiredCapacityValue,
      on_demand: defaultTo(selectedAsg?.on_demand, desiredCapacityValue)
    }
    const ports = (newAsg as ASGMinimal).target_groups?.map((tg: TargetGroupMinimal) =>
      Utils.getTargetGroupObject(tg.port as number, tg.protocol as string)
    ) as PortConfig[]
    props.setSelectedAsg(newAsg)
    const updatedGatewayDetails = {
      ...props.gatewayDetails,
      routing: {
        ...props.gatewayDetails.routing,
        instance: { ...props.gatewayDetails.routing.instance, scale_group: newAsg },
        ports
      }
    }
    props.onAsgAddSuccess?.(updatedGatewayDetails)
  }

  const refreshPageParams = () => {
    setPageIndex(0)
  }

  const handleRefresh = () => {
    refreshPageParams()
    let filterText = ''
    if (isGcpProvider) {
      if (gcpFilters?.region) {
        filterText += `regions=['${gcpFilters.region.label}']`
      }
      if (gcpFilters?.zone) {
        filterText += `\n zones=['${gcpFilters.zone.label}']`
      }
    }
    props.refresh?.(filterText)
  }

  const onGcpFiltersChange = (filters: GCPFiltersProps, loadingFilters: boolean) => {
    setGcpFilters(filters)
    let filterText = ''
    if (filters.region) {
      filterText = `regions=['${filters.region.label}']`
    }
    if (filters.zone) {
      filterText += `\n zones=['${filters.zone.label}']`
    }
    if (!_isEmpty(filterText) && !loadingFilters) {
      props.refresh?.(filterText)
    }
    setIsLoading(loadingFilters)
  }

  const columns: Column<ASGMinimal>[] = useMemo(
    () => [
      {
        Header: '',
        id: 'selected',
        Cell: TableCheck,
        width: '5%',
        disableSortBy: true
      },
      {
        accessor: 'name',
        Header: getString('ce.co.instanceSelector.name'),
        width: '70%',
        Cell: NameCell,
        disableSortBy: true
      },
      {
        accessor: 'desired',
        Header: getString('instanceFieldOptions.instances'),
        width: '10%',
        Cell: TableCell,
        disableSortBy: true
      },
      {
        accessor: 'region',
        Header: getString('regionLabel'),
        width: '10%',
        Cell: TableCell,
        disableSortBy: true
      }
    ],
    [props.scalingGroups, selectedAsg]
  )

  const loadingEnabled = props.loading || isLoading

  return (
    <Container>
      <Layout.Vertical spacing="large">
        <Container>
          <Text font={{ variation: FontVariation.H3 }}>
            {Utils.getConditionalResult(
              isGcpProvider,
              getString('ce.co.autoStoppingRule.configuration.igModal.title'),
              getString('ce.co.autoStoppingRule.configuration.asgModal.title')
            )}
          </Text>
        </Container>
        {isGcpProvider && <div className={css.sectionSeparator} />}
        <Layout.Vertical style={{ paddingTop: 20 }}>
          <GroupsFilter
            gatewayDetails={props.gatewayDetails}
            isEditFlow={false}
            onGcpFiltersChangeCallback={onGcpFiltersChange}
          />
        </Layout.Vertical>
        <div className={css.sectionSeparator} />
        {/* <Layout.Vertical style={{ paddingTop: 20 }}>
        </Layout.Vertical> */}
        <Container style={{ minHeight: 250 }}>
          <Layout.Vertical spacing={'medium'}>
            <Layout.Horizontal className={css.searchAndFilterWrapper}>
              <ExpandingSearchInput
                className={css.searchContainer}
                onChange={(text: string) => props.search(text)}
                alwaysExpanded
              />
            </Layout.Horizontal>
            {loadingEnabled && (
              <Container>
                <Layout.Horizontal flex={{ justifyContent: 'center' }}>
                  <Icon name="spinner" size={24} color="blue500" />
                </Layout.Horizontal>
              </Container>
            )}
            {!loadingEnabled && isGcpProvider && _isEmpty(gcpFilters?.region) ? (
              <Layout.Horizontal flex={{ justifyContent: 'center' }}>
                <Text icon={'execution-warning'} font={{ size: 'medium' }} iconProps={{ size: 20 }}>
                  {getString('ce.co.autoStoppingRule.configuration.igModal.gcpFiltersNotSelectedDescription')}
                </Text>
              </Layout.Horizontal>
            ) : null}
            {!loadingEnabled && !_isEmpty(props.scalingGroups) && (
              <TableV2<ASGMinimal>
                data={defaultTo(props.scalingGroups, []).slice(
                  pageIndex * TOTAL_ITEMS_PER_PAGE,
                  pageIndex * TOTAL_ITEMS_PER_PAGE + TOTAL_ITEMS_PER_PAGE
                )}
                pagination={{
                  pageSize: TOTAL_ITEMS_PER_PAGE,
                  pageIndex: pageIndex,
                  pageCount: Math.ceil(defaultTo(props.scalingGroups, []).length / TOTAL_ITEMS_PER_PAGE),
                  itemCount: defaultTo(props.scalingGroups, []).length,
                  gotoPage: newPageIndex => setPageIndex(newPageIndex)
                }}
                columns={columns}
              />
            )}
          </Layout.Vertical>
        </Container>
        <Container style={{ marginTop: 'var(--spacing-medium)' }}>
          <Layout.Horizontal flex={{ alignItems: 'center' }}>
            <Button
              onClick={addAsg}
              disabled={!isAsgSelected}
              style={{
                backgroundColor: Utils.getConditionalResult(isAsgSelected, 'var(--primary-7)', 'inherit'),
                color: Utils.getConditionalResult(isAsgSelected, 'var(--grey-100)', 'inherit'),
                marginRight: 20
              }}
            >
              {getString('ce.co.autoStoppingRule.configuration.addSelectedBtnText')}
            </Button>
            <div onClick={handleRefresh}>
              <Icon name="refresh" color="primary7" size={14} />
              <span style={{ color: 'var(--primary-7)', margin: '0 5px', cursor: 'pointer' }}>
                {getString('ce.common.refresh')}
              </span>
            </div>
          </Layout.Horizontal>
        </Container>
      </Layout.Vertical>
    </Container>
  )
}

interface GCPFiltersProps {
  region?: SelectOption
  zone?: SelectOption | null
}

interface GroupsFilterProps {
  gatewayDetails: GatewayDetails
  onGcpFiltersChangeCallback: (values: GCPFiltersProps, loading: boolean) => void
  isEditFlow: boolean
}

const GroupsFilter: React.FC<GroupsFilterProps> = ({ gatewayDetails, onGcpFiltersChangeCallback, isEditFlow }) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const isGcpProvider = Utils.isProviderGcp(gatewayDetails.provider)

  // GCP filters data
  const { data: regionsData, loading: regionsLoading } = useRegionsForSelection({
    cloudAccountId: gatewayDetails.cloudAccount.id,
    additionalProps: {}
  })
  const [selectedRegion, setSelectedRegion] = useState<SelectOption>()
  const [zonesData, setZonesData] = useState<SelectOption[]>([])
  const [selectedZone, setSelectedZone] = useState<SelectOption | null | undefined>()

  const {
    data: zones,
    loading: zonesLoading,
    refetch: fetchZones
  } = useAllZones({
    account_id: accountId,
    queryParams: {
      cloud_account_id: gatewayDetails.cloudAccount.id,
      accountIdentifier: accountId,
      region: ''
    },
    lazy: true
  })

  useEffect(() => {
    if (selectedRegion) {
      fetchZones({
        queryParams: {
          cloud_account_id: gatewayDetails.cloudAccount.id,
          accountIdentifier: accountId,
          region: selectedRegion.label
        }
      })
    }
    if (isGcpProvider) {
      setSelectedZone(null)
      onGcpFiltersChangeCallback({ region: selectedRegion }, regionsLoading)
    }
  }, [selectedRegion, regionsLoading])

  useEffect(() => {
    if (zones?.response) {
      setZonesData(zones.response.map(z => ({ label: z, value: z })))
    }
  }, [zones?.response])

  useEffect(() => {
    if (selectedRegion) {
      onGcpFiltersChangeCallback({ region: selectedRegion, zone: selectedZone }, zonesLoading)
    }
  }, [selectedZone, zonesLoading])

  if (isGcpProvider) {
    return (
      <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing={'large'} style={{ maxWidth: '40%' }}>
        <Select
          disabled={regionsLoading || isEditFlow}
          items={regionsData}
          onChange={setSelectedRegion}
          value={selectedRegion}
          inputProps={{
            placeholder: getString('ce.allRegions')
          }}
          name="regionsSelector"
        />
        <Select
          disabled={zonesLoading || isEditFlow}
          items={zonesData}
          onChange={setSelectedZone}
          value={selectedZone}
          inputProps={{
            placeholder: getString('ce.co.accessPoint.zone')
          }}
          name="zoneSelector"
        />
      </Layout.Horizontal>
    )
  }

  return null
}

export default COAsgSelector
