/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { Icon } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'

import type { ExecutionStatus } from '@pipeline/utils/statusHelpers'
import { String } from 'framework/strings'
import type { StringKeys } from 'framework/strings'

import css from './ExecutionStatusLabel.module.scss'

export const stringsMap: Record<ExecutionStatus, StringKeys> = {
  Aborted: 'pipeline.executionStatus.Aborted',
  Discontinuing: 'pipeline.executionStatus.Aborted',
  Running: 'pipeline.executionStatus.Running',
  AsyncWaiting: 'pipeline.executionStatus.Running',
  TaskWaiting: 'pipeline.executionStatus.Running',
  TimedWaiting: 'pipeline.executionStatus.Running',
  Failed: 'pipeline.executionStatus.Failed',
  Errored: 'pipeline.executionStatus.Failed',
  NotStarted: 'pipeline.executionStatus.NotStarted',
  Expired: 'pipeline.executionStatus.Expired',
  Queued: 'pipeline.executionStatus.Queued',
  Paused: 'pipeline.executionStatus.Paused',
  ResourceWaiting: 'pipeline.executionStatus.Waiting',
  Skipped: 'pipeline.executionStatus.Skipped',
  Success: 'pipeline.executionStatus.Success',
  IgnoreFailed: 'pipeline.executionStatus.Success',
  Suspended: 'pipeline.executionStatus.Suspended',
  Pausing: 'pipeline.executionStatus.Pausing',
  ApprovalRejected: 'pipeline.executionStatus.ApprovalRejected',
  InterventionWaiting: 'pipeline.executionStatus.Waiting',
  ApprovalWaiting: 'pipeline.executionStatus.Waiting',
  Waiting: 'pipeline.executionStatus.Waiting'
}

export const iconMap: Record<ExecutionStatus, IconProps> = {
  Success: { name: 'tick-circle', size: 9 },
  IgnoreFailed: { name: 'tick-circle', size: 9 },
  Paused: { name: 'pause', size: 12 },
  Pausing: { name: 'pause', size: 12 },
  Failed: { name: 'warning-sign', size: 9 },
  Errored: { name: 'warning-sign', size: 9 },
  InterventionWaiting: { name: 'time', size: 9 },
  ResourceWaiting: { name: 'time', size: 9 },
  ApprovalWaiting: { name: 'time', size: 9 },
  AsyncWaiting: { name: 'loading', size: 10 },
  TaskWaiting: { name: 'loading', size: 10 },
  TimedWaiting: { name: 'loading', size: 10 },
  Running: { name: 'loading', size: 10 },
  Aborted: { name: 'circle-stop', size: 9 },
  Discontinuing: { name: 'circle-stop', size: 9 },
  Expired: { name: 'expired', size: 9 },
  Suspended: { name: 'banned', size: 9 },
  ApprovalRejected: { name: 'x', size: 8 },
  Queued: { name: 'queued', size: 10 },
  NotStarted: { name: 'play-outline', size: 8 },
  Skipped: { name: 'skipped', size: 8 },
  Waiting: { name: 'loading', size: 10 }
}

export interface ExecutionStatusLabelProps {
  status?: ExecutionStatus
  className?: string
  label?: string
}

export default function ExecutionStatusLabel({
  status,
  className,
  label
}: ExecutionStatusLabelProps): React.ReactElement | null {
  if (!status) return null

  return (
    <div className={cx(css.status, css[status.toLowerCase() as keyof typeof css], className)}>
      {iconMap[status] ? <Icon {...iconMap[status]} className={css.icon} /> : null}
      {label ? label : <String stringID={stringsMap[status] || 'pipeline.executionStatus.Unknown'} />}
    </div>
  )
}
