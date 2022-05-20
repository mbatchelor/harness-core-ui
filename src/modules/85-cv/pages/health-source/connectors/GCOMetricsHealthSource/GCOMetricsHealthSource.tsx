/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  Container,
  Formik,
  FormikForm,
  FormInput,
  Heading,
  Text,
  Icon,
  Utils,
  FormError,
  PageError,
  NoDataCard
} from '@wings-software/uicore'
import cx from 'classnames'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { noop } from 'lodash-es'
import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'
import { Drawer } from '@blueprintjs/core'
import isEmpty from 'lodash-es/isEmpty'
import MonacoEditor from '@common/components/MonacoEditor/MonacoEditor'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  StackdriverDefinition,
  useGetMetricPacks,
  useGetStackdriverDashboardDetail,
  useGetStackdriverSampleData
} from 'services/cv'
import { useStrings } from 'framework/strings'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { SetupSourceLayout } from '@cv/components/CVSetupSourcesView/SetupSourceLayout/SetupSourceLayout'
import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import { QueryContent } from '@cv/components/QueryViewer/QueryViewer'
import { NameId } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import MetricDashboardWidgetNav from '@cv/components/MetricDashboardWidgetNav/MetricDashboardWidgetNav'
import {
  getManuallyCreatedQueries,
  formatJSON,
  initializeSelectedMetrics,
  transformSampleDataIntoHighchartOptions,
  validate,
  ensureFieldsAreFilled,
  transformGCOMetricSetupSourceToGCOHealthSource,
  transformGCOMetricHealthSourceToGCOMetricSetupSource,
  getPlaceholderForIdentifier,
  mapstackdriverDashboardDetailToMetricWidget,
  onSelectNavItem
} from './GCOMetricsHealthSource.utils'
import DrawerFooter from '../../common/DrawerFooter/DrawerFooter'
import type { GCOMetricInfo, GCOMetricsHealthSourceProps, ValidationChartProps } from './GCOMetricsHealthSource.type'
import { OVERALL, FieldNames, DrawerOptions } from './GCOMetricsHealthSource.constants'
import SelectHealthSourceServices from '../../common/SelectHealthSourceServices/SelectHealthSourceServices'
import MetricErrorAndLoading from '../../common/MetricErrorAndLoading/MetricErrorAndLoading'
import css from './GCOMetricsHealthSource.module.scss'

const GroupByClause = 'groupByFields'

function ValidationChart(props: ValidationChartProps): JSX.Element {
  const { loading, error, queryValue, onRetry, sampleData, setAsTooManyMetrics, isQueryExecuted = false } = props
  const { getString } = useStrings()
  const isTooManyMetrics = Boolean(
    sampleData?.series?.length && sampleData.series.length > 1 && queryValue?.includes(GroupByClause)
  )

  useEffect(() => {
    setAsTooManyMetrics?.(isTooManyMetrics)
  }, [sampleData])

  if (!queryValue?.length) {
    return (
      <Container className={cx(css.chartContainer, css.noDataContainer)}>
        <NoDataCard
          icon="main-notes"
          message={getString('cv.monitoringSources.gco.mapMetricsToServicesPage.enterQueryForValidation')}
        />
      </Container>
    )
  }

  if (!isQueryExecuted) {
    return (
      <Container className={cx(css.chartContainer, css.noDataContainer)}>
        <NoDataCard
          icon="timeline-line-chart"
          message={getString('cv.monitoringSources.gcoLogs.submitQueryToSeeRecords')}
        />
      </Container>
    )
  }

  if (loading) {
    return <Icon name="steps-spinner" size={32} color={Color.GREY_600} className={css.sampleDataSpinner} />
  }

  if (error) {
    return (
      <Container className={css.chartContainer}>
        <PageError message={error} onClick={() => onRetry()} />
      </Container>
    )
  }

  if (!sampleData?.series?.length) {
    return (
      <Container className={cx(css.chartContainer, css.noDataContainer)}>
        <NoDataCard
          icon="warning-sign"
          message={getString('cv.monitoringSources.gco.mapMetricsToServicesPage.noDataForQuery')}
          buttonText={getString('retry')}
          onClick={() => onRetry()}
        />
      </Container>
    )
  }

  return (
    <Container className={css.chartContainer}>
      <HighchartsReact highcharts={Highcharts} options={sampleData} />
      {isTooManyMetrics && (
        <Text
          intent="danger"
          font={{ size: 'small' }}
          className={css.tooManyRecords}
          icon="warning-sign"
          iconProps={{ intent: 'danger' }}
        >
          {getString('cv.monitoringSources.gco.mapMetricsToServicesPage.validation.tooManyMetrics')}
        </Text>
      )}
    </Container>
  )
}

