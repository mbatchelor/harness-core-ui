/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent, waitFor } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { StepViewType, StepFormikRef } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { findPopoverContainer, UseGetReturnData } from '@common/utils/testUtils'
import type { ResponseConnectorResponse } from 'services/cd-ng'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { RunStep } from '../RunStep'

jest.mock('@common/components/MonacoEditor/MonacoEditor')
jest.mock('@common/components/YAMLBuilder/YamlBuilder')

export const ConnectorResponse: UseGetReturnData<ResponseConnectorResponse> = {
  loading: false,
  refetch: jest.fn(),
  error: null,
  data: {
    status: 'SUCCESS',
    data: {
      connector: {
        name: 'connectorRef',
        identifier: 'connectorRef',
        description: '',
        tags: {},
        type: 'K8sCluster',
        spec: {
          credential: {
            type: 'ManualConfig',
            spec: {
              masterUrl: 'asd',
              auth: { type: 'UsernamePassword', spec: { username: 'asd', passwordRef: 'account.test1111' } }
            }
          }
        }
      },
      createdAt: 1602062958274,
      lastModifiedAt: 1602062958274
    },
    correlationId: 'e1841cfc-9ed5-4f7c-a87b-c9be1eeaae34'
  }
}

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn(() => ConnectorResponse)
}))

