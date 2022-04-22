/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Layout, Text, TextInput, Button, Icon, ButtonVariation } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { Slider } from '@blueprintjs/core'
import { isEqual } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { addBufferToState, addBufferToValue } from '@ce/utils/recommendationUtils'
import { ACTIONS, Action, IState } from './constants'
import css from './NodeRecommendation.module.scss'

interface TuneRecommendationCardHeaderProps {
  cardVisible: boolean
  toggleCardVisible: () => void
}

export const TuneRecommendationCardHeader: React.FC<TuneRecommendationCardHeaderProps> = ({
  cardVisible,
  toggleCardVisible
}) => {
  const { getString } = useStrings()

  return (
    <Container padding="medium" flex className={css.spaceBetween}>
      <Text
        className={css.pointer}
        font={{ variation: FontVariation.H6 }}
        color={cardVisible ? Color.GREY_800 : Color.PRIMARY_7}
        onClick={toggleCardVisible}
      >
        {getString('ce.nodeRecommendation.setInstancePreferences')}
      </Text>
      <Icon
        name={cardVisible ? 'caret-up' : 'caret-down'}
        onClick={toggleCardVisible}
        color={Color.PRIMARY_7}
        className={css.pointer}
      />
    </Container>
  )
}

interface TuneRecommendationCardProps {
  loading: boolean
  cardVisible: boolean
  toggleCardVisible: () => void
  state: IState
  dispatch: React.Dispatch<Action>
  buffer: number
  setBuffer: (newState: number) => void
  showInstanceFamiliesModal: () => void
  initialState: IState
  updatedState: IState
  updateRecommendationDetails: () => void
}

export const TuneRecommendationCard: React.FC<TuneRecommendationCardProps> = props => {
  const {
    loading,
    cardVisible,
    toggleCardVisible,
    state,
    dispatch,
    buffer,
    setBuffer,
    showInstanceFamiliesModal,
    initialState,
    updateRecommendationDetails,
    updatedState
  } = props
  const { getString } = useStrings()

  return (
    <>
      <TuneRecommendationCardHeader cardVisible={cardVisible} toggleCardVisible={toggleCardVisible} />
      {cardVisible ? (
        <Container className={css.preferences} padding="medium" background={Color.PRIMARY_1}>
          <Layout.Vertical spacing="medium">
            <Container>
              <Text
                font={{ variation: FontVariation.SMALL_SEMI }}
                tooltipProps={{ dataTooltipId: 'prefResourceNeeds' }}
              >
                {getString('ce.nodeRecommendation.prefResourceNeeds')}
              </Text>
              <Layout.Horizontal flex className={css.spaceBetween} spacing="medium" margin={{ top: 'small' }}>
                <Layout.Horizontal spacing="medium">
                  <Resources state={state} dispatch={dispatch} />
                  <Container flex={{ justifyContent: 'center' }}>
                    <Container style={{ borderWidth: 1, borderStyle: 'solid', borderLeft: 0, width: 14, height: 60 }} />
                  </Container>
                  <Container flex={{ justifyContent: 'center' }} margin={{ right: 'small' }}>
                    <Icon name="plus" size={12} color={Color.GREY_700} />
                  </Container>
                </Layout.Horizontal>
                <Buffer state={state} buffer={buffer} setBuffer={setBuffer} />
              </Layout.Horizontal>
              <Layout.Horizontal padding={{ top: 'medium' }} spacing="medium">
                <LargestResources state={state} dispatch={dispatch} />
                <Nodes state={state} dispatch={dispatch} />
              </Layout.Horizontal>
            </Container>
            <InstanceFamilies showInstanceFamiliesModal={showInstanceFamiliesModal} state={state} />
            <ApplyPreferencesButtonGroup
              dispatch={dispatch}
              setBuffer={setBuffer}
              state={state}
              initialState={initialState}
              updatedState={updatedState}
              updateRecommendationDetails={updateRecommendationDetails}
              buffer={buffer}
              loading={loading}
            />
          </Layout.Vertical>
        </Container>
      ) : null}
    </>
  )
}

