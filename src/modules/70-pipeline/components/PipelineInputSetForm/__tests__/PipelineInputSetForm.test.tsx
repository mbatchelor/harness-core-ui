/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { Formik, RUNTIME_INPUT_VALUE, MultiTypeInputType } from '@harness/uicore'
import { InputTypes, setFieldValue } from '@common/utils/JestFormHelper'
import { findPopoverContainer, TestWrapper } from '@common/utils/testUtils'
import connector from '@connectors/pages/connectors/__tests__/mocks/get-connector-mock.json'
import type { AllNGVariables } from '@pipeline/utils/types'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import * as cdngServices from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import { accountPathProps, pipelineModuleParams, triggerPathProps } from '@common/utils/routeUtils'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'
import { clearRuntimeInput } from '@pipeline/utils/runPipelineUtils'
import { PipelineInputSetForm, PipelineInputSetFormProps } from '../PipelineInputSetForm'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('@common/utils/YamlUtils', () => ({}))

jest.mock('services/cd-ng', () => ({
  useGetOrganizationAggregateDTO: jest.fn().mockImplementation(() => {
    return { data: {} }
  }),
  useGetConnector: jest.fn().mockImplementation(() => {
    return { data: connector, refetch: jest.fn(), error: null, loading: false }
  })
}))

const getCommonProps = ({
  path
}: {
  path?: string
}): Pick<PipelineInputSetFormProps, 'path' | 'readonly' | 'viewType' | 'maybeContainerClass' | 'allowableTypes'> => ({
  path: path ?? '/dummypath',
  readonly: false,
  viewType: StepViewType.InputSet,
  maybeContainerClass: '',
  allowableTypes: [MultiTypeInputType.EXPRESSION, MultiTypeInputType.FIXED]
})

const getPropsForVariables = (): PipelineInputSetFormProps => ({
  originalPipeline: {
    name: 'TestPipeline',
    identifier: 'TestPipeline',
    variables: [
      {
        name: 'testvariable',
        type: 'String'
      }
    ] as AllNGVariables[],
    stages: []
  },
  template: {
    name: 'TestPipeline',
    identifier: 'TestPipeline',
    variables: [
      {
        name: 'testvariable',
        type: 'String',
        value: RUNTIME_INPUT_VALUE
      }
    ] as AllNGVariables[],
    stages: []
  },
  ...getCommonProps({ path: '' })
})

const getPropsForCIStage = ({
  connectorRefAsRuntime,
  repoNameAsRuntime,
  depthAsRuntime,
  sslVerifyAsRuntime,
  prCloneStrategyAsRuntime,
  limitMemoryAndLimitCPUAsRuntime,
  path
}: {
  connectorRefAsRuntime?: boolean
  repoNameAsRuntime?: boolean
  depthAsRuntime?: boolean
  sslVerifyAsRuntime?: boolean
  prCloneStrategyAsRuntime?: boolean
  limitMemoryAndLimitCPUAsRuntime?: boolean
  path?: string
}): PipelineInputSetFormProps => ({
  originalPipeline: {
    name: 'TestPipeline',
    identifier: 'TestPipeline',
    properties: {
      ci: {
        codebase: {
          connectorRef: connectorRefAsRuntime ? RUNTIME_INPUT_VALUE : 'testConnectorRef',
          repoName: repoNameAsRuntime ? RUNTIME_INPUT_VALUE : 'repo',
          build: RUNTIME_INPUT_VALUE as any,
          ...(depthAsRuntime ? { depth: RUNTIME_INPUT_VALUE as any } : {}),
          ...(sslVerifyAsRuntime ? { sslVerify: RUNTIME_INPUT_VALUE as any } : {}),
          ...(prCloneStrategyAsRuntime ? { prCloneStrategy: RUNTIME_INPUT_VALUE as any } : {}),
          ...(limitMemoryAndLimitCPUAsRuntime
            ? { resources: { limits: { memory: RUNTIME_INPUT_VALUE, cpu: RUNTIME_INPUT_VALUE } } }
            : {})
        }
      }
    },
    stages: [
      {
        stage: {
          name: 'Build',
          identifier: 'Build',
          type: 'CI',
          spec: {
            // eslint-disable-next-line
            // @ts-ignore
            cloneCodebase: true
          }
        }
      }
    ]
  },
  template: {
    name: 'TestPipeline',
    identifier: 'TestPipeline',
    properties: {
      ci: {
        codebase: {
          ...(connectorRefAsRuntime ? { connectorRef: RUNTIME_INPUT_VALUE } : {}),
          ...(repoNameAsRuntime ? { repoName: RUNTIME_INPUT_VALUE } : {}),
          build: RUNTIME_INPUT_VALUE as any,
          ...(depthAsRuntime ? { depth: RUNTIME_INPUT_VALUE } : {}),
          ...(sslVerifyAsRuntime ? { sslVerify: RUNTIME_INPUT_VALUE } : {}),
          ...(prCloneStrategyAsRuntime ? { prCloneStrategy: RUNTIME_INPUT_VALUE } : {}),
          ...(limitMemoryAndLimitCPUAsRuntime
            ? { resources: { limits: { memory: RUNTIME_INPUT_VALUE, cpu: RUNTIME_INPUT_VALUE } } }
            : {})
        } as any // codebase in template does not require connectorRef if connectorRef is not a runtime input
      }
    },
    stages: [],
    delegateSelectors: ['random']
  },
  selectedStageData: {
    selectedStages: [{ stageIdentifier: 'Build', stageName: 'Build', message: 'test', stagesRequired: [] }],
    selectedStageItems: [{ label: 'Build', value: 'Build' }],
    allStagesSelected: false
  },
  ...getCommonProps({ path })
})

