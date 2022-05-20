/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { isEmpty as _isEmpty, defaultTo as _defaultTo } from 'lodash-es'
import { Text, Container, Layout, Button, Icon, Select, SelectOption } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import type { GatewayDetails, InstanceDetails } from '@ce/components/COCreateGateway/models'
import { useTelemetry } from '@common/hooks/useTelemetry'
import {
  ResourceGroup,
  useAllResourceGroups,
  useAllZones,
  useGetInstancesTags,
  GetInstancesTagsQueryParams
} from 'services/lw'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import useRegionsForSelection from '@ce/common/hooks/useRegionsForSelection'
import type { AWSFiltersProps, AzureFiltersProps, GCPFiltersProps, SelectedTagFilter } from '@ce/types'
import { useStrings } from 'framework/strings'
import { Utils } from '@ce/common/Utils'
import InstanceSelectorBody from './InstanceSelectorBody'
import css from './COInstanceSelector.module.scss'

interface COInstanceSelectorprops {
  instances: InstanceDetails[]
  selectedInstances: InstanceDetails[]
  setSelectedInstances: (selectedInstances: InstanceDetails[]) => void
  setGatewayDetails: (gatewayDetails: GatewayDetails) => void
  gatewayDetails: GatewayDetails
  onInstancesAddSuccess?: () => void
  loading: boolean
  refresh?: (tomlString?: string) => void
  isEditFlow: boolean
}

const getAwsFilterText = (filters?: AWSFiltersProps) => {
  let filterText = ''
  if (filters?.region) {
    filterText = `regions=['${filters.region?.label}']`
  }
  if (filters?.tags?.key && filters.tags.value) {
    filterText += `\n tags={${filters.tags.key}='${filters.tags.value}'}`
  }
  return filterText
}

const getAzureFilterText = (filters: AzureFiltersProps) => {
  let filterText = ''
  if (filters.resourceGroup) {
    filterText = `resource_groups=['${_defaultTo(filters.resourceGroup?.label, '')}']`
  }
  if (filters?.tags?.key && filters.tags.value) {
    filterText += `\n tags={${filters.tags.key}='${filters.tags.value}'}`
  }
  return filterText
}

const getGcpFilterText = (filters: GCPFiltersProps) => {
  return `regions=['${filters.zone?.label}']`
}

