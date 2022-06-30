import React from 'react'
import { Card } from '@harness/uicore'
import AppDMetricThresholdTab from './Components/AppDMetricThresholdTab'
import css from './AppDMetricThresholdContent.module.scss'

export default function AppDMetricThresholdContent(): JSX.Element {
  return (
    <Card className={css.appDMetricThresholdContentCard}>
      <AppDMetricThresholdTab />
    </Card>
  )
}
