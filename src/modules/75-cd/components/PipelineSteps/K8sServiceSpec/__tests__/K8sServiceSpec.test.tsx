/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, findByText, waitFor, getAllByText, findAllByText } from '@testing-library/react'

import { act } from 'react-test-renderer'
import { MultiTypeInputType } from '@wings-software/uicore'
import { TestWrapper, UseGetReturnData } from '@common/utils/testUtils'
import { AbstractStepFactory } from '@pipeline/components/AbstractSteps/AbstractStepFactory'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { ResponseConnectorResponse } from 'services/cd-ng'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { KubernetesServiceSpec } from '../K8sServiceSpec'
import PipelineMock from './mock.json'
import TemplateMock from './template.mock.json'
import connectorListJSON from './connectorList.json'
import secretMockdata from './secretMockdata.json'
import { PipelineResponse } from './pipelineMock'
import type { K8SDirectServiceStep } from '../K8sServiceSpecInterface'
import { getParams, getYaml, mockBuildList, mockManifestConnector } from './mocks'

const fetchConnectors = (): Promise<unknown> => Promise.resolve({})
jest.mock('@common/components/YAMLBuilder/YamlBuilder')
const mockProps = {
  initialValues: {
    artifacts: {
      metadata: 'artifactmetadata',
      primary: {
        type: 'DockerRegistry' as any,
        spec: {
          connectorRef: 'A',
          tag: 'B',
          imagePath: 'C',
          registryHostname: 'D',
          region: 'E',
          tagRegex: 'F'
        }
      },
      sidecars: [
        {
          sidecar: {
            identifier: 'SidecarECR',
            type: 'Ecr' as any,
            spec: {
              imagePath: '',
              tag: '',
              region: ''
            }
          }
        },
        {
          sidecar: {
            identifier: 'FLSDJF',
            type: 'Ecr' as any,
            spec: {
              connectorRef: '',
              imagePath: '',
              tag: '',
              region: ''
            }
          }
        }
      ]
    },
    manifests: [
      {
        manifest: {
          identifier: 'K8sManifest',
          type: 'K8sManifest' as any,
          spec: {
            store: {
              type: 'K8sManifest',
              spec: {
                connectorRef: '<+input>'
              }
            },
            chartName: '<+input>',
            chartVersion: '<+input>',
            skipResourceVersioning: '<+input>'
          }
        }
      },
      {
        manifest: {
          identifier: 'K8sManifest',
          type: 'K8sManifest' as any,
          spec: {
            store: {
              type: 'Git',
              spec: {
                connectorRef: '<+input>',
                folderPath: '<+input>',
                repoName: '<+input>',
                branch: '<+input>'
              }
            }
          }
        }
      }
    ],
    variables: [
      {
        type: 'String' as any,
        description: 'k8sVariable'
      }
    ]
  },
  customStepProps: {
    stageIdentifier: 'qaStage',
    metadataMap: {
      'step-name': {
        yamlProperties: {
          fqn: 'pipeline.stages.qaStage.execution.steps.K8sDelete.name',
          localName: 'step.K8sDelete.name'
        }
      }
    },
    variablesData: {
      manifests: [
        {
          manifest: {
            identifier: 'K8sManifest',
            type: 'K8sManifest',
            spec: {
              store: {
                type: 'K8sManifest',
                spec: {
                  connectorRef: '<+input>'
                }
              },
              chartName: '<+input>',
              chartVersion: '<+input>',
              skipResourceVersioning: '<+input>'
            }
          }
        },
        {
          manifest: {
            identifier: 'K8sManifest',
            type: 'K8sManifest',
            spec: {
              store: {
                type: 'Git',
                spec: {
                  connectorRef: '<+input>',
                  folderPath: '<+input>',
                  repoName: '<+input>',
                  branch: '<+input>'
                }
              }
            }
          }
        }
      ],
      artifacts: {
        metadata: 'artifactmetadata',
        primary: {
          type: 'Gcr',
          spec: {
            connectorRef: 'A',
            tag: 'B',
            imagePath: 'C',
            registryHostname: 'D',
            region: 'E',
            tagRegex: 'F'
          }
        },
        sidecars: [
          {
            sidecar: {
              identifier: 'Sidecar ECR',
              type: 'Ecr',
              spec: {
                imagePath: '',
                tag: '',
                region: ''
              }
            }
          },
          {
            sidecar: {
              identifier: 'FLSDJF',
              type: 'Ecr',
              spec: {
                connectorRef: '',
                imagePath: '',
                tag: '',
                region: ''
              }
            }
          }
        ]
      },
      variables: [
        {
          type: 'String',
          description: 'k8sVariable'
        }
      ]
    }
  },
  template: {
    artifacts: {
      sidecars: [
        {
          sidecar: {
            identifier: 'Sidecar',
            type: 'Ecr' as any,
            spec: {
              imagePath: '<+input>',
              tag: '<+input>',
              region: '<+input>'
            }
          }
        },
        {
          sidecar: {
            identifier: 'FLSDJF',
            type: 'DockerRegistry' as any,
            spec: {
              connectorRef: '<+input>',
              imagePath: '<+input>',
              tag: '<+input>',
              region: '<+input>'
            }
          }
        }
      ],
      primary: {
        type: 'Gcr' as any,
        spec: {
          connectorRef: '<+input>',
          imagePath: '<+input>',
          tag: '<+input>',
          registryHostname: '<+input>'
        }
      }
    },
    manifests: [
      {
        manifest: {
          identifier: 'K8sManifest',
          type: 'K8sManifest' as any,
          spec: {
            store: {
              type: 'K8sManifest',
              spec: {
                connectorRef: '<+input>'
              }
            }
          }
        }
      },
      {
        manifest: {
          identifier: 'K8sManifest',
          type: 'K8sManifest' as any,
          spec: {
            store: {
              type: 'Git',
              spec: {
                connectorRef: '<+input>',
                folderPath: '<+input>',
                repoName: '<+input>',
                branch: '<+input>'
              }
            }
          }
        }
      }
    ],
    variables: [
      {
        type: 'String' as any,
        description: 'k8sVariable'
      },
      {
        type: 'String' as any,
        description: 'k8sInput'
      }
    ]
  }
}

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
  useGetConnectorListV2: jest.fn().mockImplementation(() => ({ mutate: fetchConnectors })),
  getConnectorListPromise: () => Promise.resolve(connectorListJSON),
  getConnectorListV2Promise: () => Promise.resolve(mockManifestConnector),
  getBuildDetailsForDockerPromise: () => Promise.resolve(mockBuildList),
  getBuildDetailsForGcrPromise: () => Promise.resolve(mockBuildList),
  getBuildDetailsForEcrPromise: () => Promise.resolve(mockBuildList),
  useGetConnector: jest.fn(() => ConnectorResponse),
  useCreateConnector: jest.fn(() =>
    Promise.resolve({
      status: 'SUCCESS',
      data: {
        connector: {
          name: 'artifact',
          identifier: 'artifact',
          description: '',
          orgIdentifier: 'default',
          projectIdentifier: 'dummy',
          tags: [],
          type: 'DockerRegistry',
          spec: {
            dockerRegistryUrl: 'https;//hub.docker.com',
            auth: {
              type: 'UsernamePassword',
              spec: { username: 'testpass', passwordRef: 'account.testpass' }
            }
          }
        },
        createdAt: 1607289652713,
        lastModifiedAt: 1607289652713,
        status: null
      },
      metaData: null,
      correlationId: '0d20f7b7-6f3f-41c2-bd10-4c896bfd76fd'
    })
  ),
  useUpdateConnector: jest.fn(() =>
    Promise.resolve({
      status: 'SUCCESS',
      data: {
        connector: {
          name: 'artifact',
          identifier: 'artifact',
          description: '',
          orgIdentifier: 'default',
          projectIdentifier: 'dummy',
          tags: [],
          type: 'DockerRegistry',
          spec: {
            dockerRegistryUrl: 'https;//hub.docker.com',
            auth: {
              type: 'UsernamePassword',
              spec: { username: 'testpass', passwordRef: 'account.testpass' }
            }
          }
        },
        createdAt: 1607289652713,
        lastModifiedAt: 1607289652713,
        status: null
      },
      metaData: null,
      correlationId: '0d20f7b7-6f3f-41c2-bd10-4c896bfd76fd'
    })
  ),
  validateTheIdentifierIsUniquePromise: jest.fn(() =>
    Promise.resolve({
      status: 'SUCCESS',
      data: true,
      metaData: null
    })
  ),
  listSecretsV2Promise: jest.fn().mockImplementation(() => Promise.resolve(secretMockdata)),
  usePutSecret: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePostSecret: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePostSecretFileV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePutSecretFileV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetConnectorList: jest.fn(() => []),
  useGetTestConnectionResult: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetBuildDetailsForGcr: jest.fn().mockImplementation(() => {
    return { data: { data: { buildDetailsList: [] } }, refetch: jest.fn(), error: null }
  }),
  useGetBuildDetailsForDocker: jest.fn().mockImplementation(() => {
    return { data: { data: { buildDetailsList: [] } }, refetch: jest.fn(), error: null }
  })
}))
jest.mock('services/pipeline-ng', () => ({
  useGetPipeline: jest.fn(() => PipelineResponse)
}))
jest.mock('@common/hooks', () => ({
  ...(jest.requireActual('@common/hooks') as any),
  useMutateAsGet: jest.fn().mockImplementation(() => {
    return { data: {}, refetch: jest.fn(), error: null, loading: false }
  })
}))

