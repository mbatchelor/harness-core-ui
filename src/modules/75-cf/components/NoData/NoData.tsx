/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactNode } from 'react'
import { Button, ButtonProps, ButtonVariation, Container, Heading, Layout, Text } from '@harness/uicore'
import type { LayoutProps } from '@harness/uicore/dist/layouts/Layout'
import { Color, FontVariation } from '@harness/design-system'
import css from './NoData.module.scss'

export interface NoDataProps extends LayoutProps {
  imageURL: string
  message: string
  description?: ReactNode
  width?: number | string
  imgWidth?: number
  buttonText?: string
  buttonWidth?: number
  onClick?: ButtonProps['onClick']
  buttonProps?: ButtonProps
}

export const NoData: React.FC<NoDataProps> = ({
  imageURL,
  message,
  description,
  width,
  imgWidth,
  buttonText,
  buttonWidth,
  onClick,
  buttonProps,
  children,
  ...props
}) => {
  return (
    <Layout.Vertical flex={{ justifyContent: 'center' }} spacing="xxxlarge" width={width || 540} {...props}>
      <img src={imageURL} width={imgWidth || 320} height={220} alt="" data-testid="nodata-image" />

      <Container>
        <Layout.Vertical spacing="small">
          <Heading className={css.centerAlign} level={2} font={{ variation: FontVariation.H4 }} color={Color.GREY_600}>
            {message}
          </Heading>

          {description && (
            <Text className={css.centerAlign} font={{ variation: FontVariation.BODY1 }} color={Color.GREY_600}>
              {description}
            </Text>
          )}
        </Layout.Vertical>
      </Container>

      {buttonText && (
        <Button
          intent="primary"
          variation={ButtonVariation.PRIMARY}
          text={buttonText}
          width={buttonWidth}
          onClick={onClick}
          {...buttonProps}
        />
      )}

      {children}
    </Layout.Vertical>
  )
}
