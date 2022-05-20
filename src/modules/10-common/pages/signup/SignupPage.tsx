/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Link, useHistory } from 'react-router-dom'
import * as Yup from 'yup'
import {
  Button,
  FormInput,
  Formik,
  FormikForm,
  HarnessIcons,
  Icon,
  OverlaySpinner,
  Container,
  Text
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import routes from '@common/RouteDefinitions'
import { useToaster } from '@common/components'
import { useQueryParams } from '@common/hooks'
import { useSignup, SignupDTO } from 'services/cd-ng'
import AuthLayout from '@common/components/AuthLayout/AuthLayout'
import SecureStorage from 'framework/utils/SecureStorage'
import type { RestResponseUserInfo } from 'services/cd-ng'

import AuthFooter, { AuthPage } from '@common/components/AuthLayout/AuthFooter/AuthFooter'
import { useStrings } from 'framework/strings'
import type { Module } from '@common/interfaces/RouteInterfaces'

interface SignupForm {
  email: string
  password: string
}

const setToken = async (response: RestResponseUserInfo): Promise<void> => {
  SecureStorage.set('token', response.resource?.token)
  SecureStorage.set('acctId', response.resource?.defaultAccountId)
  SecureStorage.set('uuid', response.resource?.uuid)
  SecureStorage.set('lastTokenSetTime', Date.now())
}

const SignupPage: React.FC = () => {
  const { showError } = useToaster()
  const { getString } = useStrings()
  const { module } = useQueryParams<{ module?: Module }>()
  const { mutate: getUserInfo, loading } = useSignup({})
  const history = useHistory()

  const HarnessLogo = HarnessIcons['harness-logo-black']

  const handleSignup = async (data: SignupForm): Promise<void> => {
    const { email, password } = data

    const dataToSubmit: SignupDTO = {
      email,
      password
    }

    try {
      const userInfoResponse = await getUserInfo(dataToSubmit)
      const accountId = userInfoResponse.resource?.defaultAccountId || ''
      await setToken(userInfoResponse as RestResponseUserInfo)
      if (module) {
        history.push({ pathname: routes.toModuleHome({ module, accountId }), search: '?source=signup' })
      } else {
        history.push(
          routes.toPurpose({
            accountId
          })
        )
      }
    } catch (error) {
      showError(error.message)
    }
  }

  function handleSubmit(data: SignupForm): void {
    handleSignup(data)
  }

  const spinner = (
    <OverlaySpinner show>
      <></>
    </OverlaySpinner>
  )

  const submitButton = (
    <Button type="submit" intent="primary" width="100%">
      {getString('signUp.signUp')}
    </Button>
  )

  return (
    <>
      <AuthLayout>
        <Container flex={{ justifyContent: 'space-between', alignItems: 'center' }} margin={{ bottom: 'xxxlarge' }}>
          <HarnessLogo height={25} />
          <Link to={routes.toLogin()}>
            <Icon name="arrow-left" color={Color.BLUE_500} margin={{ right: 'xsmall' }} />
            <Text color={Color.BLUE_500} inline font={{ size: 'medium' }}>
              {getString('signUp.signIn')}
            </Text>
          </Link>
        </Container>

        <Text font={{ size: 'large', weight: 'bold' }} color={Color.BLACK}>
          {getString('signUp.message.primary')}
        </Text>
        <Text font={{ size: 'medium' }} color={Color.BLACK} margin={{ top: 'xsmall' }}>
          {getString('signUp.message.secondary')}
        </Text>

        <Container margin={{ top: 'xxxlarge' }}>
          <Formik
            formName="signupPageForm"
            initialValues={{ name: '', email: '', password: '' }}
            onSubmit={handleSubmit}
            validationSchema={Yup.object().shape({
              email: Yup.string().email().required(),
              password: Yup.string().min(8).required()
            })}
          >
            <FormikForm>
              <FormInput.Text
                name="email"
                label={getString('signUp.form.emailLabel')}
                placeholder={getString('signUp.form.emailPlaceholder')}
              />
              <FormInput.Text
                name="password"
                label={getString('password')}
                inputGroup={{ type: 'password' }}
                placeholder={getString('signUp.form.passwordPlaceholder')}
              />
              {loading ? spinner : submitButton}
            </FormikForm>
          </Formik>
        </Container>
        <AuthFooter page={AuthPage.SignUp} />
      </AuthLayout>
    </>
  )
}

export default SignupPage
