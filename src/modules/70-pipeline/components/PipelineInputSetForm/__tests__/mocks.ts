/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const getCICodebaseInputSetFormInitialValues = () => ({
  identifier: 's',
  properties: {
    ci: {
      codebase: {
        connectorRef: '',
        repoName: '',
        build: {
          spec: {}
        },
        depth: 50,
        sslVerify: true,
        prCloneStrategy: 'MergeCommit',
        resources: {
          limits: {
            memory: '500Mi',
            cpu: '400m'
          }
        }
      }
    }
  },
  stages: [
    {
      stage: {
        identifier: 's',
        type: 'CI',
        spec: {
          infrastructure: {
            type: 'KubernetesDirect',
            spec: {
              connectorRef: '',
              namespace: ''
            }
          },
          execution: {
            steps: [
              {
                step: {
                  identifier: 's',
                  type: 'Run',
                  spec: {
                    connectorRef: ''
                  }
                }
              }
            ]
          }
        }
      }
    }
  ]
})

export const getCICodebaseInputSetFormTemplateInitialValues = () => ({
  identifier: 'cicodebaseallfieldsruntime',
  template: {
    templateInputs: {
      properties: {
        ci: {
          codebase: {
            connectorRef: '',
            repoName: '',
            build: {
              spec: {}
            },
            depth: 50,
            sslVerify: true,
            prCloneStrategy: 'MergeCommit',
            resources: {
              limits: {
                memory: '500Mi',
                cpu: '400m'
              }
            }
          }
        }
      }
    }
  }
})

export const getReRunCICodebaseInputSetInitialValuesTemplate = () => ({
  identifier: 'cicodebaseallfieldsruntime',
  template: {
    templateInputs: {
      properties: {
        ci: {
          codebase: {
            connectorRef: 'mtaccttyperepo',
            repoName: 'repo',
            build: {
              type: 'branch',
              spec: {
                branch: 'branch'
              }
            },
            depth: 50,
            sslVerify: true,
            prCloneStrategy: 'MergeCommit',
            resources: {
              limits: {
                memory: '500Mi',
                cpu: '400m'
              }
            }
          }
        }
      }
    }
  }
})

export const getReRunCICodebaseInputSetInitialValues = ({ codebase }: { codebase?: any }) => ({
  identifier: 'cicodebaseallfieldscopy',
  properties: {
    ci: {
      codebase: {
        connectorRef: 'githubrepourltype',
        build: {
          type: 'branch',
          spec: {
            branch: 'branch'
          }
        },
        depth: 150,
        sslVerify: false,
        prCloneStrategy: 'SourceBranch',
        resources: {
          limits: {
            memory: '1500Mi',
            cpu: '1400m'
          }
        },
        ...(codebase || {})
      }
    }
  }
})