jest.mock('services/portal', () => ({
  useListAwsRegions: jest.fn().mockImplementation(() => {
    return { data: {} }
  })
}))

const PipelineContextValue = {
  state: PipelineMock.state,
  stepsFactory: PipelineMock.stepsFactory,
  stagesMap: PipelineMock.stagesMap
}
const serviceTabInitialValues = { stageIndex: 0, setupModeType: 'DIFFRENT' }
class StepFactory extends AbstractStepFactory {
  protected type = 'test-factory'
}

const factory = new StepFactory()
factory.registerStep(new KubernetesServiceSpec())

describe('StepWidget tests', () => {
  test(`renders ServiceStep for Service Tab `, () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={serviceTabInitialValues}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.Edit}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`shows deployment type tabs`, async () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={serviceTabInitialValues}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.Edit}
        />
      </TestWrapper>
    )
    const variables = await findByText(container, 'common.variables')
    expect(variables).toBeDefined()
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip(`shows add manifests modal`, async () => {
    render(
      <TestWrapper
        path="account/:accountId/cd/pipeline-studio/orgs/:orgIdentifier/projects/:projectIdentifier/pipelines/P1/ui/"
        pathParams={{
          identifier: 'dummy',
          accountId: 'dummy',
          orgIdentifier: 'dummy',
          projectIdentifier: 'dummy'
        }}
      >
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={serviceTabInitialValues}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.Edit}
        />
      </TestWrapper>
    )
    //create manifests
    const addManifestButton = await findByText(document.body, '+ Add Manifest/Config File')
    expect(addManifestButton).toBeDefined()
    fireEvent.click(addManifestButton)
    const portal = document.getElementsByClassName('bp3-dialog')[0]
    const k8sButton = await waitFor(() => findByText(portal as HTMLElement, 'K8s Manifest'))
    expect(portal).toMatchSnapshot('Create Manifest modal')
    expect(k8sButton).toBeDefined()
    fireEvent.click(k8sButton)
    await waitFor(() => findByText(portal as HTMLElement, 'GIT Server'))
    const serverInput = await findByText(portal as HTMLElement, 'connectorRef')
    fireEvent.click(serverInput)
    await waitFor(() => findByText(document.body, 'Account'))

    const firstAccount = getAllByText(document.body, 'dockerAleks')[0]
    expect(firstAccount).toBeDefined()
    fireEvent.click(firstAccount)
    expect(portal).toMatchSnapshot('Git Server Step')
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip(`shows add artifact modal`, async () => {
    const { container } = render(
      <TestWrapper
        path="account/:accountId/cd/pipeline-studio/orgs/:orgIdentifier/projects/:projectIdentifier/pipelines/P1/ui/"
        pathParams={{
          identifier: 'dummy',
          accountId: 'dummy',
          orgIdentifier: 'dummy',
          projectIdentifier: 'dummy'
        }}
      >
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={serviceTabInitialValues}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.Edit}
        />
      </TestWrapper>
    )
    //create primary artifact
    const addArtifactButton = await findByText(container, '+ Add Primary Artifact')
    fireEvent.click(addArtifactButton)
    const dockerButton = await findByText(document.body, 'Docker')
    expect(dockerButton).toBeDefined()
    fireEvent.click(dockerButton)
    await waitFor(() => expect(document.querySelector("label[for='connectorId']")).toBeDefined())

    const connectButton = await findByText(document.body, 'connectorRef')
    expect(connectButton).toBeDefined()
    fireEvent.click(connectButton)

    //create new Artifact Server
    const createArtifactButton = await findByText(document.body, 'New Artifact Server')
    fireEvent.click(createArtifactButton)

    const createArtifactModalTitle = await findAllByText(document.body, 'Overview')
    expect(createArtifactModalTitle).toBeDefined() // Create New Artifact Server Modal Rendered
    const portal = document.getElementsByClassName('bp3-dialog')[0]
    expect(portal).toMatchSnapshot('Artifact Name Step ')
    await act(async () => {
      // enter name and move to next step
      const artifactNameInput = portal.querySelector("input[name='name']")
      expect(artifactNameInput).toBeDefined()
      fireEvent.change(artifactNameInput!, { target: { value: 'artifact' } })
      expect(artifactNameInput).toHaveProperty('value', 'artifact')
      const saveAndContinueButton = document.body.querySelector('button.bp3-button[type=submit]')

      fireEvent.click(saveAndContinueButton as Element)
    })

    await act(async () => {
      //enter auth details
      const dockerRegistryInput = portal.querySelector("input[name='dockerRegistryUrl']")
      expect(dockerRegistryInput).toBeDefined()
      fireEvent.change(dockerRegistryInput!, { target: { value: 'https://hub.docker.com' } })
      expect(dockerRegistryInput).toHaveProperty('value', 'https://hub.docker.com')

      const usernameInput = portal.querySelector("input[name='usernametextField']")
      expect(usernameInput).toBeDefined()
      fireEvent.change(usernameInput!, { target: { value: 'test' } })
      expect(usernameInput).toHaveProperty('value', 'test')

      const passwordSelector = await findByText(document.body, 'Create or Select a Secret')
      expect(passwordSelector).toBeDefined()
      fireEvent.click(passwordSelector)
      const selectedSecret = await waitFor(() => findByText(document.body, 'testpass'))
      expect(selectedSecret).toBeDefined()
      fireEvent.click(selectedSecret)
      expect(await findByText(document.body, 'testpass')).toBeDefined()
      const saveAndContinueButton = await findByText(document.body, 'Save and Continue')
      fireEvent.click(saveAndContinueButton)
      expect(document.getElementsByClassName('bp3-dialog')[0]).toMatchSnapshot('Artifact Details Step')
    })
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip(`renders ServiceStep for Input sets`, () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={
            (PipelineContextValue.state.pipeline.stages[0].stage.spec.serviceConfig.serviceDefinition.spec as any) || {}
          }
          template={TemplateMock as any}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('variablesForm', () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          readonly={false}
          path={'test'}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={mockProps.initialValues}
          customStepProps={mockProps.customStepProps}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputVariable}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('inputSetMode', () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          readonly={false}
          path={'test'}
          template={mockProps.template}
          allValues={mockProps.initialValues}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={mockProps.initialValues}
          customStepProps={mockProps.customStepProps}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})

const connectorRefPath =
  'pipeline.stages.0.stage.spec.serviceConfig.serviceDefinition.spec.manifests.0.manifest.spec.store.spec.connectorRef'
const connectorArtifactPrimaryRefPath =
  'pipeline.stages.0.stage.spec.serviceConfig.serviceDefinition.spec.artifacts.primary.spec.connectorRef'
const connectorArtifactSidecarRefPath =
  'pipeline.stages.0.stage.spec.serviceConfig.serviceDefinition.spec.artifacts.sidecars.0.sidecar.spec.connectorRef'
const artifactTagListGCRPath =
  'pipeline.stages.0.stage.spec.serviceConfig.serviceDefinition.spec.artifacts.sidecars.0.sidecar.spec.tag'
const artifactTagListECRPath =
  'pipeline.stages.0.stage.spec.serviceConfig.serviceDefinition.spec.artifacts.sidecars.1.sidecar.spec.tag'
const artifactTagListDockerPath =
  'pipeline.stages.0.stage.spec.serviceConfig.serviceDefinition.spec.artifacts.sidecars.2.sidecar.spec.tag'

describe('Autocomplete fields test', () => {
  test('Test connectorRef Manifest', async () => {
    const step = new KubernetesServiceSpec() as any
    let list: CompletionItemInterface[]
    list = await step.getManifestConnectorsListForYaml(connectorRefPath, getYaml(), getParams())
    expect(list).toHaveLength(1)
    expect(list[0].insertText).toBe('account.git9march')
    list = await step.getManifestConnectorsListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)
  })
  test('Test connectorRef ArtifactsPrimaryConnectors', async () => {
    const step = new KubernetesServiceSpec() as any
    let list: CompletionItemInterface[]
    list = await step.getArtifactsPrimaryConnectorsListForYaml(connectorArtifactPrimaryRefPath, getYaml(), getParams())
    expect(list).toHaveLength(1)
    expect(list[0].insertText).toBe('account.git9march')
    list = await step.getArtifactsPrimaryConnectorsListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)
  })
  test('Test connectorRef ArtifactsSidecarConnectors', async () => {
    const step = new KubernetesServiceSpec() as any
    let list: CompletionItemInterface[]
    list = await step.getArtifactsSidecarConnectorsListForYaml(connectorArtifactSidecarRefPath, getYaml(), getParams())
    expect(list).toHaveLength(1)
    expect(list[0].insertText).toBe('account.git9march')
    list = await step.getArtifactsSidecarConnectorsListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)
  })
  test('Test connectorRef ArtifactsTagsList', async () => {
    const step = new KubernetesServiceSpec() as any
    let list: CompletionItemInterface[]

    //GCR
    list = await step.getArtifactsTagsListForYaml(artifactTagListGCRPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('latesttag')
    list = await step.getArtifactsTagsListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    //ECR
    list = await step.getArtifactsTagsListForYaml(artifactTagListECRPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('latesttag')
    list = await step.getArtifactsTagsListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)

    //Docker
    list = await step.getArtifactsTagsListForYaml(artifactTagListDockerPath, getYaml(), getParams())
    expect(list).toHaveLength(2)
    expect(list[0].insertText).toBe('latesttag')
    list = await step.getArtifactsTagsListForYaml('invalid path', getYaml(), getParams())
    expect(list).toHaveLength(0)
  })
})
