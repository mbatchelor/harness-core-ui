/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Accordion, FormInput, Layout, SelectOption, Utils } from '@wings-software/uicore'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapSplunkToServiceFieldNames } from '@cv/pages/health-source/connectors/SplunkHealthSource/components/MapQueriesToHarnessService/constants'
import { useGetSplunkSampleData, useGetSplunkSavedSearches } from 'services/cv'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { QueryViewer } from '@cv/components/QueryViewer/QueryViewer'
import Card from '@cv/components/Card/Card'
import { SplunkMetricNameAndHostIdentifier } from '../../SplunkMetricNameAndHostIdentifier'
import type { MapQueriesToHarnessServiceLayoutProps } from './types'
import css from './MapQueriesToHarnessServiceLayout.module.scss'

export default function MapQueriesToHarnessServiceLayout(props: MapQueriesToHarnessServiceLayoutProps): JSX.Element {
  const { formikProps, connectorIdentifier, onChange, isConnectorRuntimeOrExpression, isTemplate, expressions } = props
  const [isQueryExecuted, setIsQueryExecuted] = useState(false)
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const values = formikProps?.values

  const query = useMemo(() => (values?.query?.length ? values.query : ''), [values])
  const queryParams = useMemo(
    () => ({
      accountId,
      projectIdentifier,
      orgIdentifier,
      tracingId: Utils.randomId(),
      connectorIdentifier: connectorIdentifier as string
    }),
    [accountId, projectIdentifier, orgIdentifier, connectorIdentifier]
  )

  const {
    data: savedQuery,
    loading: loadingSavedQuery,
    refetch: refetchSavedQuery
  } = useGetSplunkSavedSearches({
    lazy: isConnectorRuntimeOrExpression,
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier,
      connectorIdentifier,
      requestGuid: queryParams?.tracingId
    }
  })

  useEffect(() => {
    if (!isConnectorRuntimeOrExpression) {
      refetchSavedQuery()
    }
  }, [isConnectorRuntimeOrExpression])

  const { data: splunkData, loading, refetch, error } = useGetSplunkSampleData({ lazy: true })

  const fetchSplunkRecords = useCallback(async () => {
    await refetch({
      queryParams: {
        accountId,
        orgIdentifier,
        projectIdentifier,
        connectorIdentifier,
        requestGuid: queryParams?.tracingId,
        query
      }
    })
    setIsQueryExecuted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const postFetchingRecords = useCallback(() => {
    // resetting values of service once fetch records button is clicked.
    onChange(MapSplunkToServiceFieldNames.SERVICE_INSTANCE, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
    onChange(MapSplunkToServiceFieldNames.IS_STALE_RECORD, false)
  }, [])

  const savedSearchQueryOption = useMemo(
    () =>
      loadingSavedQuery
        ? [{ label: getString('loading'), value: getString('loading') }]
        : savedQuery?.resource?.map(item => ({
            label: item.title as string,
            value: item.searchQuery as string
          })) || [],
    [loadingSavedQuery]
  )

  const onSavedQueryChange = useCallback(
    (item: SelectOption) => {
      onChange(MapSplunkToServiceFieldNames.QUERY, item.value as string)
      onChange(MapSplunkToServiceFieldNames.SERVICE_INSTANCE, '')
      onChange(MapSplunkToServiceFieldNames.RECORD_COUNT, '0')
      setIsQueryExecuted(false)
    },
    [query]
  )

  const getSavedQueryValue = useCallback(
    () => savedSearchQueryOption?.find(item => item.value === query) || { value: '', label: '' },
    [query]
  )

  const staleRecordsWarningMessage = useMemo(
    () => (values?.isStaleRecord ? getString('cv.monitoringSources.splunk.staleRecordsWarning') : ''),
    [values?.isStaleRecord]
  )

  return (
    <Card>
      <>
        <Layout.Horizontal>
          <Accordion activeId="metricToService" className={css.accordian}>
            <Accordion.Panel
              id="metricToService"
              summary={getString('cv.monitoringSources.mapQueriesToServices')}
              details={
                <SplunkMetricNameAndHostIdentifier
                  serviceInstance={values?.serviceInstance}
                  sampleRecord={splunkData?.resource?.[0] || null}
                  isQueryExecuted={isQueryExecuted}
                  onChange={onChange}
                  loading={loading}
                  isTemplate={isTemplate}
                  expressions={expressions}
                  isConnectorRuntimeOrExpression={isConnectorRuntimeOrExpression}
                />
              }
            />
          </Accordion>
          <div className={css.queryViewContainer}>
            {!isConnectorRuntimeOrExpression && (
              <FormInput.Select
                className={css.savedQueryDropdown}
                label={getString('cv.selectQuery')}
                name={'savedSearchQuery'}
                placeholder={getString('cv.monitoringSources.splunk.savedSearchQuery')}
                value={getSavedQueryValue()}
                items={savedSearchQueryOption}
                onChange={onSavedQueryChange}
              />
            )}
            <QueryViewer
              isQueryExecuted={isQueryExecuted}
              className={css.validationContainer}
              records={splunkData?.resource}
              fetchRecords={fetchSplunkRecords}
              postFetchingRecords={postFetchingRecords}
              loading={loading}
              error={error}
              query={query}
              queryNotExecutedMessage={getString('cv.monitoringSources.splunk.submitQueryToSeeRecords')}
              queryTextAreaProps={{
                onChangeCapture: () => {
                  onChange(MapSplunkToServiceFieldNames.IS_STALE_RECORD, true)
                }
              }}
              staleRecordsWarning={staleRecordsWarningMessage}
              dataTooltipId={'splunkQuery'}
              isTemplate={isTemplate}
              expressions={expressions}
              isConnectorRuntimeOrExpression={isConnectorRuntimeOrExpression}
            />
          </div>
        </Layout.Horizontal>
      </>
    </Card>
  )
}
