/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor, act } from '@testing-library/react'
import { Container, Button } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import { TestWrapper, TestWrapperProps } from '@common/utils/testUtils'
import { accountPathProps, projectPathProps, modulePathProps } from '@common/utils/routeUtils'
import * as dbHook from '@cv/hooks/IndexedDBHook/IndexedDBHook'
import Service from '../Service'
import { editModeData, onUpdatePayload, cachedData } from './Service.mock'
import { monitoredService } from '../../Dependency/__tests__/Dependency.mock'
import type { MonitoredServiceForm } from '../Service.types'

const paramsEditMode = { ...accountPathProps, ...projectPathProps, ...modulePathProps, identifier: ':identifier' }
const testWrapperProps: TestWrapperProps = {
  path: routes.toCVAddMonitoringServicesEdit(paramsEditMode),
  pathParams: {
    module: 'cv',
    accountId: '1234_accountId',
    projectIdentifier: '1234_project',
    orgIdentifier: '1234_org',
    identifier: 'ms101'
  }
}

const showDrawer = jest.fn()
const hideDrawer = jest.fn()
const onEdit = jest.fn()
const onDelete = jest.fn()

jest.mock('@cv/hooks/useDrawerHook/useDrawerHook', () => ({
  useDrawer: () => {
    return { showDrawer, hideDrawer }
  }
}))

jest.mock('@cv/components/ContextMenuActions/ContextMenuActions', () => () => {
  return (
    <>
      <div className="context-menu-mock-edit" onClick={onEdit} />
      <div className="context-menu-mock-delete" onClick={onDelete} />
    </>
  )
})

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

const fetchMonitoredServiceYAML = jest.fn(() => Promise.resolve({ data: {} }))
const updateMonitoredService = jest.fn()
const onSuccess = jest.fn()

jest.mock('services/cv', () => ({
  useSaveMonitoredService: jest
    .fn()
    .mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useUpdateMonitoredService: jest
    .fn()
    .mockImplementation(() => ({ loading: false, error: null, data: {}, mutate: updateMonitoredService })),
  useGetMonitoredService: jest
    .fn()
    .mockImplementation(() => ({ loading: false, error: null, data: editModeData, refetch: jest.fn() })),
  useGetMonitoredServiceYamlTemplate: jest
    .fn()
    .mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: fetchMonitoredServiceYAML })),
  useGetNotificationRulesForMonitoredService: jest
    .fn()
    .mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: jest.fn() })),
  useSaveNotificationRuleData: jest
    .fn()
    .mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: jest.fn() })),
  useUpdateNotificationRuleData: jest
    .fn()
    .mockImplementation(() => ({ data: {}, loading: false, error: null, refetch: jest.fn() }))
}))

