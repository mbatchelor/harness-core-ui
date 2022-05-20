/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Text, Button, Icon, FlexExpander } from '@wings-software/uicore'
import cx from 'classnames'
import { Menu, MenuItem, Popover, Position } from '@blueprintjs/core'
import { QlceViewTimeGroupType, QlceViewFilterInput } from 'services/ce/services'
import PerspectiveTimeRangePicker from '@ce/components/PerspectiveTimeRangePicker/PerspectiveTimeRangePicker'
import {
  CE_DATE_FORMAT_INTERNAL,
  DATE_RANGE_SHORTCUTS,
  getGMTEndDateTime,
  getGMTStartDateTime
} from '@ce/utils/momentUtils'
import { useStrings, UseStringsReturn } from 'framework/strings'
import type { setAggregationFn, setFiltersFn, setTimeRangeFn } from '@ce/types'
import ExplorerFilters from './ExplorerFilters'
import css from './PerspectiveExplorerFilters.module.scss'

const getAggregationText: (getString: UseStringsReturn['getString']) => Record<string, string> = getString => {
  return {
    [QlceViewTimeGroupType.Day]: getString('ce.perspectives.timeAggregation.daily'),
    [QlceViewTimeGroupType.Month]: getString('ce.perspectives.timeAggregation.monthly'),
    [QlceViewTimeGroupType.Hour]: getString('ce.perspectives.timeAggregation.hourly'),
    [QlceViewTimeGroupType.Week]: getString('triggers.schedulePanel.weeklyTabTitle')
  }
}

interface TimeGranularityDropDownProps {
  aggregation: QlceViewTimeGroupType
  setAggregation: setAggregationFn
  showHourlyAggr?: boolean
  isHourlyEnabled?: boolean
}

export const TimeGranularityDropDown: React.FC<TimeGranularityDropDownProps> = ({
  aggregation,
  setAggregation,
  showHourlyAggr,
  isHourlyEnabled
}) => {
  const { getString } = useStrings()
  const aggregationTextMap = getAggregationText(getString)
  return (
    <Popover
      position={Position.BOTTOM_LEFT}
      modifiers={{
        arrow: { enabled: false },
        flip: { enabled: true },
        keepTogether: { enabled: true },
        preventOverflow: { enabled: true }
      }}
      hoverCloseDelay={0}
      transitionDuration={0}
      minimal={true}
      content={
        <Menu>
          <MenuItem
            active={aggregation === QlceViewTimeGroupType.Day}
            className={css.aggregationMenuItems}
            onClick={() => {
              setAggregation(QlceViewTimeGroupType.Day)
            }}
            text={aggregationTextMap[QlceViewTimeGroupType.Day]}
          />
          <MenuItem
            active={aggregation === QlceViewTimeGroupType.Week}
            className={css.aggregationMenuItems}
            onClick={() => {
              setAggregation(QlceViewTimeGroupType.Week)
            }}
            text={aggregationTextMap[QlceViewTimeGroupType.Week]}
          />
          <MenuItem
            active={aggregation === QlceViewTimeGroupType.Month}
            className={css.aggregationMenuItems}
            onClick={() => {
              setAggregation(QlceViewTimeGroupType.Month)
            }}
            text={aggregationTextMap[QlceViewTimeGroupType.Month]}
          />
          {showHourlyAggr ? (
            <MenuItem
              disabled={!isHourlyEnabled}
              active={aggregation === QlceViewTimeGroupType.Hour}
              className={cx(css.aggregationMenuItems, { [css.disabled]: !isHourlyEnabled })}
              onClick={() => {
                setAggregation(QlceViewTimeGroupType.Hour)
              }}
              text={'Hourly'}
            />
          ) : null}
        </Menu>
      }
    >
      <Button
        intent="primary"
        minimal
        className={css.timeGranularityButton}
        text={aggregationTextMap[aggregation]}
        iconProps={{
          size: 16
        }}
        data-testId="groupBy"
        rightIcon="caret-down"
      />
    </Popover>
  )
}

interface PersepectiveExplorerFiltersProps {
  aggregation: QlceViewTimeGroupType
  setAggregation: setAggregationFn
  setTimeRange: setTimeRangeFn
  timeRange: {
    to: string
    from: string
  }
  setFilters: setFiltersFn
  filters: QlceViewFilterInput[]
  showHourlyAggr?: boolean
  featureEnabled?: boolean
}

const PersepectiveExplorerFilters: React.FC<PersepectiveExplorerFiltersProps> = ({
  aggregation,
  setAggregation,
  setTimeRange,
  setFilters,
  timeRange,
  filters,
  showHourlyAggr,
  featureEnabled
}) => {
  const last7DaysRange = DATE_RANGE_SHORTCUTS['LAST_7_DAYS']
  return (
    <Container
      background="white"
      padding="small"
      border={{
        bottom: true
      }}
    >
      <Container className={css.mainContainer}>
        <Icon name="ng-filter" size={20} />
        <ExplorerFilters timeRange={timeRange} filters={filters} setFilters={setFilters} />
        <FlexExpander />
        <PerspectiveTimeRangePicker timeRange={timeRange} setTimeRange={setTimeRange} featureEnabled={featureEnabled} />
        <Text color="primary7">|</Text>
        <TimeGranularityDropDown
          aggregation={aggregation}
          setAggregation={setAggregation}
          showHourlyAggr={showHourlyAggr}
          isHourlyEnabled={
            getGMTStartDateTime(timeRange.from) >=
              getGMTStartDateTime(last7DaysRange[0].format(CE_DATE_FORMAT_INTERNAL)) &&
            getGMTEndDateTime(timeRange.to) <= getGMTEndDateTime(last7DaysRange[1].format(CE_DATE_FORMAT_INTERNAL))
          }
        />
      </Container>
    </Container>
  )
}

export default PersepectiveExplorerFilters
