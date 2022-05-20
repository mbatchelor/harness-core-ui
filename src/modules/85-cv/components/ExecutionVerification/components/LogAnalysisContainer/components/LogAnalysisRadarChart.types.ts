import type { GetDataError } from 'restful-react'
import type { EventCount, RestResponseListLogAnalysisRadarChartClusterDTO } from 'services/cv'
import type { MinMaxAngleState } from '../LogAnalysisView.container.types'

export interface LogAnalysisRadarChartProps {
  clusterChartLoading: boolean
  clusterChartData: RestResponseListLogAnalysisRadarChartClusterDTO | null
  handleAngleChange: (value: MinMaxAngleState) => void
  filteredAngle: MinMaxAngleState
  onRadarPointClick: (clusterId: string) => void
  clusterChartError?: GetDataError<unknown> | null
  refetchClusterAnalysis?: () => void
  logsLoading?: boolean
  showBaseline?: boolean
}

export interface MultiRangeSliderProps {
  min: number
  max: number
  step?: number
  onChange: (value: MinMaxAngleState) => void
}

export interface LogAnalysisRadarChartHeaderProps {
  eventsCount?: EventCount[]
  totalClustersCount?: number
}

interface MarkerData {
  color: string
  x?: number
  y?: number
}

export interface MarkerOption {
  name?: string
  data: MarkerData[]
  pointPlacement: string
  clusterId?: string
}

export type CommonChartProperties = 'chart' | 'title' | 'legend' | 'pane' | 'xAxis' | 'boost'
