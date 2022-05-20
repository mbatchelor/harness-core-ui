/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, queryByAttribute } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { CFRollbackStack } from '../RollbackStack'

jest.mock('@common/components/MonacoEditor/MonacoEditor')
jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('react-monaco-editor', () => ({ value, onChange, name }: any) => {
  return <textarea value={value} onChange={e => onChange(e.target.value)} name={name || 'spec.source.spec.script'} />
})

const renderComponent = (data: any, stepType = StepViewType.Edit) =>
  render(<TestStepWidget {...data} type={StepType.CloudFormationRollbackStack} stepViewType={stepType} />)

describe('Test Cloudformation rollback stack', () => {
  beforeEach(() => {
    factory.registerStep(new CFRollbackStack())
  })

  test('should render edit view as new step', () => {
    const { container } = renderComponent({ initialValues: {} })
    expect(container).toMatchSnapshot()
  })

  test('should render rollback stack view', () => {
    const data = {
      initialValues: {
        type: StepType.CloudFormationRollbackStack,
        name: 'rollback',
        timeout: '10m',
        identifier: 'rollback',
        spec: {
          configuration: {
            provisionerIdentifier: 'test_id'
          }
        }
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should submit rollback form', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = {
      initialValues: {
        type: StepType.CloudFormationRollbackStack,
        name: 'rollback',
        timeout: '10m',
        identifier: 'rollback',
        spec: {
          configuration: {
            provisionerIdentifier: 'test_id'
          }
        }
      },
      ref,
      onUpdate
    }
    const { container } = renderComponent(data)
    await act(() => ref.current?.submitForm()!)

    expect(onUpdate).toHaveBeenCalled()
    expect(container).toMatchSnapshot()
  })

  test('should error on submit', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = {
      initialValues: {
        type: StepType.CloudFormationRollbackStack,
        name: 'rollback',
        timeout: '10m',
        identifier: 'rollback',
        spec: {
          configuration: {
            provisionerIdentifier: ''
          }
        }
      },
      ref,
      onUpdate
    }
    const { container, getByText } = renderComponent(data)
    await act(() => ref.current?.submitForm()!)

    const error = getByText('common.validation.provisionerIdentifierIsRequired')
    expect(error).toBeInTheDocument()

    expect(container).toMatchSnapshot()
  })

  test('should show runtime component', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = {
      initialValues: {
        type: StepType.CloudFormationRollbackStack,
        name: 'rollback',
        timeout: RUNTIME_INPUT_VALUE,
        identifier: 'rollback',
        spec: {
          configuration: {
            provisionerIdentifier: RUNTIME_INPUT_VALUE
          }
        }
      },
      ref,
      onUpdate
    }
    const { container } = renderComponent(data)
    await act(() => ref.current?.submitForm()!)

    expect(container).toMatchSnapshot()
  })

  test('should update field values', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = {
      initialValues: {
        type: StepType.CloudFormationRollbackStack,
        name: 'rollback',
        timeout: '',
        identifier: 'rollback',
        spec: {
          configuration: {
            provisionerIdentifier: ''
          }
        }
      },
      ref,
      onUpdate
    }
    const { container, getByPlaceholderText } = renderComponent(data)
    const timeout = getByPlaceholderText('Enter w/d/h/m/s/ms')
    userEvent.type(timeout, '10m')
    const provId = queryByAttribute('name', container, 'spec.configuration.provisionerIdentifier')
    userEvent.click(provId!)
    userEvent.type(provId!, 'testing')

    expect(container).toMatchSnapshot()
  })

  test('should render variable input step', () => {
    const data = {
      initialValues: {
        type: StepType.CloudFormationRollbackStack,
        name: 'rollback',
        timeout: '10m',
        identifier: 'rollback',
        spec: {
          configuration: {
            provisionerIdentifier: 'test_id'
          }
        }
      }
    }
    const { container } = renderComponent(data, StepViewType.InputSet)
    expect(container).toMatchSnapshot()
  })

  test('should render variable input step', () => {
    const data = {
      initialValues: {
        type: StepType.CloudFormationRollbackStack,
        name: 'rollback',
        timeout: '10m',
        identifier: 'rollback',
        spec: {
          configuration: {
            provisionerIdentifier: RUNTIME_INPUT_VALUE
          }
        }
      },
      stageIdentifier: 'qaStage',
      onUpdate: jest.fn(),
      metadataMap: {},
      variablesData: {
        type: 'DeleteStack',
        name: 'cleanup',
        identifier: 'cleanup',
        spec: {
          configuration: {
            type: 'Inline',
            spec: {
              connectorRef: 'demo_aws',
              region: 'us-gov-west-1',
              roleArn: 'TEST-ROLE',
              stackName: 'stackName'
            }
          }
        },
        timeout: '10m'
      },
      stepType: StepType.CloudFormationRollbackStack
    }
    const { container } = renderComponent(data, StepViewType.InputVariable)
    expect(container).toMatchSnapshot()
  })
})
