/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { Container, Text, Icon, Layout } from '@wings-software/uicore'
import cx from 'classnames'
import { Color, FontVariation } from '@harness/design-system'
import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'

import { useParams } from 'react-router-dom'
import { Classes } from '@blueprintjs/core'
import merge from 'lodash-es/merge'
import moment from 'moment'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { roundNumber, useErrorHandler } from '@pipeline/components/Dashboards/shared'
import { useGetDeploymentHealth, DeploymentDateAndCount } from 'services/cd-ng'
import { PieChart, PieChartProps } from '@cd/components/PieChart/PieChart'

import { numberFormatter } from '@cd/components/Services/common'
import styles from './CDDashboardPage.module.scss'

export interface HealthCardProps {
  title: string
  text: any
  rate?: number
  primaryChartOptions?: any
  secondaryChartOptions?: any
  layout: 'vertical' | 'horizontal'
  isLoading?: boolean
  pieChartProps?: any
  showPieChart?: boolean
  showLineChart?: boolean
}

export default function DeploymentsHealthCards(props: any) {
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()
  const { range, title } = props

  const { data, loading, error } = useGetDeploymentHealth({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      startTime: range?.range[0]?.getTime() || 0,
      endTime: range?.range[1]?.getTime() || 0
    }
  })

  useErrorHandler(error)
  const { getString } = useStrings()
  const mapTime = (value: DeploymentDateAndCount) => (value?.time ? moment(value.time).format('YYYY-MM-DD') : '')

  const chartsData = useMemo(() => {
    if (data?.data?.healthDeploymentInfo) {
      const ret: any = {}
      if (data?.data?.healthDeploymentInfo?.total) {
        const { countList, production, nonProduction } = data?.data?.healthDeploymentInfo?.total || {}
        if (countList?.length) {
          ret.totalChartOptions = merge({}, defaultChartOptions, primaryChartOptions, {
            chart: {
              height: 40
            },
            xAxis: {
              categories: countList?.map(mapTime)
            },
            series: [
              {
                name: 'Deployments',
                type: 'line',
                color: 'var(--ci-color-blue-500)',
                data: countList?.map(val => val?.deployments?.count)
              }
            ]
          })
        }

        ret.totalBarChartOptions = merge({}, defaultChartOptions, secondaryChartOptions, {
          xAxis: {
            categories: [`Non Prod (${nonProduction})`, `Prod (${production})`]
          },
          series: [
            {
              type: 'bar',
              name: 'Non Prod',
              color: 'var(--grey-600)',
              data: [nonProduction, 0]
            },
            {
              type: 'bar',
              name: 'Prod',
              color: 'var(--grey-600)',
              data: [0, production]
            }
          ]
        })
      }
      if (data?.data?.healthDeploymentInfo?.success?.countList?.length) {
        ret.successChartOptions = merge({}, defaultChartOptions, primaryChartOptions, {
          xAxis: {
            categories: data.data.healthDeploymentInfo.success.countList.map(mapTime)
          },
          series: [
            {
              name: 'Deployments',
              type: 'line',
              color: 'var(--ci-color-blue-500)',
              data: data.data.healthDeploymentInfo.success.countList.map(val => val?.deployments?.count)
            }
          ]
        })
      }
      if (data?.data?.healthDeploymentInfo?.failure?.countList?.length) {
        ret.failureChartOptions = merge({}, defaultChartOptions, primaryChartOptions, {
          xAxis: {
            categories: data.data.healthDeploymentInfo.failure.countList.map(mapTime)
          },
          series: [
            {
              name: 'Deployments',
              type: 'line',
              color: 'var(--ci-color-blue-500)',
              data: data.data.healthDeploymentInfo.failure.countList.map(val => val?.deployments?.count)
            }
          ]
        })
      }
      return ret
    }
  }, [data])

  const pieChartProps: PieChartProps = {
    items: [
      {
        label: getString('cd.serviceDashboard.nonProd'),
        value: data?.data?.healthDeploymentInfo?.total?.nonProduction || 0,
        formattedValue: numberFormatter(data?.data?.healthDeploymentInfo?.total?.nonProduction),
        color: 'var(--primary-2)'
      },
      {
        label: getString('cd.serviceDashboard.prod'),
        value: data?.data?.healthDeploymentInfo?.total?.production || 0,
        formattedValue: numberFormatter(data?.data?.healthDeploymentInfo?.total?.production),
        color: 'var(--primary-7)'
      }
    ],
    size: 36,
    customCls: styles.topDepPiechart,
    showInRevOrder: true,

    options: {
      tooltip: {
        enabled: false
      }
    }
  }

  const labelsHtml = (
    <Layout.Vertical
      flex={{ alignItems: 'flex-end' }}
      height="100%"
      padding={{ top: 'xsmall', bottom: 'xsmall', right: 'large' }}
    >
      <ul>
        {pieChartProps.items.map(({ label, formattedValue, value, color }) => (
          <li style={{ fontWeight: 500, fontSize: 15, color }} key={`${label}_${value}`}>
            <Text font={{ size: 'xsmall' }} color={Color.GREY_500} key={label}>{`${label} (${
              formattedValue ? formattedValue : value
            })`}</Text>
          </li>
        ))}
      </ul>
    </Layout.Vertical>
  )

  pieChartProps['labelsContent'] = labelsHtml

  return (
    <Container>
      <Text className={styles.healthCardTitle}>{title}</Text>
      <Container className={styles.healthCards}>
        <HealthCard
          title="Total Deployments"
          text={data?.data?.healthDeploymentInfo?.total?.count}
          isLoading={loading}
          layout="vertical"
          primaryChartOptions={chartsData?.totalChartOptions}
          secondaryChartOptions={chartsData?.totalBarChartOptions}
          showLineChart={data?.data?.healthDeploymentInfo?.total?.count ? true : false}
          showPieChart={
            data?.data?.healthDeploymentInfo?.total?.nonProduction !== 0 ||
            data?.data?.healthDeploymentInfo?.total?.production !== 0
          }
          pieChartProps={pieChartProps}
        />
        <HealthCard
          title="Successful Deployments"
          text={data?.data?.healthDeploymentInfo?.success?.count}
          rate={data?.data?.healthDeploymentInfo?.success?.rate}
          isLoading={loading}
          layout="horizontal"
          primaryChartOptions={chartsData?.successChartOptions}
        />
        <HealthCard
          title="Failed Deployments"
          text={data?.data?.healthDeploymentInfo?.failure?.count}
          rate={data?.data?.healthDeploymentInfo?.failure?.rate}
          isLoading={loading}
          layout="horizontal"
          primaryChartOptions={chartsData?.failureChartOptions}
        />
      </Container>
    </Container>
  )
}

