/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act } from 'react-dom/test-utils'
import { fireEvent, render, findByText } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import COInstanceSelector from '../COInstanceSelector'

const initialGatewayDetails = {
  name: '',
  cloudAccount: {
    id: '',
    name: ''
  },
  idleTimeMins: 15,
  fullfilment: '',
  filter: '',
  kind: 'instance',
  orgID: 'orgIdentifier',
  projectID: 'projectIdentifier',
  accountID: 'accountId',
  hostName: '',
  customDomains: [],
  matchAllSubdomains: false,
  disabled: false,
  routing: {
    instance: {
      filterText: ''
    },
    lb: '',
    ports: []
  },
  healthCheck: {
    protocol: 'http',
    path: '/',
    port: 80,
    timeout: 30
  },
  opts: {
    preservePrivateIP: false,
    deleteCloudResources: false,
    alwaysUsePrivateIP: false,
    access_details: {},
    hide_progress_page: false
  },
  provider: {
    name: 'Azure',
    value: 'azure',
    icon: 'service-azure'
  },
  selectedInstances: [],
  accessPointID: '',
  metadata: {},
  deps: []
}

const mockedInstance = {
  id: 'i-008',
  name: 'instance',
  region: 'us-west-1',
  ipv4: '',
  type: '',
  tags: '',
  launch_time: '', // eslint-disable-line
  status: 'running',
  vpc: ''
}

const mockedResourceGroup = {
  id: '/subscriptions/20d6a917-99fa-4b1b-9b2e-a3d624e9dcf0/resourceGroups/lightwing-test',
  name: 'lightwing-test',
  type: 'Microsoft.Resources/resourceGroups'
}

const mockedResourceGroupResponse = [mockedResourceGroup]

const mockedRegionsData = { data: { response: [{ name: 'ap-southeast-1', label: 'ap-southeast-1' }] }, loading: false }

const mockedZonesData = { response: ['us-container-1'] }

const mockedTagsData = { response: [{ key: 'testTagKey', values: ['testTagValue'] }] }

jest.mock('services/lw', () => ({
  useAllResourceGroups: jest.fn().mockImplementation(() => ({
    data: { response: mockedResourceGroupResponse },
    loading: false
  })),
  useAllRegions: jest.fn().mockImplementation(() => mockedRegionsData),
  useAllZones: jest.fn().mockImplementation(() => ({
    data: mockedZonesData,
    loading: false,
    refetch: jest.fn()
  })),
  useGetInstancesTags: jest.fn().mockImplementation(() => ({
    data: mockedTagsData,
    loading: false,
    refetch: jest.fn()
  }))
}))

