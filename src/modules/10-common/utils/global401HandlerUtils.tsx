/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { History } from 'history'
import routes from '@common/RouteDefinitions'
import SecureStorage from 'framework/utils/SecureStorage'
import { getLoginPageURL } from 'framework/utils/SessionUtils'
import { returnUrlParams } from './routeUtils'

export const global401HandlerUtils = (history: History) => {
  SecureStorage.clear()
  history.push({
    pathname: routes.toRedirect(),
    search: returnUrlParams(getLoginPageURL({ returnUrl: window.location.href }))
  })
}