const Resources: React.FC<{ dispatch: React.Dispatch<Action>; state: IState }> = ({ dispatch, state }) => {
  const { getString } = useStrings()

  return (
    <Container>
      <Layout.Vertical spacing="small">
        <Container flex className={css.spaceBetween}>
          <Text
            padding={{ right: 'small' }}
            inline
            color={Color.GREY_500}
            font={{ variation: FontVariation.SMALL_SEMI }}
          >
            {getString('ce.nodeRecommendation.cpus')}
          </Text>
          <TextInput
            value={`${state.sumCpu}`}
            wrapperClassName={css.input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              dispatch({ type: ACTIONS.SUM_CPUS, data: e.target.value })
            }
            data-testid="sumCpu-input"
          />
        </Container>
        <Container flex className={css.spaceBetween}>
          <Text
            padding={{ right: 'small' }}
            inline
            color={Color.GREY_500}
            font={{ variation: FontVariation.SMALL_SEMI }}
          >
            {getString('ce.nodeRecommendation.mem')}
          </Text>
          <TextInput
            value={`${state.sumMem}`}
            wrapperClassName={css.input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              dispatch({ type: ACTIONS.SUM_MEM, data: e.target.value })
            }
            data-testid="sumMem-input"
          />
        </Container>
      </Layout.Vertical>
    </Container>
  )
}

const Buffer: React.FC<{
  state: IState
  buffer: number
  setBuffer: (newState: number) => void
}> = ({ state, buffer, setBuffer }) => {
  const { getString } = useStrings()

  return (
    <Container width="60%">
      <Layout.Vertical spacing="xxsmall">
        <Layout.Horizontal style={{ justifyContent: 'space-between' }}>
          <Text
            font={{ variation: FontVariation.SMALL_SEMI }}
            rightIcon="info"
            rightIconProps={{ size: 12, color: Color.GREY_800 }}
            tooltipProps={{ dataTooltipId: 'buffer' }}
          >
            {getString('ce.nodeRecommendation.buffer')}
          </Text>
          <Text font={{ variation: FontVariation.SMALL_SEMI }} color={Color.GREY_400}>{`${buffer}%`}</Text>
        </Layout.Horizontal>
        <Slider
          min={0}
          max={100}
          stepSize={1}
          labelRenderer={false}
          value={buffer}
          onChange={val => setBuffer(val)}
          className={css.bufferSlider}
        />
        <Text font={{ variation: FontVariation.SMALL }} margin={{ top: 'xsmall' }}>
          {getString('ce.nodeRecommendation.cpuAndMemeValWithBuffer', {
            cpu: addBufferToValue(state.sumCpu, buffer),
            mem: addBufferToValue(state.sumMem, buffer)
          })}
        </Text>
      </Layout.Vertical>
    </Container>
  )
}

const LargestResources: React.FC<{ dispatch: React.Dispatch<Action>; state: IState }> = ({ dispatch, state }) => {
  const { getString } = useStrings()

  return (
    <Container>
      <Layout.Vertical spacing="small">
        <Text font={{ variation: FontVariation.SMALL_SEMI }} tooltipProps={{ dataTooltipId: 'largestWorkloadReq' }}>
          {getString('ce.nodeRecommendation.largestWorkloadReq')}
        </Text>
        <Container flex className={css.spaceBetween} width="75%">
          <Text inline color={Color.GREY_500} font={{ variation: FontVariation.SMALL_SEMI }}>
            {getString('ce.nodeRecommendation.cpus')}
          </Text>
          <TextInput
            value={`${state.maxCpu}`}
            wrapperClassName={css.input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              dispatch({ type: ACTIONS.MAX_CPUS, data: e.target.value })
            }
            data-testid="maxCpu-input"
          />
        </Container>
        <Container flex className={css.spaceBetween} width="75%">
          <Text inline color={Color.GREY_500} font={{ variation: FontVariation.SMALL_SEMI }}>
            {getString('ce.nodeRecommendation.mem')}
          </Text>
          <TextInput
            value={`${state.maxMemory}`}
            wrapperClassName={css.input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              dispatch({ type: ACTIONS.MAX_MEM, data: e.target.value })
            }
            data-testid="maxMemory-input"
          />
        </Container>
      </Layout.Vertical>
    </Container>
  )
}

