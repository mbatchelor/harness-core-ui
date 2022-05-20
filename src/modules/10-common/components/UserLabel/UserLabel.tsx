/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Icon, Layout, Text, Avatar, TextProps } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { IconProps } from '@harness/icons'
import cx from 'classnames'

import { Popover, PopoverInteractionKind, Position, Classes } from '@blueprintjs/core'
import css from './UserLabel.module.scss'

export interface UserLabelProps {
  name: string
  email?: string
  profilePictureUrl?: string
  className?: string
  iconProps?: Omit<IconProps, 'name'>
  textProps?: TextProps
}

const handleClickOnPopoverContent = (e: React.MouseEvent<HTMLElement, MouseEvent>): void => e.stopPropagation()

export function UserLabel(props: UserLabelProps): React.ReactElement {
  const { name, email, profilePictureUrl, className, iconProps, textProps } = props

  return (
    <div className={css.wrapper}>
      <Popover
        interactionKind={PopoverInteractionKind.HOVER}
        popoverClassName={Classes.DARK}
        position={Position.BOTTOM_LEFT}
        content={
          <Layout.Horizontal
            padding="medium"
            height="inherit"
            flex={{ align: 'center-center' }}
            onClick={handleClickOnPopoverContent}
          >
            {profilePictureUrl ? (
              <Avatar className={css.profilePicture} size={'small'} src={profilePictureUrl} hoverCard={false} />
            ) : (
              <Icon name="user" size={36} />
            )}
            <Layout.Vertical className={css.rightSection}>
              <Text font={{ weight: 'bold' }} color={Color.WHITE}>
                {name}
              </Text>
              {email ? (
                <Text font={{ size: 'small' }} color={Color.PRIMARY_5}>
                  {email}
                </Text>
              ) : null}
            </Layout.Vertical>
          </Layout.Horizontal>
        }
      >
        <div className={cx(css.userLabel, className)}>
          {profilePictureUrl ? (
            <Avatar className={css.profilePicture} size={'xsmall'} src={profilePictureUrl} hoverCard={false} />
          ) : (
            <Icon name="user" size={18} {...iconProps} />
          )}
          <Text {...textProps}>{name}</Text>
        </div>
      </Popover>
    </div>
  )
}
