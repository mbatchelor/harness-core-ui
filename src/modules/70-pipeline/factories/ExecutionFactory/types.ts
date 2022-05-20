/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@wings-software/uicore'

import type { ExecutionNode, GraphLayoutNode } from 'services/pipeline-ng'
import type { StageType } from '@pipeline/utils/stageHelpers'
import type { CardVariant } from '@pipeline/utils/constants'

export interface StepDetailProps {
  step: ExecutionNode
  stageType?: StageType
}

export interface StepDetailsRegister {
  component: React.ComponentType<StepDetailProps>
}

export interface StageDetailProps {
  stage: GraphLayoutNode
  stageType?: StageType
}

export interface StageDetailsRegister {
  component: React.ComponentType<StageDetailProps>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ExecutionCardInfoProps<T = Record<string, any>> {
  data: T
  nodeMap: Record<string, GraphLayoutNode>
  startingNodeId: string
  variant: CardVariant
}

export interface ExecutionCardInfoRegister {
  component: React.ComponentType<ExecutionCardInfoProps>
  icon: IconName
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ExecutionSummaryProps<T = any> {
  data: T
  nodeMap: Map<string, GraphLayoutNode>
}

export interface ExecutionSummaryRegister {
  component: React.ComponentType<ExecutionSummaryProps>
}

export interface ConsoleViewStepDetailProps {
  step: ExecutionNode
  errorMessage?: string
  isSkipped?: boolean
  loading?: boolean
}

export interface ConsoleViewStepDetailsRegister {
  component: React.ComponentType<ConsoleViewStepDetailProps>
}
