/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { DropDown, FlexExpander, Layout, Text } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { QlceViewFilterOperator } from 'services/ce/services'
import { allCloudProvidersList } from '@ce/constants'
import PerspectiveTimeRangePicker from '@ce/components/PerspectiveTimeRangePicker/PerspectiveTimeRangePicker'
import type { setTimeRangeFn } from '@ce/types'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import css from '../../pages/anomalies-overview/AnomaliesOverviewPage.module.scss'

interface AnomalyFiltersProps {
  filters: Record<string, Record<string, string>>
  setFilters: any
  timeRange: {
    to: string
    from: string
  }
  setTimeRange: setTimeRangeFn
}

const AnomalyFilters: React.FC<AnomalyFiltersProps> = ({ filters, setFilters, timeRange, setTimeRange }) => {
  const { getString } = useStrings()
  const isDevFeature = useFeatureFlag(FeatureFlag.CCM_DEV_TEST)

  return (
    <Layout.Horizontal spacing="large" className={css.header}>
      <Layout.Horizontal spacing="large" style={{ alignItems: 'center' }}></Layout.Horizontal>
      <FlexExpander />
      {isDevFeature ? (
        <>
          <DropDown
            placeholder={getString('ce.anomalyDetection.filters.groupByCloudProvidersPlaceholder')}
            filterable={false}
            onChange={option => {
              setFilters('CLOUD_PROVIDER', QlceViewFilterOperator.In, option.value)
            }}
            addClearBtn={true}
            value={filters ? filters['CLOUD_PROVIDER']?.value : /* istanbul ignore next */ null}
            items={allCloudProvidersList}
          />
          <Text border={{ right: true, color: 'grey300' }} />
        </>
      ) : null}
      <PerspectiveTimeRangePicker timeRange={timeRange} setTimeRange={setTimeRange} />
    </Layout.Horizontal>
  )
}

export default AnomalyFilters
