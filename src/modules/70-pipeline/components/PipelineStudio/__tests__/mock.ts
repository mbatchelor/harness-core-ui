/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const pipelineTemplateWithRuntimeInput = {
  name: 'cipipeline',
  identifier: 'cipipeline',
  projectIdentifier: 'vbci',
  orgIdentifier: 'default',
  tags: {},
  properties: {
    ci: {
      codebase: {
        connectorRef: 'account.testGitConnectors',
        build: '<+input>'
      }
    }
  },
  stages: [
    {
      stage: {
        name: 'S1',
        identifier: 'S1',
        type: 'CI',
        spec: {
          cloneCodebase: true,
          infrastructure: {
            type: 'KubernetesDirect',
            spec: {
              connectorRef: 'account.testGitConnectors',
              namespace: 'harness-delegate-pmdemo'
            }
          },
          execution: {
            steps: [
              {
                step: {
                  type: 'Run',
                  name: 'print commit sha',
                  identifier: 'print_commit_sha',
                  spec: {
                    connectorRef: 'account.testGitConnectors',
                    image: '<+input>',
                    command: 'echo <+codebase.commitSha>',
                    privileged: false
                  }
                }
              }
            ]
          },
          serviceConfig: {
            serviceRef: '',
            serviceDefinition: {
              type: 'Kubernetes',
              spec: {
                variables: []
              }
            }
          }
        }
      }
    }
  ]
}

export const pipelineWithNoBuildInfo = {
  name: 'cipipeline',
  identifier: 'cipipeline',
  projectIdentifier: 'vbci',
  orgIdentifier: 'default',
  tags: {},
  properties: {
    ci: {
      codebase: {
        connectorRef: 'account.testGitConnectors',
        build: {
          type: ''
        }
      }
    }
  },
  stages: [
    {
      stage: {
        name: 'S1',
        identifier: 'S1',
        type: 'CI',
        spec: {
          cloneCodebase: true,
          infrastructure: {
            type: 'KubernetesDirect',
            spec: {
              connectorRef: 'account.testGitConnectors',
              namespace: 'harness-delegate-pmdemo'
            }
          },
          execution: {
            steps: [
              {
                step: {
                  type: 'Run',
                  name: 'print commit sha',
                  identifier: 'print_commit_sha',
                  spec: {
                    connectorRef: 'account.testGitConnectors',
                    image: '<+input>',
                    command: 'echo <+codebase.commitSha>',
                    privileged: false
                  }
                }
              }
            ]
          },
          serviceConfig: {
            serviceRef: '',
            serviceDefinition: {
              type: 'Kubernetes',
              spec: {
                variables: []
              }
            }
          }
        }
      }
    }
  ]
}

export const pipelineWithBranchBuild = {
  name: 'cipipeline',
  identifier: 'cipipeline',
  projectIdentifier: 'vbci',
  orgIdentifier: 'default',
  tags: {},
  properties: {
    ci: {
      codebase: {
        connectorRef: 'account.testGitConnectors',
        build: {
          type: 'branch',
          spec: {}
        }
      }
    }
  },
  stages: [
    {
      stage: {
        name: 'S1',
        identifier: 'S1',
        type: 'CI',
        spec: {
          cloneCodebase: true,
          infrastructure: {
            type: 'KubernetesDirect',
            spec: {
              connectorRef: 'account.testGitConnectors',
              namespace: 'harness-delegate-pmdemo'
            }
          },
          execution: {
            steps: [
              {
                step: {
                  type: 'Run',
                  name: 'print commit sha',
                  identifier: 'print_commit_sha',
                  spec: {
                    connectorRef: 'account.testGitConnectors',
                    image: '<+input>',
                    command: 'echo <+codebase.commitSha>',
                    privileged: false
                  }
                }
              }
            ]
          },
          serviceConfig: {
            serviceRef: '',
            serviceDefinition: {
              type: 'Kubernetes',
              spec: {
                variables: []
              }
            }
          }
        }
      }
    }
  ]
}

export const pipelineWithTagBuild = {
  name: 'cipipeline',
  identifier: 'cipipeline',
  projectIdentifier: 'vbci',
  orgIdentifier: 'default',
  tags: {},
  properties: {
    ci: {
      codebase: {
        connectorRef: 'account.testGitConnectors',
        build: {
          type: 'tag',
          spec: {}
        }
      }
    }
  },
  stages: [
    {
      stage: {
        name: 'S1',
        identifier: 'S1',
        type: 'CI',
        spec: {
          cloneCodebase: true,
          infrastructure: {
            type: 'KubernetesDirect',
            spec: {
              connectorRef: 'account.testGitConnectors',
              namespace: 'harness-delegate-pmdemo'
            }
          },
          execution: {
            steps: [
              {
                step: {
                  type: 'Run',
                  name: 'print commit sha',
                  identifier: 'print_commit_sha',
                  spec: {
                    connectorRef: 'account.testGitConnectors',
                    image: '<+input>',
                    command: 'echo <+codebase.commitSha>',
                    privileged: false
                  }
                }
              }
            ]
          },
          serviceConfig: {
            serviceRef: '',
            serviceDefinition: {
              type: 'Kubernetes',
              spec: {
                variables: []
              }
            }
          }
        }
      }
    }
  ]
}

