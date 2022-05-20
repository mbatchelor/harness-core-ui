/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { Icon, IconName, Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { IconProps } from '@harness/icons'
import type { StringsMap } from 'framework/strings/StringsContext'
import { useStrings } from 'framework/strings'

interface LandingDashboardWidgetWrapperProps {
  title?: keyof StringsMap
  icon?: IconName
  iconProps?: Omit<IconProps, 'name'>
}

const LandingDashboardWidgetWrapper: React.FC<LandingDashboardWidgetWrapperProps> = props => {
  const { getString } = useStrings()

  return (
    <Layout.Vertical spacing="large">
      {props.title ? (
        <Layout.Horizontal spacing="small">
          {props.icon ? <Icon flex={{ align: 'center-center' }} {...props.iconProps} name={props.icon} /> : null}
          <Text font={{ size: 'medium', weight: 'bold' }} color={Color.BLACK}>
            {getString(props.title)}
          </Text>
        </Layout.Horizontal>
      ) : null}
      {props.children}
    </Layout.Vertical>
  )
}

export default LandingDashboardWidgetWrapper
