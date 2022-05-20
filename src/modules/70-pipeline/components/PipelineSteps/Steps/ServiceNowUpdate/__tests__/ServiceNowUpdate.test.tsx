/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, queryByAttribute, render, waitFor } from '@testing-library/react'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { mockServiceNowMetadataResponse } from '@pipeline/components/PipelineSteps/Steps/ServiceNowCreate/__tests__/ServiceNowCreateTestHelper'
import { mockTicketTypesResponse } from '@pipeline/components/PipelineSteps/Steps/ServiceNowApproval/__test__/ServiceNowApprovalTestHelper'
import { FieldType } from '@pipeline/components/PipelineSteps/Steps/ServiceNowCreate/types'
import {
  getServiceNowUpdateDeploymentModeProps,
  getServiceNowUpdateEditModeProps,
  getServiceNowUpdateInputVariableModeProps,
  mockConnectorResponse
} from './ServiceNowUpdateTestHelper'
import type { ServiceNowUpdateData } from '../types'
import { processFormData } from '../helper'
import { ServiceNowUpdate } from '../ServiceNowUpdate'
import { factory, TestStepWidget } from '../../__tests__/StepTestUtil'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/cd-ng', () => ({
  useGetConnector: () => mockConnectorResponse,
  useGetServiceNowTicketTypes: () => mockTicketTypesResponse,
  useGetServiceNowIssueMetadata: () => mockServiceNowMetadataResponse,
  useGetServiceNowTemplateMetadata: () => jest.fn()
}))

describe('ServiceNow Update tests', () => {
  beforeEach(() => {
    factory.registerStep(new ServiceNowUpdate())
  })

  test('Basic snapshot - inputset mode', async () => {
    const props = getServiceNowUpdateDeploymentModeProps()
    const { container, getByText, queryByText } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.InputSet}
        inputSetData={props.inputSetData}
      />
    )
    fireEvent.click(getByText('Submit'))
    await waitFor(() => queryByText('Errors'))
    expect(container).toMatchSnapshot('input set with errors')
  })

  test('Basic snapshot - deploymentform mode', async () => {
    const props = getServiceNowUpdateDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.DeploymentForm}
        inputSetData={props.inputSetData}
      />
    )

    expect(container).toMatchSnapshot('serviceNow-update-deploymentform')
  })

  test('deploymentform readonly mode', async () => {
    const props = getServiceNowUpdateDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.DeploymentForm}
        inputSetData={{ ...props.inputSetData, path: props.inputSetData?.path || '', readonly: true }}
      />
    )

    expect(container).toMatchSnapshot('serviceNow-update-deploymentform-readonly')
  })

  test('Basic snapshot - inputset mode but no runtime values', async () => {
    const props = getServiceNowUpdateDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        template={{ spec: { transitionTo: {} } }}
        stepViewType={StepViewType.InputSet}
        inputSetData={props.inputSetData}
      />
    )
    expect(container).toMatchSnapshot('serviceNow-update-inputset-noruntime')
  })

  test('Basic snapshot - input variable view', () => {
    const props = getServiceNowUpdateInputVariableModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        template={{ spec: {} }}
        stepViewType={StepViewType.InputVariable}
        customStepProps={props.customStepProps}
      />
    )

    expect(container).toMatchSnapshot('serviceNow-update-input variable view')
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test('Basic functions - edit stage view validations', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = getServiceNowUpdateEditModeProps()
    const { container, queryByText, getByText } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.Edit}
        ref={ref}
      />
    )

    // Submit with empty form
    act(() => ref.current?.submitForm()!)
    await waitFor(() => expect(queryByText('pipelineSteps.stepNameRequired')).toBeTruthy())

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    fireEvent.change(queryByNameAttribute('name')!, { target: { value: 'serviceNow update step' } })

    act(() => {
      fireEvent.click(getByText('pipelineSteps.timeoutLabel'))
    })
    fireEvent.change(queryByNameAttribute('timeout')!, { target: { value: '' } })

    act(() => ref.current?.submitForm()!)
    await waitFor(() => expect(queryByText('validation.timeout10SecMinimum')).toBeTruthy())
    await waitFor(() => expect(queryByText('pipeline.serviceNowApprovalStep.validations.ticketType')).toBeTruthy())
  })

  test('Edit stage - readony view', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = getServiceNowUpdateEditModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowUpdate}
        stepViewType={StepViewType.Edit}
        ref={ref}
        readonly={true}
      />
    )

    expect(container).toMatchSnapshot('editstage-readonly')
  })

  test('Minimum time cannot be less than 10s', () => {
    const response = new ServiceNowUpdate().validateInputSet({
      data: {
        name: 'Test A',
        identifier: 'Test A',
        timeout: '1s',
        type: 'ServiceNowUpdate',
        spec: {
          connectorRef: '',
          ticketType: '',
          fields: [],
          ticketNumber: '',
          fieldType: FieldType.ConfigureFields,
          useServiceNowTemplate: false
        }
      },
      template: {
        name: 'Test A',
        identifier: 'Test A',
        timeout: '<+input>',
        type: 'ServiceNowUpdate',
        spec: {
          connectorRef: '',
          ticketType: '',
          fields: [],
          ticketNumber: '',
          fieldType: FieldType.ConfigureFields,
          useServiceNowTemplate: false
        }
      },
      viewType: StepViewType.TriggerForm
    })
    expect(response).toMatchSnapshot('Value must be greater than or equal to "10s"')
  })
})

