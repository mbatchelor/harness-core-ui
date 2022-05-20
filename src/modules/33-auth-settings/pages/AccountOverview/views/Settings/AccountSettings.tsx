/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { Container, Text, PageError, PageSpinner, Collapse, getErrorInfoFromErrorObject } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import type { IconProps } from '@harness/icons'
import { useStrings } from 'framework/strings'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import {
  useListAccountSetting,
  ConnectorSettings as ConnectorSettingsDTO,
  AccountSettings as AccountSettingsDTO
} from 'services/cd-ng'
import ConnectorSettings from './connector/ConnectorSettings'

import css from './AccountSettings.module.scss'

interface SettingConfig {
  type: AccountSettingsDTO['type']
  title: string
  component: JSX.Element
}

export enum AccountSettingType {
  CONNECTOR = 'Connector'
}

const AccountSettings: React.FC = () => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const {
    data,
    loading,
    refetch: refetchAccountSettings,
    error
  } = useListAccountSetting({ queryParams: { accountIdentifier: accountId } })
  const [disableBuiltInSM, setDisableBuiltInSM] = useState<boolean>(false)

  const SETTINGS_CONFIG: SettingConfig[] = [
    {
      type: AccountSettingType.CONNECTOR,
      title: getString('connectorsLabel'),
      component: <ConnectorSettings disableBuiltInSM={disableBuiltInSM} onChange={setDisableBuiltInSM} />
    }
  ]

  useEffect(() => {
    if (!loading && data) {
      const connectorSetting = data?.data?.filter(item => item.type === AccountSettingType.CONNECTOR)
      setDisableBuiltInSM(
        connectorSetting && connectorSetting.length === 1
          ? !!(connectorSetting[0].config as ConnectorSettingsDTO)?.builtInSMDisabled
          : false
      )
    }
  }, [data, loading])

  if (loading) {
    return <PageSpinner />
  }

  if (error) {
    return (
      <Container height={300}>
        <PageError message={getErrorInfoFromErrorObject(error)} onClick={() => refetchAccountSettings()} />
      </Container>
    )
  }

  return (
    <Container margin="xlarge" padding="xlarge" background="white" className={css.container}>
      <Text color={Color.BLACK} font={{ variation: FontVariation.H5 }} margin={{ bottom: 'xlarge' }}>
        {getString('settingsLabel')}
      </Text>
      {SETTINGS_CONFIG.map(item => {
        return (
          <Collapse
            data-testid={`collapse-${item.type}`}
            key={item.type}
            collapsedIcon="main-chevron-down"
            expandedIcon="main-chevron-up"
            isRemovable={false}
            iconProps={{ size: 12, color: Color.PRIMARY_7 } as IconProps}
            collapseClassName={css.collapseWrap}
            heading={
              <Text font={{ variation: FontVariation.H6 }} margin={{ left: 'small' }}>
                {item.title}
              </Text>
            }
          >
            {item.component}
          </Collapse>
        )
      })}
    </Container>
  )
}

export default AccountSettings
