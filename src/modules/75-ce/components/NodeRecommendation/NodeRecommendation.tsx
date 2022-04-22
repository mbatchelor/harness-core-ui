/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import {
  Container,
  Layout,
  Text,
  Card,
  Button,
  ButtonVariation,
  Icon,
  Tabs,
  getErrorInfoFromErrorObject
} from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Dialog, Position, Toaster } from '@blueprintjs/core'
import { useModalHook } from '@harness/use-modal'
import { defaultTo, isEqual } from 'lodash-es'
import pDebounce from 'p-debounce'
import { useToaster } from '@common/exports'
import useDidMountEffect from '@ce/common/useDidMountEffect'
import type { NodepoolTimeRangeValue } from '@ce/types'
import { getTimePeriodString, GET_NODEPOOL_DATE_RANGE } from '@ce/utils/momentUtils'
import type {
  NodeRecommendationDto,
  RecommendationItemDto,
  RecommendationOverviewStats,
  RecommendNodePoolClusterRequest,
  TotalResourceUsage
} from 'services/ce/services'
import { useStrings } from 'framework/strings'
import Recommender from '@ce/components/NodeRecommendation/Recommender'
import formatCost from '@ce/utils/formatCost'
import {
  RecommendationDetailsSavingsCard,
  RecommendationDetailsSpendCard
} from '@ce/components/RecommendationDetailsSummaryCards/RecommendationDetailsSummaryCards'
import { TuneRecommendationCard } from '@ce/components/NodeRecommendation/TuneNodeRecommendationCard'
import { RecommendationResponse, RecommendClusterRequest, useRecommendCluster } from 'services/ce/recommenderService'
import { useGetSeries } from 'services/ce/publicPricingService'
import {
  addBufferToState,
  calculateSavingsPercentage,
  convertStateToRecommendClusterPayload,
  getInstanceFamiliesFromState,
  getProviderIcon,
  isResourceConsistent
} from '@ce/utils/recommendationUtils'
import { useQueryParamsState } from '@common/hooks/useQueryParamsState'
import { InstanceFamiliesModalTab } from '../InstanceFamiliesModalTab/InstanceFamiliesModalTab'
import ResourceUtilizationCharts from './ResourceUtilizationCharts'
import { ACTIONS, Action, IState } from './constants'
import css from './NodeRecommendation.module.scss'

export const insertOrRemoveIntoArray = (array: string[], val: string): string[] =>
  array.indexOf(val) > -1 ? array.filter(ele => ele !== val) : [...array, val]

export const reducer = (state: IState, action: Action) => {
  const { type, data } = action

  switch (type) {
    case ACTIONS.SUM_CPUS:
      return { ...state, sumCpu: data }
    case ACTIONS.SUM_MEM:
      return { ...state, sumMem: data }
    case ACTIONS.MAX_CPUS:
      return { ...state, maxCpu: data }
    case ACTIONS.MAX_MEM:
      return { ...state, maxMemory: data }
    case ACTIONS.MIN_NODES:
      return { ...state, minNodes: data }
    case ACTIONS.MAX_NODES:
      return { ...state, maxNodes: data }
    case ACTIONS.INCLUDE_TYPES:
      return {
        ...state,
        includeTypes: insertOrRemoveIntoArray(state.includeTypes, data)
      }
    case ACTIONS.INCLUDE_SERIES:
      return {
        ...state,
        includeSeries: insertOrRemoveIntoArray(state.includeSeries, data)
      }
    case ACTIONS.EXCLUDE_TYPES:
      return {
        ...state,
        excludeTypes: insertOrRemoveIntoArray(state.excludeTypes, data)
      }
    case ACTIONS.EXCLUDE_SERIES:
      return {
        ...state,
        excludeSeries: insertOrRemoveIntoArray(state.excludeSeries, data)
      }
    case ACTIONS.CLEAR_INSTACE_FAMILY:
      return {
        ...state,
        includeTypes: data.includeTypes,
        includeSeries: data.includeSeries,
        excludeTypes: data.excludeTypes,
        excludeSeries: data.excludeSeries
      }
    case ACTIONS.RESET_TO_DEFAULT:
      return data
    case ACTIONS.UPDATE_TIME_RANGE:
      return {
        ...state,
        sumCpu: data.sumCpu,
        sumMem: data.sumMem,
        minNodes: data.minNodes,
        maxCpu: data.maxCpu,
        maxMemory: data.maxMemory
      }
    default:
      return state
  }
}

