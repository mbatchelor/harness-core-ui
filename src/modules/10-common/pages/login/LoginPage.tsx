/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { useHistory, Link } from 'react-router-dom'
import { FormInput, Formik, FormikForm, Button, Text, Container, HarnessIcons, Layout } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useToaster } from '@common/components'
import SecureStorage from 'framework/utils/SecureStorage'
import { useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import { useQueryParams } from '@common/hooks'
import AuthLayout from '@common/components/AuthLayout/AuthLayout'
import AuthFooter, { AuthPage } from '@common/components/AuthLayout/AuthFooter/AuthFooter'
import { getConfig } from 'services/config'

interface LoginForm {
  email: string
  password: string
}

interface LoginQueryParams {
  returnUrl?: string
  errorCode?: string
}

// TODO: add coverage once the correct API is integrated
/* istanbul ignore next */
const createAuthToken = (login: string, password: string): string => {
  const encodedToken = btoa(login + ':' + password)
  return `Basic ${encodedToken}`
}

const LoginPage: React.FC = () => {
  const history = useHistory()
  const [isLoading, setLoading] = useState(false)
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { returnUrl, errorCode } = useQueryParams<LoginQueryParams>()

  useEffect(() => {
    if (localStorage.getItem('samlTestResponse') === 'testing') {
      if (errorCode === 'samltestsuccess') {
        localStorage.setItem('samlTestResponse', 'true')
      } else {
        localStorage.setItem('samlTestResponse', 'false')
      }
    }
  }, [errorCode])

  // TODO: add coverage once the correct API is integrated
  /* istanbul ignore next */
  const handleLogin = async (data: LoginForm): Promise<void> => {
    try {
      setLoading(true)
      // hacky/temporary fetch call
      const response = await fetch(getConfig('api/users/login'), {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          authorization: createAuthToken(data.email, data.password)
        })
      })
      setLoading(false)
      if (response.ok) {
        const json = await response.json()

        SecureStorage.set('token', json.resource.token)
        SecureStorage.set('acctId', json.resource.defaultAccountId)
        SecureStorage.set('uuid', json.resource.uuid)
        SecureStorage.set('lastTokenSetTime', Date.now())

        // this is naive redirect for now
        if (returnUrl) {
          window.location.href = returnUrl
        } else {
          history.push(routes.toHome({ accountId: json.resource.defaultAccountId }))
        }
      } else {
        throw response
      }
    } catch (e) {
      setLoading(false)
      showError(e?.statusText)
    }
  }

  const handleSubmit = (data: LoginForm): void => {
    handleLogin(data)
  }

  const HarnessLogo = HarnessIcons['harness-logo-black']

  return (
    <>
      <AuthLayout>
        <Container flex={{ justifyContent: 'space-between', alignItems: 'center' }} margin={{ bottom: 'xxxlarge' }}>
          <HarnessLogo height={25} />
        </Container>
        <Text font={{ size: 'large', weight: 'bold' }} color={Color.BLACK}>
          {getString('signUp.signIn')}
        </Text>
        <Text font={{ size: 'medium' }} color={Color.BLACK} margin={{ top: 'xsmall' }}>
          {getString('signUp.message.secondary')}
        </Text>

        <Container margin={{ top: 'xxxlarge' }}>
          <Formik<LoginForm>
            initialValues={{ email: '', password: '' }}
            formName="loginPageForm"
            onSubmit={handleSubmit}
          >
            <FormikForm>
              <FormInput.Text name="email" label={getString('signUp.form.emailLabel')} disabled={isLoading} />
              <FormInput.Text
                name="password"
                label={getString('password')}
                inputGroup={{ type: 'password' }}
                disabled={isLoading}
              />
              <Button type="submit" intent="primary" loading={isLoading} disabled={isLoading} width="100%">
                {getString('signUp.signIn')}
              </Button>
            </FormikForm>
          </Formik>
        </Container>

        <AuthFooter page={AuthPage.SignIn} />

        <Layout.Horizontal margin={{ top: 'xxxlarge' }} spacing="xsmall">
          <Text>{getString('signUp.noAccount')}</Text>
          <Link to={routes.toSignup()}>{getString('getStarted')}</Link>
        </Layout.Horizontal>
      </AuthLayout>
    </>
  )
}

export default LoginPage
