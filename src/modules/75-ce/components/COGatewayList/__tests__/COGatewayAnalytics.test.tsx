/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act } from 'react-dom/test-utils'
import { fireEvent, render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { GatewayKindType, RulesMode } from '@ce/constants'
import COGatewayAnalytics from '../COGatewayAnalytics'
import { mockedEcsClusterServiceData } from './data'

const mockServiceData = {
  id: 10,
  name: 'string',
  org_id: 'string',
  account_identifier: 'string',
  project_id: 'string',
  fulfilment: 'string',
  kind: 'string',
  cloud_account_id: 'string',
  idle_time_mins: 10,
  host_name: 'string',
  disabled: false,
  custom_domains: ['custom.doamin.in'],
  metadata: {
    cloud_provider_details: {
      name: 'Test Connector'
    }
  }
}
const mockedK8sServiceData = { ...mockServiceData, kind: GatewayKindType.KUBERNETES }

const savingsData = {
  service_id: 22,
  potential_cost: 22.0224,
  actual_cost: 0.003047567877888889,
  actual_savings: 22.019352432122112,
  savings_percentage: 99.98616150883696,
  usage_date: '0001-01-01T00:00:00Z',
  idle_hours: 0,
  actual_hours: 0
}

const mockedConnectorData = {
  data: {
    connector: {
      name: 'harness-qa',
      identifier: 'harnessqa',
      description: null,
      orgIdentifier: null,
      projectIdentifier: null,
      tags: {},
      type: 'CEAws'
    }
  }
}

jest.mock('services/lw', () => ({
  useSavingsOfService: jest.fn().mockImplementation(() => ({ data: savingsData, loading: false })),
  useHealthOfService: jest.fn().mockImplementation(() => ({ data: null, loading: false, errors: [] })),
  useAllServiceResources: jest.fn().mockImplementation(() => ({ data: null, loading: false, errors: null })),
  useToggleAutostoppingRule: jest.fn().mockImplementation(() => ({ mutate: Promise.resolve(() => jest.fn()) })),
  useDeleteService: jest.fn().mockImplementation(() => ({ mutate: Promise.resolve(() => jest.fn()) })),
  useGatewaySessionReport: jest.fn().mockImplementation(() => ({ mutate: Promise.resolve(() => jest.fn()) })),
  useListStaticSchedules: jest.fn().mockImplementation(() => ({
    data: {},
    loading: false,
    refetch: jest.fn(() => Promise.resolve({ response: {} }))
  })),
  useCreateStaticSchedules: jest.fn().mockImplementation(() => ({
    mutate: jest.fn()
  })),
  useDeleteStaticSchedule: jest.fn().mockImplementation(() => ({
    mutate: jest.fn()
  })),
  useDescribeServiceInContainerServiceCluster: jest.fn().mockImplementation(() => ({
    data: { response: mockedEcsClusterServiceData },
    loading: false
  }))
}))

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn().mockImplementation(() => ({
    data: mockedConnectorData,
    loading: false
  }))
}))

jest.mock('highcharts-react-official', () => () => <div />)

describe('Autostopping rule analytics drawer', () => {
  test('render analytics drawer', () => {
    const { container, getByTestId } = render(
      <TestWrapper>
        <COGatewayAnalytics
          service={{ index: 0, data: mockServiceData }}
          handleServiceToggle={jest.fn()}
          handleServiceDeletion={jest.fn()}
          handleServiceEdit={jest.fn()}
          mode={RulesMode.ACTIVE}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    const editIcon = getByTestId('editRuleIcon')
    expect(editIcon).toBeDefined()
    act(() => {
      fireEvent.click(editIcon!)
    })

    const deleteIcon = getByTestId('deleteRuleIcon')
    expect(deleteIcon).toBeDefined()
    act(() => {
      fireEvent.click(deleteIcon!)
    })
  })

  test('render k8s rule analytics drawer', () => {
    const { container } = render(
      <TestWrapper>
        <COGatewayAnalytics
          service={{ index: 0, data: mockedK8sServiceData }}
          handleServiceToggle={jest.fn()}
          handleServiceDeletion={jest.fn()}
          handleServiceEdit={jest.fn()}
          mode={RulesMode.ACTIVE}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
