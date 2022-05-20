/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { get } from 'lodash-es'
import {
  Text,
  Container,
  StepProps,
  Layout,
  Button,
  FormInput,
  Formik,
  FormikForm,
  FlexExpander,
  DateInput,
  Icon,
  HarnessDocTooltip
} from '@wings-software/uicore'
import moment from 'moment'
import { FontVariation, Color } from '@harness/design-system'
import type { FormikProps } from 'formik'
import Highcharts from 'highcharts/highcharts'
import { useParams } from 'react-router-dom'
import { Position } from '@blueprintjs/core'
import { Budget, useGetLastPeriodCost, useGetForecastCostForPeriod } from 'services/ce'
import formatCost from '@ce/utils/formatCost'
import CEChart from '@ce/components/CEChart/CEChart'
import { useStrings } from 'framework/strings'
import { BudgetPeriod } from 'services/ce/services'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import type { BudgetStepData } from '../types'
import css from '../PerspectiveCreateBudget.module.scss'

interface GrowthRateChartProps {
  growthRateVal: number
  amount: number
  period: string
  startTime: number
}

const IncrementStep: Record<string, any> = {
  [BudgetPeriod.Daily]: 'd',
  [BudgetPeriod.Weekly]: 'w',
  [BudgetPeriod.Monthly]: 'M',
  [BudgetPeriod.Quarterly]: 'Q',
  [BudgetPeriod.Yearly]: 'y'
}

const GrowthRateChart: (props: GrowthRateChartProps) => JSX.Element = ({
  growthRateVal,
  amount,
  period,
  startTime
}) => {
  const { getString } = useStrings()

  const incrementFactor = IncrementStep[period]

  return (
    <Container
      background={Color.PRIMARY_1}
      padding="medium"
      margin={{
        top: 'huge'
      }}
    >
      <Text font={{ variation: FontVariation.SMALL_SEMI }} margin={{ left: 'small', bottom: 'medium' }}>
        {getString('ce.perspectives.budgets.setBudgetAmount.chartTitle', { rate: growthRateVal })}
      </Text>
      <CEChart
        options={{
          series: [
            {
              color: 'var(--primary-8)',
              data: [
                [Number(moment.utc(startTime).startOf('d').format('x')), +amount],
                [
                  Number(moment.utc(startTime).startOf('d').add(1, incrementFactor).format('x')),
                  +Number(amount * (1 + growthRateVal / 100)).toFixed(2)
                ],
                [
                  Number(moment.utc(startTime).startOf('d').add(2, incrementFactor).format('x')),
                  +Number(amount * (1 + growthRateVal / 100) * (1 + growthRateVal / 100)).toFixed(2)
                ]
              ],
              name: '',
              type: 'line',
              dashStyle: 'ShortDash',
              marker: {
                enabled: false
              }
            }
          ],
          chart: {
            height: 122,
            backgroundColor: 'transparent'
          },
          yAxis: {
            tickAmount: 3,
            title: {
              text: ''
            },
            labels: {
              step: 2,
              formatter: function () {
                return `$ ${this['value']}`
              }
            }
          },
          xAxis: {
            lineWidth: 0,
            type: 'datetime',
            ordinal: true,
            labels: {
              formatter: function () {
                return Highcharts.dateFormat('%e %b %Y', Number(this.value))
              }
            }
          },
          legend: {
            enabled: false
          }
        }}
      />
    </Container>
  )
}

interface SetBudgetFormProps {
  formikProps: FormikProps<Form>
  isEditMode: boolean
  lastMonthCost: number | undefined
  setLastCostPeriodCostVar: React.Dispatch<
    React.SetStateAction<{
      startTime: number
      period: 'MONTHLY' | 'DAILY' | 'WEEKLY' | 'QUARTERLY' | 'YEARLY'
    }>
  >
}

