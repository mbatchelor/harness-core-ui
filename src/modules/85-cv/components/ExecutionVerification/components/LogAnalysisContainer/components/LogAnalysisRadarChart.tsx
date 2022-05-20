/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useMemo } from 'react'
import { Container, Icon, NoDataCard, Layout, Text, PageError } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import Boost from 'highcharts/modules/boost'
import noDataImage from '@cv/assets/noData.svg'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { useStrings } from 'framework/strings'
import type { LogAnalysisRadarChartProps } from './LogAnalysisRadarChart.types'
import MultiRangeSlider from './MinMaxSlider'
import {
  getRadarChartSeries,
  getLogAnalysisSpiderChartOptions,
  getLogAnalysisSpiderChartOptionsWithoutBaseline
} from './LogAnalysisRadarChart.utils'
import styles from '../LogAnalysis.module.scss'

Boost(Highcharts)

const LogAnalysisRadarChart: React.FC<LogAnalysisRadarChartProps> = ({
  clusterChartLoading,
  clusterChartData,
  handleAngleChange,
  filteredAngle,
  onRadarPointClick,
  clusterChartError,
  refetchClusterAnalysis,
  logsLoading,
  showBaseline = true
}) => {
  const radarChartSeries = getRadarChartSeries(clusterChartData?.resource || [])

  const filteredSeries = useMemo(
    () =>
      radarChartSeries?.filter(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        data => data?.data[0].x >= filteredAngle.min && data?.data[0].x <= filteredAngle.max
      ),
    [filteredAngle, radarChartSeries]
  )

  const { getString } = useStrings()

  const handleRadarPointClick = useCallback((pointClusterId: string) => {
    // As it is related to Highcharts cluster click, it is ignored for coverage
    /* istanbul ignore next */
    onRadarPointClick(pointClusterId)
  }, [])

  const highchartsConfigOptions = useMemo(() => {
    if (showBaseline) {
      return getLogAnalysisSpiderChartOptions(filteredSeries, filteredAngle, handleRadarPointClick)
    } else {
      return getLogAnalysisSpiderChartOptionsWithoutBaseline(filteredSeries, filteredAngle, handleRadarPointClick)
    }
  }, [showBaseline, filteredSeries, filteredAngle, handleRadarPointClick])

  if (clusterChartLoading) {
    return (
      <Container className={styles.loading} data-testid="RadarChart_loading">
        <Icon name="steps-spinner" color={Color.GREY_400} size={30} />
      </Container>
    )
  } else if (clusterChartError) {
    return (
      <Container data-testid="RadarChart_error">
        <PageError
          message={getErrorMessage(clusterChartError)}
          onClick={refetchClusterAnalysis}
          className={styles.noData}
        />
      </Container>
    )
  } else if (!clusterChartData?.resource?.length && !logsLoading) {
    return (
      <Container className={styles.noData}>
        <NoDataCard message={getString('cv.monitoredServices.noMatchingData')} image={noDataImage} />
      </Container>
    )
  } else {
    return (
      <>
        <HighchartsReact highcharts={Highcharts} options={highchartsConfigOptions} />
        <MultiRangeSlider min={0} max={360} step={30} onChange={handleAngleChange} />
        <Layout.Horizontal>
          <Icon margin={{ right: 'small' }} name="main-issue" color={Color.PRIMARY_7} />
          <Text color={Color.GREY_600} font={{ variation: FontVariation.SMALL }}>
            {getString('cv.logs.radarChartInfo')}
          </Text>
        </Layout.Horizontal>
      </>
    )
  }
}

export default React.memo(LogAnalysisRadarChart)
