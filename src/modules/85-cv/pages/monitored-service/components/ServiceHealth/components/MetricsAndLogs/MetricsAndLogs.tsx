/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { Container, Layout, Card, NoDataCard, Tabs, Tab, Button, ButtonVariation } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import noServiceAvailableImage from '@cv/assets/noServiceAvailable.png'
import { useStrings } from 'framework/strings'
import { LogAnalysisContent } from '@cv/components/LogsAnalysis/LogAnalysis'
import { useLogContentHook } from '@cv/hooks/useLogContentHook/useLogContentHook'
import { LogTypes } from '@cv/hooks/useLogContentHook/useLogContentHook.types'
import type { MetricsAndLogsProps } from './MetricsAndLogs.types'
import ErrorTracking from '../ErrorTracking/ErrorTracking'
import MetricsAnalysisContainer from './components/MetricsAnalysisContainer/MetricsAnalysisContainer'
import css from './MetricsAndLogs.module.scss'

const MetricsAndLogs: React.FC<MetricsAndLogsProps> = props => {
  const { getString } = useStrings()

  const {
    startTime,
    endTime,
    showTimelineSlider,
    monitoredServiceIdentifier,
    serviceIdentifier,
    environmentIdentifier,
    isErrorTrackingEnabled
  } = props

  const { openLogContentHook } = useLogContentHook({
    monitoredServiceStartTime: startTime,
    monitoredServiceEndTime: endTime,
    serviceName: serviceIdentifier,
    envName: environmentIdentifier,
    monitoredServiceIdentifier: monitoredServiceIdentifier,
    showTimelineSlider
  })

  return startTime && endTime ? (
    <Container className={css.metricsLogsTab} data-testid="analysis-view">
      <Layout.Horizontal className={css.logsCtaContainer}>
        <Button
          icon="api-docs"
          withoutCurrentColor
          iconProps={{ color: Color.BLACK, size: 20 }}
          text={getString('cv.externalAPICalls')}
          data-testid="ExternalAPICalls-button"
          variation={ButtonVariation.LINK}
          onClick={() => openLogContentHook(LogTypes.ApiCallLog)}
        />
        <Button
          icon="audit-trail"
          withoutCurrentColor
          iconProps={{ size: 20 }}
          text={getString('cv.executionLogs')}
          data-testid="ExecutionLogs-button"
          variation={ButtonVariation.LINK}
          onClick={() => openLogContentHook(LogTypes.ExecutionLog)}
        />
      </Layout.Horizontal>
      <Tabs id="serviceScreenMetricsLogs" defaultSelectedTabId={getString('pipeline.verification.analysisTab.metrics')}>
        <Tab
          id={getString('pipeline.verification.analysisTab.metrics')}
          title={getString('pipeline.verification.analysisTab.metrics')}
          panelClassName={css.mainTabPanel}
          panel={<MetricsAnalysisContainer {...props} startTime={startTime} endTime={endTime} />}
        />
        <Tab
          id={getString('pipeline.verification.analysisTab.logs')}
          title={getString('pipeline.verification.analysisTab.logs')}
          panelClassName={cx(css.mainTabPanel, css.mainTabPanelLogs)}
          panel={
            <Container style={{ height: '100%' }}>
              <LogAnalysisContent
                monitoredServiceIdentifier={monitoredServiceIdentifier}
                startTime={startTime}
                endTime={endTime}
              />
            </Container>
          }
        />
        {isErrorTrackingEnabled && (
          <Tab
            id={getString('errors')}
            title={getString('errors')}
            panelClassName={css.mainTabPanel}
            panel={
              <ErrorTracking
                monitoredServiceIdentifier={monitoredServiceIdentifier}
                serviceIdentifier={serviceIdentifier}
                environmentIdentifier={environmentIdentifier}
                startTime={startTime}
                endTime={endTime}
                isErrorTrackingEnabled
              />
            }
          />
        )}
      </Tabs>
    </Container>
  ) : (
    <Card className={css.noServiceImageCard} data-testid="analysis-image-view">
      <NoDataCard
        image={noServiceAvailableImage}
        message={getString('cv.monitoredServices.serviceHealth.selectTimeline')}
        containerClassName={css.noDataCardContainer}
        className={css.noDataCard}
        imageClassName={css.noServiceImage}
      />
    </Card>
  )
}

export default MetricsAndLogs
