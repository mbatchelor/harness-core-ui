/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import * as Yup from 'yup'
import { Scope } from '@common/interfaces/SecretsInterface'
import { Environment } from '@common/utils/Constants'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { GitConnectionType } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { GitAuthTypes } from '@connectors/pages/connectors/utils/ConnectorHelper'
import type { StringsMap } from 'stringTypes'

export const ConnectorSecretScope: { [scope: string]: string } = {
  [Scope.ORG]: 'org.',
  [Scope.ACCOUNT]: 'account.'
}

export function getScopingStringFromSecretRef(connecterConfig: ConnectorConfigDTO): string | undefined {
  return connecterConfig &&
    connecterConfig.passwordRefSecret &&
    connecterConfig.passwordRefSecret.scope !== Scope.PROJECT
    ? ConnectorSecretScope[connecterConfig.passwordRefSecret.scope]
    : undefined
}

export const getCommonConnectorsValidationSchema = (
  getString: (key: keyof StringsMap, vars?: Record<string, any> | undefined) => string
): Yup.ObjectSchema =>
  Yup.object().shape({
    username: Yup.string().when(['connectionType', 'authType'], {
      is: (connectionType, authType) => connectionType === GitConnectionType.HTTP && authType !== GitAuthTypes.KERBEROS,
      then: Yup.string().trim().required(getString('validation.username')),
      otherwise: Yup.string().nullable()
    }),
    authType: Yup.string().when('connectionType', {
      is: val => val === GitConnectionType.HTTP,
      then: Yup.string().trim().required(getString('validation.authType'))
    }),
    sshKey: Yup.object().when('connectionType', {
      is: val => val === GitConnectionType.SSH,
      then: Yup.object().required(getString('validation.sshKey')),
      otherwise: Yup.object().nullable()
    }),
    password: Yup.object().when(['connectionType', 'authType'], {
      is: (connectionType, authType) =>
        connectionType === GitConnectionType.HTTP && authType === GitAuthTypes.USER_PASSWORD,
      then: Yup.object().required(getString('validation.password')),
      otherwise: Yup.object().nullable()
    })
  })

export const getBackendServerUrl = (): string => {
  return `${location.protocol}//${location.hostname}`
}

export const isEnvironmentAllowedForOAuth = (): boolean => {
  return Object.values(Environment).some((env: Environment) =>
    location.hostname.toLowerCase().startsWith(env.toLowerCase())
  )
}

export const GATEWAY_URL = `${location.protocol}//${location.host}/gateway`

export const OAUTH_REDIRECT_URL_PREFIX = `${GATEWAY_URL}/api/secrets/oauth2Redirect`

export const OAUTH_PLACEHOLDER_VALUE = 'placeholder'

export const MAX_TIMEOUT_OAUTH = 1000 * 60 * 5 // five minutes
