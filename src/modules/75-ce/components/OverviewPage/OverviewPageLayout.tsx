/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactNode, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import cx from 'classnames'
import { Container, Icon, Layout, Text, Utils } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import routes from '@common/RouteDefinitions'
import { CE_COLOR_CONST, getRadialChartOptions } from '@ce/components/CEChart/CEChartOptions'
import CEChart from '@ce/components/CEChart/CEChart'
import formatCost from '@ce/utils/formatCost'
import { CCM_CHART_TYPES } from '@ce/constants'
import { useStrings } from 'framework/strings'
import CostTrend from '@ce/common/CostTrend'

import css from './OverviewPage.module.scss'

export const LEGEND_LIMIT = 5

export enum ListType {
  KEY_ONLY,
  KEY_VALUE
}

export interface Stats {
  label: string
  value: number
  trend: number
  legendColor: string
  count?: number
  linkId?: string | null
}

interface LayoutProps {
  title: string
  chartData: Stats[]
  totalCost: Stats
  showTrendInChart?: boolean
  seeAll?: ReactNode
}

interface VerticalLayoutProps extends LayoutProps {
  footer?: React.ReactNode
}

interface HorizontalLayoutProps extends LayoutProps {
  sideBar?: React.ReactNode
  showGist?: boolean
  chartSize?: number
  headingSize?: any
  dataTooltipId?: string
  strokeSize?: string
}

interface CardProps {
  classNames?: string
}

interface CostDistributionRadialChartProps {
  data: Stats[]
  colors?: string[]
  classNames?: string
  chartSize?: { height: number; width: number }
  gist: React.ReactNode
  strokeSize?: string
}

interface GistProps {
  showTrend?: boolean
  label?: string
  totalCostFontSize: string
  totalCost: Stats
}

interface LegendProps {
  color: string
  label: React.ReactNode
}

interface EfficiencyScoreProps {
  title?: string
  score: number
  trend: number
}

interface ListProps {
  data: Stats[]
  type?: ListType
  classNames?: string
  showCost?: boolean
  showCount?: boolean
}

interface ChartTypeProps {
  chartType: CCM_CHART_TYPES
  setChartType: React.Dispatch<React.SetStateAction<CCM_CHART_TYPES>>
}

const getNumberOfDigits = (num = 0) => {
  if (num % 1 != 0) {
    const parts = num.toString().split('.')
    return parts[0].length + parts[1].length
  }

  return num.toString().length
}

export const VerticalLayout = (props: VerticalLayoutProps) => {
  const { title, chartData, totalCost, footer, showTrendInChart, seeAll } = props
  const len = getNumberOfDigits(+(totalCost?.value || 0).toFixed(2))
  const totalCostFontSize = len >= 7 ? '20px' : '24px'

  return (
    <div className={css.verticalLayout}>
      <Layout.Horizontal style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text color="grey800" font={{ weight: 'semi-bold', size: 'medium' }}>
          {title}
        </Text>
        {seeAll}
      </Layout.Horizontal>
      <div className={css.centerChart}>
        <CostDistributionRadialChart
          data={chartData}
          gist={<Gist totalCostFontSize={totalCostFontSize} totalCost={totalCost} showTrend={showTrendInChart} />}
        />
      </div>
      {footer}
    </div>
  )
}

export const HorizontalLayout = (props: HorizontalLayoutProps) => {
  const {
    title,
    chartData,
    totalCost,
    sideBar,
    showTrendInChart,
    seeAll,
    showGist = true,
    chartSize = 200,
    headingSize = 'medium',
    dataTooltipId = '',
    strokeSize = '80%'
  } = props
  const len = getNumberOfDigits(+(totalCost.value || 0).toFixed(2))
  const totalCostFontSize = len >= 7 ? '15px' : '18px'

  return (
    <div className={css.horizontalLayout}>
      <Layout.Horizontal style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          tooltipProps={{ dataTooltipId: dataTooltipId }}
          color="grey800"
          font={{ weight: 'semi-bold', size: headingSize }}
        >
          {title}
        </Text>
        {seeAll}
      </Layout.Horizontal>
      <div className={css.cols}>
        <CostDistributionRadialChart
          data={chartData}
          chartSize={{ height: chartSize, width: chartSize }}
          strokeSize={strokeSize}
          gist={
            showGist ? (
              <Gist totalCostFontSize={totalCostFontSize} totalCost={totalCost} showTrend={showTrendInChart} />
            ) : null
          }
        />
        {sideBar}
      </div>
    </div>
  )
}

const CostDistributionRadialChart = (props: CostDistributionRadialChartProps) => {
  const { data, colors = CE_COLOR_CONST, chartSize, gist, strokeSize } = props
  const options = useMemo(
    () =>
      getRadialChartOptions(
        data as any,
        colors,
        {
          chart: chartSize,
          plotOptions: {
            pie: { color: Utils.getRealCSSColor(Color.GREY_100), fillColor: Utils.getRealCSSColor(Color.GREY_100) }
          }
        },
        strokeSize
      ),
    [data, colors]
  )

  return (
    <div className={css.chartContainer}>
      <CEChart options={options} />
      <div className={css.gist}>{gist}</div>
    </div>
  )
}