describe('Run Step', () => {
  beforeAll(() => {
    factory.registerStep(new RunStep())
  })

  describe('Edit View', () => {
    test('should render properly', async () => {
      const { container, getByText } = render(
        <TestStepWidget initialValues={{}} type={StepType.Run} stepViewType={StepViewType.Edit} />
      )
      expect(container).toMatchSnapshot()

      expect(getByText('pipelineSteps.connectorLabel')).toBeTruthy()
      expect(getByText('imageLabel')).toBeTruthy()
      act(() => {
        fireEvent.click(getByText('common.optionalConfig'))
      })
      expect(getByText('pipelineSteps.limitCPULabel')).toBeTruthy()
      expect(getByText('pipelineSteps.limitCPULabel')).toBeTruthy()
      expect(getByText('pipeline.stepCommonFields.runAsUser')).toBeTruthy()
      expect(getByText('pipeline.buildInfra.privileged (Common Optional Label)')).toBeTruthy()
      expect(getByText('common.shell')).toBeTruthy()
      const shellOptionsDropdownSelect = container.querySelector('[data-id="spec.shell-4"] [icon="chevron-down"]')!
      expect(shellOptionsDropdownSelect).toBeTruthy()
      await waitFor(() => {
        fireEvent.click(shellOptionsDropdownSelect)
        const menuItemLabels = findPopoverContainer()?.querySelectorAll('[class*="menuItemLabel"]')
        expect(menuItemLabels?.length).toEqual(4)
        expect(menuItemLabels?.[0].innerHTML).toEqual('common.bash')
        expect(menuItemLabels?.[3].innerHTML).toEqual('common.sh')
      })
    })

    test('renders runtime inputs', async () => {
      const initialValues = {
        identifier: 'My_Run_Step',
        name: 'My Run Step',
        description: RUNTIME_INPUT_VALUE,
        timeout: RUNTIME_INPUT_VALUE,
        spec: {
          connectorRef: RUNTIME_INPUT_VALUE,
          image: RUNTIME_INPUT_VALUE,
          command: RUNTIME_INPUT_VALUE,
          privileged: RUNTIME_INPUT_VALUE,
          reports: {
            type: 'JUnit',
            spec: {
              paths: RUNTIME_INPUT_VALUE
            }
          },
          envVariables: RUNTIME_INPUT_VALUE,
          outputVariables: RUNTIME_INPUT_VALUE,
          // TODO: Right now we do not support Image Pull Policy but will do in the future
          // pull: RUNTIME_INPUT_VALUE,
          resources: {
            limits: {
              cpu: RUNTIME_INPUT_VALUE,
              memory: RUNTIME_INPUT_VALUE
            }
          },
          shell: 'Sh'
        }
      }

      const onUpdate = jest.fn()
      const ref = React.createRef<StepFormikRef<unknown>>()
      const { container } = render(
        <TestStepWidget
          initialValues={initialValues}
          type={StepType.Run}
          stepViewType={StepViewType.Edit}
          onUpdate={onUpdate}
          ref={ref}
        />
      )

      expect(container).toMatchSnapshot()

      await act(() => ref.current?.submitForm()!)

      expect(onUpdate).toHaveBeenCalledWith(initialValues)
    })

    test('edit mode works', async () => {
      const initialValues = {
        identifier: 'My_Run_Step',
        name: 'My Run Step',
        description: 'Description',
        timeout: '10s',
        spec: {
          connectorRef: 'account.connectorRef',
          image: 'image',
          shell: 'Bash',
          command: 'command',
          privileged: false,
          reports: {
            type: 'JUnit',
            spec: {
              paths: ['path1.xml', 'path2.xml', 'path3.xml', 'path4.xml', 'path5.xml']
            }
          },
          envVariables: {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3'
          },
          outputVariables: [{ name: 'variable1' }, { name: 'variable2' }, { name: 'variable3' }, { name: 'variable4' }],
          // TODO: Right now we do not support Image Pull Policy but will do in the future
          // pull: 'always',
          resources: {
            limits: {
              memory: '128Mi',
              cpu: '0.2'
            }
          }
        }
      }

      const onUpdate = jest.fn()
      const ref = React.createRef<StepFormikRef<unknown>>()
      const { container } = render(
        <TestStepWidget
          initialValues={initialValues}
          type={StepType.Run}
          stepViewType={StepViewType.Edit}
          onUpdate={onUpdate}
          ref={ref}
        />
      )

      expect(container).toMatchSnapshot()

      await act(() => ref.current?.submitForm()!)

      expect(onUpdate).toHaveBeenCalledWith(initialValues)
    })
  })

  describe('InputSet View', () => {
    test('should render properly', () => {
      const { container } = render(
        <TestStepWidget initialValues={{}} type={StepType.Run} stepViewType={StepViewType.InputSet} />
      )

      expect(container).toMatchSnapshot()
    })

    test('should render all fields', async () => {
      const template = {
        type: StepType.Run,
        identifier: 'My_Run_Step',
        description: RUNTIME_INPUT_VALUE,
        timeout: RUNTIME_INPUT_VALUE,
        spec: {
          connectorRef: RUNTIME_INPUT_VALUE,
          image: RUNTIME_INPUT_VALUE,
          command: RUNTIME_INPUT_VALUE,
          privileged: RUNTIME_INPUT_VALUE,
          reports: {
            spec: {
              paths: RUNTIME_INPUT_VALUE
            }
          },
          envVariables: RUNTIME_INPUT_VALUE,
          outputVariables: RUNTIME_INPUT_VALUE,
          // TODO: Right now we do not support Image Pull Policy but will do in the future
          // pull: RUNTIME_INPUT_VALUE,
          resources: {
            limits: {
              cpu: RUNTIME_INPUT_VALUE,
              memory: RUNTIME_INPUT_VALUE
            }
          }
        }
      }

      const allValues = {
        type: StepType.Run,
        name: 'Test A',
        identifier: 'My_Run_Step',
        description: RUNTIME_INPUT_VALUE,
        timeout: RUNTIME_INPUT_VALUE,
        spec: {
          connectorRef: RUNTIME_INPUT_VALUE,
          image: RUNTIME_INPUT_VALUE,
          command: RUNTIME_INPUT_VALUE,
          privileged: RUNTIME_INPUT_VALUE,
          reports: {
            spec: {
              paths: RUNTIME_INPUT_VALUE
            }
          },
          envVariables: RUNTIME_INPUT_VALUE,
          outputVariables: RUNTIME_INPUT_VALUE,
          // TODO: Right now we do not support Image Pull Policy but will do in the future
          // pull: RUNTIME_INPUT_VALUE,
          resources: {
            limits: {
              cpu: RUNTIME_INPUT_VALUE,
              memory: RUNTIME_INPUT_VALUE
            }
          }
        }
      }

      const onUpdate = jest.fn()

      const { container } = render(
        <TestStepWidget
          initialValues={{}}
          type={StepType.Run}
          template={template}
          allValues={allValues}
          stepViewType={StepViewType.InputSet}
          onUpdate={onUpdate}
        />
      )

      expect(container).toMatchSnapshot()
    })

    test('should not render any fields', async () => {
      const template = {
        type: StepType.Run,
        identifier: 'My_Run_Step'
      }

      const allValues = {
        type: StepType.Run,
        identifier: 'My_Run_Step',
        name: 'My Run Step',
        description: 'Description',
        timeout: '10s',
        spec: {
          connectorRef: 'account.connectorRef',
          image: 'image',
          command: 'command',
          privileged: false,
          reports: {
            type: 'JUnit',
            spec: {
              paths: ['path1.xml', 'path2.xml', 'path3.xml', 'path4.xml', 'path5.xml']
            }
          },
          envVariables: {
            key1: 'value1',
            key2: 'value2',
            key3: 'value3'
          },
          outputVariables: [{ name: 'variable1' }, { name: 'variable2' }, { name: 'variable3' }, { name: 'variable4' }],
          // TODO: Right now we do not support Image Pull Policy but will do in the future
          // pull: 'always',
          resources: {
            limits: {
              memory: '128Mi',
              cpu: '0.2'
            }
          }
        }
      }

      const onUpdate = jest.fn()

      const { container } = render(
        <TestStepWidget
          initialValues={{}}
          type={StepType.Run}
          template={template}
          allValues={allValues}
          stepViewType={StepViewType.InputSet}
          onUpdate={onUpdate}
        />
      )

      expect(container).toMatchSnapshot()
    })
  })

  describe('InputVariable View', () => {
    test('should render properly', () => {
      const { container } = render(
        <TestStepWidget
          initialValues={{
            identifier: 'My_Run_Step',
            name: 'My Run Step',
            description: 'Description',
            timeout: '10s',
            spec: {
              connectorRef: 'account.connectorRef',
              image: 'image',
              command: 'command',
              privileged: false,
              reports: {
                type: 'JUnit',
                spec: {
                  paths: ['path1.xml', 'path2.xml', 'path3.xml', 'path4.xml', 'path5.xml']
                }
              },
              envVariables: {
                key1: 'value1',
                key2: 'value2',
                key3: 'value3'
              },
              outputVariables: [
                { name: 'variable1' },
                { name: 'variable2' },
                { name: 'variable3' },
                { name: 'variable4' }
              ],
              // TODO: Right now we do not support Image Pull Policy but will do in the future
              // pull: 'always',
              resources: {
                limits: {
                  memory: '128Mi',
                  cpu: '0.2'
                }
              }
            }
          }}
          customStepProps={{
            stageIdentifier: 'qaStage',
            metadataMap: {
              'step-name': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.run.name',
                  localName: 'step.run.name'
                }
              },
              'step-description': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.run.description',
                  localName: 'step.run.description'
                }
              },
              'step-timeout': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.run.timeout',
                  localName: 'step.run.timeout'
                }
              },
              'step-connectorRef': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.run.spec.connectorRef',
                  localName: 'step.run.spec.connectorRef'
                }
              },
              'step-image': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.run.spec.image',
                  localName: 'step.run.spec.image'
                }
              },
              'step-command': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.run.spec.command',
                  localName: 'step.run.spec.command'
                }
              },
              'step-privileged': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.run.spec.privileged',
                  localName: 'step.run.spec.privileged'
                }
              },
              'step-reportPaths': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.run.spec.reports.spec.paths',
                  localName: 'step.run.spec.reports.spec.paths'
                }
              },
              'step-envVariables': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.spec.run.envVariables',
                  localName: 'step.run.spec.envVariables'
                }
              },
              'step-outputVariables': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.run.spec.outputVariables',
                  localName: 'step.run.spec.outputVariables'
                }
              },
              // TODO: Right now we do not support Image Pull Policy but will do in the future
              // 'step-pull': {
              //   yamlProperties: {
              //     fqn: 'pipeline.stages.qaStage.execution.steps.run.spec.pull',
              //     localName: 'step.run.spec.pull'
              //   }
              // },
              'step-limitMemory': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.run.spec.resources.limits.memory',
                  localName: 'step.run.spec.resources.limits.memory'
                }
              },
              'step-limitCPU': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.run.spec.resources.limits.cpu',
                  localName: 'step.run.resources.spec.limits.cpu'
                }
              }
            },
            variablesData: {
              type: StepType.Run,
              identifier: 'run',
              name: 'step-name',
              description: 'step-description',
              timeout: 'step-timeout',
              spec: {
                connectorRef: 'step-connectorRef',
                image: 'step-image',
                command: 'step-command',
                privileged: 'step-privileged',
                reports: {
                  spec: {
                    paths: 'step-reportPaths'
                  }
                },
                envVariables: 'step-envVariables',
                outputVariables: 'step-outputVariables',
                // TODO: Right now we do not support Image Pull Policy but will do in the future
                // pull: 'step-pull',
                resources: {
                  limits: {
                    memory: 'step-limitMemory',
                    cpu: 'step-limitCPU'
                  }
                }
              }
            }
          }}
          type={StepType.Run}
          stepViewType={StepViewType.InputVariable}
        />
      )

      expect(container).toMatchSnapshot()
    })
  })
})