function TotalDepHealthCard({
  title,
  text,
  layout,
  isLoading,
  pieChartProps = {},
  showPieChart = false
}: HealthCardProps) {
  return (
    <Container
      font={{ variation: FontVariation.SMALL_SEMI }}
      color={Color.GREY_600}
      className={cx(styles.healthCard, styles.totalDepCard)}
    >
      <Container style={layout === 'horizontal' ? { display: 'flex', justifyContent: 'space-between' } : {}}>
        <Text className={styles.cardHeader}>{title}</Text>
        <Container className={styles.textAndRate}>
          {isLoading ? (
            <Container height={30} width={100} className={Classes.SKELETON} />
          ) : (
            <Text className={styles.cardText}>{text}</Text>
          )}
        </Container>
      </Container>
      <div className={styles.separator}></div>
      {showPieChart && (
        <Container className={styles.chartWrap}>
          <PieChart size={65} {...pieChartProps} />
        </Container>
      )}
    </Container>
  )
}

export function HealthCard({
  title,
  text,
  rate,
  primaryChartOptions,
  secondaryChartOptions,
  layout,
  isLoading,
  pieChartProps = {},
  showPieChart = false
}: HealthCardProps) {
  if (showPieChart) {
    return (
      <TotalDepHealthCard
        title={title}
        text={text}
        layout={layout}
        pieChartProps={pieChartProps}
        showPieChart={showPieChart}
      />
    )
  }

  return (
    <Container font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_600} className={styles.healthCard}>
      <Text className={styles.cardHeader}>{title}</Text>
      <Container style={layout === 'horizontal' ? { display: 'flex', justifyContent: 'space-between' } : {}}>
        <Container className={styles.textAndRate}>
          {isLoading ? (
            <Container height={30} width={100} className={Classes.SKELETON} />
          ) : (
            <Text className={styles.cardText}>{text}</Text>
          )}
        </Container>

        {primaryChartOptions && !isLoading && rate ? (
          <Container className={styles.chartWrap}>
            <HighchartsReact highcharts={Highcharts} options={primaryChartOptions} />
            {typeof rate === 'number' && rate && !isLoading ? (
              <Container flex>
                <Text
                  margin={{ left: 'xsmall' }}
                  style={{
                    color: rate >= 0 ? 'var(--green-600)' : 'var(--ci-color-red-500)'
                  }}
                >
                  {Math.abs(roundNumber(rate)!)}%
                </Text>
                <Icon
                  size={14}
                  name={rate >= 0 ? 'caret-up' : 'caret-down'}
                  style={{
                    color: rate >= 0 ? 'var(--green-600)' : 'var(--ci-color-red-500)'
                  }}
                />
              </Container>
            ) : null}
          </Container>
        ) : null}
        {secondaryChartOptions && !isLoading && rate ? (
          <Container className={styles.chartWrap} margin={{ top: 'large' }}>
            <HighchartsReact highcharts={Highcharts} options={secondaryChartOptions} />
            {typeof rate === 'number' && rate && !isLoading ? (
              <Container flex>
                <Text
                  margin={{ left: 'xsmall' }}
                  style={{
                    color: rate >= 0 ? 'var(--green-600)' : 'var(--ci-color-red-500)'
                  }}
                >
                  {Math.abs(roundNumber(rate)!)}%
                </Text>
                <Icon
                  size={14}
                  name={rate >= 0 ? 'caret-up' : 'caret-down'}
                  style={{
                    color: rate >= 0 ? 'var(--green-600)' : 'var(--ci-color-red-500)'
                  }}
                />
              </Container>
            ) : null}
          </Container>
        ) : null}
      </Container>
    </Container>
  )
}

