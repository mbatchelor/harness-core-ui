/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  StepProps,
  Container,
  Formik,
  FormikForm,
  Button,
  Text,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  Layout
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import * as Yup from 'yup'

import { SecretRequestWrapper, usePostSecret, usePutSecret, SecretDTOV2, WinRmAuthDTO } from 'services/cd-ng'
import type { KerberosConfigDTO, SSHKeySpecDTO } from 'services/cd-ng'
import type { SecretReference } from '@secrets/components/CreateOrSelectSecret/CreateOrSelectSecret'
import { buildAuthConfig } from '@secrets/utils/WinRMAuthUtils'
import { useToaster } from '@common/exports'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { useGovernanceMetaDataModal } from '@governance/hooks/useGovernanceMetaDataModal'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import WinRmAuthFormFields from '@secrets/components/WinRmAuthFormFields/WinRmAuthFormFields'
import type { WinRmCredSharedObj } from '../CreateWinRmCredWizard'

export interface WinRmConfigFormData {
  domain: string
  authScheme: WinRmAuthDTO['type']
  tgtGenerationMethod?: KerberosConfigDTO['tgtGenerationMethod'] | 'None'
  userName: string
  port: number
  principal: string
  realm: string
  password?: SecretReference
  keyPath: string
  useSSL: boolean
  skipCertChecks: boolean
  useNoProfile: boolean
}

interface StepAuthenticationProps {
  onSuccess?: (secret: SecretDTOV2) => void
}

const StepAuthentication: React.FC<StepProps<WinRmCredSharedObj> & StepAuthenticationProps & WinRmCredSharedObj> = ({
  prevStepData,
  nextStep,
  previousStep,
  onSuccess
}) => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const [saving, setSaving] = useState(false)
  const { getString } = useStrings()
  const { showSuccess } = useToaster()
  const { OPA_SECRET_GOVERNANCE } = useFeatureFlags()
  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal({
    considerWarningAsError: false,
    errorHeaderMsg: 'secrets.policyEvaluations.failedToSave',
    warningHeaderMsg: 'secrets.policyEvaluations.warning'
  })
  const { mutate: createSecret } = usePostSecret({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
  })
  const { mutate: editSecret } = usePutSecret({
    identifier: prevStepData?.detailsData?.identifier || '',
    queryParams: { accountIdentifier: accountId, projectIdentifier, orgIdentifier }
  })

  const isEdit = prevStepData?.isEdit
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()

  const handleSubmit = async (formData: WinRmConfigFormData): Promise<void> => {
    setSaving(true)
    try {
      const authConfig = buildAuthConfig(formData)
      // build final data to submit
      const dataToSubmit: SecretRequestWrapper = {
        secret: {
          type: 'WinRmCredentials',
          name: prevStepData?.detailsData?.name as string,
          identifier: prevStepData?.detailsData?.identifier as string,
          description: prevStepData?.detailsData?.description,
          tags: prevStepData?.detailsData?.tags,
          projectIdentifier,
          orgIdentifier,
          spec: {
            auth: {
              type: formData.authScheme,
              spec: authConfig
            },
            port: formData.port
          } as SSHKeySpecDTO
        }
      }
      // finally create the connector
      const response = isEdit ? await editSecret(dataToSubmit) : await createSecret(dataToSubmit)
      setSaving(false)
      conditionallyOpenGovernanceErrorModal(
        OPA_SECRET_GOVERNANCE ? response?.data?.governanceMetadata : undefined,
        () => {
          isEdit ? showSuccess(getString('ssh.editmessageSuccess')) : showSuccess(getString('ssh.createmessageSuccess'))
          onSuccess?.(dataToSubmit.secret)
          nextStep?.({ ...prevStepData, authData: formData, isEdit: true })
        }
      )
    } catch (err) {
      setSaving(false)
      modalErrorHandler?.show(err.data)
    }
  }
  const validationSchema = Yup.object().shape({
    port: Yup.number().required(getString('common.smtp.portRequired')),
    userName: Yup.string().when('authScheme', {
      is: 'NTLM',
      then: Yup.string().trim().required(getString('secrets.createSSHCredWizard.validateUsername'))
    }),
    password: Yup.string().required(getString('secrets.createWinRmCredWizard.validatePassword')),
    domain: Yup.string().when('authScheme', {
      is: 'NTLM',
      then: Yup.string().trim().required(getString('secrets.createWinRmCredWizard.validateDomain'))
    }),
    principal: Yup.string().when('authScheme', {
      is: 'Kerberos',
      then: Yup.string().trim().required(getString('secrets.createSSHCredWizard.validatePrincipal'))
    }),
    realm: Yup.string().when('authScheme', {
      is: 'Kerberos',
      then: Yup.string().trim().required(getString('secrets.createSSHCredWizard.validateRealm'))
    })
  })

  return (
    <>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <Container padding="small" width={400} style={{ minHeight: '500px' }}>
        <Text margin={{ bottom: 'xlarge' }} font={{ size: 'medium' }} color={Color.BLACK}>
          {getString('secrets.createSSHCredWizard.titleAuth')}
        </Text>
        <Formik<WinRmConfigFormData>
          onSubmit={formData => {
            modalErrorHandler?.hide()
            handleSubmit(formData)
          }}
          formName="stepAuthenticationForm"
          validationSchema={validationSchema}
          initialValues={{
            authScheme: 'NTLM',
            domain: '',
            principal: '',
            realm: '',
            useNoProfile: false,
            skipCertChecks: false,
            useSSL: false,
            userName: '',
            keyPath: '',
            port: 22,
            ...prevStepData?.authData
          }}
        >
          {formik => {
            return (
              <FormikForm>
                <WinRmAuthFormFields formik={formik} secretName={prevStepData?.detailsData?.name} />
                <Layout.Horizontal spacing="small">
                  <Button
                    text={getString('back')}
                    onClick={() => previousStep?.({ ...prevStepData, authData: formik.values })}
                  />
                  <Button
                    type="submit"
                    intent="primary"
                    text={saving ? getString('secrets.createSSHCredWizard.btnSaving') : getString('saveAndContinue')}
                    disabled={saving}
                  />
                </Layout.Horizontal>
              </FormikForm>
            )
          }}
        </Formik>
      </Container>
    </>
  )
}

export default StepAuthentication
