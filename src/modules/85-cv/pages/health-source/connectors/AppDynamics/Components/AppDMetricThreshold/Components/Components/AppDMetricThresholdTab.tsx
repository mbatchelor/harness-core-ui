import React from 'react'
import { Tabs } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import AppDIgnoreThresholdTabContent from './AppDIgnoreThresholdTabContent'
import AppDFailFastThresholdTabContent from './AppDFailFastThresholdTabContent'
import css from '../AppDMetricThresholdContent.module.scss'

export default function AppDMetricThresholdTab(): JSX.Element {
  const { getString } = useStrings()

  return (
    <Tabs
      id={'horizontalTabs'}
      defaultSelectedTabId={getString('cv.monitoringSources.appD.ignoreThresholds')}
      className={css.appDMetricThresholdContentTabs}
      tabList={[
        {
          id: getString('cv.monitoringSources.appD.ignoreThresholds'),
          title: getString('cv.monitoringSources.appD.ignoreThresholds'),
          panel: <AppDIgnoreThresholdTabContent />
        },
        {
          id: getString('cv.monitoringSources.appD.failFastThresholds'),
          title: getString('cv.monitoringSources.appD.failFastThresholds'),
          panel: <AppDFailFastThresholdTabContent />
        }
      ]}
    />
  )
}
