/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent } from '@testing-library/react'
import { RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { StepViewType, StepFormikRef } from '@pipeline/components/AbstractSteps/Step'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { UseGetReturnData } from '@common/utils/testUtils'
import type { ResponseConnectorResponse } from 'services/cd-ng'
import { factory, TestStepWidget } from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import { ECRStep } from '../ECRStep'

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

describe('ECR Step', () => {
  beforeAll(() => {
    factory.registerStep(new ECRStep())
  })

  describe('Edit View', () => {
    test('should render properly', () => {
      const { container, getByText } = render(
        <TestStepWidget initialValues={{}} type={StepType.ECR} stepViewType={StepViewType.Edit} />
      )

      act(() => {
        fireEvent.click(getByText('common.optionalConfig'))
      })

      expect(getByText('ci.remoteCacheImage.label')).toBeTruthy()
      expect(container).toMatchSnapshot()
    })

    test('renders runtime inputs', async () => {
      const initialValues = {
        identifier: 'My_ECR_Step',
        name: 'My ECR Step',
        timeout: RUNTIME_INPUT_VALUE,
        spec: {
          connectorRef: RUNTIME_INPUT_VALUE,
          region: RUNTIME_INPUT_VALUE,
          account: RUNTIME_INPUT_VALUE,
          imageName: RUNTIME_INPUT_VALUE,
          tags: RUNTIME_INPUT_VALUE,
          baseImageConnectorRefs: RUNTIME_INPUT_VALUE,
          dockerfile: RUNTIME_INPUT_VALUE,
          context: RUNTIME_INPUT_VALUE,
          labels: RUNTIME_INPUT_VALUE,
          buildArgs: RUNTIME_INPUT_VALUE,
          optimize: RUNTIME_INPUT_VALUE,
          target: RUNTIME_INPUT_VALUE,
          remoteCacheImage: RUNTIME_INPUT_VALUE,
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
      const ref = React.createRef<StepFormikRef<unknown>>()
      const { container } = render(
        <TestStepWidget
          initialValues={initialValues}
          type={StepType.ECR}
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
        identifier: 'My_ECR_Step',
        name: 'My ECR Step',
        timeout: '10s',
        spec: {
          connectorRef: 'account.connectorRef',
          region: 'Region',
          account: 'Account',
          imageName: 'Image Name',
          tags: ['tag1', 'tag2', 'tag3'],
          baseImageConnectorRefs: ['prodConnectorRef'],
          dockerfile: 'Dockerfile',
          context: 'Context',
          labels: {
            label1: 'value1',
            label2: 'value2',
            label3: 'value3'
          },
          buildArgs: {
            buildArg1: 'value1',
            buildArg2: 'value2',
            buildArg3: 'value3'
          },
          optimize: true,
          target: 'Target',
          remoteCacheImage: 'myImage-cache',
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
          type={StepType.ECR}
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
        <TestStepWidget initialValues={{}} type={StepType.ECR} stepViewType={StepViewType.InputSet} />
      )

      expect(container).toMatchSnapshot()
    })

    test('should render all fields', async () => {
      const template = {
        type: StepType.ECR,
        identifier: 'My_ECR_Step',
        timeout: RUNTIME_INPUT_VALUE,
        spec: {
          connectorRef: RUNTIME_INPUT_VALUE,
          region: RUNTIME_INPUT_VALUE,
          account: RUNTIME_INPUT_VALUE,
          imageName: RUNTIME_INPUT_VALUE,
          tags: RUNTIME_INPUT_VALUE,
          baseImageConnectorRefs: RUNTIME_INPUT_VALUE,
          dockerfile: RUNTIME_INPUT_VALUE,
          context: RUNTIME_INPUT_VALUE,
          labels: RUNTIME_INPUT_VALUE,
          buildArgs: RUNTIME_INPUT_VALUE,
          optimize: RUNTIME_INPUT_VALUE,
          target: RUNTIME_INPUT_VALUE,
          remoteCacheImage: RUNTIME_INPUT_VALUE,
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
        type: StepType.ECR,
        name: 'Test A',
        identifier: 'My_ECR_Step',
        timeout: RUNTIME_INPUT_VALUE,
        spec: {
          connectorRef: RUNTIME_INPUT_VALUE,
          region: RUNTIME_INPUT_VALUE,
          account: RUNTIME_INPUT_VALUE,
          imageName: RUNTIME_INPUT_VALUE,
          tags: RUNTIME_INPUT_VALUE,
          baseImageConnectorRefs: RUNTIME_INPUT_VALUE,
          dockerfile: RUNTIME_INPUT_VALUE,
          context: RUNTIME_INPUT_VALUE,
          labels: RUNTIME_INPUT_VALUE,
          buildArgs: RUNTIME_INPUT_VALUE,
          optimize: RUNTIME_INPUT_VALUE,
          target: RUNTIME_INPUT_VALUE,
          remoteCacheImage: RUNTIME_INPUT_VALUE,
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
          type={StepType.ECR}
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
        type: StepType.ECR,
        identifier: 'My_ECR_Step'
      }

      const allValues = {
        type: StepType.ECR,
        identifier: 'My_ECR_Step',
        name: 'My ECR Step',
        timeout: '10s',
        spec: {
          connectorRef: 'account.connectorRef',
          region: 'Region',
          account: 'Account',
          imageName: 'Image Name',
          tags: ['tag1', 'tag2', 'tag3'],
          baseImageConnectorRefs: ['prodConnectorRef'],
          dockerfile: 'Dockerfile',
          context: 'Context',
          labels: {
            label1: 'value1',
            label2: 'value2',
            label3: 'value3'
          },
          buildArgs: {
            buildArg1: 'value1',
            buildArg2: 'value2',
            buildArg3: 'value3'
          },
          optimize: true,
          target: 'Target',
          remoteCacheImage: 'myImage-cache',
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
          type={StepType.ECR}
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
            identifier: 'Test_A',
            name: 'Test A',
            type: StepType.ECR,
            timeout: '10s',
            spec: {
              connectorRef: 'account.connectorRef',
              region: 'Region',
              account: 'Account',
              imageName: 'Image Name',
              tags: ['tag1', 'tag2', 'tag3'],
              baseImageConnectorRefs: ['prodConnectorRef'],
              dockerfile: 'Dockerfile',
              context: 'Context',
              labels: {
                label1: 'value1',
                label2: 'value2',
                label3: 'value3'
              },
              buildArgs: {
                buildArg1: 'value1',
                buildArg2: 'value2',
                buildArg3: 'value3'
              },
              optimize: true,
              target: 'Target',
              remoteCacheImage: 'myImage-cache',
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
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.name',
                  localName: 'step.ecr.name'
                }
              },
              'step-timeout': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.timeout',
                  localName: 'step.ecr.timeout'
                }
              },
              'step-connectorRef': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.connectorRef',
                  localName: 'step.ecr.spec.connectorRef'
                }
              },
              'step-region': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.region',
                  localName: 'step.ecr.spec.region'
                }
              },
              'step-account': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.account',
                  localName: 'step.ecr.spec.account'
                }
              },
              'step-imageName': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.imageName',
                  localName: 'step.ecr.spec.imageName'
                }
              },
              'step-tags': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.tags',
                  localName: 'step.ecr.spec.tags'
                }
              },
              'step-dockerfile': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.dockerfile',
                  localName: 'step.ecr.spec.dockerfile'
                }
              },
              'step-context': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.context',
                  localName: 'step.ecr.spec.context'
                }
              },
              'step-labels': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.labels',
                  localName: 'step.ecr.spec.labels'
                }
              },
              'step-buildArgs': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.buildArgs',
                  localName: 'step.ecr.spec.buildArgs'
                }
              },
              'step-optimize': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.optimize',
                  localName: 'step.ecr.spec.optimize'
                }
              },
              'step-target': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.target',
                  localName: 'step.ecr.spec.target'
                }
              },
              'step-remoteCacheImage': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.remoteCacheImage',
                  localName: 'step.ecr.spec.remoteCacheImage'
                }
              },
              // TODO: Right now we do not support Image Pull Policy but will do in the future
              // 'step-pull': {
              //   yamlProperties: {
              //     fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.pull',
              //     localName: 'step.ecr.spec.pull'
              //   }
              // },
              'step-limitMemory': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.resources.limits.memory',
                  localName: 'step.ecr.spec.resources.limits.memory'
                }
              },
              'step-limitCPU': {
                yamlProperties: {
                  fqn: 'pipeline.stages.qaStage.execution.steps.ecr.spec.resources.limits.cpu',
                  localName: 'step.ecr.resources.spec.limits.cpu'
                }
              }
            },
            variablesData: {
              type: StepType.ECR,
              identifier: 'ecr',
              name: 'step-name',
              timeout: 'step-timeout',
              spec: {
                connectorRef: 'step-connectorRef',
                region: 'step-region',
                account: 'step-account',
                imageName: 'step-imageName',
                tags: 'step-tags',
                dockerfile: 'step-dockerfile',
                context: 'step-context',
                labels: 'step-labels',
                buildArgs: 'step-buildArgs',
                optimize: 'step-optimize',
                target: 'step-target',
                remoteCacheImage: 'step-remoteCacheImage',
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
          type={StepType.ECR}
          stepViewType={StepViewType.InputVariable}
        />
      )

      expect(container).toMatchSnapshot()
    })
  })
})
