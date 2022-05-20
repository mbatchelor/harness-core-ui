/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, queryByText, waitFor } from '@testing-library/react'
import { Formik, FormikForm } from '@wings-software/uicore'
import { renderHook } from '@testing-library/react-hooks'
import { TestWrapper } from '@common/utils/testUtils'
import { useStrings } from 'framework/strings'

import routes from '@common/RouteDefinitions'
import { accountPathProps, pipelineModuleParams, triggerPathProps } from '@common/utils/routeUtils'
import ArtifactTriggerConfigPanel from '../views/ArtifactTriggerConfigPanel'

const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
  <TestWrapper>{children}</TestWrapper>
)
const { result } = renderHook(() => useStrings(), { wrapper })

jest.mock('@wings-software/monaco-yaml/lib/esm/languageservice/yamlLanguageService', () => ({
  getLanguageService: jest.fn()
}))

const params = {
  accountId: 'testAcc',
  orgIdentifier: 'testOrg',
  projectIdentifier: 'test',
  pipelineIdentifier: 'pipeline',
  triggerIdentifier: 'triggerIdentifier',
  module: 'cd'
}

const TEST_PATH = routes.toTriggersWizardPage({ ...accountPathProps, ...triggerPathProps, ...pipelineModuleParams })

const iValues = {
  manifestType: 'HelmChart',
  resolvedPipeline: {
    name: 'test-manifest',
    identifier: 'testmanifest',
    projectIdentifier: 'mtran',
    orgIdentifier: 'harness',
    tags: {},
    stages: [
      {
        stage: {
          name: 'stage',
          identifier: 'stage',
          description: '',
          type: 'Deployment',
          spec: {
            serviceConfig: {
              serviceDefinition: {
                type: 'Kubernetes',
                spec: {
                  artifacts: {
                    sidecars: []
                  },
                  variables: [],
                  manifestOverrideSets: [],
                  manifests: [
                    {
                      manifest: {
                        identifier: 's3manifestid',
                        type: 'HelmChart',
                        spec: {
                          store: {
                            type: 'S3',
                            spec: {
                              connectorRef: '<+input>',
                              bucketName: '<+input>',
                              folderPath: 'chartPath',
                              region: '<+input>'
                            }
                          },
                          chartName: '<+input>',
                          chartVersion: '<+input>',
                          helmVersion: 'V2',
                          skipResourceVersioning: false
                        }
                      }
                    }
                  ]
                }
              },
              serviceRef: '<+input>'
            },
            infrastructure: {
              environmentRef: '<+input>',
              infrastructureDefinition: {
                type: 'KubernetesDirect',
                spec: {
                  connectorRef: '<+input>',
                  namespace: '<+input>',
                  releaseName: '<+input>'
                }
              },
              allowSimultaneousDeployments: false,
              infrastructureKey: '<+input>'
            },
            execution: {
              steps: [
                {
                  step: {
                    name: 'Rollout Deployment',
                    identifier: 'rolloutDeployment',
                    type: 'K8sRollingDeploy',
                    timeout: '10m',
                    spec: {
                      skipDryRun: false
                    }
                  }
                }
              ],
              rollbackSteps: [
                {
                  step: {
                    name: 'Rollback Rollout Deployment',
                    identifier: 'rollbackRolloutDeployment',
                    type: 'K8sRollingRollback',
                    timeout: '10m',
                    spec: {}
                  }
                }
              ]
            }
          },
          tags: {},
          failureStrategies: [
            {
              onFailure: {
                errors: ['AllErrors'],
                action: {
                  type: 'StageRollback'
                }
              }
            }
          ]
        }
      },
      {
        stage: {
          name: 'stage2',
          identifier: 'stage2',
          description: '',
          type: 'Deployment',
          spec: {
            serviceConfig: {
              serviceDefinition: {
                type: 'Kubernetes',
                spec: {
                  artifacts: {
                    sidecars: [],
                    primary: {
                      type: 'DockerRegistry',
                      spec: {
                        connectorRef: 'configurableartifact',
                        imagePath: 'imagePath',
                        tag: '<+input>'
                      }
                    }
                  },
                  manifestOverrideSets: [],
                  manifests: [
                    {
                      manifest: {
                        identifier: 'manifestId',
                        type: 'HelmChart',
                        spec: {
                          store: {
                            type: 'S3',
                            spec: {
                              connectorRef: 'account.sdhgjhgdj',
                              bucketName: '<+input>',
                              folderPath: '<+input>',
                              region: 'us-gov-west-1'
                            }
                          },
                          chartName: 'chartName',
                          chartVersion: 'chartVersion',
                          helmVersion: 'V2',
                          skipResourceVersioning: false
                        }
                      }
                    }
                  ],
                  variables: []
                }
              },
              serviceRef: '<+input>'
            },
            infrastructure: {
              environmentRef: '<+input>',
              infrastructureDefinition: {
                type: 'KubernetesDirect',
                spec: {
                  connectorRef: 'account.builfarm',
                  namespace: 'a',
                  releaseName: 'a'
                }
              },
              allowSimultaneousDeployments: false,
              infrastructureKey: 'a'
            },
            execution: {
              steps: [
                {
                  step: {
                    name: 'Rollout Deployment',
                    identifier: 'rolloutDeployment',
                    type: 'K8sRollingDeploy',
                    timeout: '10m',
                    spec: {
                      skipDryRun: false
                    }
                  }
                }
              ],
              rollbackSteps: [
                {
                  step: {
                    name: 'Rollback Rollout Deployment',
                    identifier: 'rollbackRolloutDeployment',
                    type: 'K8sRollingRollback',
                    timeout: '10m',
                    spec: {}
                  }
                }
              ]
            }
          },
          tags: {},
          failureStrategies: [
            {
              onFailure: {
                errors: ['AllErrors'],
                action: {
                  type: 'StageRollback'
                }
              }
            }
          ]
        }
      },
      {
        stage: {
          name: 'manifest-stage',
          identifier: 'manifeststage',
          description: '',
          type: 'Deployment',
          spec: {
            serviceConfig: {
              serviceDefinition: {
                type: 'Kubernetes',
                spec: {
                  artifacts: {
                    sidecars: []
                  },
                  manifestOverrideSets: [],
                  manifests: [
                    {
                      manifest: {
                        identifier: 'manifest',
                        type: 'K8sManifest',
                        spec: {
                          store: {
                            type: 'Github',
                            spec: {
                              connectorRef: 'configurablemanifest',
                              gitFetchType: 'Branch',
                              paths: ['abc'],
                              repoName: 'reponame',
                              branch: '<+input>'
                            }
                          },
                          skipResourceVersioning: false
                        }
                      }
                    }
                  ],
                  variables: []
                }
              },
              serviceRef: '<+input>'
            },
            infrastructure: {
              environmentRef: '<+input>',
              infrastructureDefinition: {
                type: 'KubernetesDirect',
                spec: {
                  connectorRef: 'account.builfarm',
                  namespace: 'a',
                  releaseName: 'a'
                }
              },
              allowSimultaneousDeployments: false,
              infrastructureKey: 'a'
            },
            execution: {
              steps: [
                {
                  step: {
                    name: 'Rollout Deployment',
                    identifier: 'rolloutDeployment',
                    type: 'K8sRollingDeploy',
                    timeout: '10m',
                    spec: {
                      skipDryRun: false
                    }
                  }
                }
              ],
              rollbackSteps: [
                {
                  step: {
                    name: 'Rollback Rollout Deployment',
                    identifier: 'rollbackRolloutDeployment',
                    type: 'K8sRollingRollback',
                    timeout: '10m',
                    spec: {}
                  }
                }
              ]
            }
          },
          tags: {},
          failureStrategies: [
            {
              onFailure: {
                errors: ['AllErrors'],
                action: {
                  type: 'StageRollback'
                }
              }
            }
          ]
        }
      }
    ]
  },
  inputSetTemplateYamlObj: {
    pipeline: {
      identifier: 'testmanifest',
      stages: [
        {
          stage: {
            identifier: 'stage',
            type: 'Deployment',
            spec: {
              serviceConfig: {
                serviceDefinition: {
                  type: 'Kubernetes',
                  spec: {
                    manifests: [
                      {
                        manifest: {
                          identifier: 's3manifestid',
                          type: 'HelmChart',
                          spec: {
                            store: {
                              type: 'S3',
                              spec: {
                                connectorRef: '<+input>',
                                bucketName: '<+input>',
                                region: '<+input>'
                              }
                            },
                            chartName: '<+input>',
                            chartVersion: '<+input>'
                          }
                        }
                      }
                    ]
                  }
                },
                serviceRef: '<+input>'
              },
              infrastructure: {
                environmentRef: '<+input>',
                infrastructureDefinition: {
                  type: 'KubernetesDirect',
                  spec: {
                    connectorRef: '<+input>',
                    namespace: '<+input>',
                    releaseName: '<+input>'
                  }
                },
                infrastructureKey: '<+input>'
              }
            }
          }
        },
        {
          stage: {
            identifier: 'stage2',
            type: 'Deployment',
            spec: {
              serviceConfig: {
                serviceDefinition: {
                  type: 'Kubernetes',
                  spec: {
                    artifacts: {
                      primary: {
                        type: 'DockerRegistry',
                        spec: {
                          tag: '<+input>'
                        }
                      }
                    },
                    manifests: [
                      {
                        manifest: {
                          identifier: 'manifestId',
                          type: 'HelmChart',
                          spec: {
                            store: {
                              type: 'S3',
                              spec: {
                                bucketName: '<+input>',
                                folderPath: '<+input>'
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                },
                serviceRef: '<+input>'
              },
              infrastructure: {
                environmentRef: '<+input>'
              }
            }
          }
        },
        {
          stage: {
            identifier: 'manifeststage',
            type: 'Deployment',
            spec: {
              serviceConfig: {
                serviceDefinition: {
                  type: 'Kubernetes',
                  spec: {
                    manifests: [
                      {
                        manifest: {
                          identifier: 'manifest',
                          type: 'K8sManifest',
                          spec: {
                            store: {
                              type: 'Github',
                              spec: {
                                branch: '<+input>'
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                },
                serviceRef: '<+input>'
              },
              infrastructure: {
                environmentRef: '<+input>'
              }
            }
          }
        }
      ]
    }
  },
  tags: {},
  triggerType: 'Manifest'
}

jest.mock('@pipeline/factories/ArtifactTriggerInputFactory', () => ({
  getTriggerFormDetails: jest.fn().mockImplementation(() => () => {
    return {
      component: <div>ABC</div>
    }
  })
}))
function WrapperComponent(props: { initialValues: any; isEdit?: boolean }): JSX.Element {
  const { initialValues, isEdit = false } = props
  return (
    <Formik initialValues={initialValues} onSubmit={() => undefined} formName="artifactTriggerConfigPanel">
      {formikProps => (
        <FormikForm>
          <TestWrapper path={TEST_PATH} pathParams={params}>
            <ArtifactTriggerConfigPanel formikProps={formikProps} isEdit={isEdit} />
          </TestWrapper>
        </FormikForm>
      )}
    </Formik>
  )
}

describe('Artifact Trigger Config Panel  tests', () => {
  describe('Renders/snapshots', () => {
    test('inital Render', async () => {
      const { container } = render(<WrapperComponent initialValues={iValues} isEdit={false} />)
      await waitFor(() => expect(queryByText(container, result.current.getString('manifestsText'))).not.toBeNull())
      //   await waitFor(() =>
      //     expect(
      //       document.body.querySelector('[class*="ArtifactTriggerConfigPanel"] [data-name="plusAdd"]')
      //     ).not.toBeNull()
      //   )
      expect(container).toMatchSnapshot()
    })

    test('edit render', async () => {
      const initialValueObj = {
        ...iValues,
        artifactRef: 's3manifestid',
        selectedArtifact: {
          identifier: 's3manifestid',
          spec: {
            chartPath: 'test',
            connectorRef: '<+input>',
            store: {
              region: 'regionA'
            }
          }
        },
        stageId: 'stage'
      }
      const { container } = render(<WrapperComponent initialValues={initialValueObj} isEdit={true} />)
      await waitFor(() =>
        expect(document.body.querySelector('[class*="ArtifactTriggerConfigPanel"] [data-name="plusAdd"]')).toBeNull()
      )
      await waitFor(() =>
        expect(
          queryByText(
            container,
            result.current.getString('pipeline.artifactTriggerConfigPanel.locationRepoPath').toUpperCase()
          )
        ).not.toBeNull()
      )
      //   !todo: update snapshot so that it shows table
      expect(container).toMatchSnapshot()
    })
  })
})
