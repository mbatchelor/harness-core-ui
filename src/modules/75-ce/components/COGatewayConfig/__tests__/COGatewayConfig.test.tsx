/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act } from 'react-dom/test-utils'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { AdvancedConfigTabs, RESOURCES } from '@ce/constants'
import COGatewayConfig from '../COGatewayConfig'
import AdvancedConfiguration from '../steps/AdvancedConfiguration/AdvancedConfiguration'

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

const params = { accountId: 'accountId', orgIdentifier: 'orgIdentifier', projectIdentifier: 'projectIdentifier' }

const mockedData = { response: [] }

const mockedInstances = [
  {
    id: 'id',
    ipv4: '',
    launch_time: '', // eslint-disable-line
    name: 'name',
    region: 'us-west-2',
    status: 'running',
    tags: '',
    type: 'type',
    vpc: 'vpcid'
  }
]

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

const asgPortInfo = {
  port: 80,
  target_port: 80, // eslint-disable-line
  action: 'forward',
  protocol: 'http',
  target_protocol: 'http', // eslint-disable-line
  redirect_url: '', // eslint-disable-line
  routing_rules: [], // eslint-disable-line
  server_name: '' // eslint-disable-line
}

const mockedSecurityGroupResponse = {
  'i-09933bfb425912567': [
    {
      id: 'sg-0fdba2cc7d3b26e14',
      name: 'default',
      // eslint-disable-next-line
      inbound_rules: [
        {
          from: '0',
          protocol: '-1',
          to: '0'
        }
      ],
      // eslint-disable-next-line
      outbound_rules: [
        {
          from: '0',
          protocol: '-1',
          to: '0'
        }
      ]
    }
  ]
}

const mockedK8sClusterIdentifier = 'mock-kubernetes-id'