describe('Instance Selector Modal', () => {
  const selectResourceGroup = async (container: HTMLElement) => {
    const resourceGroupsDropdown = container.querySelector('input[name="resourceGroupSelector"]') as HTMLInputElement
    const rgCaret = container
      .querySelector(`input[name="resourceGroupSelector"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    act(() => {
      fireEvent.click(rgCaret!)
    })
    const rgToSelect = await findByText(container, 'lightwing-test')
    act(() => {
      fireEvent.click(rgToSelect)
    })
    expect(resourceGroupsDropdown.value).toBe('lightwing-test')
  }
  test('should show loader while loading data', () => {
    const { container } = render(
      <TestWrapper>
        <COInstanceSelector
          selectedInstances={[]}
          setSelectedInstances={jest.fn()}
          setGatewayDetails={jest.fn()}
          instances={[]}
          gatewayDetails={initialGatewayDetails}
          onInstancesAddSuccess={jest.fn()}
          loading={true}
          isEditFlow={false}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    expect(container.querySelector('span[data-icon="spinner"]')).toBeDefined()
  })

  test('should show data', async () => {
    const { container, getAllByRole } = render(
      <TestWrapper>
        <COInstanceSelector
          selectedInstances={[]}
          setSelectedInstances={jest.fn()}
          setGatewayDetails={jest.fn()}
          instances={[mockedInstance]}
          gatewayDetails={initialGatewayDetails}
          onInstancesAddSuccess={jest.fn()}
          loading={false}
          isEditFlow={false}
        />
      </TestWrapper>
    )

    await selectResourceGroup(container)

    expect(container).toMatchSnapshot()
    expect(container.querySelector('span[data-icon="spinner"]')).toBeFalsy()
    const tableRows = getAllByRole('row')
    expect(tableRows.length).toBeGreaterThan(1)
  })

  test('search and select/unselect instances successfully', async () => {
    const { container } = render(
      <TestWrapper>
        <COInstanceSelector
          selectedInstances={[]}
          setSelectedInstances={jest.fn()}
          setGatewayDetails={jest.fn()}
          instances={[mockedInstance]}
          gatewayDetails={initialGatewayDetails}
          onInstancesAddSuccess={jest.fn()}
          loading={false}
          isEditFlow={false}
        />
      </TestWrapper>
    )

    await selectResourceGroup(container)

    const searchButton = document.body.querySelector('[class*="ExpandingSearchInput"]')
    fireEvent.click(searchButton!)
    const input = container.querySelector('input[type="search"]') as HTMLInputElement
    expect(input).toBeDefined()
    act(() => {
      fireEvent.change(input, { target: { value: 'instance' } })
    })
    expect(input.value).toBe('instance')
    expect(container).toMatchSnapshot()

    const checkInput = container.querySelector('input[type="checkbox"]')
    expect(checkInput).toBeDefined()
    act(() => {
      fireEvent.click(checkInput!)
    })
    expect(checkInput).toMatchSnapshot()

    const addBtn = container.querySelector('button[type="button"]') as HTMLButtonElement
    expect(addBtn).toBeDefined()
    act(() => {
      fireEvent.click(addBtn)
    })
  })

  test('modal should retain the selected resource group for Azure based rule', () => {
    const selectedInstance = { ...mockedInstance, metadata: { resourceGroup: 'lightwing-test' } }
    const { container } = render(
      <TestWrapper>
        <COInstanceSelector
          selectedInstances={[selectedInstance]}
          setSelectedInstances={jest.fn()}
          setGatewayDetails={jest.fn()}
          instances={[mockedInstance]}
          gatewayDetails={initialGatewayDetails}
          onInstancesAddSuccess={jest.fn()}
          loading={false}
          refresh={jest.fn()}
          isEditFlow={false}
        />
      </TestWrapper>
    )
    act(() => {
      expect(container).toMatchSnapshot()
    })
  })

  test('clicking on refresh button shoul load data', () => {
    const selectedInstance = { ...mockedInstance, metadata: { resourceGroup: 'lightwing-test' } }
    const { getByText } = render(
      <TestWrapper>
        <COInstanceSelector
          selectedInstances={[selectedInstance]}
          setSelectedInstances={jest.fn()}
          setGatewayDetails={jest.fn()}
          instances={[mockedInstance]}
          gatewayDetails={initialGatewayDetails}
          onInstancesAddSuccess={jest.fn()}
          loading={false}
          refresh={jest.fn()}
          isEditFlow={false}
        />
      </TestWrapper>
    )
    const refreshBtn = getByText('ce.common.refresh')
    expect(refreshBtn).toBeDefined()
    act(() => {
      fireEvent.click(refreshBtn)
    })
  })

  test('should show message when data is empty for selected resource group', async () => {
    const { container } = render(
      <TestWrapper>
        <COInstanceSelector
          selectedInstances={[]}
          setSelectedInstances={jest.fn()}
          setGatewayDetails={jest.fn()}
          instances={[]}
          gatewayDetails={initialGatewayDetails}
          onInstancesAddSuccess={jest.fn()}
          loading={false}
          refresh={jest.fn()}
          isEditFlow={false}
        />
      </TestWrapper>
    )

    await selectResourceGroup(container)

    act(() => {
      expect(container).toMatchSnapshot()
    })
  })
})

describe('GCP instance selection', () => {
  const gcpProvider = {
    name: 'GCP',
    value: 'gcp',
    icon: 'gcp'
  }
  const gcpGatewayDetails = { ...initialGatewayDetails, provider: gcpProvider }
  test('should render GCP instances selection modal with filters', () => {
    const { container } = render(
      <TestWrapper>
        <COInstanceSelector
          selectedInstances={[]}
          setSelectedInstances={jest.fn()}
          setGatewayDetails={jest.fn()}
          instances={[mockedInstance]}
          gatewayDetails={gcpGatewayDetails}
          onInstancesAddSuccess={jest.fn()}
          loading={false}
          isEditFlow={false}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('should be able to select filters', async () => {
    const { container } = render(
      <TestWrapper>
        <COInstanceSelector
          selectedInstances={[]}
          setSelectedInstances={jest.fn()}
          setGatewayDetails={jest.fn()}
          instances={[mockedInstance]}
          gatewayDetails={gcpGatewayDetails}
          onInstancesAddSuccess={jest.fn()}
          loading={false}
          isEditFlow={false}
        />
      </TestWrapper>
    )

    const regionDropdown = container.querySelector('input[name="regionsSelector"]') as HTMLInputElement
    const zoneDropdown = container.querySelector('input[name="zoneSelector"]') as HTMLInputElement

    const rgCaret = container
      .querySelector(`input[name="regionsSelector"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    act(() => {
      fireEvent.click(rgCaret!)
    })
    const rgToSelect = await findByText(container, 'ap-southeast-1')
    act(() => {
      fireEvent.click(rgToSelect)
    })
    expect(regionDropdown.value).toBe('ap-southeast-1')

    const zoneCaret = container
      .querySelector(`input[name="zoneSelector"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    act(() => {
      fireEvent.click(zoneCaret!)
    })
    const zoneToSelect = await findByText(container, 'us-container-1')
    act(() => {
      fireEvent.click(zoneToSelect)
    })
    expect(zoneDropdown.value).toBe('us-container-1')
  })
})

describe('AWS instance selection', () => {
  test('should render AWS instances selection modal with filters', () => {
    const awsProvider = {
      name: 'AWS',
      value: 'aws',
      icon: 'service-aws'
    }
    const { container } = render(
      <TestWrapper>
        <COInstanceSelector
          selectedInstances={[]}
          setSelectedInstances={jest.fn()}
          setGatewayDetails={jest.fn()}
          instances={[mockedInstance]}
          gatewayDetails={{ ...initialGatewayDetails, provider: awsProvider }}
          onInstancesAddSuccess={jest.fn()}
          loading={false}
          isEditFlow={false}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})
