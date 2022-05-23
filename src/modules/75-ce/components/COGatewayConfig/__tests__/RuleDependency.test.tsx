/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, findByText } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { TestWrapper } from '@common/utils/testUtils'
import RuleDependency from '../steps/AdvancedConfiguration/RuleDependency'

const mockedGatewayDetails = {
  name: 'gateway-details-1',
  id: 121,
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

const mockedService1 = {
  access_point_id: 'string',
  account_identifier: 'acc-string',
  cloud_account_id: 'cloud-string',
  created_at: 'string',
  custom_domains: [],
  disabled: false,
  kind: 'instance',
  name: 'service1',
  org_id: 'org-string',
  project_id: 'project-string',
  id: 123
}

const mockedService2 = {
  access_point_id: 'string',
  account_identifier: 'acc-string',
  cloud_account_id: 'cloud-string',
  created_at: 'string',
  custom_domains: [],
  disabled: false,
  kind: 'instance',
  name: 'service2',
  org_id: 'org-string',
  project_id: 'project-string',
  id: 124
}

const mockedDep = {
  delay_secs: 10,
  dep_id: 1,
  service_id: 123
}

const allServices = [mockedService1, mockedService2]

describe('Dependency selector tests', () => {
  test('should display the selection table', () => {
    const { container } = render(
      <TestWrapper>
        <RuleDependency
          allServices={allServices}
          gatewayDetails={{ ...mockedGatewayDetails, deps: [mockedDep] }}
          setGatewayDetails={jest.fn}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('should be able to add new dependency', async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <RuleDependency allServices={allServices} gatewayDetails={mockedGatewayDetails} setGatewayDetails={jest.fn} />
      </TestWrapper>
    )

    const addBtn = getByText('ce.co.gatewayConfig.addDependency')
    act(() => {
      fireEvent.click(addBtn!)
    })
    expect(container.getElementsByTagName('table')).toBeDefined()

    const dropdownCaret = container.querySelector(`[class*="bp3-input-action"]`)?.querySelector('[icon="chevron-down"]')
    act(() => {
      fireEvent.click(dropdownCaret!)
    })
    const serviceToSelect = await findByText(container, 'service1')
    act(() => {
      fireEvent.click(serviceToSelect)
    })

    expect((container.querySelector('.bp3-input-group .bp3-input') as HTMLInputElement).value).toBe('service1')

    const timeInput = container.querySelector('input[value="5"]') as HTMLInputElement
    fireEvent.change(timeInput!, { target: { value: 10 } })
    timeInput.blur()
    expect(timeInput.value).toBe('10')
  })

  test('should display the selection table', () => {
    const { container } = render(
      <TestWrapper>
        <RuleDependency
          allServices={allServices}
          gatewayDetails={{ ...mockedGatewayDetails, deps: [mockedDep] }}
          setGatewayDetails={jest.fn}
        />
      </TestWrapper>
    )

    const deleteIcon = container.querySelector('.bp3-icon svg[data-icon="trash"]')
    act(() => {
      fireEvent.click(deleteIcon!)
    })
    expect(container.getElementsByClassName('bp3-html-table')[0]).toBeUndefined()
  })
})