export const UpdatePreferenceToaster = Toaster.create({
  className: css.toaster,
  position: Position.BOTTOM_RIGHT
})

interface NodeRecommendationDetailsProps {
  recommendationStats: RecommendationOverviewStats
  recommendationDetails: NodeRecommendationDto
  timeRange: NodepoolTimeRangeValue
  recommendationName: string
  nodeRecommendationRequestData: RecommendNodePoolClusterRequest
  nodePoolData: RecommendationItemDto
}

const NodeRecommendationDetails: React.FC<NodeRecommendationDetailsProps> = ({
  recommendationDetails,
  recommendationStats,
  timeRange,
  recommendationName,
  nodeRecommendationRequestData,
  nodePoolData
}) => {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const timeRangeFilter = GET_NODEPOOL_DATE_RANGE[timeRange.value]

  const [buffer, setBuffer] = useQueryParamsState('bufferValue', 0)
  const [tuneRecomVisible, setTuneRecomVisible] = useState(true)

  const { includeTypes, includeSeries, excludeTypes, excludeSeries } = defaultTo(
    recommendationDetails.resourceRequirement,
    {}
  ) as RecommendClusterRequest

  const { sumCpu, sumMem, minNodes } = (nodeRecommendationRequestData?.recommendClusterRequest ||
    {}) as RecommendClusterRequest

  const { maxcpu, maxmemory } = (nodeRecommendationRequestData?.totalResourceUsage || {}) as TotalResourceUsage

  const { provider, region, service } = (recommendationDetails.recommended || {}) as RecommendationResponse

  const initialState = {
    maxCpu: +defaultTo(maxcpu, 0).toFixed(2),
    maxMemory: +defaultTo(maxmemory, 0).toFixed(2),
    sumCpu: +defaultTo(sumCpu, 0).toFixed(2),
    sumMem: +defaultTo(sumMem, 0).toFixed(2),
    minNodes: +defaultTo(minNodes, 0).toFixed(2),
    includeTypes: includeTypes || [],
    includeSeries: includeSeries || [],
    excludeTypes: excludeTypes || [],
    excludeSeries: excludeSeries || []
  }
  const [recomDetails, setRecomDetails] = useState(recommendationDetails)
  const [state, dispatch] = useReducer(
    reducer,
    useMemo(() => initialState as IState, [])
  )

  const [updatedState, setUpdatedState] = useState(initialState)

  const pathParams = {
    provider: defaultTo(provider, ''),
    region: defaultTo(region, ''),
    service: defaultTo(service, '')
  }
  const { mutate: fetchNewRecommendation, loading } = useRecommendCluster(pathParams)
  const { data: seriesData, loading: seriesDataLoading } = useGetSeries(pathParams)

  const debouncedFetchNewRecomm = useCallback(pDebounce(fetchNewRecommendation, 500), [])

  const updateRecommendationDetails = async () => {
    if (isResourceConsistent(state.sumCpu, state.sumMem, state.maxCpu, state.maxMemory, buffer)) {
      try {
        const payload = convertStateToRecommendClusterPayload(
          state,
          defaultTo(recommendationDetails.resourceRequirement, {}) as RecommendClusterRequest,
          buffer
        )
        const response = await debouncedFetchNewRecomm(payload)
        const newState = {
          ...recomDetails,
          recommended: { ...recomDetails.recommended, ...response }
        } as NodeRecommendationDto

        if (!isEqual(recomDetails, newState)) {
          setRecomDetails(newState)
        }
        setUpdatedState(addBufferToState(state, buffer))
        UpdatePreferenceToaster.show({ message: getString('ce.nodeRecommendation.updatePreferences'), icon: 'tick' })
      } catch (e: any) {
        showError(e?.data?.title === 'recommendation problem' ? e?.data?.detail : getErrorInfoFromErrorObject(e))
      }
    } else {
      showError(getString('ce.nodeRecommendation.inconsistentResourceReq'))
    }
  }

  const currentTimeRange = useRef<NodepoolTimeRangeValue>(timeRange)

  useDidMountEffect(() => {
    dispatch({
      type: ACTIONS.UPDATE_TIME_RANGE,
      data: {
        maxCpu: +defaultTo(maxcpu, 0).toFixed(2),
        maxMemory: +defaultTo(maxmemory, 0).toFixed(2),
        sumCpu: +defaultTo(sumCpu, 0).toFixed(2),
        sumMem: +defaultTo(sumMem, 0).toFixed(2),
        minNodes: +defaultTo(minNodes, 0).toFixed(2)
      }
    })

    currentTimeRange.current = timeRange
  }, [timeRange])

  useDidMountEffect(() => {
    updateRecommendationDetails()
  }, [currentTimeRange.current])

  const [showModal, hideModal] = useModalHook(() => {
    return (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        onClose={hideModal}
        style={{ width: 1175 }}
        className={css.modalContainer}
      >
        <Layout.Vertical spacing="medium" padding="xxlarge" height="100%">
          <Text
            font={{ variation: FontVariation.H4 }}
            icon={getProviderIcon(defaultTo(recommendationDetails.recommended?.provider, ''))}
          >
            {`${recommendationName}: Preferred Instance Families`}
          </Text>
          <Text font={{ variation: FontVariation.SMALL }}>
            {getString('ce.nodeRecommendation.instaceFamiliesModalDesc')}
          </Text>
          <Container height="100%">
            <Tabs
              id={'horizontalTabs'}
              tabList={Object.keys(defaultTo(seriesData?.categoryDetails, {})).map(key => ({
                id: key,
                title: key,
                panel: (
                  <InstanceFamiliesModalTab
                    data={seriesData?.categoryDetails ? seriesData?.categoryDetails[key] : {}}
                    state={state}
                    dispatch={dispatch}
                  />
                )
              }))}
            />
          </Container>
          <InstaceFamiliesModalButtonGroup
            onSave={hideModal}
            onCancel={() => {
              hideModal()
              dispatch({
                type: ACTIONS.CLEAR_INSTACE_FAMILY,
                data: {
                  includeTypes: updatedState.includeTypes,
                  includeSeries: updatedState.includeSeries,
                  excludeTypes: updatedState.excludeTypes,
                  excludeSeries: updatedState.excludeSeries
                }
              })
            }}
            saveButtonDisabled={isEqual(
              getInstanceFamiliesFromState(state),
              getInstanceFamiliesFromState(updatedState)
            )}
          />
        </Layout.Vertical>
      </Dialog>
    )
  }, [seriesDataLoading, state, updatedState])

  return (
    <>
      <Layout.Vertical>
        <Card style={{ paddingLeft: 0, paddingRight: 0 }}>
          <Layout.Horizontal padding={{ left: 'large' }}>
            <Container width={400}>
              <RecommendationDetailsSpendCard
                withRecommendationAmount={formatCost(
                  recommendationStats?.totalMonthlyCost - recommendationStats?.totalMonthlySaving
                )}
                withoutRecommendationAmount={formatCost(recommendationStats?.totalMonthlyCost)}
                title={`${getString('ce.recommendation.listPage.monthlyPotentialCostText')}`}
                spentBy={getTimePeriodString(timeRangeFilter[1], 'MMM DD')}
              />
            </Container>
            <Container>
              <RecommendationDetailsSavingsCard
                amount={formatCost(recommendationStats?.totalMonthlySaving)}
                title={getString('ce.recommendation.listPage.monthlySavingsText')}
                amountSubTitle={calculateSavingsPercentage(
                  recommendationStats?.totalMonthlySaving,
                  recommendationStats?.totalMonthlyCost
                )}
                subTitle={`${getTimePeriodString(timeRangeFilter[0], 'MMM DD')} - ${getTimePeriodString(
                  timeRangeFilter[1],
                  'MMM DD'
                )}`}
              />
            </Container>
          </Layout.Horizontal>
          <Recommender stats={recommendationStats} details={recomDetails} loading={loading} />
          <TuneRecommendationHelpText
            toggleCardVisible={() => setTuneRecomVisible((prevState: boolean) => !prevState)}
          />
        </Card>
      </Layout.Vertical>
      <Layout.Vertical spacing="large" padding="xlarge">
        <Text font={{ variation: FontVariation.H5 }}>{getString('ce.recommendation.detailsPage.nodepoolDetails')}</Text>
        <Container margin={{ bottom: 'large' }}>
          <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_500}>
            {getString('common.cluster')}
          </Text>
          <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_800}>
            {nodePoolData.clusterName}
          </Text>
        </Container>
        <ResourceUtilizationCharts
          sumCpu={+defaultTo(sumCpu, 0).toFixed(2)}
          sumMem={+defaultTo(sumMem, 0).toFixed(2)}
          minNodes={+defaultTo(minNodes, 0).toFixed(2)}
          timeRange={timeRange}
        />
        <Text font={{ variation: FontVariation.H5 }} padding={{ top: 'xsmall' }}>
          {getString('ce.recommendation.detailsPage.tuneRecommendations')}
        </Text>
        <Card className={css.tuneRecommendationCard}>
          <TuneRecommendationCard
            cardVisible={tuneRecomVisible}
            loading={loading}
            toggleCardVisible={() => setTuneRecomVisible(prevState => !prevState)}
            state={state}
            dispatch={dispatch}
            buffer={buffer}
            setBuffer={setBuffer}
            showInstanceFamiliesModal={showModal}
            initialState={initialState}
            updatedState={updatedState}
            updateRecommendationDetails={updateRecommendationDetails}
          />
        </Card>
      </Layout.Vertical>
    </>
  )
}