const getPropsForCDStage = (
  withStageVariables = false,
  withStageSpec = false,
  withStagewhen = false
): PipelineInputSetFormProps => ({
  originalPipeline: {
    name: 'TestPipeline',
    identifier: 'TestPipeline',
    stages: [
      {
        stage: {
          type: 'Deploy',
          identifier: 'testCdStage1',
          name: 'testCdStage1',
          spec: withStageSpec
            ? {
                execution: {
                  steps: [
                    {
                      step: {
                        name: 'Step1',
                        identifier: 'Step1',
                        type: 'Rolling',
                        timeout: ''
                      }
                    }
                  ]
                }
              }
            : undefined,
          variables: withStageVariables
            ? ([
                {
                  name: 'testStageVariable',
                  type: 'String'
                }
              ] as AllNGVariables[])
            : undefined
        }
      },
      {
        parallel: [
          {
            stage: {
              type: 'Deploy',
              identifier: 'parallelStage1',
              name: 'parallelStage1'
            }
          },
          {
            stage: {
              type: 'Deploy',
              identifier: 'parallelStage2',
              name: 'parallelStage2'
            }
          }
        ]
      }
    ]
  },
  template: {
    name: 'TestPipeline',
    identifier: 'TestPipeline',
    delegateSelectors: ['random'],
    timeout: RUNTIME_INPUT_VALUE,
    stages: [
      {
        stage: {
          type: 'Deploy',
          identifier: 'testCdStage1',
          name: 'testCdStage1',
          spec: withStageSpec
            ? {
                execution: {
                  steps: [
                    {
                      step: {
                        name: 'Step1',
                        identifier: 'Step1',
                        type: 'Rolling',
                        timeout: RUNTIME_INPUT_VALUE
                      }
                    }
                  ]
                }
              }
            : undefined,
          variables: withStageVariables
            ? ([
                {
                  name: 'testStageVariable',
                  type: 'String',
                  value: RUNTIME_INPUT_VALUE
                }
              ] as AllNGVariables[])
            : undefined,
          when: withStagewhen
            ? {
                pipelineStatus: 'Success',
                condition: 'some condition'
              }
            : undefined
        }
      },
      //without identifier
      {
        stage: {
          type: 'Deploy',
          name: 'testCdStage1'
        }
      } as any,
      {
        stage: {
          type: 'Deploy',
          identifier: 'testCdStage1',
          name: 'testCdStage1',
          template: {
            templateInputs: {
              type: 'Deploy'
            }
          } as any
        }
      },
      {
        parallel: [
          {
            stage: {
              type: 'Deploy',
              identifier: 'parallelStage1',
              name: 'parallelStage1'
            }
          },
          {
            stage: {
              type: 'Deploy',
              identifier: 'parallelStage2',
              name: 'parallelStage2'
            }
          },
          //without identifier check
          {
            stage: {
              type: 'Deploy',
              name: 'testCdStage12'
            }
          }
        ]
      }
    ]
  },
  ...getCommonProps({ path: '' })
})