export const getCICodebaseInputSetFormProps = ({ formik, isTemplate }: { formik: any; isTemplate?: boolean }): any => ({
  path: isTemplate ? 'template.templateInputs' : '',
  formik,
  template: isTemplate
    ? {
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
    : {
        identifier: 'cicodebaseallfieldscopy',
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
      },
  originalPipeline: {
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
          name: 'stage1',
          identifier: 'stage1',
          type: 'CI',
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
                    type: 'Run',
                    name: 'run step',
                    identifier: 'run_step',
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
    name: 'cicodebase-all-fields-copy',
    identifier: 'cicodebaseallfieldscopy',
    tags: {},
    projectIdentifier: 'mtran',
    orgIdentifier: 'default'
  }
})

// Geting initialValues in the template studio
export const getCICodebaseTemplateInitialValues = () => ({
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
  projectIdentifier: 'mtran',
  orgIdentifier: 'default'
})

export const GetUseGetConnectorAcctUrlTypeResponse = {
  status: 'SUCCESS',
  data: {
    data: {
      connector: {
        name: 'mt-acct-type-repo',
        identifier: 'mtaccttyperepo',
        description: '',
        orgIdentifier: 'default',
        projectIdentifier: 'mtran',
        tags: {},
        type: 'Github',
        spec: {
          url: 'https://github.com',
          validationRepo: 'sdf',
          authentication: {
            type: 'Http',
            spec: {
              type: 'UsernameToken',
              spec: {
                username: 'asdf',
                usernameRef: null,
                tokenRef: 'account.testGitPrivateToken7P192KsDDl'
              }
            }
          },
          apiAccess: null,
          delegateSelectors: [],
          executeOnDelegate: false,
          type: 'Account'
        }
      },
      createdAt: 1651880828672,
      lastModifiedAt: 1651880828665,
      status: {
        status: 'FAILURE',
        errorSummary: 'Error Encountered (Please provide valid git repository url                                   )',
        errors: [
          {
            reason: 'Unexpected Error',
            message: 'Please provide valid git repository url                                   ',
            code: 450
          }
        ],
        testedAt: 1651880831801,
        lastTestedAt: 0,
        lastConnectedAt: 0
      },
      activityDetails: {
        lastActivityTime: 1651880828720
      },
      harnessManaged: false,
      gitDetails: {
        objectId: null,
        branch: null,
        repoIdentifier: null,
        rootFolder: null,
        filePath: null,
        repoName: null
      },
      entityValidityDetails: {
        valid: true,
        invalidYaml: null
      },
      governanceMetadata: null
    }
  },
  metaData: null,
  correlationId: '5c82f437-16a0-4ce0-8b91-44e12f7cf746'
}
export const GetUseGetConnectorRepoUrlTypeResponse = {
  data: {
    data: {
      connector: {
        name: 'github-repo-url-type',
        identifier: 'githubrepourltype',
        description: '',
        orgIdentifier: 'default',
        projectIdentifier: 'mtran',
        tags: {},
        type: 'Github',
        spec: {
          url: 'https://github.com/harness/harness-core-ui',
          validationRepo: null,
          authentication: {
            type: 'Http',
            spec: {
              type: 'UsernameToken',
              spec: {
                username: 'mtran7',
                usernameRef: null,
                tokenRef: 'mtran7'
              }
            }
          },
          apiAccess: null,
          delegateSelectors: [],
          executeOnDelegate: false,
          type: 'Repo'
        }
      },
      createdAt: 1651910747770,
      lastModifiedAt: 1652147896444,
      status: {
        status: 'SUCCESS',
        errorSummary: null,
        errors: null,
        testedAt: 1652375314730,
        lastTestedAt: 0,
        lastConnectedAt: 1652375314730
      },
      activityDetails: {
        lastActivityTime: 1652147896470
      },
      harnessManaged: false,
      gitDetails: {
        objectId: null,
        branch: null,
        repoIdentifier: null,
        rootFolder: null,
        filePath: null,
        repoName: null
      },
      entityValidityDetails: {
        valid: true,
        invalidYaml: null
      },
      governanceMetadata: null
    }
  },
  metaData: null,
  correlationId: '5fc68703-6079-4042-922b-f4f635c6b73a'
}

export const getCICodebaseParallelStageInitialValues = () => ({
  identifier: 'ciparallelpipelinemerge',
  template: {
    templateInputs: {
      properties: {
        ci: {
          codebase: {
            connectorRef: 'mtaccttyperepo',
            repoName: 'repo',
            build: {
              type: 'branch',
              spec: {
                branch: 'master'
              }
            },
            depth: 50,
            sslVerify: true,
            prCloneStrategy: 'MergeCommit',
            resources: {
              limits: {
                memory: '500Mi',
                cpu: '400m'
              }
            }
          }
        }
      },
      stages: [
        {
          parallel: [
            {
              stage: {
                identifier: 'stage1',
                type: 'CI',
                spec: {
                  execution: {
                    steps: [
                      {
                        step: {
                          identifier: 'run',
                          type: 'Run',
                          spec: {
                            image: 'image'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              stage: {
                identifier: 'parallelstage',
                type: 'CI',
                spec: {
                  execution: {
                    steps: [
                      {
                        step: {
                          identifier: 'run',
                          type: 'Run',
                          spec: {
                            image: 'image2'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      ]
    }
  }
})

export const getCICodebaseParallelTemplateProps = ({ formik }: { formik: any }): any => ({
  path: 'template.templateInputs',
  formik,
  template: {
    identifier: 'ciparallelpipelinemerge',
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
        },
        stages: [
          {
            parallel: [
              {
                stage: {
                  identifier: 'stage1',
                  type: 'CI',
                  spec: {
                    execution: {
                      steps: [
                        {
                          step: {
                            identifier: 'run',
                            type: 'Run',
                            spec: {
                              image: '<+input>'
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                stage: {
                  identifier: 'parallelstage',
                  type: 'CI',
                  spec: {
                    execution: {
                      steps: [
                        {
                          step: {
                            identifier: 'run',
                            type: 'Run',
                            spec: {
                              image: '<+input>'
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        ]
      }
    }
  },
  originalPipeline: {
    name: 'ci-parallel-pipeline-merge',
    identifier: 'ciparallelpipelinemerge',
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
        parallel: [
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
                    connectorRef: 'account.CItestK8sConnectortECJ7K6Ags',
                    namespace: 'default',
                    automountServiceAccountToken: true,
                    nodeSelector: {}
                  }
                },
                execution: {
                  steps: [
                    {
                      step: {
                        identifier: 'run',
                        type: 'Run',
                        name: 'run',
                        spec: {
                          connectorRef: 'account.CItestDockerConnectorlsRKDabVkl',
                          image: '<+input>',
                          shell: 'Sh',
                          command: "echo 'hi'"
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          {
            stage: {
              identifier: 'parallelstage',
              type: 'CI',
              name: 'parallelstage',
              spec: {
                cloneCodebase: true,
                infrastructure: {
                  type: 'KubernetesDirect',
                  spec: {
                    connectorRef: 'account.CItestK8sConnector3sUqvOsbZG',
                    namespace: 'def',
                    nodeSelector: {}
                  }
                },
                execution: {
                  steps: [
                    {
                      step: {
                        identifier: 'run',
                        type: 'Run',
                        name: 'run',
                        spec: {
                          connectorRef: 'account.CItestGCPConnector5nslcmHyZA',
                          image: '<+input>',
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
        ]
      }
    ],
    tags: {},
    projectIdentifier: 'mtran',
    orgIdentifier: 'default'
  }
})
