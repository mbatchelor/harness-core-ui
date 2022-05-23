/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, act, queryByAttribute } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@harness/uicore'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import * as Portal from 'services/portal'
import * as cdServices from 'services/cd-ng'
import { DeleteStackTypes } from '../../CloudFormationInterfaces.types'
import { CFDeleteStack } from '../DeleteStack'

const regionMock = {
  resource: [
    {
      name: 'GovCloud (US-West)',
      value: 'us-gov-west-1'
    },
    {
      name: 'GovCloud (US-East)',
      value: 'us-gov-east-1'
    }
  ]
}
const rolesMock = {
  'arn:aws:iam::role/Test': 'TestRole',
  'arn:aws:iam::role/AnotherTest': 'AnotherTestRole'
}
jest.mock('@common/components/MonacoEditor/MonacoEditor')
jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('react-monaco-editor', () => ({ value, onChange, name }: any) => {
  return <textarea value={value} onChange={e => onChange(e.target.value)} name={name || 'spec.source.spec.script'} />
})

const renderComponent = (data: any, stepType = StepViewType.Edit) =>
  render(<TestStepWidget {...data} type={StepType.CloudFormationDeleteStack} stepViewType={stepType} />)

describe('Test Cloudformation delete stack', () => {
  beforeEach(() => {
    factory.registerStep(new CFDeleteStack())
    jest
      .spyOn(cdServices, 'useGetConnector')
      .mockImplementation(() => ({ loading: false, error: null, data: {} } as any))
    jest
      .spyOn(Portal, 'useListAwsRegions')
      .mockImplementation(() => ({ loading: false, error: null, data: regionMock, refetch: jest.fn() } as any))
  })

  test('should render edit view as new step', () => {
    const { container } = renderComponent({ initialValues: {} })
    expect(container).toMatchSnapshot()
  })

  test('should render delete stack view - inline', () => {
    const data = {
      initialValues: {
        type: StepType.CloudFormationDeleteStack,
        name: 'Test',
        identifier: 'Test',
        timeout: '10m',
        spec: {
          configuration: {
            type: DeleteStackTypes.Inline,
            spec: {
              connectorRef: RUNTIME_INPUT_VALUE,
              region: 'test region',
              roleArn: 'test role',
              stackName: 'test name',
              provisionerIdentifier: 'test_id'
            }
          }
        }
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should submit form for inline config', async () => {
    jest
      .spyOn(cdServices, 'useGetIamRolesForAws')
      .mockReturnValue({ loading: false, error: null, data: rolesMock, refetch: jest.fn() } as any)
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = {
      initialValues: {
        type: StepType.CloudFormationDeleteStack,
        name: 'Test',
        identifier: 'Test',
        timeout: '10m',
        spec: {
          configuration: {
            type: DeleteStackTypes.Inline,
            spec: {
              connectorRef: RUNTIME_INPUT_VALUE,
              region: 'test region',
              roleArn: 'test role',
              stackName: 'test name',
              provisionerIdentifier: 'test_id'
            }
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

  test('should error form for inline config', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = {
      initialValues: {
        type: StepType.CloudFormationDeleteStack,
        name: '',
        identifier: '',
        timeout: '',
        spec: {
          configuration: {
            type: DeleteStackTypes.Inline,
            spec: {
              connectorRef: '',
              region: '',
              roleArn: '',
              stackName: ''
            }
          }
        }
      },
      ref,
      onUpdate
    }
    const { container, getByText } = renderComponent(data)
    await act(() => ref.current?.submitForm()!)

    const nameError = getByText('pipelineSteps.stepNameRequired')
    expect(nameError).toBeInTheDocument()

    const timeoutError = getByText('validation.timeout10SecMinimum')
    expect(timeoutError).toBeInTheDocument()

    const regionError = getByText('cd.cloudFormation.errors.region')
    expect(regionError).toBeInTheDocument()

    const stackNameError = getByText('cd.cloudFormation.errors.stackName')
    expect(stackNameError).toBeInTheDocument()

    expect(container).toMatchSnapshot()
  })

  test('should be able to edit inline config', async () => {
    const data = {
      initialValues: {
        type: StepType.CloudFormationDeleteStack,
        name: 'Test',
        identifier: 'Test',
        timeout: '10m',
        spec: {
          configuration: {
            type: DeleteStackTypes.Inline,
            spec: {
              connectorRef: RUNTIME_INPUT_VALUE,
              region: 'test region',
              roleArn: 'test role',
              stackName: 'test name',
              provisionerIdentifier: 'test_id'
            }
          }
        }
      }
    }
    const { container } = renderComponent(data)

    const stepName = queryByAttribute('name', container, 'name')
    act(() => {
      userEvent.clear(stepName!)
      userEvent.type(stepName!, 'new name')
    })
    expect(stepName).toHaveDisplayValue('new name')

    const timeout = queryByAttribute('name', container, 'timeout')
    act(() => {
      userEvent.clear(timeout!)
      userEvent.type(timeout!, '20m')
    })
    expect(timeout).toHaveDisplayValue('20m')

    const stackName = queryByAttribute('name', container, 'spec.configuration.spec.stackName')
    act(() => {
      userEvent.clear(stackName!)
      userEvent.type(stackName!, 'new_name')
    })
    expect(stackName).toHaveDisplayValue('new_name')
    expect(container).toMatchSnapshot()
  })

  test('should render when inherit from create', async () => {
    const data = {
      initialValues: {
        type: StepType.CloudFormationDeleteStack,
        name: 'Test',
        identifier: 'Test',
        timeout: '10m',
        spec: {
          configuration: {
            type: DeleteStackTypes.Inherited,
            spec: {
              provisionerIdentifier: 'provID'
            }
          }
        }
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should submit form for inherited from create', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = {
      initialValues: {
        type: StepType.CloudFormationDeleteStack,
        name: 'Test',
        identifier: 'Test',
        timeout: '10m',
        spec: {
          configuration: {
            type: DeleteStackTypes.Inherited,
            spec: {
              provisionerIdentifier: 'provID'
            }
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

  test('should show error when inherited from create and id is empty', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = {
      initialValues: {
        type: StepType.CloudFormationDeleteStack,
        name: 'Test',
        identifier: 'Test',
        timeout: '10m',
        spec: {
          configuration: {
            type: DeleteStackTypes.Inherited,
            spec: {
              provisionerIdentifier: ''
            }
          }
        }
      },
      ref,
      onUpdate
    }
    const { container, getByText } = renderComponent(data)

    const provId = queryByAttribute('name', container, 'spec.configuration.spec.provisionerIdentifier')
    act(() => {
      userEvent.type(provId!, '')
    })
    expect(provId).toHaveDisplayValue('')

    await act(() => ref.current?.submitForm()!)
    const error = getByText('common.validation.provisionerIdentifierIsRequired')
    expect(error).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })

  test('should render all runtime inputs', async () => {
    const data = {
      initialValues: {
        type: StepType.CloudFormationDeleteStack,
        name: 'Test',
        identifier: 'Test',
        timeout: '10m',
        spec: {
          configuration: {
            type: DeleteStackTypes.Inherited,
            spec: {
              connectorRef: RUNTIME_INPUT_VALUE,
              region: RUNTIME_INPUT_VALUE,
              roleArn: RUNTIME_INPUT_VALUE,
              stackName: RUNTIME_INPUT_VALUE
            }
          }
        }
      }
    }
    const { container } = renderComponent(data)
    expect(container).toMatchSnapshot()
  })

  test('should render all runtime inputs and error on submit', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const onUpdate = jest.fn()
    const data = {
      initialValues: {
        type: StepType.CloudFormationDeleteStack,
        name: '',
        identifier: '',
        timeout: RUNTIME_INPUT_VALUE,
        spec: {
          configuration: {
            type: DeleteStackTypes.Inherited,
            spec: {
              connectorRef: RUNTIME_INPUT_VALUE,
              region: RUNTIME_INPUT_VALUE,
              roleArn: RUNTIME_INPUT_VALUE,
              stackName: RUNTIME_INPUT_VALUE
            }
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

  test('should render variable input step', () => {
    const data = {
      initialValues: {
        type: StepType.CloudFormationDeleteStack,
        name: 'test name',
        identifier: 'test_identifier',
        timeout: '10m',
        spec: {
          configuration: {
            type: DeleteStackTypes.Inline,
            spec: {
              provisionerIdentifier: RUNTIME_INPUT_VALUE,
              connectorRef: 'test',
              region: RUNTIME_INPUT_VALUE,
              roleArn: RUNTIME_INPUT_VALUE,
              stackName: RUNTIME_INPUT_VALUE
            }
          }
        }
      }
    }
    const { container } = renderComponent(data, StepViewType.InputSet)
    expect(container).toMatchSnapshot()
  })

  test('should render variable step', () => {
    const data = {
      initialValues: {
        type: StepType.CloudFormationDeleteStack,
        name: 'Test',
        identifier: 'Test',
        timeout: '10m',
        spec: {
          configuration: {
            type: 'test type',
            spec: {
              connectorRef: 'test ref',
              region: 'test region',
              roleArn: 'test role',
              stackName: 'test name',
              provisionerIdentifier: 'test_id'
            }
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
              roleArn: 'DatadogAWSIntegrationRole',
              stackName: 'stackName'
            }
          }
        },
        timeout: '10m'
      },
      stepType: StepType.CloudFormationDeleteStack
    }
    const { container } = renderComponent(data, StepViewType.InputVariable)
    expect(container).toMatchSnapshot()
  })
})