const mockedConnector = {
  connector: {
    name: 'dms-test',
    identifier: 'mock-kubernetes-id',
    description: '',
    orgIdentifier: null,
    projectIdentifier: null,
    tags: {},
    type: 'CEK8sCluster',
    spec: {
      connectorRef: 'cadfsdg',
      featuresEnabled: ['VISIBILITY']
    }
  },
  createdAt: 1632812028599,
  lastModifiedAt: 1632812028588,
  status: {
    status: 'SUCCESS',
    errorSummary: null,
    errors: null,
    testedAt: 1632812029812,
    lastTestedAt: 0,
    lastConnectedAt: 1632812029812
  },
  activityDetails: {
    lastActivityTime: 1632812028609
  },
  harnessManaged: false,
  gitDetails: {
    objectId: null,
    branch: null,
    repoIdentifier: null,
    rootFolder: null,
    filePath: null
  }
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

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('@common/hooks/useFeatureFlag', () => ({
  useFeatureFlag: jest.fn(() => true),
  useFeatureFlags: jest.fn(() => ({}))
}))

jest.mock('services/lw', () => ({
  useAllResourcesOfAccount: jest.fn().mockImplementation(() => ({
    mutate: jest.fn(() =>
      Promise.resolve({
        response: mockedInstances
      })
    ),
    loading: false
  })),
  useGetAllASGs: jest
    .fn()
    .mockImplementation(() => ({ mutate: jest.fn(() => Promise.resolve({ response: [mockedAsg] })), loading: false })),
  useSecurityGroupsOfInstances: jest.fn().mockImplementation(() => ({
    mutate: jest.fn(() => Promise.resolve({ response: mockedSecurityGroupResponse })),
    loading: false
  })),
  useAllResourceGroups: jest.fn().mockImplementation(() => ({
    data: { response: mockedResourceGroupResponse },
    loading: false
  })),
  useAllRegions: jest.fn().mockImplementation(() => mockedRegionsData),
  useAllZones: jest.fn().mockImplementation(() => ({
    data: mockedZonesData,
    loading: false
  })),
  useGetInstancesTags: jest.fn().mockImplementation(() => ({
    data: mockedTagsData,
    loading: false,
    refetch: jest.fn()
  }))
}))

jest.mock('services/cd-ng', () => ({
  useGetConnectorListV2: jest.fn().mockImplementation(() => ({
    mutate: jest.fn(() => Promise.resolve({ data: { content: [mockedConnector] } })),
    loading: false
  }))
}))

describe('Auto stopping Rule creation Tests', () => {
  test('Config screen renders without crashing', () => {
    const { container } = render(
      <TestWrapper pathParams={params}>
        <COGatewayConfig
          setGatewayDetails={jest.fn()}
          setValidity={jest.fn()}
          valid={false}
          gatewayDetails={initialGatewayDetails}
          allServices={mockedData.response}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('Fill step1 form successfully', async () => {
    const { container } = render(
      <TestWrapper pathParams={params}>
        <COGatewayConfig
          setGatewayDetails={jest.fn()}
          setValidity={jest.fn()}
          valid={false}
          gatewayDetails={initialGatewayDetails}
          allServices={mockedData.response}
        />
      </TestWrapper>
    )
    const nameInput = container.querySelector('input[name="gatewayName"]') as HTMLInputElement
    expect(nameInput).toBeDefined()
    await waitFor(() => {
      fireEvent.change(nameInput, { target: { value: 'New Rule' } })
    })
    expect(nameInput.value).toBe('New Rule')

    const idleTimeInput = container.querySelector('input[name="idleTime"]') as HTMLInputElement
    expect(idleTimeInput).toBeDefined()
    await waitFor(() => {
      fireEvent.change(idleTimeInput, { target: { value: '10' } })
    })
    expect(idleTimeInput.value).toBe('10')
  })

  test('Fill remaining form for INSTANCES', async () => {
    const { container, getByLabelText, getByText, getByTestId, queryByText } = render(
      <TestWrapper pathParams={params}>
        <COGatewayConfig
          setGatewayDetails={jest.fn()}
          setValidity={jest.fn()}
          valid={false}
          allServices={mockedData.response}
          gatewayDetails={{ ...initialGatewayDetails, selectedInstances: mockedInstances }}
        />
      </TestWrapper>
    )

    const instanceRadio = getByLabelText('ce.co.autoStoppingRule.helpText.step2.description.resourceList.ec2Vms')
    expect(instanceRadio).toBeDefined()
    act(() => {
      fireEvent.click(instanceRadio)
    })
    expect(getByText('ce.co.autoStoppingRule.configuration.step2.additionalResourceInfo.instance')).toBeDefined()

    const addInstanceCta = getByText('+ ce.co.autoStoppingRule.configuration.step2.addResourceCta.instance')
    await waitFor(() => {
      fireEvent.click(addInstanceCta)
    })
    // expect(container).toMatchSnapshot('TEST_SNAPSHOT_DEBUG')
    expect(getByText('ce.co.autoStoppingRule.configuration.instanceModal.header')).toBeTruthy()
    fireEvent.click(getByTestId('close-instance-modal'))
    expect(queryByText('ce.co.autoStoppingRule.configuration.instanceModal.header')).toBeFalsy()

    const spotCard = container.querySelector('#configStep3 .bp3-card')
    expect(spotCard).toBeDefined()
    act(() => {
      fireEvent.click(spotCard!)
    })
    expect(spotCard?.classList.contains('Card--selected')).toBeTruthy()
    expect(container).toMatchSnapshot()
  })

  test('fill remaining form for ASGs', async () => {
    const { container, getByLabelText, getByText, getByTestId, queryByText } = render(
      <TestWrapper pathParams={params}>
        <COGatewayConfig
          setGatewayDetails={jest.fn()}
          setValidity={jest.fn()}
          valid={false}
          allServices={mockedData.response}
          gatewayDetails={{
            ...initialGatewayDetails,
            routing: {
              ...initialGatewayDetails.routing,
              ports: [asgPortInfo],
              instance: { filterText: '', scale_group: mockedAsg } // eslint-disable-line
            }
          }}
        />
      </TestWrapper>
    )

    const asgRadio = getByLabelText('ce.co.autoStoppingRule.helpText.step2.description.resourceList.asg')
    expect(asgRadio).toBeDefined()
    act(() => {
      fireEvent.click(asgRadio)
    })
    expect(getByText('ce.co.autoStoppingRule.configuration.step2.additionalResourceInfo.asg')).toBeDefined()

    const addAsgBtn = getByText('+ ce.co.autoStoppingRule.configuration.step2.addResourceCta.asg')
    fireEvent.click(addAsgBtn)
    expect(getByText('ce.co.autoStoppingRule.configuration.asgModal.title')).toBeTruthy()
    fireEvent.click(getByTestId('close-asg-modal'))
    expect(queryByText('ce.co.autoStoppingRule.configuration.asgModal.title')).toBeFalsy()

    expect(getByText('ce.co.autoStoppingRule.configuration.step3.asgSubTitle')).toBeDefined()
    const odInstanceInput = container.querySelector('input[name="odInstance"]') as HTMLInputElement
    expect(odInstanceInput).toBeTruthy()
    await waitFor(() => {
      fireEvent.change(odInstanceInput, { target: { value: 3 } })
    })
    expect(odInstanceInput.value).toBe('3')
    expect(container).toMatchSnapshot()

    const spotInstanceInput = container.querySelector('input[name="spotInstance"]') as HTMLInputElement
    expect(spotInstanceInput).toBeTruthy()
    if (!spotInstanceInput.disabled) {
      await waitFor(() => {
        fireEvent.change(spotInstanceInput, { target: { value: 1 } })
      })
      expect(spotInstanceInput.value).toBe('1')
      expect(container).toMatchSnapshot()
    }
  })

  test('kubernestes config edit', () => {
    const { container } = render(
      <TestWrapper pathParams={params}>
        <COGatewayConfig
          setGatewayDetails={jest.fn()}
          setValidity={jest.fn()}
          valid={false}
          allServices={mockedData.response}
          gatewayDetails={{
            ...initialGatewayDetails,
            kind: 'k8s',
            metadata: {
              ...initialGatewayDetails.metadata,
              kubernetes_connector_id: mockedK8sClusterIdentifier
            },
            routing: {
              ...initialGatewayDetails.routing,
              k8s: {
                RuleJson: '{"apiVersion":"lightwing.lightwing.io/v1","kind":"AutoStoppingRule"}',
                ConnectorID: 't2',
                Namespace: 'default'
              }
            }
          }}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  describe('Advanced configuration section', () => {
    test('should open the dependencies tab based on active step details', () => {
      const { container } = render(
        <TestWrapper>
          <AdvancedConfiguration
            allServices={mockedData.response}
            gatewayDetails={initialGatewayDetails}
            selectedResource={RESOURCES.ECS}
            setGatewayDetails={jest.fn}
            totalStepsCount={4}
            activeStepDetails={{ count: 4, tabId: AdvancedConfigTabs.deps }}
          />
        </TestWrapper>
      )

      expect(container).toMatchSnapshot()
    })

    test('should open the schedules tab based on active step details', () => {
      const { container } = render(
        <TestWrapper>
          <AdvancedConfiguration
            allServices={mockedData.response}
            gatewayDetails={initialGatewayDetails}
            selectedResource={RESOURCES.ECS}
            setGatewayDetails={jest.fn}
            totalStepsCount={4}
            activeStepDetails={{ count: 4, tabId: AdvancedConfigTabs.schedules }}
          />
        </TestWrapper>
      )

      expect(container).toMatchSnapshot()
    })

    test('change tab to schedules', () => {
      const { container } = render(
        <TestWrapper>
          <AdvancedConfiguration
            allServices={mockedData.response}
            gatewayDetails={initialGatewayDetails}
            selectedResource={RESOURCES.ECS}
            setGatewayDetails={jest.fn}
            totalStepsCount={4}
          />
        </TestWrapper>
      )

      const schedTab = container.querySelectorAll('div[role="tab"]')[1]
      expect(schedTab).toBeDefined()
      act(() => {
        fireEvent.click(schedTab)
      })

      expect(container).toMatchSnapshot()
    })
  })
})