describe('PIPELINE VARIABLES', () => {
  test('Render variables in normal mode', () => {
    const props = getPropsForVariables()
    const { container } = render(
      <Formik
        initialValues={clearRuntimeInput(props.template)}
        formName="pipelineInputSetFormTest"
        onSubmit={jest.fn()}
      >
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} />
          </TestWrapper>
        )}
      </Formik>
    )

    // Check if variable is rendered
    const variableInput = container.querySelector('input[name="variables[0].value"]')
    expect(variableInput).toBeTruthy()
  })

  test('Render variables in READONLY mode', () => {
    const props = getPropsForVariables()
    const { container } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} readonly={true} />
          </TestWrapper>
        )}
      </Formik>
    )

    // Check for the disabled class
    const disabledBp3 = container.querySelector('.bp3-disabled')
    expect(disabledBp3).toBeTruthy()
  })
})
const TEST_PATH = routes.toTriggersWizardPage({ ...accountPathProps, ...triggerPathProps, ...pipelineModuleParams })

describe('CI enabled', () => {
  test('CI present in one of the stages', () => {
    const props = getPropsForCIStage({})
    const { container, getByText } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} />
          </TestWrapper>
        )}
      </Formik>
    )
    //type change - gitBranch
    fireEvent.click(getByText('gitBranch'))
    expect(getByText('common.branchName')).toBeTruthy()
    fireEvent.change(container.querySelector('input[name="/dummypath.properties.ci.codebase.build.spec.branch"]')!, {
      target: { value: 'main' }
    })
    // make it expression
    fireEvent.click(container.querySelector('[data-icon="fixed-input"]') as HTMLElement)
    let findPopover = findPopoverContainer()
    expect(findPopover).toBeTruthy()
    fireEvent.click(getByText('Expression'))

    //type change - gitBranch
    fireEvent.click(getByText('gitTag'))
    expect(getByText('common.tagName')).toBeTruthy()
    fireEvent.change(container.querySelector('input[name="/dummypath.properties.ci.codebase.build.spec.tag"]')!, {
      target: { value: 'main' }
    })
    // make it expression
    fireEvent.click(container.querySelector('[data-icon="fixed-input"]') as HTMLElement)
    findPopover = findPopoverContainer()
    expect(findPopover).toBeTruthy()
    fireEvent.click(getByText('Expression'))

    //type change - gitPR
    fireEvent.click(getByText('pipeline.gitPullRequest'))
    expect(getByText('pipeline.ciCodebase.pullRequestNumber')).toBeTruthy()
    fireEvent.change(container.querySelector('input[name="/dummypath.properties.ci.codebase.build.spec.number"]')!, {
      target: { value: 'main' }
    })
    // make it expression
    fireEvent.click(container.querySelector('[data-icon="fixed-input"]') as HTMLElement)
    findPopover = findPopoverContainer()
    expect(findPopover).toBeTruthy()
    fireEvent.click(getByText('Expression'))

    expect(container).toMatchSnapshot('CI codebase input set form')
  })

  test('CI present with triggers', async () => {
    connector.data.connector.type = 'Gitlab'
    jest.mock('services/cd-ng', () => ({
      useGetConnector: jest.fn().mockImplementation(() => {
        return { data: connector, refetch: jest.fn(), error: null, loading: false }
      })
    }))

    const props = getPropsForCIStage({})
    const { container, getByText } = render(
      <Formik
        initialValues={{ properties: { ci: { codebase: { connectorRef: 'account.test' } } } }}
        formName="pipelineInputSetFormTest"
        onSubmit={jest.fn()}
      >
        {() => (
          <TestWrapper
            // path params for giving triggerIdentifier
            path={TEST_PATH}
            pathParams={{
              accountId: 'testAcc',
              orgIdentifier: 'testOrg',
              projectIdentifier: 'test',
              pipelineIdentifier: 'pipeline',
              triggerIdentifier: 'triggerIdentifier',
              module: 'cd'
            }}
            defaultAppStoreValues={defaultAppStoreValues}
          >
            <PipelineInputSetForm {...props} />
          </TestWrapper>
        )}
      </Formik>
    )
    //type change - gitBranch
    fireEvent.click(getByText('gitBranch'))
    expect(getByText('common.branchName')).toBeTruthy()

    //type change - gitBranch
    fireEvent.click(getByText('gitTag'))
    expect(getByText('common.tagName')).toBeTruthy()

    //type change - gitPR
    fireEvent.click(getByText('pipeline.gitPullRequest'))
    expect(getByText('pipeline.ciCodebase.pullRequestNumber')).toBeTruthy()

    expect(container).toMatchSnapshot('CI codebase input set form with triggers')
  })
  test('CI READONLY mode', () => {
    const props = getPropsForCIStage({})
    const { container } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} readonly={true} />
          </TestWrapper>
        )}
      </Formik>
    )

    expect(container).toMatchSnapshot('CI stage readonly mode')
  })

  test('CI with ConnectorRef as runtime input', () => {
    // with connectoRef as runtime input, we will prompt for Git Branch, Git Tag, and Git Pull Request

    const props = getPropsForCIStage({ connectorRefAsRuntime: true })
    const { container } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} readonly={true} />
          </TestWrapper>
        )}
      </Formik>
    )
    expect(container).toMatchSnapshot('CI stage expects Connector and Repo Name')
  })

  test('Update repoName runtime input with values', async () => {
    connector.data.connector.type = 'Gitlab'
    jest.mock('services/cd-ng', () => ({
      useGetConnector: jest.fn().mockImplementation(() => {
        return { data: connector, refetch: jest.fn(), error: null, loading: false }
      })
    }))
    // with connectoRef as runtime input, we will prompt for Git Branch, Git Tag, and Git Pull Request
    const props = getPropsForCIStage({ connectorRefAsRuntime: true, repoNameAsRuntime: true, path: 'pipeline' })
    const { container } = render(
      <Formik
        initialValues={{ pipeline: { properties: { ci: { codebase: { connectorRef: 'account.gitlab' } } } } }}
        formName="pipelineInputSetFormTest"
        onSubmit={jest.fn()}
      >
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} readonly={true} />
          </TestWrapper>
        )}
      </Formik>
    )

    setFieldValue({
      container,
      type: InputTypes.TEXTFIELD,
      fieldId: 'pipeline.properties.ci.codebase.repoName',
      value: 'reponamevalue'
    })

    // since the connector is not an account type due to the dummy connector, we should not see the whole repo below
    // Need to refactor so that each test takes its own connector
    await waitFor(() => expect(container.querySelector('[class*="predefinedValue"')).toBeFalsy())
  })

  test('Render CI Codebase all runtime inputs', async () => {
    connector.data.connector.type = 'Gitlab'
    jest.mock('services/cd-ng', () => ({
      useGetConnector: jest.fn().mockImplementation(() => {
        return { data: connector, refetch: jest.fn(), error: null, loading: false }
      })
    }))
    // with connectoRef as runtime input, we will prompt for Git Branch, Git Tag, and Git Pull Request
    const props = getPropsForCIStage({
      connectorRefAsRuntime: true,
      repoNameAsRuntime: true,
      depthAsRuntime: true,
      sslVerifyAsRuntime: true,
      prCloneStrategyAsRuntime: true,
      limitMemoryAndLimitCPUAsRuntime: true,
      path: 'pipeline'
    })
    const { container } = render(
      <Formik
        initialValues={{ pipeline: { properties: { ci: { codebase: { connectorRef: 'account.gitlab' } } } } }}
        formName="pipelineInputSetFormTest"
        onSubmit={jest.fn()}
      >
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} readonly={true} />
          </TestWrapper>
        )}
      </Formik>
    )

    // since the connector is not an account type due to the dummy connector, we should not see the whole repo below
    // Need to refactor so that each test takes its own connector
    expect(container).toMatchSnapshot('all inputs as runtime inputs and prompts for values')
  })

  test('PR Number build radio option should not be visible for CodeCommit type connector', () => {
    connector.data.connector.type = 'Codecommit'
    jest.mock('services/cd-ng', () => ({
      useGetConnector: jest.fn().mockImplementation(() => {
        return { data: connector, refetch: jest.fn(), error: null, loading: false }
      })
    }))
    const props = getPropsForCIStage({})
    const { container } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} readonly={true} />
          </TestWrapper>
        )}
      </Formik>
    )

    expect(container).toMatchSnapshot(
      'PR Number build radio option should not be visible for CodeCommit type connector'
    )
  })

  test('CI loading mode', () => {
    jest.spyOn(cdngServices, 'useGetConnector').mockImplementation((): any => {
      return { data: {}, error: null, loading: true, refetch: jest.fn() }
    })
    const props = getPropsForCIStage({})
    const { container } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} />
          </TestWrapper>
        )}
      </Formik>
    )
    expect(container.querySelector('[data-icon="steps-spinner"]')).toBeTruthy()
  })
})

