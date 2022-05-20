/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { act } from '@testing-library/react-hooks'
import COAsgSelector from '@ce/components/COAsgSelector'
import { TestWrapper } from '@common/utils/testUtils'

const mockedAsg = {
  id: 'mockAsg',
  desired: 0,
  max: 3,
  min: 0,
  spot: 0,
  on_demand: 1, // eslint-disable-line
  provider_name: '', // eslint-disable-line
  // eslint-disable-next-line
  target_groups: [
    {
      id: 'target',
      name: 'my-targets',
      port: 80,
      protocol: 'HTTP',
      vpc: 'vpc'
    }
  ],
  availability_zones: ['us-east-1a'], // eslint-disable-line
  status: '',
  region: 'us-east-1',
  meta: {
    // eslint-disable-next-line
    mixed_instance_policy: {
      InstancesDistribution: {
        OnDemandAllocationStrategy: 'prioritized',
        OnDemandBaseCapacity: 1,
        OnDemandPercentageAboveBaseCapacity: 0,
        SpotAllocationStrategy: 'lowest-price',
        SpotInstancePools: 2,
        SpotMaxPrice: null
      },
      LaunchTemplate: {
        LaunchTemplateSpecification: {
          LaunchTemplateId: 'lt-03',
          LaunchTemplateName: 'lwcg',
          Version: null
        },
        Overrides: [{ InstanceType: '', LaunchTemplateSpecification: null, WeightedCapacity: null }]
      }
    }
  },
  mixed_instance: true // eslint-disable-line
}

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
    name: 'AWS',
    value: 'aws',
    icon: 'service-aws'
  },
  selectedInstances: [],
  accessPointID: '',
  metadata: {},
  deps: []
}

const mockedRegionsData = { data: { response: [{ name: 'ap-southeast-1', label: 'ap-southeast-1' }] }, loading: false }

const mockedZonesData = { response: ['us-container-1'] }

jest.mock('services/lw', () => ({
  useAllRegions: jest.fn().mockImplementation(() => mockedRegionsData),
  useAllZones: jest.fn().mockImplementation(() => ({
    data: mockedZonesData,
    loading: false
  }))
}))

describe('ASG selection modal component', () => {
  test('should render successfully', () => {
    const { container } = render(
      <TestWrapper>
        <COAsgSelector
          selectedScalingGroup={undefined}
          setSelectedAsg={jest.fn()}
          scalingGroups={[mockedAsg]}
          gatewayDetails={initialGatewayDetails}
          search={jest.fn()}
          onAsgAddSuccess={jest.fn()}
          loading={false}
          refresh={jest.fn()}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('should refresh the list', () => {
    const { container, getByText } = render(
      <TestWrapper>
        <COAsgSelector
          selectedScalingGroup={undefined}
          setSelectedAsg={jest.fn()}
          scalingGroups={[mockedAsg]}
          gatewayDetails={initialGatewayDetails}
          search={jest.fn()}
          onAsgAddSuccess={jest.fn()}
          loading={false}
          refresh={jest.fn()}
        />
      </TestWrapper>
    )

    const refreshBtn = getByText('ce.common.refresh')
    expect(refreshBtn).toBeDefined()
    act(() => {
      fireEvent.click(refreshBtn)
    })

    expect(container).toMatchSnapshot()
  })

  test('should select the ASG', () => {
    const { container } = render(
      <TestWrapper>
        <COAsgSelector
          selectedScalingGroup={undefined}
          setSelectedAsg={jest.fn()}
          scalingGroups={[mockedAsg]}
          gatewayDetails={initialGatewayDetails}
          search={jest.fn()}
          onAsgAddSuccess={jest.fn()}
          loading={false}
          refresh={jest.fn()}
        />
      </TestWrapper>
    )

    const radioBtn = container.querySelector('input[type="radio"]') as HTMLInputElement
    expect(radioBtn).toBeDefined()
    act(() => {
      fireEvent.click(radioBtn!)
    })
    expect(radioBtn.checked).toBeTruthy()
  })

  test('should add the selected ASG', () => {
    const { container, getByText } = render(
      <TestWrapper>
        <COAsgSelector
          selectedScalingGroup={undefined}
          setSelectedAsg={jest.fn()}
          scalingGroups={[mockedAsg]}
          gatewayDetails={initialGatewayDetails}
          search={jest.fn()}
          onAsgAddSuccess={jest.fn()}
          loading={false}
          refresh={jest.fn()}
        />
      </TestWrapper>
    )

    const radioBtn = container.querySelector('input[type="radio"]') as HTMLInputElement
    expect(radioBtn).toBeDefined()
    act(() => {
      fireEvent.click(radioBtn!)
    })
    expect(radioBtn.checked).toBeTruthy()

    const addBtn = getByText('ce.co.autoStoppingRule.configuration.addSelectedBtnText')
    expect(addBtn).toBeDefined()
    act(() => {
      fireEvent.click(addBtn)
    })

    expect(container).toMatchSnapshot()
  })

  test('should be able to search', () => {
    const { container } = render(
      <TestWrapper>
        <COAsgSelector
          selectedScalingGroup={undefined}
          setSelectedAsg={jest.fn()}
          scalingGroups={[mockedAsg]}
          gatewayDetails={initialGatewayDetails}
          search={jest.fn()}
          onAsgAddSuccess={jest.fn()}
          loading={false}
          refresh={jest.fn()}
        />
      </TestWrapper>
    )
    const searchContainer = container.querySelector('.ui-search-box')
    expect(searchContainer).toBeDefined()
    act(() => {
      fireEvent.click(searchContainer!)
    })

    const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'abc' } })
    })
  })
})
