/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, waitFor, fireEvent } from '@testing-library/react'
import { Formik, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import type { AllNGVariables } from '@pipeline/utils/types'
import { CustomVariables } from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariables'
import { AbstractStepFactory } from '@pipeline/components/AbstractSteps/AbstractStepFactory'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { StepFormikRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import {
  TestStepWidget,
  factory as testStepFactory
} from '@pipeline/components/PipelineSteps/Steps/__tests__/StepTestUtil'
import type { K8SDirectServiceStep } from '../K8sServiceSpecInterface'
import { KubernetesServiceSpec } from '../K8sServiceSpec'
import {
  mockAwsRegionsResponse,
  mockConnectorResponse,
  mockConnectorsListResponse,
  mockCreateConnectorResponse,
  mockDockerTagsCallResponse,
  mockPipelineResponse,
  mockSecretData,
  mockUpdateConnectorResponse
} from './mocks'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@common/utils/YamlUtils', () => ({}))

jest.mock('services/cd-ng', () => ({
  useGetConnectorListV2: () => jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  getConnectorListPromise: () => Promise.resolve(mockConnectorsListResponse),
  useGetConnector: jest.fn(() => mockConnectorResponse),
  useCreateConnector: () => jest.fn().mockResolvedValue(mockCreateConnectorResponse),
  useUpdateConnector: () => jest.fn().mockResolvedValue(mockUpdateConnectorResponse),
  validateTheIdentifierIsUniquePromise: () =>
    jest.fn().mockResolvedValue({
      status: 'SUCCESS',
      data: true,
      metaData: null
    }),
  listSecretsV2Promise: () => jest.fn().mockResolvedValue(mockSecretData),
  usePutSecret: () => jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePostSecret: () => jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePostSecretFileV2: () => jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePutSecretFileV2: () => jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetConnectorList: () => jest.fn(() => []),
  useGetTestConnectionResult: () => jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetBuildDetailsForGcrWithYaml: () =>
    jest.fn().mockImplementation(() => {
      return { data: { data: { buildDetailsList: [] } }, refetch: jest.fn(), error: null }
    }),
  useGetBuildDetailsForDockerWithYaml: () => mockDockerTagsCallResponse,
  useGetBuildDetailsForEcrWithYaml: () =>
    jest.fn().mockImplementation(() => {
      return { data: { data: { buildDetailsList: [] } }, refetch: jest.fn(), error: null }
    }),
  useGetBucketListForS3: () =>
    jest.fn().mockImplementation(() => ({ data: { data: {} }, refetch: jest.fn(), loading: false })),
  useGetGCSBucketList: () =>
    jest.fn().mockImplementation(() => ({ data: { data: {} }, refetch: jest.fn(), loading: false }))
}))

jest.mock('services/pipeline-ng', () => ({
  useGetPipeline: () => jest.fn(() => mockPipelineResponse)
}))

jest.mock('services/portal', () => ({
  useListAwsRegions: () => jest.fn(() => mockAwsRegionsResponse)
}))

class StepFactory extends AbstractStepFactory {
  protected type = 'test-factory'
}
const factory = new StepFactory()

jest.mock('@common/hooks', () => ({
  ...(jest.requireActual('@common/hooks') as any),
  useMutateAsGet: jest.fn().mockImplementation(() => {
    return {
      data: mockDockerTagsCallResponse,
      refetch: jest.fn(),
      error: null,
      cancel: jest.fn(),
      loading: false
    }
  })
}))

describe('DOCKER', () => {
  beforeEach(() => {
    factory.registerStep(new KubernetesServiceSpec())
  })
  test(`renders the primary artifact form if all the attributes are runtime`, () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          template={{
            artifacts: {
              primary: {
                type: 'DockerRegistry',
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE,
                  tag: RUNTIME_INPUT_VALUE,
                  imagePath: RUNTIME_INPUT_VALUE,
                  registryHostname: RUNTIME_INPUT_VALUE,
                  region: RUNTIME_INPUT_VALUE,
                  tagRegex: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot('primary artifact runtime form')
  })

  test(`renders the primary artifact form in readonly mode`, () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          readonly={true}
          template={{
            artifacts: {
              primary: {
                type: 'DockerRegistry',
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE,
                  tag: RUNTIME_INPUT_VALUE,
                  imagePath: RUNTIME_INPUT_VALUE,
                  registryHostname: RUNTIME_INPUT_VALUE,
                  region: RUNTIME_INPUT_VALUE,
                  tagRegex: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot('primary artifact runtime form readonly')
  })

  test(`renders the tag component if other values are fixed`, async () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          template={{
            artifacts: {
              primary: {
                type: 'DockerRegistry',
                spec: {
                  tag: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
          customStepProps={{
            allValues: {
              artifacts: {
                primary: {
                  type: 'DockerRegistry',
                  spec: {
                    connectorRef: 'connectorRef',
                    imagePath: 'imagePath',
                    registryHostname: 'registryHostname',
                    region: 'region',
                    tagRegex: 'tagRegex'
                  }
                }
              }
            }
          }}
        />
      </TestWrapper>
    )

    // Should fetch tags on click
    const tagInput = container.querySelector('.bp3-input') as HTMLInputElement
    act(() => {
      tagInput?.focus()
    })
    // Should call the fetch tags, cannot assert on the API
    expect(container).toMatchSnapshot('fetch tags docker')
  })

  test(`renders the tag component if other values is expression`, async () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          template={{
            artifacts: {
              primary: {
                type: 'DockerRegistry',
                spec: {
                  tag: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
          customStepProps={{
            allValues: {
              artifacts: {
                primary: {
                  type: 'DockerRegistry',
                  spec: {
                    connectorRef: 'connectorRef',
                    imagePath: '<+imagePath>'
                  }
                }
              }
            }
          }}
        />
      </TestWrapper>
    )
    // Should fetch tags on click
    const tagInput = container.querySelector('.bp3-input') as HTMLInputElement
    act(() => {
      tagInput?.focus()
    })
    expect(container).toMatchSnapshot('fetch tags docker if dependent fields are expression')
  })
})

describe('ECR', () => {
  beforeEach(() => {
    factory.registerStep(new KubernetesServiceSpec())
  })
  test(`renders the primary artifact form if all the attributes are runtime`, () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          template={{
            artifacts: {
              primary: {
                type: 'Ecr',
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE,
                  tag: RUNTIME_INPUT_VALUE,
                  imagePath: RUNTIME_INPUT_VALUE,
                  registryHostname: RUNTIME_INPUT_VALUE,
                  region: RUNTIME_INPUT_VALUE,
                  tagRegex: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot('ecr - primary artifact runtime form')
  })

  test(`renders the primary artifact form in readonly mode`, () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          readonly={true}
          template={{
            artifacts: {
              primary: {
                type: 'Ecr',
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE,
                  tag: RUNTIME_INPUT_VALUE,
                  imagePath: RUNTIME_INPUT_VALUE,
                  registryHostname: RUNTIME_INPUT_VALUE,
                  region: RUNTIME_INPUT_VALUE,
                  tagRegex: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot('ecr - primary artifact runtime form readonly')
  })

  test(`renders the tag component if other values are fixed`, async () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          template={{
            artifacts: {
              primary: {
                type: 'Ecr',
                spec: {
                  tag: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
          customStepProps={{
            allValues: {
              artifacts: {
                primary: {
                  type: 'Ecr',
                  spec: {
                    connectorRef: 'connectorRef',
                    imagePath: 'imagePath',
                    registryHostname: 'registryHostname',
                    region: 'region',
                    tagRegex: 'tagRegex'
                  }
                }
              }
            }
          }}
        />
      </TestWrapper>
    )

    // Should fetch tags on click
    const tagInput = container.querySelector('.bp3-input') as HTMLInputElement
    act(() => {
      tagInput?.focus()
    })
    expect(container).toMatchSnapshot('fetch tags ecr')
  })

  test(`renders the tag component if other values are expression`, async () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          template={{
            artifacts: {
              primary: {
                type: 'Ecr',
                spec: {
                  tag: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
          customStepProps={{
            allValues: {
              artifacts: {
                primary: {
                  type: 'Ecr',
                  spec: {
                    connectorRef: 'connectorRef',
                    imagePath: '<+imagePath>',
                    region: '<+region>'
                  }
                }
              }
            }
          }}
        />
      </TestWrapper>
    )

    // Should fetch tags on click
    const tagInput = container.querySelector('.bp3-input') as HTMLInputElement
    act(() => {
      tagInput?.focus()
    })
    expect(container).toMatchSnapshot('fetch tags ecr if dependent fields are expression')
  })
})

describe('GCR', () => {
  beforeEach(() => {
    factory.registerStep(new KubernetesServiceSpec())
  })
  test(`renders the primary artifact form if all the attributes are runtime`, () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          template={{
            artifacts: {
              primary: {
                type: 'Gcr',
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE,
                  tag: RUNTIME_INPUT_VALUE,
                  imagePath: RUNTIME_INPUT_VALUE,
                  registryHostname: RUNTIME_INPUT_VALUE,
                  region: RUNTIME_INPUT_VALUE,
                  tagRegex: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot('ecr - primary artifact runtime form')
  })

  test(`renders the primary artifact form in readonly mode`, () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          readonly={true}
          template={{
            artifacts: {
              primary: {
                type: 'Gcr',
                spec: {
                  connectorRef: RUNTIME_INPUT_VALUE,
                  tag: RUNTIME_INPUT_VALUE,
                  imagePath: RUNTIME_INPUT_VALUE,
                  registryHostname: RUNTIME_INPUT_VALUE,
                  region: RUNTIME_INPUT_VALUE,
                  tagRegex: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot('ecr - primary artifact runtime form readonly')
  })

  test(`renders the tag component if other values are fixed`, async () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          template={{
            artifacts: {
              primary: {
                type: 'Gcr',
                spec: {
                  tag: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
          customStepProps={{
            allValues: {
              artifacts: {
                primary: {
                  type: 'Gcr',
                  spec: {
                    connectorRef: 'connectorRef',
                    imagePath: 'imagePath',
                    registryHostname: 'registryHostname',
                    region: 'region',
                    tagRegex: 'tagRegex'
                  }
                }
              }
            }
          }}
        />
      </TestWrapper>
    )

    // Should fetch tags on click
    const tagInput = container.querySelector('.bp3-input') as HTMLInputElement
    act(() => {
      tagInput?.focus()
    })
    expect(container).toMatchSnapshot('fetch tags gcr')
  })

  test(`renders the tag component if other values are fixed`, async () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          template={{
            artifacts: {
              primary: {
                type: 'Gcr',
                spec: {
                  tag: RUNTIME_INPUT_VALUE
                }
              },
              sidecars: []
            },
            manifests: [],
            variables: []
          }}
          customStepProps={{
            allValues: {
              artifacts: {
                primary: {
                  type: 'Gcr',
                  spec: {
                    connectorRef: 'connectorRef',
                    imagePath: '<+imagePath>',
                    registryHostname: '<+registryHostname>'
                  }
                }
              }
            }
          }}
        />
      </TestWrapper>
    )

    // Should fetch tags on click
    const tagInput = container.querySelector('.bp3-input') as HTMLInputElement
    act(() => {
      tagInput?.focus()
    })
    expect(container).toMatchSnapshot('fetch tags gcr if dependent fields are expression')
  })
})

describe('VARIABLES', () => {
  beforeEach(() => {
    factory.registerStep(new KubernetesServiceSpec())
    factory.registerStep(new CustomVariables())
  })
  test(`renders the service variables form`, async () => {
    // stepTestUtilFactory.registerStep(new CustomVariables())
    const onUpdateMock = jest.fn()
    const { container, queryByText } = render(
      <Formik initialValues={{}} formName="dummy" onSubmit={jest.fn()}>
        {() => {
          return (
            <TestWrapper>
              <StepWidget<K8SDirectServiceStep>
                factory={factory}
                allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
                initialValues={{}}
                type={StepType.K8sServiceSpec}
                stepViewType={StepViewType.InputSet}
                onUpdate={onUpdateMock}
                customStepProps={{
                  stageIdentifier: 'testStageIdentifier',
                  allValues: {
                    variables: [
                      {
                        name: 'testvar1',
                        type: 'String',
                        default: 'somedefaultvalue'
                      }
                    ] as AllNGVariables[]
                  }
                }}
                template={{
                  variables: [
                    {
                      name: 'testvar1',
                      type: 'String',
                      value: RUNTIME_INPUT_VALUE
                    }
                  ] as AllNGVariables[]
                }}
              />
            </TestWrapper>
          )
        }}
      </Formik>
    )

    await waitFor(() => expect(queryByText('common.variables')).toBeTruthy())
    expect(container).toMatchSnapshot('variables with default value')
  })
})

describe('MANIFEST', () => {
  beforeEach(() => {
    factory.registerStep(new KubernetesServiceSpec())
  })
  test(`renders the K8 manifest`, async () => {
    // stepTestUtilFactory.registerStep(new CustomVariables())
    const onUpdateMock = jest.fn()
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputSet}
          onUpdate={onUpdateMock}
          customStepProps={{
            stageIdentifier: 'testStageIdentifier',
            allValues: {}
          }}
          template={{
            manifests: [
              {
                manifest: {
                  identifier: 'manifestId',
                  spec: {},
                  type: 'K8sManifest'
                }
              }
            ]
          }}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot('manifest form skeleton')
  })
})

describe('VALIDATIONS', () => {
  beforeEach(() => {
    testStepFactory.registerStep(new KubernetesServiceSpec())
  })
  test('ARTIFACTS', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container, getByText } = render(
      <TestStepWidget
        type={StepType.K8sServiceSpec}
        stepViewType={StepViewType.DeploymentForm}
        ref={ref}
        template={{
          artifacts: {
            primary: {
              type: 'DockerRegistry',
              spec: {
                connectorRef: RUNTIME_INPUT_VALUE,
                tag: RUNTIME_INPUT_VALUE,
                imagePath: RUNTIME_INPUT_VALUE,
                registryHostname: RUNTIME_INPUT_VALUE,
                region: RUNTIME_INPUT_VALUE,
                tagRegex: RUNTIME_INPUT_VALUE
              }
            }
          }
        }}
        initialValues={{
          artifacts: {
            primary: {
              type: 'DockerRegistry',
              spec: {
                connectorRef: '',
                tag: '',
                imagePath: '',
                registryHostname: '',
                region: '',
                tagRegex: ''
              }
            }
          }
        }}
      />
    )

    await act(() => {
      fireEvent.click(getByText('Submit'))
    })
    const errorDiv = container.querySelector('pre')
    await waitFor(() => expect(errorDiv?.innerHTML).not.toBe('{}'))
  })

  test('ARTIFACTS - with values present', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container, getByText } = render(
      <TestStepWidget
        type={StepType.K8sServiceSpec}
        stepViewType={StepViewType.DeploymentForm}
        ref={ref}
        template={{
          artifacts: {
            primary: {
              type: 'DockerRegistry',
              spec: {
                connectorRef: RUNTIME_INPUT_VALUE,
                tag: RUNTIME_INPUT_VALUE,
                imagePath: RUNTIME_INPUT_VALUE,
                registryHostname: RUNTIME_INPUT_VALUE,
                region: RUNTIME_INPUT_VALUE,
                tagRegex: RUNTIME_INPUT_VALUE
              }
            }
          }
        }}
        initialValues={{
          artifacts: {
            primary: {
              type: 'DockerRegistry',
              spec: {
                connectorRef: 'A',
                tag: 'A',
                imagePath: 'A',
                registryHostname: 'A',
                region: 'A',
                tagRegex: 'A'
              }
            }
          }
        }}
      />
    )

    await act(() => {
      fireEvent.click(getByText('Submit'))
    })
    const errorDiv = container.querySelector('pre')
    await waitFor(() => expect(errorDiv?.innerHTML).toBe('{}'))
  })

  test('ARTIFACTS: Input Set mode - do not validate', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container, getByText } = render(
      <TestStepWidget
        type={StepType.K8sServiceSpec}
        stepViewType={StepViewType.InputSet}
        ref={ref}
        template={{
          artifacts: {
            primary: {
              type: 'DockerRegistry',
              spec: {
                connectorRef: RUNTIME_INPUT_VALUE,
                tag: RUNTIME_INPUT_VALUE,
                imagePath: RUNTIME_INPUT_VALUE,
                registryHostname: RUNTIME_INPUT_VALUE,
                region: RUNTIME_INPUT_VALUE,
                tagRegex: RUNTIME_INPUT_VALUE
              }
            }
          }
        }}
        initialValues={{
          artifacts: {
            primary: {
              type: 'DockerRegistry',
              spec: {
                connectorRef: '',
                tag: '',
                imagePath: '',
                registryHostname: '',
                region: '',
                tagRegex: ''
              }
            }
          }
        }}
      />
    )

    await act(() => {
      fireEvent.click(getByText('Submit'))
    })
    const errorDiv = container.querySelector('pre')
    await waitFor(() => expect(errorDiv?.innerHTML).toBe('{}'))
  })

  test('SIDECARS', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container, getByText } = render(
      <TestStepWidget
        type={StepType.K8sServiceSpec}
        stepViewType={StepViewType.DeploymentForm}
        ref={ref}
        template={{
          artifacts: {
            sidecars: [
              {
                sidecar: {
                  spec: {
                    connectorRef: RUNTIME_INPUT_VALUE,
                    imagePath: RUNTIME_INPUT_VALUE,
                    tag: RUNTIME_INPUT_VALUE,
                    tagRegex: RUNTIME_INPUT_VALUE,
                    registryHostname: RUNTIME_INPUT_VALUE
                  }
                }
              }
            ]
          }
        }}
        initialValues={{
          artifacts: {
            sidecars: [
              {
                sidecar: {
                  spec: {
                    connectorRef: '',
                    imagePath: '',
                    tag: '',
                    tagRegex: '',
                    registryHostname: ''
                  }
                }
              }
            ]
          }
        }}
      />
    )

    await act(() => {
      fireEvent.click(getByText('Submit'))
    })
    const errorDiv = container.querySelector('pre')
    await waitFor(() => expect(errorDiv?.innerHTML).not.toBe('{}'))
  })

  test('SIDECARS - with values present', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container, getByText } = render(
      <TestStepWidget
        type={StepType.K8sServiceSpec}
        stepViewType={StepViewType.DeploymentForm}
        ref={ref}
        template={{
          artifacts: {
            sidecars: [
              {
                sidecar: {
                  spec: {
                    connectorRef: RUNTIME_INPUT_VALUE,
                    imagePath: RUNTIME_INPUT_VALUE,
                    tag: RUNTIME_INPUT_VALUE,
                    tagRegex: RUNTIME_INPUT_VALUE,
                    registryHostname: RUNTIME_INPUT_VALUE
                  }
                }
              }
            ]
          }
        }}
        initialValues={{
          artifacts: {
            sidecars: [
              {
                sidecar: {
                  spec: {
                    connectorRef: 'A',
                    imagePath: 'A',
                    tag: 'A',
                    tagRegex: 'A',
                    registryHostname: 'A'
                  }
                }
              }
            ]
          }
        }}
      />
    )

    await act(() => {
      fireEvent.click(getByText('Submit'))
    })
    const errorDiv = container.querySelector('pre')
    await waitFor(() => expect(errorDiv?.innerHTML).toBe('{}'))
  })

  test('SIDECARS: Input Set mode do not validate', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container, getByText } = render(
      <TestStepWidget
        type={StepType.K8sServiceSpec}
        stepViewType={StepViewType.InputSet}
        ref={ref}
        template={{
          artifacts: {
            sidecars: [
              {
                sidecar: {
                  spec: {
                    connectorRef: RUNTIME_INPUT_VALUE,
                    imagePath: RUNTIME_INPUT_VALUE,
                    tag: RUNTIME_INPUT_VALUE,
                    tagRegex: RUNTIME_INPUT_VALUE,
                    registryHostname: RUNTIME_INPUT_VALUE
                  }
                }
              }
            ]
          }
        }}
        initialValues={{
          artifacts: {
            sidecars: [
              {
                sidecar: {
                  spec: {
                    connectorRef: '',
                    imagePath: '',
                    tag: '',
                    tagRegex: '',
                    registryHostname: ''
                  }
                }
              }
            ]
          }
        }}
      />
    )

    await act(() => {
      fireEvent.click(getByText('Submit'))
    })
    const errorDiv = container.querySelector('pre')
    await waitFor(() => expect(errorDiv?.innerHTML).toBe('{}'))
  })

  test('MANIFESTS', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container, getByText } = render(
      <TestStepWidget
        type={StepType.K8sServiceSpec}
        stepViewType={StepViewType.DeploymentForm}
        ref={ref}
        template={{
          manifests: [
            {
              manifest: {
                spec: {
                  store: {
                    spec: {
                      connectorRef: RUNTIME_INPUT_VALUE,
                      folderPath: RUNTIME_INPUT_VALUE,
                      branch: RUNTIME_INPUT_VALUE,
                      paths: RUNTIME_INPUT_VALUE,
                      bucketName: RUNTIME_INPUT_VALUE
                    }
                  }
                }
              }
            }
          ]
        }}
        initialValues={{
          manifests: [
            {
              manifest: {
                spec: {
                  store: {
                    spec: {
                      connectorRef: '',
                      folderPath: '',
                      branch: '',
                      paths: '',
                      bucketName: ''
                    }
                  }
                }
              }
            }
          ]
        }}
      />
    )

    await act(() => {
      fireEvent.click(getByText('Submit'))
    })
    const errorDiv = container.querySelector('pre')
    await waitFor(() => expect(errorDiv?.innerHTML).not.toBe('{}'))
  })

  test('MANIFESTS - with values present', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container, getByText } = render(
      <TestStepWidget
        type={StepType.K8sServiceSpec}
        stepViewType={StepViewType.DeploymentForm}
        ref={ref}
        template={{
          manifests: [
            {
              manifest: {
                spec: {
                  store: {
                    spec: {
                      connectorRef: RUNTIME_INPUT_VALUE,
                      folderPath: RUNTIME_INPUT_VALUE,
                      branch: RUNTIME_INPUT_VALUE,
                      paths: RUNTIME_INPUT_VALUE,
                      bucketName: RUNTIME_INPUT_VALUE
                    }
                  }
                }
              }
            }
          ]
        }}
        initialValues={{
          manifests: [
            {
              manifest: {
                spec: {
                  store: {
                    spec: {
                      connectorRef: 'A',
                      folderPath: 'A',
                      branch: 'A',
                      paths: 'A',
                      bucketName: 'A'
                    }
                  }
                }
              }
            }
          ]
        }}
      />
    )

    await act(() => {
      fireEvent.click(getByText('Submit'))
    })
    const errorDiv = container.querySelector('pre')
    await waitFor(() => expect(errorDiv?.innerHTML).toBe('{}'))
  })

  test('MANIFESTS: Input set mode do not validate', async () => {
    const ref = React.createRef<StepFormikRef<unknown>>()
    const { container, getByText } = render(
      <TestStepWidget
        type={StepType.K8sServiceSpec}
        stepViewType={StepViewType.InputSet}
        ref={ref}
        template={{
          manifests: [
            {
              manifest: {
                spec: {
                  store: {
                    spec: {
                      connectorRef: RUNTIME_INPUT_VALUE,
                      folderPath: RUNTIME_INPUT_VALUE,
                      branch: RUNTIME_INPUT_VALUE,
                      paths: RUNTIME_INPUT_VALUE,
                      bucketName: RUNTIME_INPUT_VALUE
                    }
                  }
                }
              }
            }
          ]
        }}
        initialValues={{
          manifests: [
            {
              manifest: {
                spec: {
                  store: {
                    spec: {
                      connectorRef: '',
                      folderPath: '',
                      branch: '',
                      paths: '',
                      bucketName: ''
                    }
                  }
                }
              }
            }
          ]
        }}
      />
    )

    await act(() => {
      fireEvent.click(getByText('Submit'))
    })
    const errorDiv = container.querySelector('pre')
    await waitFor(() => expect(errorDiv?.innerHTML).toBe('{}'))
  })
})

describe('INPUT VARIABLE VIEW', () => {
  test(`renders the input variable view`, () => {
    const { container } = render(
      <TestWrapper>
        <StepWidget<K8SDirectServiceStep>
          factory={factory}
          allowableTypes={[]}
          customStepProps={{
            variablesData: {
              artifacts: {
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
                sidecars: []
              }
            }
          }}
          initialValues={{}}
          type={StepType.K8sServiceSpec}
          stepViewType={StepViewType.InputVariable}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot('input variabe mode')
  })
})