describe('ServiceNow Update process form data tests', () => {
  test('if duplicate fields are not sent', () => {
    const formValues: ServiceNowUpdateData = {
      name: 'serviceNowUpdate',
      identifier: 'jup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: 'conn',
        fieldType: FieldType.ConfigureFields,
        useServiceNowTemplate: false,
        ticketType: 'INCIDENT',
        ticketNumber: '123',
        description: 'description',
        shortDescription: 'short description',
        fields: [
          {
            name: 'f1',
            value: 'v1'
          },
          {
            name: 'f2',
            value: { label: 'vb2', value: 'vb2' }
          }
        ],
        selectedFields: [
          {
            name: 'f2',
            value: { label: 'vb2', value: 'vb2' },
            key: 'f2',
            allowedValues: [],
            schema: {
              typeStr: '',
              type: 'string'
            }
          },
          {
            name: 'f3',
            value: [
              { label: 'v3', value: 'v3' },
              { label: 'v32', value: 'v32' }
            ],
            key: 'f3',
            allowedValues: [],
            schema: {
              typeStr: '',
              type: 'string'
            }
          }
        ]
      }
    }

    const returned = processFormData(formValues)
    expect(returned).toStrictEqual({
      name: 'serviceNowUpdate',
      identifier: 'jup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: 'conn',
        delegateSelectors: undefined,
        ticketType: 'INCIDENT',
        ticketNumber: '123',
        useServiceNowTemplate: false,
        fields: [
          {
            name: 'description',
            value: 'description'
          },
          {
            name: 'short_description',
            value: 'short description'
          },
          {
            name: 'f2',
            value: 'vb2'
          },
          {
            name: 'f3',
            value: 'v3,v32'
          },
          {
            name: 'f1',
            value: 'v1'
          }
        ]
      }
    })
  })

  test('if runtime values work', () => {
    const formValues: ServiceNowUpdateData = {
      name: 'serviceNowUpdate',
      identifier: 'jup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: '<+input>',
        delegateSelectors: undefined,
        ticketNumber: '<+input>',
        ticketType: 'INCIDENT',
        fieldType: FieldType.ConfigureFields,
        useServiceNowTemplate: false,
        fields: [
          {
            name: 'f1',
            value: '<+a.b>'
          }
        ],
        selectedFields: [
          {
            name: 'f2',
            value: '<+x.y>',
            key: 'f2',
            allowedValues: [],
            schema: {
              typeStr: '',
              type: 'string'
            }
          }
        ]
      }
    }

    const returned = processFormData(formValues)
    expect(returned).toStrictEqual({
      name: 'serviceNowUpdate',
      identifier: 'jup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: '<+input>',
        delegateSelectors: undefined,
        ticketNumber: '<+input>',
        useServiceNowTemplate: false,
        ticketType: 'INCIDENT',
        fields: [
          {
            name: 'description',
            value: ''
          },
          {
            name: 'short_description',
            value: ''
          },
          {
            name: 'f2',
            value: '<+x.y>'
          },
          {
            name: 'f1',
            value: '<+a.b>'
          }
        ]
      }
    })
  })

  test('when useServiceNowTemplate is true', () => {
    const formValues: ServiceNowUpdateData = {
      name: 'serviceNowUpdate',
      identifier: 'snup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: '<+input>',
        delegateSelectors: undefined,
        ticketNumber: '<+input>',
        ticketType: 'INCIDENT',
        fieldType: FieldType.CreateFromTemplate,
        useServiceNowTemplate: true,
        fields: [],
        selectedFields: [],
        templateName: 'snowUpdateTemplate'
      }
    }

    const returned = processFormData(formValues)
    expect(returned).toStrictEqual({
      name: 'serviceNowUpdate',
      identifier: 'snup',
      timeout: '10m',
      type: 'ServiceNowUpdate',
      spec: {
        connectorRef: '<+input>',
        delegateSelectors: undefined,
        ticketNumber: '<+input>',
        useServiceNowTemplate: true,
        ticketType: 'INCIDENT',
        templateName: 'snowUpdateTemplate',
        fields: []
      }
    })
  })
})