const Gist = (props: GistProps) => {
  const { getString } = useStrings()
  const { label = getString('ce.overview.totalCost'), showTrend = true, totalCostFontSize, totalCost } = props
  return (
    <Layout.Vertical spacing="small" style={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Text color="grey600" font="small">
        {label}
      </Text>
      <Text color="grey800" font={{ weight: 'bold' }} style={{ fontSize: totalCostFontSize }}>
        {formatCost(totalCost?.value)}
      </Text>
      {showTrend && <CostTrend value={totalCost?.trend} defaultIcon="caret-down" />}
    </Layout.Vertical>
  )
}

export const EfficiencyScore = (props: EfficiencyScoreProps) => {
  const { getString } = useStrings()
  const { title = getString('ce.overview.cardtitles.efficiencyScore'), score, trend } = props
  return (
    <div className={css.efficienyScore}>
      <Layout.Vertical>
        <Text tooltipProps={{ dataTooltipId: 'overviewCostEfficiencyScore' }}>{title}</Text>
        <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
          <Text color="grey800" font={{ weight: 'bold' }} style={{ fontSize: 24 }}>
            {score || '-'}
          </Text>
          <CostTrend value={trend} flipColors defaultIcon="caret-up" />
        </Layout.Horizontal>
      </Layout.Vertical>
    </div>
  )
}

const Legend = (props: LegendProps) => {
  const { color, label } = props
  return (
    <Layout.Horizontal spacing="small" style={{ alignItems: 'center' }}>
      <div className={css.legendColor} style={{ background: color }}></div>
      {label}
    </Layout.Horizontal>
  )
}

export const FlexList = (props: ListProps) => {
  const { accountId } = useParams<{ accountId: string }>()
  const { data = [], type = ListType.KEY_ONLY, classNames } = props

  const renderLegend = (item: Stats) => {
    return (
      <Legend
        color={item.legendColor as string}
        label={
          item.linkId ? (
            <Link
              to={routes.toPerspectiveDetails({
                accountId: accountId,
                perspectiveId: item.linkId,
                perspectiveName: item.linkId
              })}
            >
              <Text inline color="primary7" font="small" lineClamp={1} style={{ width: 100 }}>
                {item.label}
              </Text>
            </Link>
          ) : (
            <Text color="grey800" font="small" lineClamp={1} style={{ width: 100 }}>
              {item.label}
            </Text>
          )
        }
      />
    )
  }

  const renderItem = (item: Stats, idx: number) => {
    if (type === ListType.KEY_VALUE) {
      return (
        <Layout.Horizontal key={idx} spacing="large" style={{ alignItems: 'center' }}>
          {renderLegend(item)}
          <Text color="grey600" font="small" lineClamp={1} style={{ width: 90 }}>
            {formatCost(item.value)}
          </Text>
        </Layout.Horizontal>
      )
    }

    return (
      <Container padding={{ top: 'small' }} key={idx}>
        {renderLegend(item)}
      </Container>
    )
  }

  return <div className={cx(css.flexList, classNames)}>{data.map(renderItem)}</div>
}

export const TableList = (props: ListProps) => {
  const { accountId } = useParams<{ accountId: string }>()
  const { data = [], type = ListType.KEY_ONLY, classNames, showCost = true, showCount = true } = props

  const renderLegend = (item: Stats) => {
    return (
      <Legend
        color={item.legendColor as string}
        label={
          item.linkId ? (
            <Link
              to={routes.toPerspectiveDetails({
                accountId: accountId,
                perspectiveId: item.linkId,
                perspectiveName: item.linkId
              })}
            >
              <Text inline color="primary7" font="small" lineClamp={1} style={{ maxWidth: 100 }}>
                {item.label}
              </Text>
            </Link>
          ) : (
            <Text color="grey800" font="small" lineClamp={1} style={{ maxWidth: 100 }}>
              {item.label}
            </Text>
          )
        }
      />
    )
  }

  const renderItem = (item: Stats, idx: number) => {
    if (type === ListType.KEY_VALUE) {
      return (
        <tr key={idx}>
          <td>{renderLegend(item)}</td>
          <td className={css.radialChartTable}>
            <Text color="grey600" font="small" lineClamp={1} style={{ maxWidth: 90 }}>
              {showCost ? formatCost(item.value) : item.count}
            </Text>
            {item.count && showCount && showCost ? (
              <Text color="grey600" font="small" lineClamp={1} style={{ maxWidth: 90 }}>
                {`(${item.count})`}
              </Text>
            ) : null}
          </td>
        </tr>
      )
    }

    return (
      <tr key={idx}>
        <td>{renderLegend(item)}</td>
      </tr>
    )
  }

  return <table className={cx(css.tableList, classNames)}>{data.map(renderItem)}</table>
}

export const Loader = (props: { className?: string }) => {
  return (
    <Container className={cx(css.chartLoadingContainer, props.className)}>
      <Icon name="spinner" color="blue500" size={30} />
    </Container>
  )
}

export const Card: React.FC<CardProps> = props => {
  return <div className={cx(css.card, props.classNames)}>{props.children}</div>
}

export const ChartTypes: React.FC<ChartTypeProps> = ({ chartType, setChartType }) => {
  return (
    <Layout.Horizontal
      spacing="small"
      style={{
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}
    >
      <Icon
        style={{ cursor: 'pointer ' }}
        name="timeline-area-chart"
        onClick={() => {
          setChartType(CCM_CHART_TYPES.AREA)
        }}
        size={20}
        color={chartType === CCM_CHART_TYPES.AREA ? 'primary7' : 'grey400'}
      />
      <Icon
        style={{ cursor: 'pointer ' }}
        name="timeline-bar-chart"
        onClick={() => {
          setChartType(CCM_CHART_TYPES.COLUMN)
        }}
        size={18}
        color={chartType === CCM_CHART_TYPES.COLUMN ? 'primary7' : 'grey400'}
      />
    </Layout.Horizontal>
  )
}
