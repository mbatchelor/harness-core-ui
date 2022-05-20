/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Icon, Layout, Text } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'
import cx from 'classnames'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'

import css from './DashboardAPIErrorWidget.module.scss'

export interface DashboardAPIErrorWidgetProps {
  className?: string
  iconProps?: Omit<IconProps, 'name'>
  callback?: (options?: Record<string, any>) => Promise<void>
}

const renderRetryLinks = (label: string, callback?: DashboardAPIErrorWidgetProps['callback']): JSX.Element => {
  return (
    <Text color={Color.PRIMARY_7} onClick={callback ?? (() => location.reload())}>
      {label}
    </Text>
  )
}

const DashboardAPIErrorWidget: React.FC<DashboardAPIErrorWidgetProps> = props => {
  const { getString } = useStrings()

  const getSuggestionText = (): JSX.Element => {
    return (
      <Layout.Horizontal spacing="xsmall">
        <Text>{getString('common.suggestionsLabel')}</Text>
        <Text>{renderRetryLinks(getString('retry'), props.callback)}</Text>
        <Text>{getString('or')}</Text>
        <Text>{renderRetryLinks(getString('common.refreshPage'))}</Text>
      </Layout.Horizontal>
    )
  }

  return (
    <Layout.Vertical
      className={cx(props.className, css.errorWidgetWrapper)}
      background={Color.YELLOW_50}
      flex={{ justifyContent: 'center' }}
    >
      <Icon name="data-fetch-error" size={120} {...props.iconProps} margin={{ bottom: 'large', top: 'small' }}></Icon>
      <Text
        icon="warning-sign"
        iconProps={{ color: Color.ORANGE_700 }}
        color={Color.ORANGE_700}
        font={{ size: 'medium' }}
      >
        {getString('projectsOrgs.apiError')}
      </Text>
      {getSuggestionText()}
    </Layout.Vertical>
  )
}

export default DashboardAPIErrorWidget
