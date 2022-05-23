/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import cx from 'classnames'
import {
  Card,
  Container,
  Icon,
  Layout,
  Select,
  SelectOption,
  Text,
  StackedSummaryInterface,
  StackedSummaryTable,
  handleZeroOrInfinityTrend,
  renderTrend,
  IconName
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { FontVariation, Color } from '@harness/design-system'
import { defaultTo } from 'lodash-es'
import type { TooltipFormatterContextObject } from 'highcharts'
import type { GetDataError } from 'restful-react'
import moment from 'moment'
import type { Error, Failure } from 'services/template-ng'
import { useLandingDashboardContext } from '@common/factories/LandingDashboardContext'
import { String, StringKeys, useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  ChartType,
  OverviewChartsWithToggle
} from '@common/components/OverviewChartsWithToggle/OverviewChartsWithToggle'
import routes from '@common/RouteDefinitions'
import {
  DeploymentsOverview,
  useGetDeploymentStatsOverview,
  TimeBasedStats,
  GetDeploymentStatsOverviewQueryParams,
  DeploymentsStatsOverview,
  ActiveServiceInfo
} from 'services/dashboard-service'
import { useErrorHandler } from '@pipeline/components/Dashboards/shared'
import DashboardAPIErrorWidget from '@projects-orgs/components/DashboardAPIErrorWidget/DashboardAPIErrorWidget'
import DashboardNoDataWidget from '@projects-orgs/components/DashboardNoDataWidget/DashboardNoDataWidget'

import type { TimeRangeSelectorProps } from '@common/components/TimeRangeSelector/TimeRangeSelector'
import css from './LandingDashboardDeploymentsWidget.module.scss'

export enum TimeRangeGroupByMapping {
  'DAY' = 'DAY',
  'WEEK' = 'WEEK',
  'MONTH' = 'MONTH'
}

const getGroupByValue = (timeRange: TimeRangeSelectorProps): TimeRangeGroupByMapping => {
  const startDate = moment(timeRange.range[0])
  const endDate = moment(timeRange.range[1])
  const diff = endDate.diff(startDate, 'day')

  if (diff <= 30) {
    return TimeRangeGroupByMapping.DAY
  } else if (diff > 30 && diff <= 90) {
    return TimeRangeGroupByMapping.WEEK
  }

  return TimeRangeGroupByMapping.MONTH
}

const sortByOptions: SelectOption[] = [
  { label: 'By Deployments', value: 'DEPLOYMENTS' },
  { label: 'By Instances', value: 'INSTANCES' }
]

export const renderTooltipContent = ({
  time,
  failureRate,
  count,
  successCount,
  failureCount
}: {
  time: string | number
  failureRate: string | number
  count?: number
  successCount?: number
  failureCount?: number
}) => {
  return `<div style="padding: 16px; color: white; width: 282px; height: 128px;">
      <div style="display: flex; justify-content: space-between; border-bottom: 0.5px solid rgba(243, 243, 250); padding-bottom: 7px; margin-bottom: 15px;">
        <div style="font-weight: normal; font-size: 12px; line-height: 18px; opacity: 0.8;">${time}</div>
        <div>
          <span style="white-space: pre; font-weight: bold; font-size: 12px; line-height: 18px; opacity: 0.8;">Deployments: </span>
          <span style="font-weight: bold; font-size: 12px; line-height: 18px;">${count}</span>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <div>
          <p style="font-weight: 500; font-size: 10px; line-height: 14px; letter-spacing: 0.2px; color: #D9DAE6; margin-bottom: 0px;">Failure Rate</p>
          <p style="font-weight: 600; font-size: 28px; line-height: 38px; color: #FBE6E4;">${failureRate}</p>
        </div>
        <div style="margin-right: 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <div style="height: 6px; width: 12px; background-color: #5FB34E; border-radius: 16px; display: inline-block; margin-right: 8px"></div>
            <span style="white-space: pre; font-weight: bold; font-size: 12px; line-height: 16px; letter-spacing: 0.2px; opacity: 0.8;">Success </span>
            <span style="font-weight: bold; font-size: 12px; line-height: 16px; letter-spacing: 0.2px;">${successCount}</span>
          </div>
          <div style="display: flex; align-items: center;">
            <div style="height: 6px; width: 12px; background-color: #EE5F54; border-radius: 16px; display: inline-block; margin-right: 8px"></div>
            <span style="white-space: pre; font-weight: bold; font-size: 12px; line-height: 18px; opacity: 0.8;">Failed </span>
            <span style="font-weight: bold; font-size: 12px; line-height: 18px;">${failureCount}</span>
          </div>
        </div>
      </div>
    </div>`
}

export const getTooltip = (currPoint: TooltipFormatterContextObject): string => {
  const custom = currPoint?.series?.userOptions?.custom
  const point: TimeBasedStats = custom?.[currPoint.key]
  const time =
    point && point?.time
      ? new Date(point?.time).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
      : currPoint.x
  let failureRate: string | number = 'Infinity'
  if (point?.countWithSuccessFailureDetails?.failureCount && point.countWithSuccessFailureDetails?.count) {
    failureRate =
      ((point.countWithSuccessFailureDetails.failureCount / point.countWithSuccessFailureDetails.count) * 100).toFixed(
        1
      ) + '%'
  }
  if (point?.countWithSuccessFailureDetails?.failureCount === 0) {
    failureRate = '0'
  }
  return renderTooltipContent({
    time,
    failureRate,
    count: point?.countWithSuccessFailureDetails?.count,
    successCount: point?.countWithSuccessFailureDetails?.successCount,
    failureCount: point?.countWithSuccessFailureDetails?.failureCount
  })
}

interface SummaryCardData {
  title: string
  count: string
  trend: string
}

function EmptyCard({ children }: { children: React.ReactElement }): JSX.Element {
  return (
    <Layout.Horizontal className={css.loaderContainer}>
      <Card className={css.loaderCard}>{children}</Card>
    </Layout.Horizontal>
  )
}

const showBadgesCard = (deploymentsOverview: DeploymentsOverview): boolean => {
  const deploymentsOverviewKeys = Object.keys(deploymentsOverview)
  if (Object.keys(deploymentsOverviewKeys).length === 0) {
    return false
  }
  const nonZeroDeploymentsOverviewKeys = deploymentsOverviewKeys.filter(
    key => (deploymentsOverview as any)[key].length > 0
  )
  return nonZeroDeploymentsOverviewKeys.length > 0
}

const getBadge = (type: string, stat: number): JSX.Element | null => {
  if (stat <= 0) {
    return null
  }
  switch (type) {
    case 'pendingManualInterventionExecutions':
      return (
        <div className={css.badge} key={type}>
          <Icon name="status-pending" size={16} color={Color.ORANGE_700} />
          <Text className={css.badgeText}>
            {`${stat} `}
            {stat > 1 ? (
              <String stringID={'pipeline.dashboardDeploymentsWidget.pendingManualIntervention.plural'} />
            ) : (
              <String stringID={'pipeline.dashboardDeploymentsWidget.pendingManualIntervention.singular'} />
            )}
          </Text>
        </div>
      )
    case 'pendingApprovalExecutions':
      return (
        <div className={css.badge} key={type}>
          <Icon name="status-pending" size={16} color={Color.ORANGE_700} />
          <Text className={css.badgeText}>
            {`${stat} `}
            {stat > 1 ? (
              <String stringID={'pipeline.dashboardDeploymentsWidget.pendingApproval.plural'} />
            ) : (
              <String stringID={'pipeline.dashboardDeploymentsWidget.pendingApproval.singular'} />
            )}
          </Text>
        </div>
      )
    case 'failed24HrsExecutions':
      return (
        <div className={cx(css.badge, css.failed24HrsExecutionsBadge)} key={type}>
          <Icon name="warning-sign" size={12} color={Color.RED_600} />
          <Text className={css.badgeText}>
            {`${stat} `}
            {stat > 1 ? (
              <String stringID={'pipeline.dashboardDeploymentsWidget.failed24Hrs.plural'} />
            ) : (
              <String stringID={'pipeline.dashboardDeploymentsWidget.failed24Hrs.singular'} />
            )}
          </Text>
        </div>
      )
    case 'runningExecutions':
      return (
        <div className={cx(css.badge, css.runningExecutions)} key={type}>
          <Icon name="status-running" size={16} color={Color.PRIMARY_7} />
          <Text className={css.badgeText}>
            {`${stat} `}
            {stat > 1 ? (
              <String stringID={'pipeline.dashboardDeploymentsWidget.runningPipeline.plural'} />
            ) : (
              <String stringID={'pipeline.dashboardDeploymentsWidget.runningPipeline.singular'} />
            )}
          </Text>
        </div>
      )
    default:
      return null
  }
}

const getFormattedNumber = (givenNumber?: number | string): string => {
  if (givenNumber) {
    if (givenNumber === 'Infinity') {
      return givenNumber
    } else if (givenNumber > 1000) {
      return Math.round(Number(givenNumber) / 1000) + 'K'
    } else if (givenNumber > 1000000) {
      return Math.round(Number(givenNumber) / 1000000) + 'M'
    }
    return Math.round(Number(givenNumber)).toString()
  }
  return '0'
}

const summaryCardRenderer = (cardData: SummaryCardData, groupByValue: string): JSX.Element => {
  let color = cardData.trend.includes('-') ? Color.RED_500 : Color.GREEN_500
  // Failure should be in Red
  if (cardData.title === 'Failure Rate') {
    color = cardData.trend.includes('-') ? Color.GREEN_500 : Color.RED_500
  }
  return (
    <Container className={css.summaryCard} key={cardData.title}>
      <Text font={{ size: 'medium' }} color={Color.GREY_700} className={css.cardTitle}>
        {cardData.title}
      </Text>
      <Layout.Horizontal>
        <Layout.Horizontal className={css.frequencyContainer}>
          <Text color={Color.BLACK} font={{ size: 'large', weight: 'bold' }} className={css.frequencyCount}>
            {cardData.count}
          </Text>
          {cardData.title === 'Deployment Frequency' && (
            <Text color={Color.GREY_700} font={{ size: 'small', weight: 'semi-bold' }} className={css.groupByValue}>
              {`/ ${groupByValue.toLocaleLowerCase()}`}
            </Text>
          )}
        </Layout.Horizontal>
        <Container className={css.trendContainer} flex>
          {isNaN(parseInt(cardData.trend)) ? (
            handleZeroOrInfinityTrend(cardData.trend, color)
          ) : (
            <Container flex>{renderTrend(cardData.trend, color)}</Container>
          )}
        </Container>
      </Layout.Horizontal>
    </Container>
  )
}

const getSummaryCardRenderers = (summaryCardsData: SummaryCardData[], groupByValue: string): JSX.Element => {
  return (
    <Container className={css.summaryCardsContainer}>
      {summaryCardsData?.map(currData => summaryCardRenderer(currData, groupByValue))}
    </Container>
  )
}

interface LandingDashboardDeploymentsNoContentWidgetProps {
  loading: boolean
  response: DeploymentsStatsOverview | undefined
  error: GetDataError<Failure | Error> | null
  count: number | undefined
  accountId: string
  refetch: any
}
function LandingDashboardDeploymentsNoContentWidget(
  props: LandingDashboardDeploymentsNoContentWidgetProps
): JSX.Element {
  const { loading, response, error, count, accountId, refetch } = props
  if (loading) {
    return (
      <EmptyCard>
        <Icon name="spinner" size={24} color={Color.PRIMARY_7} />
      </EmptyCard>
    )
  }

  if (!response || error) {
    return (
      <EmptyCard>
        <DashboardAPIErrorWidget className={css.apiErrorWidget} callback={refetch} iconProps={{ size: 90 }} />
      </EmptyCard>
    )
  }

  if (!count) {
    return (
      <EmptyCard>
        <DashboardNoDataWidget
          label={
            <Text color={Color.GREY_400} style={{ fontSize: '14px' }} margin="medium">
              {'No Deployments'}
            </Text>
          }
          getStartedLink={routes.toCDHome({ accountId })}
        />
      </EmptyCard>
    )
  }
  return <></>
}

const renderServiceTooltipRow = (iconName: IconName, label: StringKeys, value?: string) => {
  if (!value) {
    return <></>
  }
  return (
    <Layout.Horizontal padding={{ top: 'small' }} flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
      <Icon name={iconName} color={Color.GREY_300} margin={{ right: 'xsmall' }} />
      <Layout.Horizontal className={css.serviceTooltipRowLabel}>
        <Text inline color={Color.GREY_300}>
          <String stringID={label} />
        </Text>
        <Text color={Color.GREY_300} margin={{ right: 'xsmall' }}>
          :
        </Text>
      </Layout.Horizontal>

      <Text color={Color.WHITE}>{value}</Text>
    </Layout.Horizontal>
  )
}

const renderTooltipForServiceLabel = (service: ActiveServiceInfo): JSX.Element => {
  return (
    <Layout.Vertical padding="medium" spacing="small">
      <Text color={Color.WHITE}>{service?.serviceInfo?.serviceName ?? ''}</Text>
      {renderServiceTooltipRow('nav-project', 'projectLabel', service?.projectInfo?.projectName)}
      {renderServiceTooltipRow('union', 'common.org', service?.orgInfo?.orgName)}
    </Layout.Vertical>
  )
}

function LandingDashboardDeploymentsWidget(): React.ReactElement {
  const { getString } = useStrings()
  const { selectedTimeRange } = useLandingDashboardContext()
  const { accountId } = useParams<ProjectPathProps>()
  const [sortByValue, setSortByValue] = useState<GetDeploymentStatsOverviewQueryParams['sortBy']>('DEPLOYMENTS')
  const [selectedView, setSelectedView] = useState<ChartType>(ChartType.BAR)
  const getServiceDetailsLink = (service: ActiveServiceInfo): string => {
    const serviceId = defaultTo(service.serviceInfo?.serviceIdentifier, '')
    return routes.toServiceStudio({
      accountId,
      orgIdentifier: service.orgInfo?.orgIdentifier || '',
      projectIdentifier: service.projectInfo?.projectIdentifier || '',
      serviceId,
      module: 'cd'
    })
  }

  const groupByValue = getGroupByValue(selectedTimeRange)

  const { data, error, refetch, loading } = useGetDeploymentStatsOverview({
    queryParams: {
      accountIdentifier: accountId,
      startTime: selectedTimeRange.range[0]?.getTime() || 0,
      endTime: selectedTimeRange.range[1]?.getTime() || 0,
      groupBy: getGroupByValue(selectedTimeRange),
      sortBy: sortByValue
    }
  })

  const response = data?.data?.response

  useErrorHandler(error)

  const deploymentStatsData = useMemo(() => {
    const successData: number[] = []
    const failureData: number[] = []
    const custom: TimeBasedStats[] = []
    if (response?.deploymentsStatsSummary?.deploymentStats?.length) {
      response.deploymentsStatsSummary.deploymentStats.forEach(val => {
        successData.push(defaultTo(val.countWithSuccessFailureDetails?.successCount, 0))
        failureData.push(defaultTo(val.countWithSuccessFailureDetails?.failureCount, 0))
        custom.push(val)
      })
    }
    const successCount = successData.reduce((sum, i) => sum + i, 0)
    const failureCount = failureData.reduce((sum, i) => sum + i, 0)
    const successArr = {
      name: `Success (${successCount})`,
      data: successData,
      color: '#5FB34E',
      custom
    }
    const failureArr = {
      name: `Failed (${failureCount})`,
      data: failureData,
      color: '#EE5F54',
      custom
    }
    return selectedView === ChartType.BAR ? [failureArr, successArr] : [successArr, failureArr]
  }, [response?.deploymentsStatsSummary?.deploymentStats, selectedView])

  const summaryCardsData: SummaryCardData[] = useMemo(() => {
    return [
      {
        title: getString('deploymentsText'),
        count: getFormattedNumber(response?.deploymentsStatsSummary?.countAndChangeRate?.count),
        trend:
          getFormattedNumber(
            response?.deploymentsStatsSummary?.countAndChangeRate?.countChangeAndCountChangeRateInfo?.countChangeRate
          ) + '%'
      },
      {
        title: getString('common.failureRate'),
        count:
          getFormattedNumber(defaultTo(response?.deploymentsStatsSummary?.failureRateAndChangeRate?.rate, 0)) + '%',
        trend: getFormattedNumber(response?.deploymentsStatsSummary?.failureRateAndChangeRate?.rateChangeRate) + '%'
      },
      {
        title: getString('pipeline.deploymentFrequency'),
        count: getFormattedNumber(defaultTo(response?.deploymentsStatsSummary?.deploymentRateAndChangeRate?.rate, 0)),
        trend: getFormattedNumber(response?.deploymentsStatsSummary?.deploymentRateAndChangeRate?.rateChangeRate) + '%'
      }
    ]
  }, [response, getString])

  const mostActiveServicesData = useMemo(() => {
    const servicesData: StackedSummaryInterface[] | undefined = response?.mostActiveServicesList?.activeServices?.map(
      service => {
        return {
          label: defaultTo(defaultTo(service.serviceInfo?.serviceName, service.serviceInfo?.serviceIdentifier), ''),
          labelTooltip: renderTooltipForServiceLabel(service),
          labelLink: getServiceDetailsLink(service),
          tooltipProps: {
            isDark: true,
            fill: false,
            position: 'bottom'
          },
          barSectionsData:
            sortByValue === 'INSTANCES'
              ? [
                  {
                    count: defaultTo(service.countWithSuccessFailureDetails?.count, 0),
                    color: Color.GREEN_500
                  }
                ]
              : [
                  {
                    count: defaultTo(service.countWithSuccessFailureDetails?.successCount, 0),
                    color: Color.GREEN_500
                  },
                  {
                    count: defaultTo(service.countWithSuccessFailureDetails?.failureCount, 0),
                    color: Color.RED_500
                  }
                ],
          trend: `${Math.round(
            service.countWithSuccessFailureDetails?.countChangeAndCountChangeRateInfo?.countChangeRate ?? 0
          )}%`
        }
      }
    )
    if (sortByValue === 'INSTANCES') {
      return servicesData?.sort((a, b) => {
        return b.barSectionsData[0].count - a.barSectionsData[0].count
      })
    }
    return servicesData?.sort((a, b) => {
      return (
        b.barSectionsData[0].count +
        b.barSectionsData[1].count -
        (a.barSectionsData[0].count + a.barSectionsData[1].count)
      )
    })
  }, [response])

  const deploymentsStatsSummaryCount = response?.deploymentsStatsSummary?.countAndChangeRate?.count
  if (loading || !response || error || !deploymentsStatsSummaryCount) {
    return (
      <LandingDashboardDeploymentsNoContentWidget
        loading={loading}
        response={response}
        error={error}
        count={deploymentsStatsSummaryCount}
        refetch={refetch}
        accountId={accountId}
      />
    )
  }

  const noDataRenderer = () => {
    if (sortByValue === 'INSTANCES') {
      return (
        <div className={css.noDataContainer}>
          <Icon name="no-instances" size={55} className={css.noDataIcon} />
          No Service Instances in selected time range
        </div>
      )
    }
    return <div className={css.noDataContainer}>No Deployments in selected time range</div>
  }

  return (
    <div className={css.main}>
      {response?.deploymentsOverview && showBadgesCard(response?.deploymentsOverview) && (
        <Card className={css.badgesContainer}>
          {response?.deploymentsOverview &&
            Object.keys(response?.deploymentsOverview).map(key =>
              // eslint-disable-next-line
              getBadge(key, (response?.deploymentsOverview as any)[key].length)
            )}
        </Card>
      )}
      <div className={css.chartCardsContainer}>
        <Card style={{ width: '65%' }} className={css.deploymentsChartContainer}>
          <OverviewChartsWithToggle
            data={defaultTo(deploymentStatsData, [])}
            summaryCards={getSummaryCardRenderers(summaryCardsData, groupByValue)}
            updateSelectedView={setSelectedView}
            customChartOptions={{
              chart: {
                height: 225
              },
              tooltip: {
                stickOnContact: true,
                useHTML: true,
                formatter: function () {
                  return getTooltip(this)
                },
                backgroundColor: Color.BLACK,
                outside: true,
                borderColor: 'black'
              },
              xAxis: {
                title: {
                  text: 'Date'
                },
                labels: {
                  formatter: function (this) {
                    let time = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                    if (response?.deploymentsStatsSummary?.deploymentStats?.length) {
                      const val = response.deploymentsStatsSummary.deploymentStats[this.pos].time
                      time = val ? new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : time
                    }
                    return time
                  }
                }
              },
              yAxis: {
                title: {
                  text: '# of Deployments'
                }
              }
            }}
          />
        </Card>
        <Card className={css.mostActiveServicesContainer}>
          <Layout.Horizontal
            flex
            border={{ bottom: true }}
            height={54}
            className={css.mostActiveServicesHeaderContainer}
          >
            <Text font={{ variation: FontVariation.CARD_TITLE }} className={css.activeServicesTitle}>
              {getString('common.mostActiveServices')}
            </Text>
            <Select
              onChange={item => setSortByValue(item.value as GetDeploymentStatsOverviewQueryParams['sortBy'])}
              items={sortByOptions}
              className={css.servicesByDropdown}
              value={sortByOptions.find(option => option.value === sortByValue)}
            />
          </Layout.Horizontal>
          <div className={css.mostActiveServicesChartContainer}>
            <StackedSummaryTable
              // barLength={185}
              columnHeaders={['SERVICES', sortByValue]}
              summaryData={defaultTo(mostActiveServicesData, [])}
              noDataRenderer={noDataRenderer}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default LandingDashboardDeploymentsWidget
