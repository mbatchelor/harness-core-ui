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

import { TestWrapper } from '@common/utils/testUtils'
import { FieldType } from '@pipeline/components/PipelineSteps/Steps/ServiceNowCreate/types'
import { mockTicketTypesResponse } from '@pipeline/components/PipelineSteps/Steps/ServiceNowApproval/__test__/ServiceNowApprovalTestHelper'
import { ServiceNowFieldsRenderer } from '@pipeline/components/PipelineSteps/Steps/ServiceNowCreate/ServiceNowFieldsRenderer'
import { factory, TestStepWidget } from '../../__tests__/StepTestUtil'
import { ServiceNowCreate } from '../ServiceNowCreate'
import {
  getServiceNowCreateDeploymentModeProps,
  getServiceNowCreateEditModeProps,
  getServiceNowCreateEditModePropsWithValues,
  getServiceNowCreateInputVariableModeProps,
  getServiceNowFieldRendererProps,
  mockConnectorResponse,
  mockServiceNowMetadataResponse
} from './ServiceNowCreateTestHelper'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/cd-ng', () => ({
  useGetConnector: () => mockConnectorResponse,
  useGetServiceNowTicketTypes: () => mockTicketTypesResponse,
  useGetServiceNowIssueMetadata: () => mockServiceNowMetadataResponse,
  useGetServiceNowTemplateMetadata: () => jest.fn()
}))

