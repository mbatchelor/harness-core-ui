import { renderHook } from '@testing-library/react-hooks'
import { waitFor } from '@testing-library/react'
import { parse } from 'yaml'
import { useGetTemplateFromPipeline, useGetMergeInputSetFromPipelineTemplateWithListInput } from 'services/pipeline-ng'

import { useInputSets } from '../useInputSets'
import type { UseInputSetsProps } from '../useInputSets'
import { clearRuntimeInput } from '../../PipelineStudio/StepUtil'
jest.mock('services/pipeline-ng', () => ({
  useGetTemplateFromPipeline: jest.fn(() => ({})),
  useGetMergeInputSetFromPipelineTemplateWithListInput: jest.fn(() => ({}))
}))

const getInitialProps = (): UseInputSetsProps => ({
  accountId: 'TEST_ACCOUNT',
  orgIdentifier: 'TEST_ORG',
  pipelineIdentifier: 'TEST_PIPELINE',
  projectIdentifier: 'TEST_PROJECT',
  selectedStageData: { allStagesSelected: true, selectedStages: [], selectedStageItems: [] }
})

const runtimeInputsYaml = `pipeline:
  identifier: "RPF_Bugs"
  stages:
    - stage:
        identifier: "Stage_1"
        type: "Deployment"
        spec:
          serviceConfig:
            serviceDefinition:
              type: "Kubernetes"
              spec:
                variables:
                  - name: "var1"
                    type: "String"
                    value: "<+input>"
    - stage:
        identifier: "Stage_3"
        type: "Deployment"
        spec:
          execution:
            steps:
              - step:
                  identifier: "Step_1"
                  type: "ShellScript"
                  timeout: "<+input>"
  variables:
    - name: "test1"
      type: "String"
      value: "<+input>.allowedValues(1,2,3,4,5)"
    - name: "test2"
      type: "String"
      value: "<+input>.allowedValues(2,1)"
`

const mergedPipelineYaml = `pipeline:
  identifier: "RPF_Bugs"
  stages:
      - stage:
          identifier: "Stage_1"
          type: "Deployment"
          spec:
            serviceConfig:
                serviceDefinition:
                  type: "Kubernetes"
                  spec:
                      variables:
                        - name: "var1"
                          type: "String"
                          value: "123"
      - stage:
          identifier: "Stage_3"
          type: "Deployment"
          spec:
          execution:
              steps:
                - step:
                    identifier: "Step_1"
                    type: "ShellScript"
                    timeout: ""
  variables:
    - name: "test2"
      type: "String"
      value: "test2"
    - name: "test1"
      type: "String"
      value: "test1"
`

