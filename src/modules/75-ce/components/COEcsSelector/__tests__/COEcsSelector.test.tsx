/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { TestWrapper } from '@common/utils/testUtils'
import * as lwServices from 'services/lw'
import COEcsSelector from '../COEcsSelector'

const pathParams = { accountId: 'accountId', orgIdentifier: 'orgIdentifier', projectIdentifier: 'projectIdentifier' }

const gatewayDetails = {
  name: 'Rule1',
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
    name: 'AWS',
    value: 'aws',
    icon: 'service-aws'
  },
  selectedInstances: [],
  accessPointID: '',
  metadata: {},
  deps: []
}

const mockedRegionsData = { data: { response: [{ name: 'us-east-1', label: 'us-east-1' }] }, loading: false }

const mockedClustersData = {
  data: { response: [{ name: 'dummy-cluster', id: 'dummy-id' }] },
  loading: false,
  refetch: jest.fn(() => Promise.resolve({ data: { response: [{ name: 'dummy-cluster', id: 'dummy-id' }] } }))
}

const mockedClusterServicesData = {
  data: { response: [{ name: 'dummy-service', id: 'dummy-service-id' }] },
  loading: false,
  refetch: jest.fn(() => Promise.resolve({ data: { response: [{ name: 'dummy-service', id: 'dummy-service-id' }] } }))
}

const mockedDescService = {
  cluster: 'dummy-cluster',
  region: 'us-east-1',
  service: 'dummy-service',
  task_count: 0
}

const mockedServiceDescribeDetails = {
  data: { response: mockedDescService },
  loading: false,
  refetch: jest.fn(() => Promise.resolve({ data: mockedDescService }))
}

jest.mock('services/lw', () => ({
  useAllRegions: jest.fn().mockImplementation(() => mockedRegionsData),
  useGetContainerClustersOfRegion: jest.fn().mockImplementation(() => mockedClustersData),
  useListOfServicesInContainerServiceCluster: jest.fn().mockImplementation(() => mockedClusterServicesData),
  useDescribeServiceInContainerServiceCluster: jest.fn().mockImplementation(() => mockedServiceDescribeDetails)
}))

describe('ECS Service Selector Modal', () => {
  test('should display message for selecting region and cluster', () => {
    const { container, getByText } = render(
      <TestWrapper pathParams={pathParams}>
        <COEcsSelector gatewayDetails={gatewayDetails} onServiceAddSuccess={jest.fn()} setGatewayDetails={jest.fn()} />
      </TestWrapper>
    )

    const emptyText = getByText('ce.co.autoStoppingRule.configuration.ecsModal.emptyDescription')
    expect(emptyText).toBeDefined()

    expect(container).toMatchSnapshot()
  })

  test('should fill in region and cluster and display list of services', () => {
    const { container, getByText } = render(
      <TestWrapper pathParams={pathParams}>
        <COEcsSelector gatewayDetails={gatewayDetails} onServiceAddSuccess={jest.fn()} setGatewayDetails={jest.fn()} />
      </TestWrapper>
    )

    const regionDropdown = container.querySelector(`input[name="region"]`) as HTMLInputElement
    const regionCaret = container
      .querySelector(`input[name="region"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    act(() => {
      fireEvent.click(regionCaret!)
    })

    const regionToSelect = getByText('us-east-1')
    expect(regionToSelect).toBeDefined()
    act(() => {
      fireEvent.click(regionToSelect)
    })

    expect(regionDropdown.value).toBe('us-east-1')

    const clusterDropdown = container.querySelector(`input[name="cluster"]`) as HTMLInputElement
    const clusterCaret = container
      .querySelector(`input[name="cluster"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    act(() => {
      fireEvent.click(clusterCaret!)
    })

    const clusterToSelect = getByText('dummy-cluster')
    expect(clusterToSelect).toBeDefined()
    act(() => {
      fireEvent.click(clusterToSelect)
    })

    expect(clusterDropdown.value).toBe('dummy-cluster')

    expect(container).toMatchSnapshot()
  })

  test('clicking on refresh fetches data again and search is enabled', async () => {
    const refetchServicesFn = jest.fn()
    jest.spyOn(lwServices, 'useListOfServicesInContainerServiceCluster').mockImplementation(
      () =>
        ({
          data: { response: [{ name: 'dummy-service', id: 'dummy-service-id' }] },
          loading: false,
          error: 'Some error',
          refetch: refetchServicesFn
        } as any)
    )

    const { container, getByText } = render(
      <TestWrapper pathParams={pathParams}>
        <COEcsSelector gatewayDetails={gatewayDetails} onServiceAddSuccess={jest.fn()} setGatewayDetails={jest.fn()} />
      </TestWrapper>
    )

    const regionCaret = container
      .querySelector(`input[name="region"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    act(() => {
      fireEvent.click(regionCaret!)
    })

    const regionToSelect = getByText('us-east-1')
    expect(regionToSelect).toBeDefined()
    act(() => {
      fireEvent.click(regionToSelect)
    })

    const clusterCaret = container
      .querySelector(`input[name="cluster"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    act(() => {
      fireEvent.click(clusterCaret!)
    })

    const clusterToSelect = getByText('dummy-cluster')
    expect(clusterToSelect).toBeDefined()
    act(() => {
      fireEvent.click(clusterToSelect)
    })

    const refreshBtn = getByText('ce.common.refresh')
    expect(refreshBtn).toBeDefined()
    act(() => {
      fireEvent.click(refreshBtn)
    })
    await waitFor(() => {
      expect(refetchServicesFn).toBeCalled()
    })

    const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement
    expect(searchInput).toBeDefined()
    await waitFor(() => {
      fireEvent.change(searchInput!, { target: { value: 'random' } })
    })
    expect(searchInput.value).toBe('random')
  })

  test('error', () => {
    jest.spyOn(lwServices, 'useListOfServicesInContainerServiceCluster').mockImplementation(
      () =>
        ({
          data: null,
          loading: false,
          error: 'Some error',
          refetch: jest.fn()
        } as any)
    )
    jest.spyOn(lwServices, 'useDescribeServiceInContainerServiceCluster').mockImplementation(
      () =>
        ({
          data: null,
          loading: false,
          error: 'Some Descrive service error',
          refetch: jest.fn()
        } as any)
    )

    const { container } = render(
      <TestWrapper pathParams={pathParams}>
        <COEcsSelector gatewayDetails={gatewayDetails} onServiceAddSuccess={jest.fn()} setGatewayDetails={jest.fn()} />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})