describe('CD enabled', () => {
  test('CD stage form', () => {
    const props = getPropsForCDStage()
    const { queryByText, queryAllByText } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} />
          </TestWrapper>
        )}
      </Formik>
    )

    expect(queryAllByText('Stage: testCdStage1')).toBeTruthy()
    expect(queryByText('Stage: parallelStage1')).toBeTruthy()
    expect(queryByText('Stage: parallelStage2')).toBeTruthy()
  })

  test('CD stage form READONLY mode', () => {
    const props = getPropsForCDStage()
    const { container } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} readonly={true} />
          </TestWrapper>
        )}
      </Formik>
    )

    expect(container).toMatchSnapshot('disabled CD stage')
  })

  test('CD stage with variables', () => {
    const props = getPropsForCDStage(true)
    const { container } = render(
      <Formik
        initialValues={clearRuntimeInput(props.template)}
        formName="pipelineInputSetFormTest"
        onSubmit={jest.fn()}
      >
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} readonly={true} isRetryFormStageSelected={true} />
          </TestWrapper>
        )}
      </Formik>
    )

    const stageVariableInput = container.querySelector('input[name="stages[0].stage.variables[0].value"]')
    expect(stageVariableInput).toBeTruthy()
  })

  test('CD stage with spec', () => {
    const props = getPropsForCDStage(false, true)
    const { queryByText } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} readonly={true} isRetryFormStageSelected={false} />
          </TestWrapper>
        )}
      </Formik>
    )
    expect(queryByText('executionText')).toBeTruthy()
  })

  test('CD stage with when', () => {
    const props = getPropsForCDStage(false, false, true)
    const { queryByText } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm
              {...props}
              readonly={true}
              isRetryFormStageSelected={false}
              listOfSelectedStages={['demo', 'demo2']}
            />
          </TestWrapper>
        )}
      </Formik>
    )
    expect(queryByText('advancedTitle')).toBeTruthy()
  })
  test('CD stage form with allValues', () => {
    const props = {
      originalPipeline: {
        name: 'TestPipeline',
        identifier: 'TestPipeline',
        stages: [
          {
            stage: {
              type: 'Deploy',
              identifier: 'testCdStage1',
              name: 'testCdStage1',
              template: {
                templateInputs: {
                  type: 'Deploy'
                }
              }
            }
          },
          {
            parallel: [
              {
                stage: {
                  type: 'Deploy',
                  identifier: 'parallelStage1',
                  name: 'parallelStage1'
                }
              }
            ]
          }
        ]
      },
      template: getPropsForCDStage().template,
      isRetryFormStageSelected: true,
      listOfSelectedStages: ['demo'],
      viewType: StepViewType.InputSet
    } as any
    const { getByText } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineContext.Provider
              value={
                {
                  state: { pipeline: { name: '', identifier: '' } } as any,
                  getStageFromPipeline: jest.fn((_stageId, pipeline) => ({
                    stage: pipeline.stages[0]
                  }))
                } as any
              }
            >
              <PipelineInputSetForm {...props} readonly={true} />
            </PipelineContext.Provider>
          </TestWrapper>
        )}
      </Formik>
    )
    expect(getByText('Stage: parallelStage1')).toBeTruthy()
  })
  test('isRunPipelineForm true', () => {
    const props = {
      originalPipeline: getPropsForCDStage().originalPipeline,
      template: {
        stages: [{}]
      },
      isRunPipelineForm: true,
      viewType: StepViewType.InputSet
    } as any
    const { container } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} readonly={true} />
          </TestWrapper>
        )}
      </Formik>
    )
    expect(container).toBeEnabled()
  })
  test('render no data', () => {
    const props = {
      originalPipeline: {},
      template: {},
      viewType: StepViewType.InputSet
    } as any
    const { container } = render(
      <Formik initialValues={{}} formName="pipelineInputSetFormTest" onSubmit={jest.fn()}>
        {() => (
          <TestWrapper>
            <PipelineInputSetForm {...props} />
          </TestWrapper>
        )}
      </Formik>
    )
    expect(container).toBeEnabled()
  })
})