const defaultChartOptions: Highcharts.Options = {
  chart: {
    animation: false,
    backgroundColor: 'transparent',
    height: 25,
    spacing: [5, 0, 5, 0]
  },
  credits: undefined,
  title: {
    text: ''
  },
  legend: {
    enabled: false
  },
  plotOptions: {
    series: {
      marker: {
        states: {
          hover: {
            enabled: false
          }
        },
        enabled: false,
        radius: 1
      }
    }
  },
  tooltip: {
    enabled: false,
    outside: true
  },
  xAxis: {
    title: {
      text: ''
    },
    labels: {
      enabled: false
    },
    gridLineWidth: 0,
    lineWidth: 0,
    tickLength: 0
  },
  yAxis: {
    labels: { enabled: false },
    title: {
      text: ''
    },
    gridLineWidth: 0,
    lineWidth: 0,
    tickLength: 0
  }
}

const primaryChartOptions: Highcharts.Options = {
  tooltip: {
    enabled: true
  },
  plotOptions: {
    line: {
      lineWidth: 2,
      marker: {
        enabled: false
      }
    }
  },
  yAxis: {
    min: -1
  }
}

const secondaryChartOptions: Highcharts.Options = {
  chart: {
    height: 80
  },
  plotOptions: {
    bar: {
      stacking: 'normal',
      pointPadding: 0,
      borderWidth: 3,
      borderRadius: 4,
      pointWidth: 20
    }
  },
  xAxis: {
    labels: {
      enabled: true,
      style: {
        fontSize: '8',
        color: '#9293AB',
        whiteSpace: 'nowrap',
        fontFamily: 'Inter, sans-serif'
      }
    }
  }
}
