/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Dispatch, FormEvent, SetStateAction } from 'react'
import cx from 'classnames'
import { FormikForm, Layout, PageSpinner, Text } from '@harness/uicore'
import { isEmpty } from 'lodash-es'

import { useStrings } from 'framework/strings'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import SelectExistingInputsOrProvideNew from './SelectExistingOrProvide'
import { InputSetSelector } from '../InputSetSelector/InputSetSelector'
import type { InputSetValue } from '../InputSetSelector/utils'
import { PipelineInputSetForm } from '../PipelineInputSetForm/PipelineInputSetForm'
import { StepViewType } from '../AbstractSteps/Step'
import type { StageSelectionData } from '../../utils/runPipelineUtils'

import css from './RunPipelineForm.module.scss'

export type ExistingProvide = 'existing' | 'provide'

export interface VisualViewProps {
  executionView?: boolean
  existingProvide: ExistingProvide
  setExistingProvide: Dispatch<SetStateAction<ExistingProvide>>
  setRunClicked: Dispatch<SetStateAction<boolean>>
  selectedInputSets?: InputSetValue[]
  pipelineIdentifier: string
  executionIdentifier?: string
  hasRuntimeInputs: boolean
  template: PipelineInfoConfig
  pipeline?: PipelineInfoConfig
  resolvedPipeline?: PipelineInfoConfig
  currentPipeline?: {
    pipeline?: PipelineInfoConfig
  }
  getTemplateError: any
  submitForm(): void
  hasInputSets: boolean
  setSelectedInputSets: Dispatch<SetStateAction<InputSetValue[] | undefined>>
  loading?: boolean
  loadingMergeInputSetUpdate: boolean
  selectedStageData: StageSelectionData
}

export default function VisualView(props: VisualViewProps): React.ReactElement {
  const {
    executionView,
    existingProvide,
    setExistingProvide,
    selectedInputSets,
    pipelineIdentifier,
    executionIdentifier,
    hasRuntimeInputs,
    template,
    pipeline,
    currentPipeline,
    getTemplateError,
    resolvedPipeline,
    setRunClicked,
    submitForm,
    hasInputSets,
    setSelectedInputSets,
    loading,
    loadingMergeInputSetUpdate,
    selectedStageData
  } = props
  const { getString } = useStrings()

  const checkIfRuntimeInputsNotPresent = (): string | undefined => {
    if (executionView && isEmpty(template)) {
      return getString('pipeline.inputSets.noRuntimeInputsWhileExecution')
    } else if (!executionView && resolvedPipeline && currentPipeline && !hasRuntimeInputs && !getTemplateError) {
      /*
      We don't have any runtime inputs required for running this pipeline
        - if API doesn't fail and
        - the inputSetTemplateYaml is not present
      */
      return getString('runPipelineForm.noRuntimeInput')
    }
  }

  const showInputSetSelector = (): boolean => {
    return !!(pipeline && currentPipeline && hasRuntimeInputs && existingProvide === 'existing')
  }

  const showPipelineInputSetForm = (): boolean => {
    return !!(existingProvide === 'provide' || selectedInputSets?.length || executionView)
  }

  const showVoidPipelineInputSetForm = (): boolean => {
    return !!(existingProvide === 'existing' && selectedInputSets?.length)
  }

  const onExistingProvideRadioChange = (ev: FormEvent<HTMLInputElement>): void => {
    setExistingProvide((ev.target as HTMLInputElement).value as ExistingProvide)
  }

  const noRuntimeInputs = checkIfRuntimeInputsNotPresent()

  return (
    <div
      className={cx(executionView ? css.runModalFormContentExecutionView : css.runModalFormContent, {
        [css.noRuntimeInput]: (template as any)?.data?.replacedExpressions?.length > 0 && noRuntimeInputs
      })}
      data-testid="runPipelineVisualView"
      onKeyDown={ev => {
        if (ev.key === 'Enter') {
          ev.preventDefault()
          ev.stopPropagation()
          setRunClicked(true)

          if ((!selectedInputSets || selectedInputSets.length === 0) && existingProvide === 'existing') {
            setExistingProvide('provide')
          } else {
            submitForm()
          }
        }
      }}
    >
      <FormikForm>
        {noRuntimeInputs ? (
          <Layout.Horizontal padding="medium" margin="medium">
            <Text>{noRuntimeInputs}</Text>
          </Layout.Horizontal>
        ) : (
          <>
            {hasInputSets ? (
              <>
                {executionView ? null : (
                  <Layout.Vertical
                    className={css.pipelineHeader}
                    padding={{ top: 'xlarge', left: 'xlarge', right: 'xlarge' }}
                  >
                    <SelectExistingInputsOrProvideNew
                      existingProvide={existingProvide}
                      onExistingProvideRadioChange={onExistingProvideRadioChange}
                    />

                    {showInputSetSelector() ? (
                      <GitSyncStoreProvider>
                        <InputSetSelector
                          pipelineIdentifier={pipelineIdentifier}
                          onChange={inputsets => {
                            setSelectedInputSets(inputsets)
                          }}
                          value={selectedInputSets}
                        />
                      </GitSyncStoreProvider>
                    ) : null}
                  </Layout.Vertical>
                )}
              </>
            ) : null}
            {showPipelineInputSetForm() ? (
              <PipelineInputSetFormWrapper
                executionView={executionView}
                loading={loading}
                existingProvide={existingProvide}
                currentPipeline={currentPipeline}
                executionIdentifier={executionIdentifier}
                hasRuntimeInputs={hasRuntimeInputs}
                template={template}
                resolvedPipeline={resolvedPipeline}
                loadingMergeInputSetUpdate={loadingMergeInputSetUpdate}
                selectedStageData={selectedStageData}
              />
            ) : null}
            {showVoidPipelineInputSetForm() ? <div className={css.noPipelineInputSetForm} /> : null}
          </>
        )}
      </FormikForm>
    </div>
  )
}

