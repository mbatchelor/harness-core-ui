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
import type { RiskData } from 'services/cv'
import css from './IconGrid.module.scss'

interface Props {
  items?: RiskData[]
  iconProps: IconProps
  max?: number
  width?: number
  isDarkBackground?: boolean
}

const IconGrid: React.FC<Props> = ({ items, iconProps, max = 8, width, isDarkBackground }) => {
  const { getString } = useStrings()

  if (items) {
    return (
      <Layout.Horizontal className={css.container} width={width}>
        {items.slice(0, max).map((item, i) => (
          <Utils.WrapOptionalTooltip
            key={i}
            tooltip={item.healthScore?.toString() ?? getString(getRiskLabelStringId(item.riskStatus))}
            tooltipProps={{
              usePortal: false,
              popoverClassName: isDarkBackground ? css.healthScorePopoverDarkBg : css.healthScorePopoverLightBg
            }}
          >
            <Icon {...iconProps} color={getRiskColorValue(item.riskStatus, false, !!isDarkBackground)} />
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

export default IconGrid
