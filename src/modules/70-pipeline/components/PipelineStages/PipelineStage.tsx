/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { IconName } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'

export interface PipelineStageProps<T = Record<string, unknown>> {
  name: string
  type: string
  icon: IconName
  hoverIcon?: IconName
  isDisabled: boolean
  title: string
  description: string
  isHidden?: boolean
  isApproval: boolean
  isTemplateSupported?: boolean
  isComingSoon?: boolean // Default to false
  stageProps?: T
  iconsStyle?: React.CSSProperties
  iconsProps?: Omit<IconProps, 'name'>
  minimal?: boolean
}

export abstract class PipelineStage<T = Record<string, unknown>> extends React.Component<PipelineStageProps<T>> {}