const COInstanceSelector: React.FC<COInstanceSelectorprops> = props => {
  const { trackEvent } = useTelemetry()
  const { getString } = useStrings()
  const [filteredInstances, setFilteredInstances] = useState<InstanceDetails[]>([])
  const [selectedInstances, setSelectedInstances] = useState<InstanceDetails[]>(_defaultTo(props.selectedInstances, []))
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [azureFilters, setAzureFilters] = useState<AzureFiltersProps>()
  const [gcpFilters, setGcpFilters] = useState<GCPFiltersProps>()
  const [awsFilters, setAwsFilters] = useState<AWSFiltersProps>()

  const isAzureProvider = Utils.isProviderAzure(props.gatewayDetails.provider)
  const isGcpProvider = Utils.isProviderGcp(props.gatewayDetails.provider)

  useEffect(() => {
    setFilteredInstances(props.instances)
  }, [props.instances])

  const onAzureFiltersChange = (filters: AzureFiltersProps, resourceGroupLoading: boolean) => {
    setAzureFilters(filters)
    if (filters.resourceGroup) {
      props.refresh?.(getAzureFilterText(filters))
    }
    setIsLoading(resourceGroupLoading)
  }

  const onGcpFiltersChange = (filters: GCPFiltersProps, loadingFilters: boolean) => {
    setGcpFilters(filters)
    if (filters.zone) {
      props.refresh?.(getGcpFilterText(filters))
    }
    setIsLoading(loadingFilters)
  }

  const onAwsFiltersChange = (filters: AWSFiltersProps, loadingFilters: boolean, forceFetch = false) => {
    setAwsFilters(filters)
    if (filters.region || forceFetch) {
      props.refresh?.(getAwsFilterText(filters))
    }
    setIsLoading(loadingFilters)
  }

  const onCheckboxChange = (e: React.FormEvent<HTMLInputElement>, alreadyChecked: boolean, data: InstanceDetails) => {
    if (e.currentTarget.checked && !alreadyChecked) {
      setSelectedInstances([...selectedInstances, data])
    } else if (!e.currentTarget.checked && alreadyChecked) {
      const updatedInstances = [...selectedInstances]
      updatedInstances.splice(selectedInstances.indexOf(data), 1)
      setSelectedInstances(updatedInstances)
    }
  }

  const addInstances = () => {
    const newInstances = [...selectedInstances]
    props.setSelectedInstances(newInstances)
    const updatedGatewayDetails = { ...props.gatewayDetails, selectedInstances: newInstances }
    props.setGatewayDetails(updatedGatewayDetails)
    handleSearch('')
    props.onInstancesAddSuccess?.()
  }

  const handleSearch = (text: string): void => {
    pageIndex !== 0 && setPageIndex(0)
    if (!text) {
      setFilteredInstances(props.instances)
      return
    }
    text = text.toLowerCase()
    const instances = props.instances.filter(
      t => t.name.toLowerCase().indexOf(text) >= 0 || t.id.toLowerCase().indexOf(text) >= 0
    )
    setFilteredInstances(instances)
  }

  useEffect(() => {
    trackEvent('SelectedInstances', {})
  }, [])

  const refreshPageParams = () => {
    setPageIndex(0)
  }

  const handleRefresh = () => {
    refreshPageParams()
    if (isAzureProvider && azureFilters?.resourceGroup) {
      props.refresh?.(getAzureFilterText(azureFilters))
    } else if (isGcpProvider && gcpFilters?.zone) {
      props.refresh?.(getGcpFilterText(gcpFilters))
    } else {
      props.refresh?.(getAwsFilterText(awsFilters))
    }
  }

  const hasSelectedInstances = !_isEmpty(selectedInstances)

  return (
    <Container>
      <Layout.Vertical spacing="large">
        <Container>
          <Text font={{ variation: FontVariation.H3 }}>
            {getString('ce.co.autoStoppingRule.configuration.instanceModal.header')}
          </Text>
        </Container>
        <div className={css.sectionSeparator} />
        <Layout.Vertical
          style={{
            paddingTop: 20
          }}
        >
          <Text>{getString('ce.co.autoStoppingRule.configuration.instanceModal.description')}</Text>
          <InstancesFilter
            gatewayDetails={props.gatewayDetails}
            onAzureFiltersChangeSelectCallback={onAzureFiltersChange}
            onGcpFiltersChangeCallback={onGcpFiltersChange}
            onAwsFiltersChangeCallback={onAwsFiltersChange}
            selectedInstances={selectedInstances}
            isEditFlow={props.isEditFlow}
          />
        </Layout.Vertical>
        <div className={css.sectionSeparator} />
        <InstanceSelectorBody
          isLoading={_defaultTo(props.loading, isLoading)}
          selectedResourceGroup={azureFilters?.resourceGroup}
          instances={filteredInstances}
          pageProps={{
            index: pageIndex,
            setIndex: setPageIndex,
            totalCount: _defaultTo(filteredInstances.length, 0)
          }}
          onCheckboxChange={onCheckboxChange}
          selectedInstances={selectedInstances}
          isAzureSelection={isAzureProvider}
          isGcpSelection={isGcpProvider}
          selectedGcpFilters={gcpFilters}
          handleSearch={handleSearch}
        />
        <Layout.Horizontal flex={{ alignItems: 'center' }} margin={{ top: 'var(--spacing-medium)' }}>
          <Button
            onClick={addInstances}
            disabled={!hasSelectedInstances}
            style={{
              backgroundColor: Utils.getConditionalResult(hasSelectedInstances, 'var(--primary-7)', 'inherit'),
              color: Utils.getConditionalResult(hasSelectedInstances, 'var(--grey-100)', 'inherit'),
              marginRight: 20
            }}
          >
            {`${getString('ce.co.autoStoppingRule.configuration.addSelectedBtnText')} ${Utils.getConditionalResult(
              hasSelectedInstances,
              `(${selectedInstances.length})`,
              ''
            )}`}
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

interface InstancesFilterProps {
  gatewayDetails: GatewayDetails
  onAzureFiltersChangeSelectCallback: (values: AzureFiltersProps, loading: boolean) => void
  onGcpFiltersChangeCallback: (values: GCPFiltersProps, loading: boolean) => void
  onAwsFiltersChangeCallback: (values: AWSFiltersProps, loading: boolean, forceFetch?: boolean) => void
  selectedInstances: InstanceDetails[]
  isEditFlow: boolean
}

const InstancesFilter: React.FC<InstancesFilterProps> = ({
  gatewayDetails,
  onAzureFiltersChangeSelectCallback,
  onGcpFiltersChangeCallback,
  onAwsFiltersChangeCallback,
  selectedInstances,
  isEditFlow
}) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const isAzureProvider = Utils.isProviderAzure(gatewayDetails.provider)
  const isGcpProvider = Utils.isProviderGcp(gatewayDetails.provider)
  const isAwsProvider = Utils.isProviderAws(gatewayDetails.provider)

  const { data: regionsData, loading: regionsLoading } = useRegionsForSelection({
    cloudAccountId: gatewayDetails.cloudAccount.id,
    additionalProps: { lazy: !isAwsProvider }
  })
  const [selectedRegion, setSelectedRegion] = useState<SelectOption>()
  const [tagKeys, setTagKeys] = useState<SelectOption[]>([])
  const [tagValues, setTagValues] = useState<SelectOption[]>([])
  const [selectedTagPair, setSelectedTagPair] = useState<SelectedTagFilter>()

  const {
    data: tagsData,
    loading: tagsLoading,
    refetch: fetchTags
  } = useGetInstancesTags({
    account_id: accountId,
    queryParams: {
      cloud_account_id: gatewayDetails.cloudAccount.id,
      accountIdentifier: accountId,
      routingId: accountId,
      filter: _defaultTo(selectedRegion?.label, '')
    },
    lazy: true
  })

  useEffect(() => {
    handleRegionsFilterUpdate()
  }, [regionsData])

  useEffect(() => {
    if (isAwsProvider) {
      handleAwsRegionFilterUpdate()
    }
  }, [selectedRegion])

  useEffect(() => {
    if (tagsData?.response?.length) {
      const keys = tagsData.response.map(tag => ({ label: tag.key as string, value: tag.key as string }))
      setTagKeys(keys)
    }
  }, [tagsData])

  useEffect(() => {
    if (selectedTagPair?.key) {
      const selectedTag = tagsData?.response?.find(tag => tag.key === selectedTagPair.key)
      setTagValues(
        _defaultTo(
          selectedTag?.values?.map(v => ({ label: v, value: v })),
          []
        )
      )
    }
  }, [selectedTagPair?.key])

  useEffect(() => {
    if (selectedTagPair?.key && selectedTagPair.value) {
      onAwsFiltersChangeCallback({ region: selectedRegion, tags: selectedTagPair }, false)
    }
  }, [selectedTagPair])

  const handleAwsRegionFilterUpdate = () => {
    if (selectedRegion) {
      fetchTags()
    }
    onAwsFiltersChangeCallback({ region: selectedRegion }, regionsLoading, _isEmpty(selectedInstances))
  }

  const handleRegionsFilterUpdate = () => {
    if (isAwsProvider && !selectedRegion && !_isEmpty(selectedInstances)) {
      const region = selectedInstances?.[0]?.region?.toLowerCase()
      const regionToSelect = regionsData.find(r => r.label.toLowerCase() === region)
      setSelectedRegion(regionToSelect)
    }
  }

  const tagsFilter = (
    <Layout.Horizontal spacing={'small'}>
      <div>
        <Text font={{ variation: FontVariation.FORM_LABEL }} className={css.filterLabel}>
          {getString('ce.co.autoStoppingRule.configuration.instanceModal.labels.selectTags')}
        </Text>
        <Select
          items={tagKeys}
          inputProps={{
            placeholder: getString('ce.co.autoStoppingRule.configuration.instanceModal.labels.selectTagKey')
          }}
          value={selectedTagPair?.key ? { label: selectedTagPair.key, value: selectedTagPair.key } : null}
          disabled={tagsLoading}
          onChange={item => {
            setSelectedTagPair({ key: item.label })
          }}
        />
      </div>
      <div>
        <Text font={{ variation: FontVariation.FORM_LABEL }} className={cx(css.filterLabel, css.emptyLabel)} />
        <Select
          items={tagValues}
          inputProps={{
            placeholder: getString('ce.co.autoStoppingRule.configuration.instanceModal.labels.selectTagVal')
          }}
          disabled={!selectedTagPair?.key}
          value={selectedTagPair?.value ? { label: selectedTagPair.value, value: selectedTagPair.value } : null}
          onChange={item => {
            setSelectedTagPair(prevTagPair => ({ ...prevTagPair, value: item.label }))
          }}
        />
      </div>
    </Layout.Horizontal>
  )

  if (isAzureProvider) {
    return (
      <InstanceSelectorAzureFilters
        tagsFilter={tagsFilter}
        gatewayDetails={gatewayDetails}
        selectedInstances={selectedInstances}
        onAzureFiltersChangeSelectCallback={onAzureFiltersChangeSelectCallback}
        fetchTags={fetchTags}
        selectedTagPair={selectedTagPair}
      />
    )
  }

  if (isGcpProvider) {
    return (
      <InstanceSelectorGcpFilters
        gatewayDetails={gatewayDetails}
        selectedInstances={selectedInstances}
        onGcpFiltersChangeCallback={onGcpFiltersChangeCallback}
        isEditFlow={isEditFlow}
      />
    )
  }

  return (
    <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing={'large'}>
      <div>
        <Text font={{ variation: FontVariation.FORM_LABEL }} className={css.filterLabel}>
          {getString('ce.co.autoStoppingRule.configuration.instanceModal.labels.selectRegion')}
        </Text>
        <Select
          disabled={regionsLoading || isEditFlow}
          items={regionsData}
          onChange={setSelectedRegion}
          value={selectedRegion}
          name="regionsSelector"
        />
      </div>
      {tagsFilter}
    </Layout.Horizontal>
  )
}

interface InstanceSelectorAzureFiltersProps {
  tagsFilter: React.ReactNode
  gatewayDetails: GatewayDetails
  selectedInstances: InstanceDetails[]
  onAzureFiltersChangeSelectCallback: (values: AzureFiltersProps, resourceGroupLoading: boolean) => void
  fetchTags: (params: { queryParams: GetInstancesTagsQueryParams }) => Promise<void>
  selectedTagPair?: SelectedTagFilter
}

const InstanceSelectorAzureFilters: React.FC<InstanceSelectorAzureFiltersProps> = ({
  tagsFilter,
  gatewayDetails,
  selectedInstances,
  onAzureFiltersChangeSelectCallback,
  fetchTags,
  selectedTagPair
}) => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()

  const [resourceGroupData, setResourceGroupData] = useState<SelectOption[]>([])
  const [selectedResourceGroup, setSelectedResourceGroup] = useState<SelectOption>()

  const { data: resourceGroups, loading: resourceGroupsLoading } = useAllResourceGroups({
    account_id: accountId, // eslint-disable-line
    queryParams: {
      cloud_account_id: gatewayDetails.cloudAccount.id, // eslint-disable-line
      accountIdentifier: accountId
    }
  })

  useEffect(() => {
    setResourceGroupDataFromResponse(resourceGroups?.response)
  }, [resourceGroups?.response])

  useEffect(() => {
    handleAzureFiltersUpdate()
  }, [resourceGroupData])

  useEffect(() => {
    if (selectedResourceGroup) {
      fetchTags({
        queryParams: {
          cloud_account_id: gatewayDetails.cloudAccount.id,
          accountIdentifier: accountId,
          routingId: accountId,
          filter: selectedResourceGroup.label
        }
      })
    }
    onAzureFiltersChangeSelectCallback({ resourceGroup: selectedResourceGroup }, resourceGroupsLoading)
  }, [selectedResourceGroup, resourceGroupsLoading])

  useEffect(() => {
    if (selectedTagPair?.key && selectedTagPair.value) {
      onAzureFiltersChangeSelectCallback({ resourceGroup: selectedResourceGroup, tags: selectedTagPair }, false)
    }
  }, [selectedTagPair])

  const setResourceGroupDataFromResponse = (response: ResourceGroup[] = []) => {
    const loaded = response.map(r => ({
      label: r.name as string,
      value: r.name as string
    }))
    setResourceGroupData(loaded)
  }

  const handleAzureFiltersUpdate = () => {
    if (!selectedResourceGroup && !_isEmpty(selectedInstances)) {
      const groupName = selectedInstances?.[0]?.metadata?.resourceGroup?.toLowerCase()
      const groupToSelect = resourceGroupData.find(d => d.label.toLowerCase() === groupName)
      setSelectedResourceGroup(groupToSelect)
    }
  }

  return (
    <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing={'large'}>
      <div>
        <Text font={{ variation: FontVariation.FORM_LABEL }} className={css.filterLabel}>
          {getString('ce.co.selectResourceGroupPlaceholder')}
        </Text>
        <Select
          disabled={resourceGroupsLoading}
          items={resourceGroupData}
          onChange={setSelectedResourceGroup}
          value={selectedResourceGroup}
          name="resourceGroupSelector"
        />
      </div>
      {tagsFilter}
    </Layout.Horizontal>
  )
}

