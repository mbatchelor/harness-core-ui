/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Icon, NoDataCard, PageError, MultiSelectOption } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import {
  GetAllRadarChartLogsClusterDataQueryParams,
  GetAllRadarChartLogsDataQueryParams,
  useGetAllRadarChartLogsClusterData,
  useGetAllRadarChartLogsData
} from 'services/cv'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import LogAnalysis from '@cv/components/ExecutionVerification/components/LogAnalysisContainer/LogAnalysis'
import noDataImage from '@cv/assets/noData.svg'
import type { ClusterTypesServiceScreen, LogAnalysisContentProps } from './LogAnalysis.types'
import type { MinMaxAngleState } from '../ExecutionVerification/components/LogAnalysisContainer/LogAnalysisView.container.types'
import { getClusterTypes } from '../ExecutionVerification/components/LogAnalysisContainer/LogAnalysis.utils'
import type { EventTypeFullName } from '../ExecutionVerification/components/LogAnalysisContainer/LogAnalysis.constants'
import LogFilters from './components/LogFilters/LogFilters'
import { RadarChartAngleLimits } from '../ExecutionVerification/components/LogAnalysisContainer/LogAnalysisView.container.constants'
import css from './LogAnalysis.module.scss'

export const LogAnalysisContent: React.FC<LogAnalysisContentProps> = ({
  monitoredServiceIdentifier,
  startTime,
  endTime
}) => {
  const { getString } = useStrings()
  const { orgIdentifier, projectIdentifier, accountId } = useParams<ProjectPathProps>()

  const isFirstFilterCall = useRef(true)

  const [clusterTypeFilters, setClusterTypeFilters] = useState<ClusterTypesServiceScreen>(
    (): ClusterTypesServiceScreen => {
      return getClusterTypes(getString).map(i => i.value) as ClusterTypesServiceScreen
    }
  )

  const [minMaxAngle, setMinMaxAngle] = useState({ min: RadarChartAngleLimits.MIN, max: RadarChartAngleLimits.MAX })
  const [selectedHealthSources, setSelectedHealthSources] = useState<MultiSelectOption[]>([])

  const [logsDataQueryParams, setLogsDataQueryParams] = useState<GetAllRadarChartLogsDataQueryParams>(
    (): GetAllRadarChartLogsDataQueryParams => {
      return {
        accountId,
        pageNumber: 0,
        pageSize: 10,
        orgIdentifier,
        projectIdentifier,
        monitoredServiceIdentifier,
        minAngle: minMaxAngle.min,
        maxAngle: minMaxAngle.max,
        startTime,
        endTime,
        clusterTypes: clusterTypeFilters?.length ? clusterTypeFilters : undefined,
        healthSources: selectedHealthSources.length
          ? (selectedHealthSources.map(item => item.value) as string[])
          : undefined
      }
    }
  )

  const [radarChartDataQueryParams, setRadarChartDataQueryParams] =
    useState<GetAllRadarChartLogsClusterDataQueryParams>((): GetAllRadarChartLogsClusterDataQueryParams => {
      return {
        accountId,
        orgIdentifier,
        projectIdentifier,
        monitoredServiceIdentifier,
        startTime,
        endTime,
        clusterTypes: clusterTypeFilters?.length ? clusterTypeFilters : undefined,
        healthSources: selectedHealthSources.length
          ? (selectedHealthSources.map(item => item.value) as string[])
          : undefined
      }
    })

  const {
    data: logsData,
    refetch: fetchLogAnalysis,
    loading: logsLoading,
    error: logsError
  } = useGetAllRadarChartLogsData({
    queryParams: logsDataQueryParams,
    queryParamStringifyOptions: {
      arrayFormat: 'repeat'
    }
  })

  const {
    data: clusterChartData,
    loading: clusterChartLoading,
    error: clusterChartError,
    refetch: fetchClusterAnalysis
  } = useGetAllRadarChartLogsClusterData({
    queryParams: radarChartDataQueryParams,
    queryParamStringifyOptions: {
      arrayFormat: 'repeat'
    }
  })

  useEffect(() => {
    if (!isFirstFilterCall.current) {
      setLogsDataQueryParams({
        ...logsDataQueryParams,
        minAngle: minMaxAngle.min,
        maxAngle: minMaxAngle.max
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minMaxAngle])

  useEffect(() => {
    if (!isFirstFilterCall.current) {
      const updatedQueryParams = {
        clusterTypes: clusterTypeFilters?.length ? clusterTypeFilters : undefined,
        healthSources: selectedHealthSources.length
          ? (selectedHealthSources.map(item => item.value) as string[])
          : undefined,
        startTime,
        endTime
      }

      const updatedLogsDataParams = {
        ...logsDataQueryParams,
        ...updatedQueryParams
      }

      const updatedRadarChartDataParams = {
        ...radarChartDataQueryParams,
        ...updatedQueryParams
      }

      setLogsDataQueryParams(updatedLogsDataParams)
      setRadarChartDataQueryParams(updatedRadarChartDataParams)
      setMinMaxAngle({ min: RadarChartAngleLimits.MIN, max: RadarChartAngleLimits.MAX })
    } else {
      isFirstFilterCall.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterTypeFilters, selectedHealthSources, startTime, endTime])

  const handleClustersFilterChange = useCallback((checked: boolean, filterName: EventTypeFullName): void => {
    setClusterTypeFilters(currentFilters => {
      if (checked) {
        return [...(currentFilters as EventTypeFullName[]), filterName]
      } else {
        return currentFilters?.filter((item: string) => item !== filterName)
      }
    })
  }, [])

  /* istanbul ignore next */
  const goToLogsPage = useCallback(
    pageNumber => {
      fetchLogAnalysis({
        queryParams: { ...logsDataQueryParams, pageNumber }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logsDataQueryParams]
  )

  const handleHealthSourceChange = useCallback(selectedHealthSourceFitlers => {
    setSelectedHealthSources(selectedHealthSourceFitlers)
  }, [])

  const handleMinMaxChange = useCallback((updatedAngle: MinMaxAngleState): void => {
    setMinMaxAngle({ ...updatedAngle })
  }, [])

  const getContents = (): JSX.Element => {
    if (logsLoading && clusterChartLoading) {
      return (
        <Container
          flex={{ justifyContent: 'center' }}
          className={css.loadingContainer}
          data-testid="LogAnalysis-loading-spinner"
        >
          <Icon name="steps-spinner" color={Color.GREY_400} size={30} />
        </Container>
      )
    }

    if (logsError) {
      return <PageError message={getErrorMessage(logsError)} onClick={() => fetchLogAnalysis()} />
    }

    if (!logsData?.resource?.logAnalysisRadarCharts?.content?.length && !clusterChartData?.resource?.length) {
      return (
        <NoDataCard
          message={getString('cv.monitoredServices.noAvailableData')}
          image={noDataImage}
          containerClassName={css.logsAnalysisNoDataServicePage}
        />
      )
    }

    return (
      <>
        <LogAnalysis
          data={logsData}
          clusterChartData={clusterChartData}
          filteredAngle={minMaxAngle}
          logsLoading={logsLoading}
          logsError={logsError}
          refetchLogAnalysis={fetchLogAnalysis}
          refetchClusterAnalysis={fetchClusterAnalysis}
          clusterChartError={clusterChartError}
          clusterChartLoading={clusterChartLoading}
          goToPage={goToLogsPage}
          handleAngleChange={handleMinMaxChange}
          startTime={startTime}
          endTime={endTime}
          monitoredServiceIdentifier={monitoredServiceIdentifier}
          isServicePage
        />
      </>
    )
  }

  return (
    <>
      <LogFilters
        clusterTypeFilters={clusterTypeFilters}
        onFilterChange={handleClustersFilterChange}
        onHealthSouceChange={handleHealthSourceChange}
        monitoredServiceIdentifier={monitoredServiceIdentifier}
        selectedHealthSources={selectedHealthSources}
      />
      {getContents()}
    </>
  )
}
