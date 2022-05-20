/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Container, Button } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { MonitoredServiceTemplate } from '@templates-library/components/Templates/MonitoredServiceTemplate/MonitoredServiceTemplate'
import { MonitoredTemplateCanvasWithRef } from '../MonitoredServiceTemplateCanvas'

import { getTemplateContextMock } from '../../__tests__/stateMock'

const stepTemplateContextMock = getTemplateContextMock(TemplateType.MonitoredService)

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

jest.mock('@cv/hooks/IndexedDBHook/IndexedDBHook', () => ({
  useIndexedDBHook: jest.fn().mockReturnValue({ isInitializingDB: false, dbInstance: { get: jest.fn() } }),
  CVObjectStoreNames: {}
}))

jest.mock('services/cv', () => ({
  useSaveMonitoredService: jest
    .fn()
    .mockImplementation(() => ({ loading: false, error: null, data: {}, refetch: jest.fn() })),
  useUpdateMonitoredService: jest
    .fn()
    .mockImplementation(() => ({ loading: false, error: null, data: {}, mutate: updateMonitoredService })),
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

describe('Test MonitoredTemplateCanvasWithRef', () => {
  test('should match snapshot for MonitoredTemplateCanvasWithRef', async () => {
    const { container } = render(
      <TestWrapper>
        <TemplateContext.Provider value={stepTemplateContextMock}>
          <MonitoredTemplateCanvasWithRef />
        </TemplateContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should validate props for MonitoredServiceTemplate', async () => {
    const monitoredServiceTemplate = new MonitoredServiceTemplate()
    expect(monitoredServiceTemplate).toEqual({
      color: 'teal700',
      defaultValues: {
        identifier: 'Template_name',
        name: 'Template name',
        type: 'MonitoredService',
        versionLabel: ''
      },
      name: 'Monitored Service Template',
      type: 'MonitoredService'
    })
  })
})
