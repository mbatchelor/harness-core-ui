/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { Container, Button } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import { TestWrapper, TestWrapperProps } from '@common/utils/testUtils'
import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import * as cvServices from 'services/cv'
import { yamlResponse, monitoredServiceMockData } from '../CVMonitoredService/__test__/CVMonitoredService.mock'
import MonitoredServicePage from '../MonitoredServicePage'
import { isProjectChangedOnMonitoredService } from '../MonitoredServicePage.utils'

const testWrapperProps: TestWrapperProps = {
  path: routes.toCVAddMonitoringServicesSetup({ ...accountPathProps, ...projectPathProps }),
  pathParams: {
    accountId: '1234_accountId',
    projectIdentifier: '1234_project',
    orgIdentifier: '1234_org',
    identifier: 'monitored-service'
  }
}

const testWrapperEditMode = {
  path: routes.toCVAddMonitoringServicesEdit({ ...accountPathProps, ...projectPathProps, identifier: ':identifier' }),
  pathParams: {
    accountId: '1234_accountId',
    projectIdentifier: '1234_project',
    orgIdentifier: '1234_org',
    identifier: 'monitored-service'
  }
}

jest.mock('@cv/components/HarnessServiceAndEnvironment/HarnessServiceAndEnvironment', () => ({
  useGetHarnessServices: () => ({
    serviceOptions: [
      { label: 'service1', value: 'service1' },
      { label: 'AppDService101', value: 'AppDService101' }
    ]
  }),
  HarnessServiceAsFormField: function MockComponent(props: any) {
    return (
      <Container>
        <Button
          className="addService"
          onClick={() => props.serviceProps.onNewCreated({ name: 'newService', identifier: 'newService' })}
        />
      </Container>
    )
  },
  HarnessEnvironmentAsFormField: function MockComponent(props: any) {
    return (
      <Container>
        <Button
          className="addEnv"
          onClick={() => props.environmentProps.onNewCreated({ name: 'newEnv', identifier: 'newEnv' })}
        />
      </Container>
    )
  },
  useGetHarnessEnvironments: () => {
    return {
      environmentOptions: [
        { label: 'env1', value: 'env1' },
        { label: 'AppDTestEnv1', value: 'AppDTestEnv1' }
      ]
    }
  }
}))