interface InstanceSelectorGcpFiltersProps {
  gatewayDetails: GatewayDetails
  isEditFlow: boolean
  selectedInstances: InstanceDetails[]
  onGcpFiltersChangeCallback: (values: GCPFiltersProps, loading: boolean) => void
}

const InstanceSelectorGcpFilters: React.FC<InstanceSelectorGcpFiltersProps> = ({
  gatewayDetails,
  isEditFlow,
  selectedInstances,
  onGcpFiltersChangeCallback
}) => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()

  const { data: regionsData, loading: regionsLoading } = useRegionsForSelection({
    cloudAccountId: gatewayDetails.cloudAccount.id,
    additionalProps: {}
  })
  const [selectedRegion, setSelectedRegion] = useState<SelectOption>()
  const [zonesData, setZonesData] = useState<SelectOption[]>([])
  const [selectedZone, setSelectedZone] = useState<SelectOption>()

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
    handleRegionsFilterUpdate()
  }, [regionsData])

  useEffect(() => {
    handleGcpRegionFilterUpdate()
  }, [selectedRegion, regionsLoading])

  useEffect(() => {
    if (zones?.response) {
      setZonesData(zones.response.map(z => ({ label: z, value: z })))
    }
  }, [zones?.response])

  useEffect(() => {
    handleGcpZonesFilterUpdate()
  }, [zonesData])

  useEffect(() => {
    if (selectedRegion) {
      onGcpFiltersChangeCallback({ region: selectedRegion, zone: selectedZone }, zonesLoading)
    }
  }, [selectedZone, zonesLoading])

  const handleRegionsFilterUpdate = () => {
    if (!selectedRegion && !_isEmpty(selectedInstances)) {
      const region = selectedInstances?.[0]?.region?.toLowerCase()
      const regionToSelect = regionsData.find(r => r.label.toLowerCase() === region)
      setSelectedRegion(regionToSelect)
    }
  }

  const handleGcpZonesFilterUpdate = () => {
    if (!selectedZone && !_isEmpty(selectedInstances)) {
      const zone = selectedInstances?.[0]?.metadata?.availabilityZone?.toLowerCase()
      const zoneToSelect = zonesData.find(z => z.label.toLowerCase() === zone)
      setSelectedZone(zoneToSelect)
    }
  }

  const handleGcpRegionFilterUpdate = () => {
    if (selectedRegion) {
      fetchZones({
        queryParams: {
          cloud_account_id: gatewayDetails.cloudAccount.id,
          accountIdentifier: accountId,
          region: selectedRegion.label
        }
      })
    }
    onGcpFiltersChangeCallback({ region: selectedRegion }, regionsLoading)
  }

  return (
    <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing={'large'}>
      <div>
        <Text font={{ variation: FontVariation.FORM_LABEL }} className={css.filterLabel}>
          {getString('ce.co.autoStoppingRule.configuration.instanceModal.labels.selectRegion')}
        </Text>
        <Select
          disabled={regionsLoading || isEditFlow}
          items={regionsData}
          onChange={setSelectedRegion}
          value={selectedRegion}
          name="regionsSelector"
        />
      </div>
      <div>
        <Text font={{ variation: FontVariation.FORM_LABEL }} className={css.filterLabel}>
          {getString('ce.co.accessPoint.select.zone')}
        </Text>
        <Select
          disabled={zonesLoading || isEditFlow}
          items={zonesData}
          onChange={setSelectedZone}
          value={selectedZone}
          name="zoneSelector"
        />
      </div>
    </Layout.Horizontal>
  )
}

export default COInstanceSelector