const SetBudgetForm: (props: SetBudgetFormProps) => JSX.Element = ({
  formikProps,
  isEditMode,
  lastMonthCost,
  setLastCostPeriodCostVar
}) => {
  const { getString } = useStrings()

  useEffect(() => {
    if (formikProps.values.type === 'PREVIOUS_PERIOD_SPEND' && !isEditMode) {
      formikProps.setFieldValue('budgetAmount', lastMonthCost || 0)
    }
  }, [lastMonthCost])

  const BUDGET_PERIOD = useMemo(() => {
    return [
      { label: getString('ce.perspectives.budgets.setBudgetAmount.budgetPeriods.monthly'), value: 'MONTHLY' },
      { label: 'Daily', value: 'DAILY' },
      { label: 'Weekly', value: 'WEEKLY' },
      { label: 'Quarterly', value: 'QUARTERLY' },
      { label: 'Yearly', value: 'YEARLY' }
    ]
  }, [])

  const BUDGET_TYPE = useMemo(() => {
    return [
      { label: getString('ce.perspectives.budgets.setBudgetAmount.specifiedAmount'), value: 'SPECIFIED_AMOUNT' },
      { label: getString('ce.perspectives.budgets.setBudgetAmount.lastMonthSpend'), value: 'PREVIOUS_PERIOD_SPEND' }
    ]
  }, [])

  return (
    <Container
      padding={{
        right: 'medium'
      }}
    >
      <FormInput.Select
        disabled={isEditMode}
        items={BUDGET_PERIOD}
        name={'period'}
        label={getString('ce.perspectives.budgets.setBudgetAmount.budgetPeriod')}
        tooltipProps={{
          dataTooltipId: 'budgetPeriod'
        }}
        onChange={val => {
          setLastCostPeriodCostVar(x => ({ ...x, period: val.value as any }))
        }}
      />
      <Text font={{ variation: FontVariation.BODY2 }} color={Color.GREY_600}>
        {getString('ce.perspectives.budgets.setBudgetAmount.monthStartsFrom')}
      </Text>
      <DateInput
        disabled={isEditMode}
        popoverProps={{
          position: Position.BOTTOM,
          disabled: isEditMode
        }}
        value={String(formikProps.values.startTime)}
        onChange={val => {
          const startTime = Number(val)
          setLastCostPeriodCostVar(x => ({ ...x, startTime: startTime as any }))

          formikProps.setValues({
            ...formikProps.values,
            startTime: startTime
          })
        }}
      />
      <HarnessDocTooltip tooltipId="budgetStartTime" useStandAlone={true} />
      <FormInput.Select
        value={BUDGET_TYPE.find(op => op.value === formikProps.values.type)}
        items={BUDGET_TYPE}
        name={'type'}
        label={getString('ce.perspectives.budgets.setBudgetAmount.budgetType')}
        onChange={option => {
          if (option.value === 'PREVIOUS_PERIOD_SPEND') {
            formikProps.setFieldValue('budgetAmount', lastMonthCost || 0)
          }
        }}
      />
      <FormInput.Text
        disabled={formikProps.values.type === 'PREVIOUS_PERIOD_SPEND'}
        name={'budgetAmount'}
        inputGroup={{ type: 'number' }}
        label={
          formikProps.values.type === 'PREVIOUS_PERIOD_SPEND'
            ? getString('ce.perspectives.budgets.setBudgetAmount.lastMonthSpend')
            : getString('ce.perspectives.budgets.setBudgetAmount.specifyAmount')
        }
      />
      {formikProps.values.type === 'SPECIFIED_AMOUNT' ? (
        <FormInput.CheckBox
          name="growthRateCheck"
          label={getString('ce.perspectives.budgets.setBudgetAmount.growthRateCheck')}
          tooltipProps={{
            dataTooltipId: 'growthRateCheckbox'
          }}
        />
      ) : null}
      {formikProps.values.growthRateCheck && formikProps.values.type === 'SPECIFIED_AMOUNT' ? (
        <Layout.Horizontal
          margin={{
            top: 'xlarge'
          }}
          spacing="small"
        >
          <FormInput.Text
            name={'growthRate'}
            inputGroup={{ type: 'number' }}
            label={getString('ce.perspectives.budgets.setBudgetAmount.growthRateLabel')}
          />
          <Text
            margin={{
              top: 'xxlarge'
            }}
          >
            %
          </Text>
        </Layout.Horizontal>
      ) : null}
    </Container>
  )
}

interface Props {
  name: string
  budget?: Budget
  isEditMode: boolean
  perspective?: string
  initiatorPage?: string
}

interface Form {
  type: 'SPECIFIED_AMOUNT' | 'PREVIOUS_MONTH_SPEND' | 'PREVIOUS_PERIOD_SPEND'
  budgetAmount: number
  period: string
  startTime: number
  growthRate: number
  growthRateCheck: boolean
}

