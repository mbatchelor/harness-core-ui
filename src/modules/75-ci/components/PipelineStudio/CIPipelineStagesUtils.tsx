/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { UseStringsReturn } from 'framework/strings'
import { PipelineStages, PipelineStagesProps } from '@pipeline/components/PipelineStages/PipelineStages'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import { StageType } from '@pipeline/utils/stageHelpers'

interface GetCIPipelineStagesArgs {
  args: Omit<PipelineStagesProps, 'children'>
  getString: UseStringsReturn['getString']
  isCIEnabled?: boolean
  isCDEnabled?: boolean
  isCFEnabled?: boolean
  isSTOEnabled?: boolean
  isApprovalStageEnabled?: boolean
}

export const getCIPipelineStages: (args: GetCIPipelineStagesArgs) => React.ReactElement<PipelineStagesProps> = ({
  args,
  getString,
  isCIEnabled = false,
  isCDEnabled = false,
  isCFEnabled = false,
  isSTOEnabled = false,
  isApprovalStageEnabled = false
}) => {
  return (
    <PipelineStages {...args}>
      {stagesCollection.getStage(StageType.BUILD, isCIEnabled, getString)}
      {stagesCollection.getStage(StageType.DEPLOY, isCDEnabled, getString)}
      {stagesCollection.getStage(StageType.APPROVAL, isApprovalStageEnabled, getString)}
      {stagesCollection.getStage(StageType.FEATURE, isCFEnabled, getString)}
      {stagesCollection.getStage(StageType.SECURITY, isSTOEnabled, getString)}
      {stagesCollection.getStage(StageType.PIPELINE, false, getString)}
      {stagesCollection.getStage(StageType.CUSTOM, true, getString)}
      {stagesCollection.getStage(StageType.Template, false, getString)}
    </PipelineStages>
  )
}

export enum BuildTabs {
  OVERVIEW = 'OVERVIEW',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  EXECUTION = 'EXECUTION',
  ADVANCED = 'ADVANCED'
}
