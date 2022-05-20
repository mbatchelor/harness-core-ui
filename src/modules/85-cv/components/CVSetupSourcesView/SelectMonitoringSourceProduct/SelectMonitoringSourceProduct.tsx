/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FormInput, Layout, Container, Text, Card, CardBody } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { StepLabelProps, StepLabel } from '../StepLabel/StepLabel'
import { SetupSourceEmptyCardHeader } from '../SetupSourceCardHeader/SetupSourceCardHeader'
import css from './SelectMonitoringSourceProduct.module.scss'

export interface SelectMonitoringSourceProductProps {
  products: Array<{ productName: string; icon: IconProps; productLabel: string }>
  stepLabelProps: StepLabelProps
  monitoringSourceName: string
  monitoringSourceEntityName: string
}

export function SelectMonitoringSourceProduct(props: SelectMonitoringSourceProductProps): JSX.Element {
  const { products, stepLabelProps, monitoringSourceEntityName, monitoringSourceName } = props
  const { getString } = useStrings()
  return (
    <Container className={css.main}>
      <SetupSourceEmptyCardHeader>
        <StepLabel {...stepLabelProps} />
        <Text className={css.selectProductText}>
          {getString('cv.onboarding.monitoringSources.selectProduct', {
            type: monitoringSourceName,
            entity: monitoringSourceEntityName
          })}
        </Text>
      </SetupSourceEmptyCardHeader>
      <FormInput.CustomRender
        name="product"
        className={css.productSelection}
        render={formikProps => {
          return (
            <Layout.Horizontal spacing="medium">
              {products?.map((item, index) => {
                return (
                  <Card
                    selected={item.productName === formikProps.values.productName}
                    className={css.sourceIcon}
                    key={index}
                  >
                    <CardBody.Icon icon={item.icon.name} iconSize={item.icon.size} />
                    <Text color={Color.BLACK}>{item.productLabel}</Text>
                  </Card>
                )
              })}
            </Layout.Horizontal>
          )
        }}
      />
    </Container>
  )
}
