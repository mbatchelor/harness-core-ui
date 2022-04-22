/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Layout, Text, Card, Popover, Container } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Position, Menu, MenuItem } from '@blueprintjs/core'
import { defaultTo } from 'lodash-es'

import { NodepoolTimeRange, NodepoolTimeRangeType, NodepoolTimeRangeValue } from '@ce/types'
import { GET_NODEPOOL_DATE_RANGE } from '@ce/utils/momentUtils'
import { Page } from '@common/exports'
import {
  NodeRecommendationDto,
  RecommendationItemDto,
  RecommendationOverviewStats,
  RecommendNodePoolClusterRequest,
  ResourceType,
  useFetchNodeRecommendationRequestQuery,
  useFetchRecommendationQuery
} from 'services/ce/services'
import routes from '@common/RouteDefinitions'
import { useStrings } from 'framework/strings'
import { getProviderIcon } from '@ce/utils/recommendationUtils'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { ViewNodepoolTimeRange } from '@ce/components/RecommendationDetails/constants'
import NodeRecommendationDetails from '@ce/components/NodeRecommendation/NodeRecommendation'
import { useQueryParamsState } from '@common/hooks/useQueryParamsState'
import css from './NodeRecommendationDetailsPage.module.scss'

interface Params {
  recommendation: string
  recommendationName: string
  accountId: string
}

const NodeRecommendationDetailsPage = () => {
  const { getString } = useStrings()
  const { recommendation, accountId, recommendationName } = useParams<Params>()
  const [timeRange, setTimeRange] = useQueryParamsState<NodepoolTimeRangeValue>('timeRange', {
    value: NodepoolTimeRangeType.LAST_7,
    label: NodepoolTimeRange.LAST_7
  })
  const timeRangeFilter = GET_NODEPOOL_DATE_RANGE[timeRange.value]

  const breadCrumbLinks = useMemo(() => {
    return [{ url: routes.toCERecommendations({ accountId }), label: getString('ce.recommendation.sideNavText') }]
  }, [])

  const [{ data, fetching }] = useFetchRecommendationQuery({
    variables: {
      id: recommendation,
      resourceType: ResourceType.NodePool,
      startTime: timeRangeFilter[0],
      endTime: timeRangeFilter[1]
    }
  })

  const nodePoolData =
    (data?.recommendationsV2?.items?.length && data?.recommendationsV2?.items[0]) || ({} as RecommendationItemDto)

  const recommendationStats = (data?.recommendationStatsV2 || {}) as RecommendationOverviewStats
  const recommendationDetails = (data?.recommendationDetails || {}) as NodeRecommendationDto

  const clusterId = recommendationDetails.nodePoolId?.clusterid

  const [{ data: nodeRecommendationRequestData, fetching: nodeRecommendationDataFetching }] =
    useFetchNodeRecommendationRequestQuery({
      variables: {
        nodePoolId: { clusterid: clusterId || '', nodepoolname: recommendationName },
        startTime: timeRangeFilter[0],
        endTime: timeRangeFilter[1]
      }
    })

  if (fetching || nodeRecommendationDataFetching) {
    return <Page.Spinner />
  }

  return (
    <>
      <Page.Header
        title={
          <Layout.Horizontal spacing="small">
            <Text
              icon={getProviderIcon(defaultTo(recommendationDetails.recommended?.provider, ''))}
              font={{ variation: FontVariation.BODY1 }}
            >
              {getString('ce.recommendation.detailsPage.headerText')}
            </Text>
            <Text font={{ variation: FontVariation.H4 }} style={{ verticalAlign: 'middle' }}>
              {nodePoolData.resourceName}
            </Text>
          </Layout.Horizontal>
        }
        breadcrumbs={<NGBreadcrumbs className={css.breadCrumb} links={breadCrumbLinks} />}
      />
      <Page.Body>
        <Card style={{ width: '100%' }}>
          <Layout.Horizontal spacing="small">
            <Text color={Color.GREY_800} font={{ variation: FontVariation.H6 }}>
              {getString('ce.recommendation.detailsPage.utilizationDataComputation')}
            </Text>
            <Popover
              position={Position.BOTTOM_LEFT}
              modifiers={{
                arrow: { enabled: false },
                flip: { enabled: true },
                keepTogether: { enabled: true },
                preventOverflow: { enabled: true }
              }}
              content={
                <Menu>
                  {ViewNodepoolTimeRange.map(viewTimeRange => (
                    <MenuItem
                      onClick={() => {
                        setTimeRange(viewTimeRange)
                      }}
                      text={viewTimeRange.label}
                      key={viewTimeRange.value}
                    />
                  ))}
                </Menu>
              }
            >
              <Text
                color={Color.PRIMARY_5}
                rightIcon="caret-down"
                rightIconProps={{
                  color: Color.PRIMARY_5
                }}
                className={css.actionText}
              >
                {timeRange?.label}
              </Text>
            </Popover>
          </Layout.Horizontal>
        </Card>
        <Container className={css.body}>
          <NodeRecommendationDetails
            recommendationStats={recommendationStats}
            recommendationDetails={recommendationDetails}
            timeRange={timeRange}
            recommendationName={recommendationName}
            nodeRecommendationRequestData={
              nodeRecommendationRequestData?.nodeRecommendationRequest as RecommendNodePoolClusterRequest
            }
            nodePoolData={nodePoolData as RecommendationItemDto}
          />
        </Container>
      </Page.Body>
    </>
  )
}

export default NodeRecommendationDetailsPage
