/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { IconProps } from '@harness/icons'
import { Layout, Text, Utils, Icon } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { getRiskColorValue, getRiskLabelStringId } from '@cv/utils/CommonUtils'
import { useStrings } from 'framework/strings'
import type { MonitoredServiceListItemDTO } from 'services/cv'
import css from './SLOsIconGrid.module.scss'

interface SLOsIconGridProps {
  items?: MonitoredServiceListItemDTO['sloHealthIndicators']
  iconProps: IconProps
  max?: number
  width?: number
  isDarkBackground?: boolean
}

const SLOsIconGrid: React.FC<SLOsIconGridProps> = ({ items, iconProps, max = 8, width, isDarkBackground }) => {
  const { getString } = useStrings()

  if (items) {
    return (
      <Layout.Horizontal className={css.container} width={width}>
        {items.slice(0, max).map((item, i) => (
          <Utils.WrapOptionalTooltip
            key={i}
            tooltip={
              `${Number(item?.errorBudgetRemainingPercentage || 0).toFixed(2)}%` ??
              getString(getRiskLabelStringId(item.errorBudgetRisk))
            }
            tooltipProps={{
              usePortal: false,
              popoverClassName: isDarkBackground ? css.errorBudgetPopoverDarkBg : css.errorBudgetPopoverLightBg
            }}
          >
            <Icon {...iconProps} color={getRiskColorValue(item.errorBudgetRisk, false, !!isDarkBackground)} />
          </Utils.WrapOptionalTooltip>
        ))}
        {items.length > max && (
          <Text
            font={{ variation: FontVariation.TINY_SEMI }}
            color={isDarkBackground ? Color.GREY_100 : Color.GREY_600}
          >
            +{items.length - max}
          </Text>
        )}
      </Layout.Horizontal>
    )
  }

  return null
}

export default SLOsIconGrid