describe('Unit tests for createting monitored source', () => {
  let refetchDashboardWidgets: jest.Mock
  beforeEach(() => {
    refetchDashboardWidgets = jest.fn()

    jest.spyOn(cvServices, 'useGetAllJourneys').mockReturnValue({
      data: {},
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cvServices, 'useGetSLODashboardWidgets').mockReturnValue({
      data: {},
      loading: false,
      error: null,
      refetch: refetchDashboardWidgets
    } as any)

    jest.spyOn(cvServices, 'useGetAllMonitoredServicesWithTimeSeriesHealthSources').mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cvServices, 'useGetServiceLevelObjectivesRiskCount').mockReturnValue({
      data: {
        data: {
          riskCounts: [
            {
              displayName: 'Healthy',
              identifier: 'HEALTHY',
              count: 2
            }
          ],
          totalCount: 3
        }
      },
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cvServices, 'useResetErrorBudget').mockReturnValue({ mutate: jest.fn(), loading: false } as any)

    jest.spyOn(cvServices, 'useGetNotificationRulesForMonitoredService').mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)
  })

  test('Health source table and environment services compoenet renders ', async () => {
    jest.spyOn(cvServices, 'useGetMonitoredService').mockImplementation(
      () =>
        ({
          data: {
            data: monitoredServiceMockData
          },
          error: null,
          loading: false
        } as any)
    )
    jest.spyOn(cvServices, 'useGetMonitoredServiceYamlTemplate').mockImplementation(
      () =>
        ({
          data: yamlResponse,
          refetch: jest.fn()
        } as any)
    )
    const { getByText } = render(
      <TestWrapper {...testWrapperProps}>
        <MonitoredServicePage />
      </TestWrapper>
    )
    expect(getByText('cv.monitoredServices.title')).toBeDefined()
    expect(getByText('cv.monitoredServices.addNewMonitoredServices')).toBeDefined()

    expect(getByText('cv.monitoredServices.monitoredServiceName')).toBeDefined()

    // Table cv.healthSource.defineYourSource
    expect(getByText('cv.healthSource.defineYourSource')).toBeDefined()
  })

  test('should render loading state', () => {
    jest.spyOn(cvServices, 'useGetMonitoredService').mockImplementation(
      () =>
        ({
          data: {},
          error: null,
          loading: true,
          refetch: jest.fn()
        } as any)
    )
    const { getByText } = render(
      <TestWrapper {...testWrapperEditMode}>
        <MonitoredServicePage />
      </TestWrapper>
    )
    expect(getByText(/Loading, please wait\.\.\./)).toBeTruthy()
  })

  test('should render error state', () => {
    jest.spyOn(cvServices, 'useGetMonitoredService').mockImplementation(
      () =>
        ({
          data: {},
          error: { message: '' },
          loading: false,
          refetch: jest.fn()
        } as any)
    )
    const { getByText } = render(
      <TestWrapper {...testWrapperEditMode}>
        <MonitoredServicePage />
      </TestWrapper>
    )
    expect(getByText('We cannot perform your request at the moment. Please try again.')).toBeTruthy()
  })

  test('should render edit mode', async () => {
    jest.spyOn(cvServices, 'useGetMonitoredService').mockImplementation(
      () =>
        ({
          data: {
            data: monitoredServiceMockData
          },
          error: null,
          loading: false,
          refetch: jest.fn()
        } as any)
    )
    jest.spyOn(cvServices, 'useGetMonitoredServiceScores').mockImplementation(
      () =>
        ({
          data: null,
          refetch: jest.fn(),
          error: { message: '' },
          loading: true
        } as any)
    )
    jest.spyOn(cvServices, 'useGetMonitoredServiceOverAllHealthScore').mockReturnValue({
      data: {},
      refetch: jest.fn()
    } as any)

    jest.spyOn(cvServices, 'useChangeEventList').mockImplementation(
      () =>
        ({
          data: {},
          error: null,
          loading: false,
          refetch: jest.fn()
        } as any)
    )
    jest.spyOn(cvServices, 'useGetServiceDependencyGraph').mockImplementation(
      () =>
        ({
          data: {},
          refetch: jest.fn(),
          error: null,
          loading: false
        } as any)
    )
    jest.spyOn(cvServices, 'useChangeEventTimeline').mockImplementation(
      () =>
        ({
          data: {
            resource: {
              categoryTimeline: {
                Deployment: [],
                Infrastructure: [],
                Alert: []
              }
            }
          },
          refetch: jest.fn(),
          error: null,
          loading: false,
          cancel: jest.fn()
        } as any)
    )
    jest.spyOn(cvServices, 'useGetMonitoredServiceChangeTimeline').mockImplementation(
      () =>
        ({
          data: {
            resource: {
              categoryTimeline: {
                Deployment: [],
                Infrastructure: [],
                Alert: []
              }
            }
          },
          refetch: jest.fn(),
          error: null,
          loading: false,
          cancel: jest.fn()
        } as any)
    )
    const { container, getByText, getAllByRole } = render(
      <TestWrapper {...testWrapperEditMode}>
        <MonitoredServicePage />
      </TestWrapper>
    )
    expect(getAllByRole('tab').length).toEqual(3)

    const tabTitle = [
      'cv.slos.title',
      'cv.monitoredServices.monitoredServiceTabs.serviceHealth',
      'cv.monitoredServices.monitoredServiceTabs.configurations'
    ]

    getAllByRole('tab').forEach((tab, index) => {
      expect(tab.textContent).toEqual(tabTitle[index])
    })

    await waitFor(() => expect(container.querySelector('div[data-tab-id="ServiceHealth"]')).toBeTruthy())
    await waitFor(() => expect(container.querySelector('div[data-tab-id="SLOs"]')).toBeTruthy())
    await waitFor(() => expect(container.querySelector('div[data-tab-id="Configurations"]')).toBeTruthy())
    await waitFor(() => expect(getByText('cv.monitoredServices.monitoredServiceTabs.configurations')).toBeTruthy())
  })

  test('should return true when isProjectChangedOnMonitoredService method is called with the correct error message', () => {
    const identifier = 'app_1'
    const error = {
      data: {
        message: `Invalid request: Monitored Source Entity with identifier ${identifier} is not present`
      }
    }
    expect(isProjectChangedOnMonitoredService(error, identifier)).toEqual(true)
  })

  test('should return false when isProjectChangedOnMonitoredService method is called with different error message', () => {
    const identifier = 'app_1'
    const error = {
      data: {
        message: `Invalid request:`
      }
    }
    expect(isProjectChangedOnMonitoredService(error, identifier)).toEqual(false)
  })
})