describe('<useInputSets /> tests', () => {
  beforeEach(() => {
    ;(useGetTemplateFromPipeline as jest.Mock).mockReset()
    ;(useGetMergeInputSetFromPipelineTemplateWithListInput as jest.Mock).mockReset().mockImplementation(() => ({}))
  })

  test('works without runtime inputs', async () => {
    ;(useGetTemplateFromPipeline as jest.Mock).mockImplementation(() => ({
      mutate: jest.fn().mockResolvedValue({
        data: {
          inputSetTemplateYaml: ''
        }
      })
    }))
    const { result } = renderHook(useInputSets, { initialProps: getInitialProps() })

    await waitFor(() => expect(result.current.inputSetYamlResponse?.data?.inputSetTemplateYaml).toEqual(''))
    expect(result.current.inputSet).toEqual({})
    expect(result.current.parsedInputSetTemplateYaml).toEqual({})
  })

  test('works with runtime inputs, without predefined inputsets', async () => {
    ;(useGetTemplateFromPipeline as jest.Mock).mockImplementation(() => ({
      mutate: jest.fn().mockResolvedValue({
        data: {
          inputSetTemplateYaml: runtimeInputsYaml
        }
      })
    }))
    const { result } = renderHook(useInputSets, { initialProps: getInitialProps() })
    const parsed = parse(runtimeInputsYaml)

    await waitFor(() =>
      expect(result.current.inputSetYamlResponse?.data?.inputSetTemplateYaml).toEqual(runtimeInputsYaml)
    )
    expect(result.current.inputSet).toEqual(clearRuntimeInput(parsed))
    expect(result.current.parsedInputSetTemplateYaml).toEqual(parsed)
  })

  test('works with predefined inputsets', async () => {
    ;(useGetTemplateFromPipeline as jest.Mock).mockImplementation(() => ({
      mutate: jest.fn().mockResolvedValue({
        data: {
          inputSetTemplateYaml: runtimeInputsYaml
        }
      })
    }))
    ;(useGetMergeInputSetFromPipelineTemplateWithListInput as jest.Mock).mockImplementation(() => ({
      mutate: jest.fn().mockResolvedValue({
        data: {
          pipelineYaml: mergedPipelineYaml
        }
      })
    }))
    const { result } = renderHook(useInputSets, {
      initialProps: { ...getInitialProps(), inputSetSelected: [{ value: 'test1', type: 'INPUT_SET', label: 'test1' }] }
    })

    await waitFor(() =>
      expect(result.current.inputSetYamlResponse?.data?.inputSetTemplateYaml).toEqual(runtimeInputsYaml)
    )
    expect(result.current.inputSet).toMatchInlineSnapshot(`
      Object {
        "pipeline": Object {
          "identifier": "RPF_Bugs",
          "stages": Array [
            Object {
              "stage": Object {
                "identifier": "Stage_1",
                "spec": Object {
                  "serviceConfig": Object {
                    "serviceDefinition": Object {
                      "spec": Object {
                        "variables": Array [
                          Object {
                            "name": "var1",
                            "type": "String",
                            "value": "123",
                          },
                        ],
                      },
                      "type": "Kubernetes",
                    },
                  },
                },
                "type": "Deployment",
              },
            },
            Object {
              "stage": Object {
                "execution": Object {
                  "steps": Array [
                    Object {
                      "step": Object {
                        "identifier": "Step_1",
                        "timeout": "",
                        "type": "ShellScript",
                      },
                    },
                  ],
                },
                "identifier": "Stage_3",
                "spec": null,
                "type": "Deployment",
              },
            },
          ],
          "variables": Array [
            Object {
              "name": "test1",
              "type": "String",
              "value": "test1",
            },
            Object {
              "name": "test2",
              "type": "String",
              "value": "test2",
            },
          ],
        },
      }
    `)
  })

  test('works with rerun', async () => {
    ;(useGetTemplateFromPipeline as jest.Mock).mockImplementation(() => ({
      mutate: jest.fn().mockResolvedValue({
        data: {
          inputSetTemplateYaml: runtimeInputsYaml
        }
      })
    }))
    const { result } = renderHook(useInputSets, {
      initialProps: { ...getInitialProps(), rerunInputSetYaml: mergedPipelineYaml }
    })
    const parsed = parse(runtimeInputsYaml)

    await waitFor(() =>
      expect(result.current.inputSetYamlResponse?.data?.inputSetTemplateYaml).toEqual(runtimeInputsYaml)
    )
    expect(result.current.inputSet).toEqual(parse(mergedPipelineYaml))
    expect(result.current.parsedInputSetTemplateYaml).toEqual(parsed)
  })

  test('git sync params are passed to API when available', async () => {
    const getTemplateMock = jest.fn().mockResolvedValue({ data: {} })
    const mergeMock = jest.fn().mockResolvedValue({ data: {} })
    const repoIdentifier = 'REPO_IDENTIFIER'
    const branch = 'BRANCH'

    ;(useGetTemplateFromPipeline as jest.Mock).mockImplementation(() => ({
      mutate: getTemplateMock
    }))
    ;(useGetMergeInputSetFromPipelineTemplateWithListInput as jest.Mock).mockImplementation(() => ({
      mutate: mergeMock
    }))

    renderHook(useInputSets, {
      initialProps: {
        ...getInitialProps(),
        repoIdentifier,
        branch,
        inputSetSelected: [{ value: 'test1', type: 'INPUT_SET', label: 'test1' }]
      }
    })

    await waitFor(() => {
      expect(getTemplateMock).toHaveBeenLastCalledWith(
        expect.any(Object),
        expect.objectContaining({
          queryParams: expect.objectContaining({ repoIdentifier, branch })
        })
      )
    })

    await waitFor(() => {
      expect(mergeMock).toHaveBeenLastCalledWith(
        expect.any(Object),
        expect.objectContaining({
          queryParams: expect.objectContaining({ repoIdentifier, branch })
        })
      )
    })
  })
})
