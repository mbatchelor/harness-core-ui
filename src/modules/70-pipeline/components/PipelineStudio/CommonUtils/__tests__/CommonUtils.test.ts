/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import { getSelectedStagesFromPipeline, getSelectStageOptionsFromPipeline } from '../CommonUtils'

function generateStage(idx: number, type: string): StageElementWrapper {
  return {
    stage: {
      identifier: `stageid-${idx}`,
      name: `stage-${idx}`,
      type: type
    }
  }
}

const stage1 = generateStage(1, 'Build')
const stage2 = generateStage(2, 'Deployment')
const stage3 = generateStage(3, 'Build')
const stage4 = generateStage(4, 'Deployment')

const pipeline: PipelineInfoConfig = {
  stages: [
    stage1,
    {
      parallel: [stage2, stage3]
    },
    stage4
  ]
} as PipelineInfoConfig

describe('getSelectOptionsFromPipeline', () => {
  test('should return correct number of stages', async () => {
    const options = getSelectStageOptionsFromPipeline(pipeline)
    expect(options).toHaveLength(4)
  })
  test('should return correct stage at index', async () => {
    const options = getSelectStageOptionsFromPipeline(pipeline)
    expect(options[0]).toEqual({
      label: stage1.stage?.name,
      value: stage1.stage?.identifier,
      node: stage1,
      type: stage1.stage?.type
    })
    expect(options[1]).toEqual({
      label: stage2.stage?.name,
      value: stage2.stage?.identifier,
      node: stage2,
      type: stage2.stage?.type
    })
    expect(options[2]).toEqual({
      label: stage3.stage?.name,
      value: stage3.stage?.identifier,
      node: stage3,
      type: stage3.stage?.type
    })
    expect(options[3]).toEqual({
      label: stage4.stage?.name,
      value: stage4.stage?.identifier,
      node: stage4,
      type: stage4.stage?.type
    })
  })

  test('Test getSelectedStagesFromPipeline method', () => {
    const testPipeline = {
      name: 'CI-4894',
      identifier: 'CI4894',
      projectIdentifier: 'CI_Sanity',
      orgIdentifier: 'default',
      tags: {},
      properties: { ci: { codebase: { connectorRef: 'paymentsservice', build: '<+input>' } } },
      stages: [
        {
          stage: {
            name: 'Build',
            identifier: 'Build',
            type: 'CI',
            spec: {
              cloneCodebase: true,
              infrastructure: {
                type: 'KubernetesDirect',
                spec: {
                  connectorRef: 'cidelegateplay',
                  namespace: 'default',
                  automountServiceAccountToken: true,
                  nodeSelector: {},
                  os: 'Linux'
                }
              },
              execution: {
                steps: [
                  {
                    step: {
                      type: 'Run',
                      name: 'Run',
                      identifier: 'Run',
                      spec: { connectorRef: 'dockerfinalrepro', image: 'node', shell: 'Sh', command: 'echo Run' }
                    }
                  }
                ]
              }
            }
          }
        },
        {
          stage: {
            name: 'Deploy',
            identifier: 'Deploy',
            description: '',
            type: 'Deployment',
            spec: {
              serviceConfig: {
                serviceRef: 'sample',
                serviceDefinition: { spec: { variables: [] }, type: 'Kubernetes' }
              },
              infrastructure: {
                environmentRef: 'env',
                infrastructureDefinition: {
                  type: 'KubernetesDirect',
                  spec: { connectorRef: 'cidelegateplay', namespace: 'default', releaseName: 'release-<+INFRA_KEY>' }
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
                      spec: { skipDryRun: false }
                    }
                  },
                  {
                    step: {
                      type: 'ShellScript',
                      name: 'shell',
                      identifier: 'shell',
                      spec: {
                        shell: 'Bash',
                        onDelegate: true,
                        source: { type: 'Inline', spec: { script: 'echo Test' } },
                        environmentVariables: [],
                        outputVariables: [],
                        executionTarget: {}
                      },
                      timeout: '10m'
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
            failureStrategies: [{ onFailure: { errors: ['AllErrors'], action: { type: 'StageRollback' } } }]
          }
        }
      ],
      allowStageExecutions: true
    }
    expect(
      getSelectedStagesFromPipeline(testPipeline as any, {
        selectedStages: [{ stageIdentifier: 'Deploy', stageName: 'Deploy', message: 'test', stagesRequired: [] }],
        selectedStageItems: [{ label: 'Deploy', value: 'Deploy' }],
        allStagesSelected: false
      }).length
    ).toBe(1)
    expect(
      getSelectedStagesFromPipeline(testPipeline as any, {
        selectedStages: [
          { stageIdentifier: 'Build', stageName: 'Build', message: 'test', stagesRequired: [] },
          { stageIdentifier: 'Deploy', stageName: 'Deploy', message: 'test', stagesRequired: [] }
        ],
        selectedStageItems: [
          { label: 'Build', value: 'Build' },
          { label: 'Deploy', value: 'Deploy' }
        ],
        allStagesSelected: true
      }).length
    ).toBe(2)
  })
})