const Nodes: React.FC<{ dispatch: React.Dispatch<Action>; state: IState }> = ({ dispatch, state }) => {
  const { getString } = useStrings()

  return (
    <Container padding={{ left: 'large' }}>
      <Layout.Vertical spacing="small">
        <Text font={{ variation: FontVariation.SMALL_SEMI }} tooltipProps={{ dataTooltipId: 'prefMinNodeCount' }}>
          {getString('ce.nodeRecommendation.prefMinNodeCount')}
        </Text>
        <Layout.Horizontal spacing="small" className={css.minNodeContainer}>
          <Button
            icon="minus"
            variation={ButtonVariation.SECONDARY}
            onClick={() => {
              dispatch({ type: ACTIONS.MIN_NODES, data: state.minNodes - 1 })
            }}
            disabled={state.minNodes <= 0}
            data-testid="increment-minnode-btn"
          />
          <TextInput
            value={`${state.minNodes}`}
            wrapperClassName={css.minNodeInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              dispatch({ type: ACTIONS.MIN_NODES, data: +e.target.value })
            }
            data-testid="minnodes-input"
          />
          <Button
            icon="plus"
            variation={ButtonVariation.SECONDARY}
            onClick={() => {
              dispatch({ type: ACTIONS.MIN_NODES, data: state.minNodes + 1 })
            }}
            data-testid="decrement-minnode-btn"
          />
        </Layout.Horizontal>
      </Layout.Vertical>
    </Container>
  )
}

const InstanceFamilies: React.FC<{
  state: IState
  showInstanceFamiliesModal: () => void
}> = ({ state, showInstanceFamiliesModal }) => {
  const { getString } = useStrings()

  return (
    <Container>
      <Container margin={{ bottom: 'small' }}>
        <Text
          inline
          font={{ variation: FontVariation.SMALL_SEMI }}
          // tooltipProps={{ dataTooltipId: 'preferredInstanceFamilies' }}
        >
          {getString('ce.nodeRecommendation.preferredInstanceFamilies')}
        </Text>
        {state.includeSeries.length || state.includeTypes.length ? (
          <Button
            inline
            variation={ButtonVariation.LINK}
            icon="edit"
            onClick={showInstanceFamiliesModal}
            iconProps={{ size: 12 }}
          >
            {getString('edit')}
          </Button>
        ) : null}
      </Container>
      {state.includeSeries.length || state.includeTypes.length ? (
        <TextInput
          value={[...state.includeSeries, ...state.includeTypes].join(', ')}
          contentEditable={false}
          className={css.instaceFamilyInput}
          readOnly
        />
      ) : null}
      <Button
        icon="plus"
        variation={ButtonVariation.LINK}
        margin={{ bottom: 'small' }}
        onClick={showInstanceFamiliesModal}
      >
        {getString('ce.nodeRecommendation.addPreferredInstanceFamilies')}
      </Button>
    </Container>
  )
}

const ApplyPreferencesButtonGroup: React.FC<{
  updateRecommendationDetails: () => void
  state: IState
  initialState: IState
  updatedState: IState
  dispatch: React.Dispatch<Action>
  setBuffer: (newState: number) => void
  buffer: number
  loading: boolean
}> = ({ updateRecommendationDetails, state, initialState, updatedState, dispatch, setBuffer, buffer, loading }) => {
  const { getString } = useStrings()

  const stateWithBuffer = addBufferToState(state, buffer)

  return (
    <Layout.Horizontal spacing="small">
      <Button
        variation={ButtonVariation.PRIMARY}
        onClick={updateRecommendationDetails}
        disabled={isEqual(stateWithBuffer, updatedState)}
        loading={loading}
      >
        {getString('ce.nodeRecommendation.applyPreferences')}
      </Button>
      {!isEqual(stateWithBuffer, initialState) ? (
        <Button
          variation={ButtonVariation.SECONDARY}
          onClick={() => {
            setBuffer(0)
            dispatch({
              type: ACTIONS.RESET_TO_DEFAULT,
              data: initialState
            })
          }}
        >
          {getString('ce.recommendation.detailsPage.resetRecommendationText')}
        </Button>
      ) : null}
    </Layout.Horizontal>
  )
}