export default NodeRecommendationDetails

export const TuneRecommendationHelpText: React.FC<{ toggleCardVisible: () => void }> = ({ toggleCardVisible }) => {
  const { getString } = useStrings()

  return (
    <Container margin="medium" className={css.tuneRecomInfoContainer} padding="medium" background={Color.BLUE_50}>
      <Layout.Horizontal spacing="xsmall">
        <Icon name="info-messaging" />
        <Container>
          <Text inline color={Color.GREY_700} font={{ variation: FontVariation.SMALL }}>
            {getString('ce.nodeRecommendation.tuneRecommendationsInfo1')}
          </Text>
          <Text
            inline
            color={Color.PRIMARY_7}
            font={{ variation: FontVariation.SMALL }}
            onClick={toggleCardVisible}
            className={css.pointer}
          >
            {getString('ce.recommendation.detailsPage.tuneRecommendations').toLowerCase()}
          </Text>
          <Text inline color={Color.GREY_700} font={{ variation: FontVariation.SMALL }}>
            {getString('ce.nodeRecommendation.tuneRecommendationsInfo2')}
          </Text>
        </Container>
      </Layout.Horizontal>
    </Container>
  )
}

const InstaceFamiliesModalButtonGroup: React.FC<{
  onSave: () => void
  onCancel: () => void
  saveButtonDisabled: boolean
}> = ({ onCancel, onSave, saveButtonDisabled }) => {
  const { getString } = useStrings()

  return (
    <Layout.Horizontal spacing="medium">
      <Button variation={ButtonVariation.PRIMARY} onClick={onSave} disabled={saveButtonDisabled}>
        {getString('ce.nodeRecommendation.savePreferences')}
      </Button>
      <Button variation={ButtonVariation.TERTIARY} onClick={onCancel}>
        {getString('cancel')}
      </Button>
    </Layout.Horizontal>
  )
}