export interface PipelineInputSetFormWrapperProps {
  loading?: boolean
  executionView?: boolean
  existingProvide: ExistingProvide
  executionIdentifier?: string
  currentPipeline?: {
    pipeline?: PipelineInfoConfig
  }
  hasRuntimeInputs?: boolean
  template: PipelineInfoConfig
  resolvedPipeline?: PipelineInfoConfig
  loadingMergeInputSetUpdate: boolean
  selectedStageData: StageSelectionData
}

function PipelineInputSetFormWrapper(props: PipelineInputSetFormWrapperProps): React.ReactElement | null {
  const {
    loading,
    executionView,
    existingProvide,
    currentPipeline,
    hasRuntimeInputs,
    template,
    executionIdentifier,
    resolvedPipeline,
    loadingMergeInputSetUpdate,
    selectedStageData
  } = props
  const { getString } = useStrings()

  if (loading) {
    return (
      <PageSpinner
        className={css.inputSetsUpdatingSpinner}
        message={
          loadingMergeInputSetUpdate
            ? getString('pipeline.inputSets.applyingInputSets')
            : getString('pipeline.inputSets.applyingInputSet')
        }
      />
    )
  }
  if (currentPipeline?.pipeline && resolvedPipeline && hasRuntimeInputs) {
    return (
      <>
        {existingProvide === 'existing' ? <div className={css.divider} /> : null}
        <PipelineInputSetForm
          originalPipeline={resolvedPipeline}
          template={template}
          readonly={executionView}
          path=""
          viewType={StepViewType.DeploymentForm}
          isRunPipelineForm
          executionIdentifier={executionIdentifier}
          maybeContainerClass={existingProvide === 'provide' ? css.inputSetFormRunPipeline : ''}
          selectedStageData={selectedStageData}
        />
      </>
    )
  }

  return null
}
