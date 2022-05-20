/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { Layout, Text } from '@wings-software/uicore'
import { get } from 'lodash-es'

import routes from '@common/RouteDefinitions'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { SidebarLink } from '@common/navigation/SideNav/SideNav'
import { useStrings } from 'framework/strings'
import { useLogout1 } from 'services/portal'
import SecureStorage from 'framework/utils/SecureStorage'
import { useToaster } from '@common/exports'
import { getLoginPageURL } from 'framework/utils/SessionUtils'
import { returnUrlParams } from '@common/utils/routeUtils'
import css from './UserNav.module.scss'

export default function UserNav(): React.ReactElement {
  const { accountId } = useParams<AccountPathProps>()
  const history = useHistory()
  const { mutate: logout } = useLogout1({
    userId: SecureStorage.get('uuid') as string,
    requestOptions: { headers: { 'content-type': 'application/json' } }
  })
  const { getString } = useStrings()
  const { showError } = useToaster()

  const signOut = async (): Promise<void> => {
    try {
      // BE is not publishing correct types for logout response yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await logout()
      SecureStorage.clear()
      if (response?.resource?.logoutUrl) {
        // if BE returns a logoutUrl, redirect there. Used by some customers in onprem
        window.location.href = response.resource.logoutUrl
      } else {
        history.push({ pathname: routes.toRedirect(), search: returnUrlParams(getLoginPageURL({})) })
      }
      return
    } catch (err) {
      showError(get(err, 'responseMessages[0].message', getString('somethingWentWrong')))
    }
  }

  return (
    <div>
      <Layout.Vertical margin={{ top: 'xxxlarge' }}>
        <SidebarLink exact label={getString('profile')} to={routes.toUserProfile({ accountId })} />
        {/* Enable when Ready */}
        {/* <SidebarLink label={getString('preferences')} to={routes.toUserPreferences({ accountId })} /> */}
      </Layout.Vertical>
      <div className={css.signout}>
        <Text
          font={{ weight: 'semi-bold' }}
          icon="log-out"
          iconProps={{ size: 16, padding: { right: 'small' } }}
          onClick={signOut}
          className={css.text}
          data-testid="signout-link"
        >
          {getString('signOut')}
        </Text>
      </div>
    </div>
  )
}