export function GCOMetricsHealthSource(props: GCOMetricsHealthSourceProps): JSX.Element {
  const { data, onSubmit } = props

  const { onPrevious, sourceData } = useContext(SetupSourceTabsContext)

  const { existingMetricDetails, selectedDashboards: selectedDashboardsContextValue = [] } = sourceData || {}

  const metricDefinitions = existingMetricDetails?.spec?.metricDefinitions

  const { getString } = useStrings()
  const transformedData = useMemo(() => transformGCOMetricHealthSourceToGCOMetricSetupSource(data), [data])
  const [updatedData, setUpdatedData] = useState(
    initializeSelectedMetrics(selectedDashboardsContextValue, transformedData.metricDefinition)
  )
  const [shouldShowChart, setShouldShowChart] = useState(false)
  const [isIdentifierEdited, setIsIdentifierEdited] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string>()
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const queryParams = useMemo(
    () => ({
      orgIdentifier,
      projectIdentifier,
      accountId,
      tracingId: Utils.randomId(),
      connectorIdentifier: data.connectorRef as string
    }),
    [data?.connectorRef, projectIdentifier, orgIdentifier, accountId]
  )

  const { mutate, cancel } = useGetStackdriverSampleData({ queryParams })

  useEffect(() => {
    setIsIdentifierEdited(false)
  }, [selectedMetric])

  const [isQueryExpanded, setIsQueryExpanded] = useState(false)
  const [sampleData, setSampleData] = useState<Highcharts.Options | undefined>()

  const onQueryChange = useCallback(
    async (updatedQueryValue: string | undefined, onError?: () => void) => {
      cancel()
      try {
        if (updatedQueryValue?.length) {
          setLoading(true)
          setError(undefined)
          const response = await mutate(JSON.parse(updatedQueryValue), {
            queryParams: { ...queryParams, tracingId: Utils.randomId() }
          })
          if (response?.data) {
            setError(undefined)
            setSampleData(transformSampleDataIntoHighchartOptions(response?.data || []))
          }
          setLoading(false)
        } else {
          setError(undefined)
          setSampleData(transformSampleDataIntoHighchartOptions([]))
        }
      } catch (e) {
        if (e.message?.includes('The user aborted a request.')) {
          return
        }
        if (e.name === 'SyntaxError') {
          setError(getErrorMessage(e))
          setSampleData(transformSampleDataIntoHighchartOptions([]))
          onError?.()
        } else if (e?.data) {
          setError(getErrorMessage(e))
          setSampleData(transformSampleDataIntoHighchartOptions([]))
        }
        setLoading(false)
      }
    },
    [mutate, cancel]
  )

  const stackDriverDashBoardRequest = useGetStackdriverDashboardDetail({ lazy: true })

  const { loading: loadingDashBoardData } = stackDriverDashBoardRequest

  const metricPackResponse = useGetMetricPacks({
    queryParams: { projectIdentifier, orgIdentifier, accountId, dataSourceType: 'STACKDRIVER' }
  })

  const formInitialValues: GCOMetricInfo = updatedData.get(selectedMetric || '') || {}

  return (
    <Formik<GCOMetricInfo>
      enableReinitialize={true}
      formName="mapGCOMetrics"
      initialValues={formInitialValues}
      onSubmit={noop}
      validate={values => {
        const newMap = new Map(updatedData)
        if (selectedMetric) {
          newMap.set(selectedMetric, { ...values })
        }

        return validate(values, newMap, getString)
      }}
    >
      {formikProps => {
        const {
          sli = false,
          healthScore = false,
          continuousVerification = false,
          riskCategory = ''
        } = formikProps.values

        const currentSelectedMetricDetail = metricDefinitions?.find(
          (metricDefinition: StackdriverDefinition) =>
            metricDefinition.metricName === updatedData.get(selectedMetric as string)?.metricName
        )

        const shouldShowIdentifierPlaceholder =
          !currentSelectedMetricDetail?.identifier && !formikProps.values?.identifier

        if (shouldShowIdentifierPlaceholder && !isIdentifierEdited) {
          formikProps.setFieldValue(
            FieldNames.IDENTIFIER,
            getPlaceholderForIdentifier(formikProps.values?.metricName, getString)
          )
          setIsIdentifierEdited(true)
        }

        const dashboard: { itemId: string; title: string }[] = selectedDashboardsContextValue.map(
          (item: { id: string; name: string }) => {
            return { itemId: item.id, title: item.name }
          }
        )

        const isDashdoardEmpty = !Object.values(dashboard).filter(item => item.title).length

        return (
          <SetupSourceLayout
            content={
              <FormikForm className={css.setupContainer}>
                <Heading level={3} color={Color.BLACK} className={css.sectionHeading}>
                  {getString('cv.monitoringSources.gco.mapMetricsToServicesPage.querySpecifications')}
                </Heading>

                <MetricErrorAndLoading isEmpty={isEmpty(formInitialValues)} loading={loadingDashBoardData}>
                  <>
                    <Container className={css.nameAndMetricTagContainer}>
                      <FormInput.KVTagInput
                        label={getString('cv.monitoringSources.gco.mapMetricsToServicesPage.metricTagsLabel')}
                        name={FieldNames.METRIC_TAGS}
                        tagsProps={{
                          addOnBlur: true,
                          addOnPaste: true,
                          onChange: values => {
                            const newTagObj: { [key: string]: any } = {}
                            ;(values as string[])?.forEach(val => {
                              newTagObj[val as string] = ''
                            })
                            formikProps.setFieldValue(FieldNames.METRIC_TAGS, newTagObj)
                          }
                        }}
                      />
                      <FormError name="metricTags" errorMessage={formikProps.errors['metricTags']} />
                      <NameId
                        nameLabel={getString('cv.monitoringSources.metricNameLabel')}
                        identifierProps={{
                          inputName: FieldNames.METRIC_NAME,
                          idName: FieldNames.IDENTIFIER,
                          isIdentifierEditable: Boolean(!currentSelectedMetricDetail?.identifier)
                        }}
                      />
                    </Container>

                    <Container className={css.validationContainer}>
                      <QueryContent
                        handleFetchRecords={async () => {
                          if (!shouldShowChart) {
                            setShouldShowChart(true)
                          }
                          onQueryChange(formikProps.values.query)
                        }}
                        onClickExpand={setIsQueryExpanded}
                        isDialogOpen={isQueryExpanded}
                        query={formikProps.values.query}
                        loading={loading}
                        textAreaName={FieldNames.QUERY}
                      />

                      <ValidationChart
                        loading={loading}
                        error={error}
                        sampleData={sampleData}
                        queryValue={formikProps.values.query}
                        setAsTooManyMetrics={isTooMany => {
                          if (isTooMany) {
                            formikProps.setFieldError('tooManyMetrics', 'invalid')
                          } else {
                            formikProps.setFieldError('tooManyMetrics', '')
                          }
                        }}
                        isQueryExecuted={shouldShowChart}
                        onRetry={async () => {
                          if (!formikProps.values.query?.length) return
                          onQueryChange(formikProps.values.query)
                        }}
                      />

                      {isQueryExpanded && (
                        <Drawer
                          {...DrawerOptions}
                          onClose={() => {
                            setIsQueryExpanded(false)
                          }}
                        >
                          <MonacoEditor
                            language="javascript"
                            value={formatJSON(formikProps.values.query)}
                            data-testid="monaco-editor"
                            onChange={val => formikProps.setFieldValue(FieldNames.QUERY, val)}
                            options={
                              {
                                readOnly: false,
                                wordBasedSuggestions: false,
                                fontFamily: "'Roboto Mono', monospace",
                                fontSize: 13
                              } as any
                            }
                          />
                        </Drawer>
                      )}
                    </Container>
                    <SelectHealthSourceServices
                      values={{
                        sli,
                        healthScore,
                        riskCategory,
                        continuousVerification
                      }}
                      metricPackResponse={metricPackResponse}
                      hideServiceIdentifier
                    />
                    {formikProps.values.continuousVerification && (
                      <FormInput.Text
                        name={FieldNames.SERVICE_INSTANCE_FIELD}
                        label={getString('cv.monitoringSources.serviceInstanceIdentifier')}
                      />
                    )}
                    <FormInput.Text name={OVERALL} className={css.hiddenField} />
                  </>
                </MetricErrorAndLoading>
                <DrawerFooter
                  onPrevious={onPrevious}
                  isSubmit
                  onNext={async () => {
                    formikProps.setTouched({
                      ...formikProps.touched,
                      [OVERALL]: true,
                      [FieldNames.SLI]: true,
                      [FieldNames.RISK_CATEGORY]: true,
                      [FieldNames.HIGHER_BASELINE_DEVIATION]: true,
                      [FieldNames.LOWER_BASELINE_DEVIATION]: true,
                      [FieldNames.SERVICE_INSTANCE_FIELD]: true
                    } as any)

                    const errors = validate(formikProps.values, updatedData, getString)
                    if (!isEmpty(errors)) {
                      formikProps.setErrors({ ...errors })
                      return
                    }

                    if (selectedMetric) {
                      updatedData.set(selectedMetric, { ...formikProps.values })
                    }
                    const filteredData = new Map()
                    for (const metric of updatedData) {
                      const [metricName, metricInfo] = metric
                      if (isEmpty(ensureFieldsAreFilled(metricInfo, getString, new Map(updatedData)))) {
                        filteredData.set(metricName, metricInfo)
                      }
                    }

                    await onSubmit(
                      data,
                      transformGCOMetricSetupSourceToGCOHealthSource({
                        ...transformedData,
                        metricDefinition: filteredData
                      })
                    )
                  }}
                />
              </FormikForm>
            }
            leftPanelContent={
              <MetricDashboardWidgetNav
                dashboards={isDashdoardEmpty ? [] : dashboard}
                dashboardWidgetMapper={mapstackdriverDashboardDetailToMetricWidget}
                dashboardDetailsRequest={stackDriverDashBoardRequest}
                addManualQueryTitle={'cv.monitoringSources.gco.manualInputQueryModal.modalTitle'}
                connectorIdentifier={data.connectorRef as string}
                manuallyInputQueries={getManuallyCreatedQueries(updatedData)}
                showSpinnerOnLoad={!selectedMetric}
                onSelectMetric={(id, metricName, query, widget, dashboardId, dashboardTitle) => {
                  onSelectNavItem({
                    id,
                    metricName,
                    query,
                    widget,
                    dashboardId,
                    dashboardTitle,
                    updatedData,
                    setUpdatedData,
                    selectedMetric,
                    formikProps
                  })
                  setSelectedMetric(metricName)
                  setShouldShowChart(false)
                  setError(undefined)
                  setSampleData(transformSampleDataIntoHighchartOptions([]))

                  formikProps.resetForm()
                }}
              />
            }
          />
        )
      }}
    </Formik>
  )
}