const SetBudgetAmount: React.FC<StepProps<BudgetStepData> & Props> = props => {
  const { getString } = useStrings()
  const { accountId } = useParams<{
    accountId: string
  }>()
  const { trackEvent } = useTelemetry()
  const {
    nextStep,
    prevStepData,
    previousStep,
    budget: { budgetAmount = 0, period, startTime, growthRate } = {},
    isEditMode,
    initiatorPage = ''
  } = props

  let type = props.budget?.type

  if (type === 'PREVIOUS_MONTH_SPEND') {
    type = 'PREVIOUS_PERIOD_SPEND'
  }

  const [lastPeriodCostVar, setLastCostPeriodCostVar] = useState({
    startTime: startTime || get(prevStepData, 'startTime') || Number(moment().startOf('month').format('x')),
    period: period || get(prevStepData, 'period') || 'MONTHLY'
  })

  const { perspective } = prevStepData || {}

  const { data: lpc, loading: lpcLoading } = useGetLastPeriodCost({
    queryParams: {
      accountIdentifier: accountId,
      perspectiveId: perspective as string,
      period: lastPeriodCostVar.period,
      startTime: lastPeriodCostVar.startTime
    }
  })

  const { data: fcp, loading: fcpLoading } = useGetForecastCostForPeriod({
    queryParams: {
      accountIdentifier: accountId,
      perspectiveId: perspective as string,
      period: lastPeriodCostVar.period,
      startTime: lastPeriodCostVar.startTime
    }
  })

  useEffect(() => {
    trackEvent(USER_JOURNEY_EVENTS.SET_BUDGET_AMOUNT, { pageName: initiatorPage, isEditMode })
  }, [])

  const COSTS = useMemo(
    () => [
      [getString('ce.perspectives.budgets.setBudgetAmount.lastMonthCost'), lpc?.data],
      [getString('ce.perspectives.budgets.setBudgetAmount.projectedCost'), fcp?.data]
    ],
    [lpc?.data, fcp?.data]
  )

  const handleSubmit = (data: Form) => {
    const nextStepData = {
      ...((prevStepData || {}) as Budget & { perspective: string }),
      type: data.type,
      budgetAmount: data.budgetAmount,
      lastMonthCost: lpc?.data,
      forecastCost: fcp?.data,
      period: data.period,
      startTime: data.startTime,
      growthRate: data.growthRate
    } as BudgetStepData

    nextStep?.(nextStepData)
  }

  const renderCosts = () => {
    return (
      <div className={css.costs}>
        {COSTS.map((cost, idx) => {
          return (
            <>
              <div key={idx}>
                <Text color="grey800" margin={{ bottom: 'small' }} font={{ variation: FontVariation.SMALL }}>
                  {cost[0] || 0}
                </Text>
                <Text color="grey800" font={{ variation: FontVariation.H5 }}>
                  {formatCost((cost[1] as number) || 0)}
                </Text>
              </div>
              {idx === 0 && <div className={css.separator}></div>}
            </>
          )
        })}
      </div>
    )
  }

  const formLoading = lpcLoading || fcpLoading ? true : undefined

  return (
    <Container>
      <Formik<Form>
        onSubmit={data => {
          handleSubmit(data)
        }}
        formName="selectPerspective"
        enableReinitialize={true}
        initialValues={{
          type: type || get(prevStepData, 'type') || 'PREVIOUS_PERIOD_SPEND',
          budgetAmount: budgetAmount || get(prevStepData, 'budgetAmount') || 0,
          period: period || get(prevStepData, 'period') || 'MONTHLY',
          startTime: startTime || get(prevStepData, 'startTime') || Number(moment().startOf('month').format('x')),
          growthRate: growthRate || get(prevStepData, 'growthRate') || 0,
          growthRateCheck: !!growthRate || !!get(prevStepData, 'growthRate')
        }}
      >
        {formikProps => {
          return (
            <FormikForm className={css.selectPerspectiveContainer}>
              {formLoading ? (
                <Container className={css.loadingContainer}>
                  <Icon name="spinner" size={26} color={Color.BLUE_500} />
                </Container>
              ) : null}
              <Container className={css.selectPerspectiveContainer}>
                <Text
                  font={{ variation: FontVariation.H4 }}
                  tooltipProps={{
                    dataTooltipId: 'createBudgetSetBudget'
                  }}
                >
                  {getString('ce.perspectives.budgets.setBudgetAmount.title')}
                </Text>

                <Container
                  margin={{
                    top: 'xxlarge'
                  }}
                  className={css.setBudgetContainer}
                >
                  <SetBudgetForm
                    formikProps={formikProps}
                    isEditMode={isEditMode}
                    lastMonthCost={lpc?.data}
                    setLastCostPeriodCostVar={setLastCostPeriodCostVar}
                  />
                  <Container
                    padding={{
                      left: 'medium'
                    }}
                  >
                    {renderCosts()}
                    {formikProps.values.growthRateCheck ? (
                      <GrowthRateChart
                        period={formikProps.values.period}
                        growthRateVal={formikProps.values.growthRate}
                        amount={formikProps.values.budgetAmount}
                        startTime={formikProps.values.startTime}
                      />
                    ) : null}
                  </Container>
                </Container>

                <FlexExpander />
                <Layout.Horizontal spacing="medium">
                  <Button
                    text={getString('previous')}
                    icon="chevron-left"
                    onClick={() => previousStep?.(prevStepData)}
                  />
                  <Button type="submit" intent="primary" rightIcon={'chevron-right'} disabled={false}>
                    {getString('continue')}
                  </Button>
                </Layout.Horizontal>
              </Container>
            </FormikForm>
          )
        }}
      </Formik>
    </Container>
  )
}

export default SetBudgetAmount
