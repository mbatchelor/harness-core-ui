/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react'
import { Container, Button, FormInput } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import { TestWrapper, TestWrapperProps } from '@common/utils/testUtils'
import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import * as dbHook from '@cv/hooks/IndexedDBHook/IndexedDBHook'
import { InputTypes, setFieldValue } from '@common/utils/JestFormHelper'
import MonitoredService from '../Configurations/Configurations'
import { yamlResponse } from '../../CVMonitoredService/__test__/CVMonitoredService.mock'

const testWrapperProps: TestWrapperProps = {
  path: routes.toCVAddMonitoringServicesSetup({ ...accountPathProps, ...projectPathProps }),
  pathParams: {
    accountId: '1234_accountId',
    projectIdentifier: '1234_project',
    orgIdentifier: '1234_org'
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
        <FormInput.Text name="serviceRef" />
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

const fetchMonitoredServiceYAML = jest.fn(() => Promise.resolve({ data: yamlResponse }))

jest.mock('services/cv', () => ({
  useSaveMonitoredService: () =>
    jest.fn().mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useUpdateMonitoredService: () =>
    jest.fn().mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useGetMonitoredService: jest
    .fn()
    .mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
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

describe('Unit tests for createting monitored source', () => {
  test('Health source table and environment services component renders', async () => {
    jest.spyOn(dbHook, 'useIndexedDBHook').mockReturnValue({
      dbInstance: {
        put: jest.fn(),
        get: jest.fn().mockReturnValue(undefined)
      } as any,
      isInitializingDB: false
    })
    const { getByText } = render(
      <TestWrapper {...testWrapperProps}>
        <MonitoredService />
      </TestWrapper>
    )

    // Table cv.healthSource.defineYourSource
    expect(getByText('cv.healthSource.defineYourSource')).toBeDefined()
  })

  test('Verify validaiton works on clicking Add new health source', async () => {
    jest.spyOn(dbHook, 'useIndexedDBHook').mockReturnValue({
      dbInstance: {
        put: jest.fn(),
        get: jest.fn().mockReturnValue(undefined)
      } as any,
      isInitializingDB: false
    })
    const { container, getByText, queryByText } = render(
      <TestWrapper {...testWrapperProps}>
        <MonitoredService />
      </TestWrapper>
    )
    // click on add new button
    const addNewButton = getByText('cv.healthSource.addHealthSource')
    await act(async () => {
      fireEvent.click(addNewButton)
    })

    await waitFor(() => expect(getByText('cv.monitoredServices.nameValidation')).not.toBeNull())

    await setFieldValue({
      container,
      type: InputTypes.TEXTFIELD,
      fieldId: 'name',
      value: 'Updated Monitored service'
    })

    await waitFor(() => expect(queryByText('cv.monitoredServices.nameValidation')).toBeNull())
  })

  test('Check discard and save button', async () => {
    jest.spyOn(dbHook, 'useIndexedDBHook').mockReturnValue({
      dbInstance: {
        put: jest.fn(),
        get: jest.fn().mockReturnValue(undefined)
      } as any,
      isInitializingDB: false
    })
    const { container, getByText } = render(
      <TestWrapper {...testWrapperProps}>
        <MonitoredService />
      </TestWrapper>
    )

    expect(container.querySelector('.discardBtn')).toBeDefined()

    expect(getByText('save')).toBeDefined()

    expect(container.querySelector('.discardBtn')).toBeDisabled()

    await setFieldValue({
      container,
      type: InputTypes.TEXTFIELD,
      fieldId: 'serviceRef',
      value: 'Updated Monitored service'
    })

    expect(container.querySelector('input[value="Updated Monitored service"]')).toBeDefined()

    expect(getByText('unsavedChanges')).toBeDefined()

    expect(container.querySelector('.discardBtn')).not.toBeDisabled()
  })
})
