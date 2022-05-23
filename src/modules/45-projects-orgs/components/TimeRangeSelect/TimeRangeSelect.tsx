/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useLandingDashboardContext } from '@common/factories/LandingDashboardContext'
import { TimeRangeSelector } from '@common/components/TimeRangeSelector/TimeRangeSelector'

interface TimeRangeSelectProps {
  className?: string
}

const TimeRangeSelect: React.FC<TimeRangeSelectProps> = () => {
  const { selectedTimeRange, selectTimeRange } = useLandingDashboardContext()

  return <TimeRangeSelector minimal timeRange={selectedTimeRange.range} setTimeRange={selectTimeRange} />
}

export default TimeRangeSelect
