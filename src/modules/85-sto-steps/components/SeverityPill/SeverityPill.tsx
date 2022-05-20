/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import classNames from 'classnames'
import { useStrings } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import { SeverityCode } from '@sto-steps/types'
import css from './SeverityPill.module.scss'

export interface SeverityPillProps {
  severity: SeverityCode
  value: number
}

export function severityString(severity: SeverityCode): keyof StringsMap {
  switch (severity) {
    case SeverityCode.Critical:
      return 'stoSteps.Critical'
    case SeverityCode.High:
      return 'connectors.cdng.verificationSensitivityLabel.high'
    case SeverityCode.Medium:
      return 'connectors.cdng.verificationSensitivityLabel.medium'
    case SeverityCode.Low:
      return 'connectors.cdng.verificationSensitivityLabel.low'
    case SeverityCode.Info:
      return 'stoSteps.Info'
  }
  return 'stoSteps.Unassigned'
}

const SeverityPill: React.FC<SeverityPillProps> = ({ severity, value }) => {
  const { getString } = useStrings()

  const severityClass = severity.toLowerCase() as keyof typeof css

  return (
    <div className={css.main}>
      <div className={css.label}>{getString(severityString(severity))}</div>
      <div className={classNames(css.value, css[severityClass])}>{value}</div>
    </div>
  )
}

export default SeverityPill