describe('ServiceNow Create tests', () => {
  beforeEach(() => {
    factory.registerStep(new ServiceNowCreate())
  })

  test('Basic snapshot - inputset mode', async () => {
    const props = getServiceNowCreateDeploymentModeProps()
    const { container, getByText, queryByText } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.ServiceNowCreate}
        stepViewType={StepViewType.InputSet}
        inputSetData={props.inputSetData}
      />
    )
    fireEvent.click(getByText('Submit'))
    await waitFor(() => queryByText('Errors'))
    expect(container).toMatchSnapshot('input set with errors')
  })

  test('Basic snapshot - deploymentform mode', async () => {
    const props = getServiceNowCreateDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.ServiceNowCreate}
        stepViewType={StepViewType.DeploymentForm}
        inputSetData={props.inputSetData}
      />
    )

    expect(container).toMatchSnapshot('serviceNow-create-deploymentform')
  })

  test('Deploymentform readonly mode', async () => {
    const props = getServiceNowCreateDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        template={props.inputSetData?.template}
        initialValues={props.initialValues}
        type={StepType.ServiceNowCreate}
        stepViewType={StepViewType.DeploymentForm}
        inputSetData={{ ...props.inputSetData, path: props.inputSetData?.path || '', readonly: true }}
      />
    )

    expect(container).toMatchSnapshot('serviceNow-create-deploymentform-readonly')
  })

  test('Basic snapshot - inputset mode but no runtime values', async () => {
    const props = getServiceNowCreateDeploymentModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowCreate}
        template={{ spec: {} }}
        stepViewType={StepViewType.InputSet}
        inputSetData={props.inputSetData}
      />
    )
    expect(container).toMatchSnapshot('serviceNow-create-inputset-noruntime')
  })

  test('Basic snapshot - input variable view', () => {
    const props = getServiceNowCreateInputVariableModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowCreate}
        template={{ spec: {} }}
        stepViewType={StepViewType.InputVariable}
        customStepProps={props.customStepProps}
      />
    )

    expect(container).toMatchSnapshot('serviceNow-create-input variable view')
  })

  test('Edit Stage - readonly view', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = getServiceNowCreateEditModeProps()
    const { container } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowCreate}
        stepViewType={StepViewType.Edit}
        ref={ref}
        readonly={true}
      />
    )
    expect(container).toMatchSnapshot('edit-stage-readonly')
  })

  test('Basic functions - edit stage view validations', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = getServiceNowCreateEditModeProps()
    const { container, queryByText, getByText } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowCreate}
        stepViewType={StepViewType.Edit}
        ref={ref}
      />
    )

    // Submit with empty form
    act(() => ref.current?.submitForm()!)
    await waitFor(() => expect(queryByText('pipelineSteps.stepNameRequired')).toBeTruthy())

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    fireEvent.change(queryByNameAttribute('name')!, { target: { value: 'serviceNow create step' } })

    act(() => {
      fireEvent.click(getByText('pipelineSteps.timeoutLabel'))
    })
    fireEvent.change(queryByNameAttribute('timeout')!, { target: { value: '' } })

    act(() => ref.current?.submitForm()!)
    await waitFor(() => expect(queryByText('validation.timeout10SecMinimum')).toBeTruthy())
    await waitFor(() => {
      expect(queryByText('pipeline.serviceNowApprovalStep.validations.ticketType')).toBeTruthy()
    })
    await waitFor(() => expect(queryByText('pipeline.serviceNowCreateStep.validations.description')).toBeTruthy())
  })

  test('Open a saved step - edit stage view', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const props = { ...getServiceNowCreateEditModePropsWithValues() }
    const {
      container,
      getByText,
      getByTestId,
      queryByPlaceholderText,
      getByPlaceholderText,
      queryByDisplayValue,
      queryByText
    } = render(
      <TestStepWidget
        initialValues={props.initialValues}
        type={StepType.ServiceNowCreate}
        stepViewType={StepViewType.Edit}
        ref={ref}
        onUpdate={props.onUpdate}
      />
    )

    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)
    fireEvent.change(queryByNameAttribute('name')!, { target: { value: 'serviceNow createe step' } })
    expect(queryByDisplayValue('1d')).toBeTruthy()

    // Check if fields are populated
    expect(queryByDisplayValue('value1')).toBeTruthy()
    expect(queryByDisplayValue('2233')).toBeTruthy()
    expect(queryByDisplayValue('23-march')).toBeTruthy()

    fireEvent.change(getByPlaceholderText('pipeline.serviceNowCreateStep.descriptionPlaceholder'), {
      target: { value: 'description' }
    })

    // Open the fields selector dialog
    act(() => {
      fireEvent.click(getByText('pipeline.jiraCreateStep.fieldSelectorAdd'))
    })

    await waitFor(() => expect(queryByText('pipeline.serviceNowCreateStep.selectFieldListHelp')).toBeTruthy())
    const dialogContainer = document.body.querySelector('.bp3-portal')

    // Click the new custom field
    fireEvent.click(getByText('f1'))

    // Add the field to serviceNow create form
    const button = dialogContainer?.querySelector('.bp3-button-text')
    fireEvent.click(button!)

    // The selected field should be now added to the main form
    expect(queryByPlaceholderText('f1')).toBeTruthy()

    // Open the fields selector dialog again
    act(() => {
      fireEvent.click(getByText('pipeline.jiraCreateStep.fieldSelectorAdd'))
    })
    // Click on provide field list option - to add KV pairs
    fireEvent.click(getByText('pipeline.jiraCreateStep.provideFieldList'))

    const dialogContainerPostUpdate = document.body.querySelector('.bp3-portal')
    act(() => {
      fireEvent.click(getByTestId('add-fieldList'))
    })
    // add the new KV pair inside the dialog container
    const keyDiv = dialogContainerPostUpdate?.querySelector('input[name="fieldList[0].name"]')
    fireEvent.change(keyDiv!, { target: { value: 'issueKey1' } })
    const valueDiv = dialogContainerPostUpdate?.querySelector('input[name="fieldList[0].value"]')
    fireEvent.change(valueDiv!, { target: { value: 'issueKey1Value' } })

    // Add the field to form
    const addButton = dialogContainerPostUpdate?.querySelector('button[type="submit"]')
    fireEvent.click(addButton!)

    // the new kv pair should now be visible in the main form
    expect(queryByDisplayValue('issueKey1')).toBeTruthy()
    expect(queryByDisplayValue('issueKey1Value')).toBeTruthy()
    await act(() => ref.current?.submitForm()!)
    expect(props.onUpdate).toBeCalledWith({
      identifier: 'serviceNow_createe_step',
      timeout: '1d',
      type: 'ServiceNowCreate',
      spec: {
        connectorRef: 'cid1',
        useServiceNowTemplate: false,
        ticketType: 'INCIDENT',
        delegateSelectors: undefined,
        fields: [
          { name: 'description', value: 'descriptionval' },
          { name: 'short_description', value: 'short description' },
          { name: 'f2', value: 2233 },
          { name: 'f1', value: '' },
          { name: 'f21', value: 'value1' },
          { name: 'date', value: '23-march' },
          { name: 'issueKey1', value: 'issueKey1Value' }
        ]
      },
      name: 'serviceNow createe step'
    })
  })

  test('ServiceNow Fields Renderer Test', () => {
    const props = getServiceNowFieldRendererProps()
    const { container } = render(
      <TestWrapper>
        <ServiceNowFieldsRenderer {...props}></ServiceNowFieldsRenderer>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('Minimum time cannot be less than 10s', () => {
    const response = new ServiceNowCreate().validateInputSet({
      data: {
        name: 'Test A',
        identifier: 'Test A',
        timeout: '1s',
        type: 'ServiceNowCreate',
        spec: {
          connectorRef: '',
          ticketType: '',
          description: '',
          shortDescription: '',
          fields: [],
          selectedFields: [],
          delegateSelectors: undefined,
          fieldType: FieldType.ConfigureFields,
          useServiceNowTemplate: false
        }
      },
      viewType: StepViewType.TriggerForm
    })
    expect(response).toMatchSnapshot('Value must be greater than or equal to "10s"')
  })
})