export const pipelineWithDeploymentStage = {
  name: 'cipipeline',
  identifier: 'cipipeline',
  projectIdentifier: 'vbci',
  orgIdentifier: 'default',
  tags: {},
  stages: [
    {
      stage: {
        name: 'DeployCD',
        identifier: 'DeployCD',
        description: '',
        type: 'Deployment',
        spec: {
          serviceConfig: {
            serviceRef: '<+input>',
            serviceDefinition: {
              type: 'Kubernetes',
              spec: {
                variables: []
              }
            }
          },
          infrastructure: {
            environmentRef: '<+input>',
            infrastructureDefinition: {
              type: 'KubernetesDirect',
              spec: {
                connectorRef: 'account.testK8sConnector',
                namespace: 'harness-delegate',
                releaseName: 'release-<+INFRA_KEY>'
              }
            },
            allowSimultaneousDeployments: false
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
  ],
  timeout: '6000'
}

export const templateWithRuntimeTimeout = {
  timeout: '<+input>',
  name: 'cipipeline',
  identifier: 'cipipeline',
  projectIdentifier: 'vbci',
  orgIdentifier: 'default',
  tags: {},
  stages: [
    {
      stage: {
        name: 'DeployCD',
        identifier: 'DeployCD',
        description: '',
        type: 'Deployment',
        spec: {
          serviceConfig: {
            serviceRef: '<+input>',
            serviceDefinition: {
              type: 'Kubernetes',
              spec: {
                variables: []
              }
            }
          },
          infrastructure: {
            environmentRef: '<+input>',
            infrastructureDefinition: {
              type: 'KubernetesDirect',
              spec: {
                connectorRef: 'account.testK8sConnector',
                namespace: 'harness-delegate',
                releaseName: 'release-<+INFRA_KEY>'
              }
            },
            allowSimultaneousDeployments: false
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
}

export const pipelineTemplateOriginalPipeline = {
  name: 'ci-codebase-all-fields-runtime',
  identifier: 'cicodebaseallfieldsruntime',
  template: {
    templateRef: 'cicodebaseallfields',
    versionLabel: 'v1',
    templateInputs: {
      properties: {
        ci: {
          codebase: {
            connectorRef: '<+input>',
            repoName: '<+input>',
            build: '<+input>',
            depth: '<+input>',
            sslVerify: '<+input>',
            prCloneStrategy: '<+input>',
            resources: {
              limits: {
                memory: '<+input>',
                cpu: '<+input>'
              }
            }
          }
        }
      }
    }
  },
  tags: {},
  projectIdentifier: 'projectIdentifier',
  orgIdentifier: 'default'
}

export const pipelineTemplateTemplate = {
  identifier: 'cicodebaseallfieldsruntime',
  template: {
    templateInputs: {
      properties: {
        ci: {
          codebase: {
            connectorRef: '<+input>',
            repoName: '<+input>',
            build: '<+input>',
            depth: '<+input>',
            sslVerify: '<+input>',
            prCloneStrategy: '<+input>',
            resources: {
              limits: {
                memory: '<+input>',
                cpu: '<+input>'
              }
            }
          }
        }
      }
    }
  }
}

export const pipelineTemplateResolvedPipeline = {
  name: 'ci-codebase-all-fields-runtime',
  identifier: 'cicodebaseallfieldsruntime',
  properties: {
    ci: {
      codebase: {
        connectorRef: '<+input>',
        repoName: '<+input>',
        build: '<+input>',
        depth: '<+input>',
        sslVerify: '<+input>',
        prCloneStrategy: '<+input>',
        resources: {
          limits: {
            memory: '<+input>',
            cpu: '<+input>'
          }
        }
      }
    }
  },
  stages: [
    {
      stage: {
        identifier: 'stage1',
        type: 'CI',
        name: 'stage1',
        spec: {
          cloneCodebase: true,
          infrastructure: {
            type: 'KubernetesDirect',
            spec: {
              connectorRef: 'account.CItestK8sConnectorYL1agYpudC',
              namespace: 'default',
              automountServiceAccountToken: true,
              nodeSelector: {}
            }
          },
          execution: {
            steps: [
              {
                step: {
                  identifier: 'run_step',
                  type: 'Run',
                  name: 'run step',
                  spec: {
                    connectorRef: 'account.CItestDockerConnectorBNcmp5A5Ml',
                    image: 'alpine',
                    shell: 'Sh',
                    command: "echo 'hi'"
                  }
                }
              }
            ]
          }
        }
      }
    }
  ],
  tags: {},
  projectIdentifier: 'projectIdentifier',
  orgIdentifier: 'default'
}