describe('Verify Service', () => {
  test('Monitored service is poplulated in Edit mode', async () => {
    jest.spyOn(dbHook, 'useIndexedDBHook').mockReturnValue({
      dbInstance: {
        put: jest.fn(),
        get: jest.fn().mockReturnValue(undefined)
      } as any,
      isInitializingDB: false
    })
    const { container, getByText } = render(
      <TestWrapper {...testWrapperProps}>
        <Service
          value={monitoredService}
          onSuccess={onSuccess}
          serviceTabformRef={{ current: {} }}
          onChangeMonitoredServiceType={jest.fn()}
        />
      </TestWrapper>
    )
    // name
    await waitFor(() => expect(container.querySelector('input[value="Monitored Service 101"]')).toBeTruthy())
    // description
    await waitFor(() => expect(getByText('Monitored Service with change source and health source')).toBeTruthy())

    // Change Source populates
    await waitFor(() =>
      expect(container.querySelectorAll('.changeSourceTableWrapper .TableV2--body [role="row"]').length).toEqual(1)
    )
    await waitFor(() => expect(getByText('PagerDuty 101')).toBeTruthy()) // name
    await waitFor(() => expect(getByText('Alert')).toBeTruthy()) // type
    await waitFor(() => expect(container.querySelector('span[data-icon="service-pagerduty"]')).toBeTruthy()) // source icon

    // Health Source populates
    await waitFor(() =>
      expect(container.querySelectorAll('.healthSourceTableWrapper .TableV2--body [role="row"]').length).toEqual(1)
    )
    await waitFor(() => expect(getByText('Splunk 102')).toBeTruthy()) // name
    await waitFor(() => expect(getByText('pipeline.verification.analysisTab.logs')).toBeTruthy()) // type
    await waitFor(() => expect(container.querySelector('span[data-icon="service-splunk"]')).toBeTruthy()) // source icon

    // Click Save to update
    await waitFor(() => expect(getByText('save')).toBeTruthy())
    act(() => {
      fireEvent.click(getByText('save'))
    })

    // onSave works
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(onUpdatePayload))

    await waitFor(() => expect(getByText('save')).toBeTruthy())

    // click addChangeSource
    act(() => {
      fireEvent.click(getByText('cv.changeSource.addChangeSource'))
    })

    await waitFor(() =>
      expect(showDrawer).toHaveBeenCalledWith(
        expect.objectContaining({
          hideDrawer: hideDrawer,
          monitoredServiceType: 'Application',
          tableData: [
            {
              category: 'Alert',
              desc: 'Alert from PagerDuty',
              enabled: true,
              identifier: 'pagerduty',
              name: 'PagerDuty 101',
              spec: {
                connectorRef: 'PagerDutyConnector',
                pagerDutyServiceId: 'pagerDutyServiceId101'
              },
              type: 'PagerDuty'
            }
          ]
        })
      )
    )

    act(() => {
      fireEvent.click(container.querySelector('.context-menu-mock-delete')!)
    })

    await waitFor(() => expect(onDelete).toHaveBeenCalled())

    act(() => {
      fireEvent.click(container.querySelector('.context-menu-mock-edit')!)
    })

    await waitFor(() => expect(onEdit).toHaveBeenCalled())
  })

  test('Ensure that any infra change source is removed when switching type to application', async () => {
    jest.spyOn(dbHook, 'useIndexedDBHook').mockReturnValue({
      dbInstance: {
        put: jest.fn(),
        get: jest.fn().mockReturnValue(Promise.resolve({ currentData: cachedData }))
      } as any,
      isInitializingDB: false
    })
    const onChangeType = jest.fn()
    const { container, getByText } = render(
      <TestWrapper>
        <Service
          value={{ isEdit: false, ...cachedData } as MonitoredServiceForm}
          onSuccess={onSuccess}
          serviceTabformRef={{ current: {} }}
          onChangeMonitoredServiceType={onChangeType}
        />
      </TestWrapper>
    )
    // name
    await waitFor(() => expect(container.querySelector('input[value="Application"]')).toBeTruthy())
    expect(getByText('CD 101')).not.toBeNull()
    fireEvent.click(
      container.querySelector(`[class*="monitoredService"] .bp3-input-action [data-icon="chevron-down"]`)!
    )
    await waitFor(() => expect(container.querySelector('[class*="menuItemLabel"]')).not.toBeNull())
    fireEvent.click(getByText('Infrastructure'))
    fireEvent.click(getByText('confirm'))
    await waitFor(() => expect(getByText('cv.healthSource.noData')).not.toBeNull())
    expect(onChangeType).toHaveBeenCalledWith({
      correlationId: 'c910c9e2-5a48-4f4b-9dad-afdeac54d060',
      dependencies: [],
      description: 'Monitored Service with change source and health source',
      environmentRef: 'EnvironmentRef102',
      identifier: 'monitoredservice101',
      isEdit: false,
      metaData: null,
      name: 'Monitored Service 101',
      orgIdentifier: 'default',
      projectIdentifier: 'Demo',
      serviceRef: 'ServiceRef102',
      sources: {
        changeSources: [],
        healthSources: []
      },
      tags: {
        tag1: '',
        tag2: ''
      },
      type: 'Infrastructure'
    })
  })
})
