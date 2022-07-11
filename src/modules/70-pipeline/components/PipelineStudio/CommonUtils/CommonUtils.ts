/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { defaultTo } from 'lodash-es'
import type { MultiSelectOption, SelectOption } from '@wings-software/uicore'
import type { PipelineInfoConfig, StageElementWrapperConfig } from 'services/pipeline-ng'
import { EmptyStageName } from '../PipelineConstants'
import type { SelectedStageData, StageSelectionData } from '../../../utils/runPipelineUtils'

export interface StageSelectOption extends SelectOption {
  node: any
  type: string
}

export function getStagesMultiSelectOptionFromPipeline(pipeline: PipelineInfoConfig): MultiSelectOption[] {
  return getStagesFromPipeline(pipeline).map(node => ({
    label: defaultTo(node.stage?.name, ''),
    value: defaultTo(node.stage?.identifier, '')
  }))
}

export function getSelectStageOptionsFromPipeline(pipeline: PipelineInfoConfig): StageSelectOption[] {
  return getStagesFromPipeline(pipeline).map(node => ({
    label: defaultTo(node.stage?.name, ''),
    value: defaultTo(node.stage?.identifier, ''),
    node: node,
    type: defaultTo(node.stage?.type, '')
  }))
}

export function getStagesFromPipeline(pipeline: PipelineInfoConfig): StageElementWrapperConfig[] {
  const stages: StageElementWrapperConfig[] = []
  if (pipeline.stages) {
    pipeline.stages.forEach((node: StageElementWrapperConfig) => {
      if (node.stage && node.stage.name !== EmptyStageName) {
        stages.push(node)
      } else if (node.parallel) {
        node.parallel.forEach((parallelNode: StageElementWrapperConfig) => {
          if (parallelNode.stage && parallelNode.stage.name !== EmptyStageName) {
            stages.push(parallelNode)
          }
        })
      }
    })
  }
  return stages
}

export function getSelectedStagesFromPipeline(
  pipeline?: PipelineInfoConfig,
  selectedStageData?: StageSelectionData
): StageElementWrapperConfig[] {
  return selectedStageData?.selectedStages?.map((selectedStage: SelectedStageData) =>
    pipeline?.stages?.find(
      stage =>
        stage?.stage?.identifier === selectedStage.stageIdentifier ||
        stage?.parallel?.some(parallelStage => parallelStage.stage?.identifier === selectedStage.stageIdentifier)
    )
  ) as StageElementWrapperConfig[]
}
