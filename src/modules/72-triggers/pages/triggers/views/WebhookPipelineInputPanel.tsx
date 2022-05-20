/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Layout, Text, NestedAccordionProvider, HarnessDocTooltip, PageSpinner } from '@wings-software/uicore'
import { parse } from 'yaml'
import { pick, merge, cloneDeep, isEmpty, defaultTo } from 'lodash-es'
import type { FormikProps } from 'formik'
import { InputSetSelector, InputSetSelectorProps } from '@pipeline/components/InputSetSelector/InputSetSelector'
import type { PipelineInfoConfig, StageElementWrapperConfig } from 'services/cd-ng'
import {
  useGetTemplateFromPipeline,
  getInputSetForPipelinePromise,
  useGetMergeInputSetFromPipelineTemplateWithListInput
} from 'services/pipeline-ng'
import { PipelineInputSetForm } from '@pipeline/components/PipelineInputSetForm/PipelineInputSetForm'
import { isCloneCodebaseEnabledAtLeastOneStage } from '@pipeline/utils/CIUtils'
import { useStrings } from 'framework/strings'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { clearRuntimeInput } from '@pipeline/components/PipelineStudio/StepUtil'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useMutateAsGet } from '@common/hooks'
import {
  ciCodebaseBuild,
  ciCodebaseBuildPullRequest,
  filterArtifactIndex,
  getFilteredStage,
  TriggerTypes,
  eventTypes
} from '../utils/TriggersWizardPageUtils'
import css from './WebhookPipelineInputPanel.module.scss'

interface WebhookPipelineInputPanelPropsInterface {
  formikProps?: any
  isEdit?: boolean
}

const applyArtifactToPipeline = (newPipelineObject: any, formikProps: FormikProps<any>): PipelineInfoConfig => {
  const artifactIndex = filterArtifactIndex({
    runtimeData: newPipelineObject?.stages,
    stageId: formikProps?.values?.stageId,
    artifactId: formikProps?.values?.selectedArtifact?.identifier,
    isManifest: false
  })
  const filteredStage = getFilteredStage(newPipelineObject?.stages, formikProps?.values?.stageId)
  if (artifactIndex >= 0) {
    const selectedArtifact = {
      sidecar: {
        type: formikProps?.values?.selectedArtifact?.type,
        spec: {
          ...formikProps?.values?.selectedArtifact?.spec
        }
      }
    }

    const filteredStageArtifacts =
      filteredStage.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts?.sidecars
    filteredStageArtifacts[artifactIndex] = selectedArtifact
  } else if (artifactIndex < 0) {
    const selectedArtifact = {
      type: formikProps?.values?.selectedArtifact?.type,
      spec: {
        ...formikProps?.values?.selectedArtifact?.spec
      }
    }

    const filteredStageArtifacts = defaultTo(
      filteredStage.stage?.spec?.serviceConfig?.serviceDefinition?.spec?.artifacts,
      {}
    )
    filteredStageArtifacts.primary = selectedArtifact
  }
  return newPipelineObject
}
// Selected Artifact is applied to inputYaml on Pipeline Input Panel in KubernetesManifests.tsx
// This is to apply the selected artifact values
// to the applied input sets pipeline stage values
const applySelectedArtifactToPipelineObject = (
  pipelineObj: PipelineInfoConfig,
  formikProps: FormikProps<any>
): PipelineInfoConfig => {
  // Cloning or making into a new object
  // so the original pipeline is not effected
  const newPipelineObject = { ...pipelineObj }
  if (!newPipelineObject) {
    return {} as PipelineInfoConfig
  }

  const { triggerType } = formikProps.values

  if (triggerType === TriggerTypes.MANIFEST) {
    const artifactIndex = filterArtifactIndex({
      runtimeData: newPipelineObject?.stages,
      stageId: formikProps?.values?.stageId,
      artifactId: formikProps?.values?.selectedArtifact?.identifier,
      isManifest: true
    })
    if (artifactIndex >= 0) {
      const filteredStage =
        (newPipelineObject?.stages || []).find(
          (stage: StageElementWrapperConfig) => stage.stage?.identifier === formikProps?.values?.stageId
        ) || {}

      const selectedArtifact = {
        manifest: {
          type: formikProps?.values?.selectedArtifact?.type,
          spec: {
            ...formikProps?.values?.selectedArtifact?.spec
          }
        }
      }

      const filteredStageManifests = (filteredStage.stage?.spec as any)?.serviceConfig?.serviceDefinition?.spec
        ?.manifests
      filteredStageManifests[artifactIndex] = selectedArtifact
    }
  } else if (triggerType === TriggerTypes.ARTIFACT && newPipelineObject) {
    return applyArtifactToPipeline(newPipelineObject, formikProps)
  }
  return newPipelineObject
}

