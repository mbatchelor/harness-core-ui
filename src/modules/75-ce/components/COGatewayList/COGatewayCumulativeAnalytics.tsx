/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

// import { ProgressBar } from '@blueprintjs/core'
import React from 'react'
import { isEmpty as _isEmpty, defaultTo as _defaultTo } from 'lodash-es'
import { Container, HarnessDocTooltip, Heading, Icon, Layout, Text } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { String, useStrings } from 'framework/strings'
import type { CumulativeSavings } from 'services/lw'
import { RulesMode } from '@ce/constants'
import EmptyView from '@ce/images/empty-state.svg'
import { getEmissionsValue } from '@ce/utils/formatResourceValue'
import greenLeaf from '@ce/common/images/green-leaf.svg'
import grayLeaf from '@ce/common/images/gray-leaf.svg'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { geGaugeChartOptionsWithoutLabel, getDay } from './Utils'
import css from './COGatewayCumulativeAnalytics.module.scss'

interface COGatewayCumulativeAnalyticsProps {
  data: CumulativeSavings | undefined
  loadingData: boolean
  mode: RulesMode
}

const toFixedDecimalNumber = (num: number, decimalPlaces = 2) => Number(num.toFixed(decimalPlaces))

function getStackedAreaChartOptions(
  title: string,
  categories: string[],
  yAxisText: string,
  savingsData: number[],
  spendData: number[],
  mode: RulesMode
): Highcharts.Options {
  let step = 1
  if (categories && categories.length) {
    categories = categories.map(x => getDay(x, 'YYYY-MM-DDTHH:mm:ssZ'))
    step = Math.ceil(categories.length * 0.25)
  }
  savingsData = _defaultTo(
    savingsData.map(n => toFixedDecimalNumber(n)),
    []
  )
  spendData = _defaultTo(
    spendData.map(n => toFixedDecimalNumber(n)),
    []
  )
  return {
    chart: {
      type: 'spline',
      height: 180,
      spacing: [5, 20, 5, 5]
    },
    colors: ['rgba(71, 213, 223)', 'rgba(124, 77, 211,0.05)'],
    title: {
      text: title
    },
    xAxis: {
      categories: categories,
      labels: {
        step: step
      },
      units: [['day', [1]]],
      startOnTick: true,
      tickmarkPlacement: 'on'
    },
    yAxis: {
      // min: 0,
      title: {
        text: yAxisText
      },
      labels: {
        format: '${value}'
      }
    },
    credits: {
      enabled: false
    },
    tooltip: {
      pointFormat: '{series.name}: ${point.y}<br/>'
    },
    plotOptions: {
      area: {
        stacking: 'normal',
        pointPlacement: 'on'
      }
    },
    series: [
      {
        name: 'Savings',
        type: 'area',
        data: savingsData,
        showInLegend: false,
        color: {
          linearGradient: {
            x1: 0,
            x2: 1,
            y1: 0,
            y2: 1
          },
          stops: [
            [0, 'rgba(71, 213, 223, 0.7)'],
            [1, 'rgba(71, 213, 223, 0)']
          ]
        },
        pointPlacement: 'on',
        dashStyle: mode === RulesMode.DRY ? 'Dash' : 'Solid'
      },
      {
        name: 'Spend',
        type: 'area',
        data: spendData,
        showInLegend: false,
        color: {
          linearGradient: {
            x1: 0,
            x2: 1,
            y1: 0,
            y2: 1
          },
          stops: [
            [0, 'rgba(124, 77, 211, 0.7)'],
            [1, 'rgba(124, 77, 211, 0) 55.59%)']
          ]
        },
        pointPlacement: 'on',
        dashStyle: mode === RulesMode.DRY ? 'Dash' : 'Solid'
      }
    ]
  }
}
function getSavingsPercentage(totalSavings: number, totalPotentialCost: number): number {
  if (totalPotentialCost == 0) {
    return 0
  }
  return Math.round((totalSavings / totalPotentialCost) * 100)
}
const COGatewayCumulativeAnalytics: React.FC<COGatewayCumulativeAnalyticsProps> = ({ data, loadingData, mode }) => {
  const { getString } = useStrings()
  const sustainabilityEnabled = useFeatureFlag(FeatureFlag.CCM_SUSTAINABILITY)
  const hasData = !_isEmpty(data)

  return (
    <Container padding="small">
      <div>
        <Text className={css.summaryHeading} data-tooltip-id="summaryOfRulesHeader">
          SUMMARY OF RULES
          <HarnessDocTooltip tooltipId="summaryOfRulesHeader" useStandAlone={true} />
        </Text>
        <Layout.Horizontal
          spacing="xxlarge"
          background={Color.WHITE}
          className={css.analyticsContainer}
          // style={{ margin: '0px var(--spacing-medium) !important' }}
        >
          <Layout.Vertical
            spacing="large"
            style={{ textAlign: 'center', flex: 3, marginRight: 'var(--spacing-xxlarge)' }}
          >
            <Text className={css.analyticsColHeader}>TOTAL SPEND VS SAVINGS</Text>
            {data?.days && data?.days.length ? (
              <HighchartsReact
                highchart={Highcharts}
                options={getStackedAreaChartOptions(
                  '',
                  data?.days as string[],
                  '',
                  data?.savings as number[],
                  data?.actual_cost as number[],
                  mode
                )}
              />
            ) : loadingData ? (
              <Icon name="spinner" size={24} color="blue500" style={{ alignSelf: 'center' }} />
            ) : (
              <Text style={{ marginTop: 'var(--spacing-xxlarge)', fontSize: 'var(--font-size-medium)' }}>
                {getString('ce.co.noData')}
              </Text>
            )}
          </Layout.Vertical>
          <Layout.Vertical style={{ flex: 1 }}>
            <Layout.Vertical spacing="xsmall">
              <Text className={css.analyticsColHeader}>SAVINGS PERCENTAGE</Text>
              <Heading level={1}>
                {hasData ? getSavingsPercentage(data?.total_savings as number, data?.total_potential as number) : 0}%
              </Heading>
              <Layout.Horizontal>
                <HighchartsReact
                  highchart={Highcharts}
                  options={
                    hasData
                      ? geGaugeChartOptionsWithoutLabel(
                          getSavingsPercentage(data?.total_savings as number, data?.total_potential as number),
                          mode
                        )
                      : geGaugeChartOptionsWithoutLabel(0, mode)
                  }
                />
              </Layout.Horizontal>
            </Layout.Vertical>
            <Text className={css.analyticsColHeader}>ACTIVE RULES</Text>
            <Layout.Horizontal spacing="small">
              <Heading level={1}>{_defaultTo(data?.total_active_services, 0)}</Heading>
              <Text style={{ alignSelf: 'center' }}>Rules</Text>
            </Layout.Horizontal>
          </Layout.Vertical>
          <Layout.Vertical spacing="small" style={{ flex: 1 }}>
            <Layout.Vertical spacing="large">
              <Container padding="small" style={{ borderRadius: '4px', backgroundColor: 'rgba(71, 213, 223,0.05)' }}>
                <Layout.Vertical spacing="small">
                  <Text className={css.analyticsColHeader} color={Color.TEAL_800}>
                    TOTAL SAVINGS TILL DATE
                  </Text>
                  {loadingData ? (
                    <Icon name="spinner" size={24} color="blue500" />
                  ) : (
                    <>
                      {hasData ? (
                        <Heading level={1} color={Color.TEAL_800}>
                          ${(Math.round(data?.total_savings as number) * 100) / 100}
                        </Heading>
                      ) : (
                        <div>
                          <img src={EmptyView} />
                          <Text>{getString('ce.noSavingsDataMessage')}</Text>
                        </div>
                      )}
                    </>
                  )}
                </Layout.Vertical>
              </Container>
              <Container padding="small" style={{ borderRadius: '4px', backgroundColor: 'rgba(124, 77, 211,0.05)' }}>
                <Layout.Vertical spacing="small">
                  <Text className={css.analyticsColHeader} color={Color.PURPLE_700}>
                    TOTAL SPEND TILL DATE
                  </Text>
                  {loadingData ? (
                    <Icon name="spinner" size={24} color="blue500" />
                  ) : (
                    <Heading level={1} color={Color.PURPLE_700}>
                      ${(Math.round(data?.total_cost as number) * 100) / 100}
                    </Heading>
                  )}
                </Layout.Vertical>
              </Container>
            </Layout.Vertical>
          </Layout.Vertical>
          {sustainabilityEnabled && (
            <Layout.Vertical spacing={'huge'} style={{ flex: 1 }} padding="small">
              <Layout.Vertical spacing={'medium'}>
                <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'center' }} spacing="small">
                  <img src={greenLeaf} width={20} />
                  <Text font={{ variation: FontVariation.H6 }} color={Color.GREY_500}>
                    {getString('ce.co.reducedEmissions')}
                  </Text>
                </Layout.Horizontal>
                <Text font={{ variation: FontVariation.H3 }}>
                  <String
                    stringID="ce.common.emissionUnitHTML"
                    useRichText
                    vars={{ value: getEmissionsValue(_defaultTo(data?.total_savings, 0)) }}
                  />
                </Text>
              </Layout.Vertical>
              <Layout.Vertical spacing={'medium'} style={{ paddingTop: 'var(--spacing-large)' }}>
                <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'center' }} spacing="small">
                  <img src={grayLeaf} width={20} />
                  <Text font={{ variation: FontVariation.H6 }} color={Color.GREY_500}>
                    {getString('ce.co.totalEmissions')}
                  </Text>
                </Layout.Horizontal>
                <Text font={{ variation: FontVariation.H3 }} color={Color.GREY_500}>
                  <String
                    stringID="ce.common.emissionUnitHTML"
                    useRichText
                    vars={{ value: getEmissionsValue(_defaultTo(data?.total_cost, 0)) }}
                  />
                </Text>
              </Layout.Vertical>
            </Layout.Vertical>
          )}
        </Layout.Horizontal>
      </div>
    </Container>
  )
}

export default COGatewayCumulativeAnalytics
