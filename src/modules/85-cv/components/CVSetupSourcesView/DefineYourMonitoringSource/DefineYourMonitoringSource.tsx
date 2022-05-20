/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Text, Card, CardBody } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'
import type { FormikProps } from 'formik'
import { Color } from '@harness/design-system'
import { NameIdDescriptionTags } from '@common/components'
import { SetupSourceCardHeader, SetupSourceCardHeaderProps } from '../SetupSourceCardHeader/SetupSourceCardHeader'
import css from './DefineYourMonitoringSource.module.scss'

export interface DefineYourMonitoringSourceProps extends SetupSourceCardHeaderProps {
  sourceIcon: IconProps
  iconLabel: string
  isEdit?: boolean
  formikProps: FormikProps<any>
}

export function DefineYourMonitoringSource(props: DefineYourMonitoringSourceProps): JSX.Element {
  const { sourceIcon, iconLabel, formikProps, isEdit, ...defineYourSourceProps } = props
  return (
    <Container className={css.defineMonitoringSource}>
      <SetupSourceCardHeader {...defineYourSourceProps} />
      <Container className={css.monitoringSourceContent}>
        <Card selected={true} className={css.sourceIcon}>
          <CardBody.Icon icon={sourceIcon.name} iconSize={sourceIcon.size || 40} />
          <Text color={Color.BLACK}>{iconLabel}</Text>
        </Card>
        <NameIdDescriptionTags
          formikProps={formikProps}
          identifierProps={{ inputName: 'monitoringSourceName', isIdentifierEditable: !isEdit }}
        />
      </Container>
    </Container>
  )
}