const getPipelineWithInjectedWithCloneCodebase = ({
  event,
  pipeline,
  isPipelineFromTemplate
}: {
  event: string
  pipeline: PipelineInfoConfig
  isPipelineFromTemplate: boolean
}): any => {
  if (isPipelineFromTemplate) {
    const pipelineFromTemplate = { ...(pipeline || {}) }
    if (pipelineFromTemplate?.template?.templateInputs?.properties?.ci?.codebase?.build) {
      pipelineFromTemplate.template.templateInputs.properties.ci.codebase.build =
        event === eventTypes.PULL_REQUEST ? ciCodebaseBuildPullRequest : ciCodebaseBuild
    }

    return pipelineFromTemplate
  }
  if (event === eventTypes.PULL_REQUEST) {
    return {
      ...pipeline,
      properties: {
        ci: {
          codebase: {
            build: ciCodebaseBuildPullRequest
          }
        }
      }
    }
  } else {
    return {
      ...pipeline,
      properties: {
        ci: {
          codebase: {
            build: ciCodebaseBuild
          }
        }
      }
    }
  }
}

function WebhookPipelineInputPanelForm({
  formikProps,
  isEdit
}: WebhookPipelineInputPanelPropsInterface): React.ReactElement {
  const {
    values: { inputSetSelected, pipeline, resolvedPipeline },
    values
  } = formikProps

  const { getString } = useStrings()
  const ciCodebaseBuildValue = formikProps.values?.pipeline?.properties?.ci?.codebase?.build

  const [selectedInputSets, setSelectedInputSets] = useState<InputSetSelectorProps['value']>(inputSetSelected)
  const [hasEverRendered, setHasEverRendered] = useState(
    typeof ciCodebaseBuildValue === 'object' && !isEmpty(ciCodebaseBuildValue)
  )

  const { orgIdentifier, accountId, projectIdentifier, pipelineIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
    pipelineIdentifier: string
    triggerIdentifier: string
  }>()

  const { data: template, loading } = useMutateAsGet(useGetTemplateFromPipeline, {
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      pipelineIdentifier,
      projectIdentifier
    },
    body: {
      stageIdentifiers: []
    }
  })

  const { mutate: mergeInputSet } = useGetMergeInputSetFromPipelineTemplateWithListInput({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      pipelineIdentifier
    }
  })

  useEffect(() => {
    const shouldInjectCloneCodebase = isCloneCodebaseEnabledAtLeastOneStage(resolvedPipeline)

    if (!hasEverRendered && shouldInjectCloneCodebase && !isEdit) {
      const formikValues = cloneDeep(formikProps.values)
      const isPipelineFromTemplate = !!formikValues?.pipeline?.template
      formikValues.pipeline = getPipelineWithInjectedWithCloneCodebase({
        event: formikValues.event,
        pipeline: formikValues.pipeline,
        isPipelineFromTemplate
      })

      formikProps.setValues(formikValues)
    }

    setHasEverRendered(true)
  }, [formikProps, hasEverRendered, resolvedPipeline?.properties?.ci?.codebase, resolvedPipeline?.stages])

  useEffect(() => {
    setSelectedInputSets(inputSetSelected)
  }, [inputSetSelected])

  useEffect(() => {
    if (template?.data?.inputSetTemplateYaml) {
      if ((selectedInputSets && selectedInputSets.length > 1) || selectedInputSets?.[0]?.type === 'OVERLAY_INPUT_SET') {
        const fetchData = async (): Promise<void> => {
          const data = await mergeInputSet({
            inputSetReferences: selectedInputSets.map(item => item.value as string)
          })
          if (data?.data?.pipelineYaml) {
            const pipelineObject = parse(data.data.pipelineYaml) as {
              pipeline: PipelineInfoConfig
            }
            const newPipelineObject = applySelectedArtifactToPipelineObject(pipelineObject.pipeline, formikProps)
            formikProps.setValues({
              ...values,
              inputSetSelected: selectedInputSets,
              pipeline: clearRuntimeInput(merge(pipeline, newPipelineObject))
            })
          }
        }
        fetchData()
      } else if (selectedInputSets && selectedInputSets.length === 1) {
        const fetchData = async (): Promise<void> => {
          const data = await getInputSetForPipelinePromise({
            inputSetIdentifier: selectedInputSets[0].value as string,
            queryParams: {
              accountIdentifier: accountId,
              projectIdentifier,
              orgIdentifier,
              pipelineIdentifier
            }
          })
          if (data?.data?.inputSetYaml) {
            if (selectedInputSets[0].type === 'INPUT_SET') {
              const pipelineObject = pick(parse(data.data.inputSetYaml)?.inputSet, 'pipeline') as {
                pipeline: PipelineInfoConfig
              }

              const newPipelineObject = applySelectedArtifactToPipelineObject(pipelineObject.pipeline, formikProps)
              formikProps.setValues({
                ...values,
                inputSetSelected: selectedInputSets,
                pipeline: clearRuntimeInput(merge(pipeline, newPipelineObject))
              })
            }
          }
        }
        fetchData()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    template?.data?.inputSetTemplateYaml,
    selectedInputSets?.length,
    selectedInputSets,
    accountId,
    projectIdentifier,
    orgIdentifier,
    pipelineIdentifier
  ])

  return (
    <Layout.Vertical className={css.webhookPipelineInputContainer} spacing="large" padding="none">
      {loading && (
        <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
          <PageSpinner />
        </div>
      )}
      {!isEmpty(pipeline) && template?.data?.inputSetTemplateYaml ? (
        <div className={css.inputsetGrid}>
          <div className={css.inputSetContent}>
            <div className={css.pipelineInputRow}>
              <Text className={css.formContentTitle} inline={true} data-tooltip-id="pipelineInputLabel">
                {getString('triggers.pipelineInputLabel')}
                <HarnessDocTooltip tooltipId="pipelineInputLabel" useStandAlone={true} />
              </Text>
              <GitSyncStoreProvider>
                <InputSetSelector
                  pipelineIdentifier={pipelineIdentifier}
                  onChange={value => {
                    setSelectedInputSets(value)
                  }}
                  value={selectedInputSets}
                  selectedValueClass={css.inputSetSelectedValue}
                />
              </GitSyncStoreProvider>
              <div className={css.divider} />
            </div>
            <PipelineInputSetForm
              originalPipeline={resolvedPipeline}
              template={
                !isEmpty(template?.data?.inputSetTemplateYaml) &&
                defaultTo(parse(template.data.inputSetTemplateYaml).pipeline, {})
              }
              path="pipeline"
              viewType={StepViewType.InputSet}
              maybeContainerClass={css.pipelineInputSetForm}
              viewTypeMetadata={{ isTrigger: true }}
            />
          </div>
        </div>
      ) : (
        <Layout.Vertical style={{ padding: '0 var(--spacing-small)' }} margin="large" spacing="large">
          <Text className={css.formContentTitle} inline={true} tooltipProps={{ dataTooltipId: 'pipelineInputLabel' }}>
            {getString('triggers.pipelineInputLabel')}
          </Text>
          <Layout.Vertical className={css.formContent}>
            <Text>{getString('pipeline.pipelineInputPanel.noRuntimeInputs')}</Text>
          </Layout.Vertical>
        </Layout.Vertical>
      )}
    </Layout.Vertical>
  )
}

const WebhookPipelineInputPanel: React.FC<WebhookPipelineInputPanelPropsInterface> = props => {
  return (
    <NestedAccordionProvider>
      <WebhookPipelineInputPanelForm {...props} />
    </NestedAccordionProvider>
  )
}
export default WebhookPipelineInputPanel
