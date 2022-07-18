/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { StepsProgress, ModalErrorHandler, ModalErrorHandlerBinding } from '@wings-software/uicore'
import { Intent } from '@harness/design-system'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SSHKeyValidationMetadata, useValidateSecret, ResponseSecretValidationResultDTO } from 'services/cd-ng'
import { useGetDelegatesStatus, RestResponseDelegateStatus } from 'services/portal'
import { useStrings } from 'framework/strings'
import type { UseGetMockData } from '@common/utils/testUtils'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'

interface VerifySecretProps {
  validationMetadata?: SSHKeyValidationMetadata
  identifier: string
  onFinish?: (status: Status) => void
  mockDelegateStatus?: UseGetMockData<RestResponseDelegateStatus>
  mockValidateSecret?: UseGetMockData<ResponseSecretValidationResultDTO>
}

enum Step {
  ZERO,
  ONE,
  TWO
}

export enum Status {
  WAIT = 'WAIT',
  PROCESS = 'PROCESS',
  DONE = 'DONE',
  ERROR = 'ERROR'
}

const VerifySecret: React.FC<VerifySecretProps> = ({
  identifier,
  validationMetadata,
  onFinish,
  mockDelegateStatus,
  mockValidateSecret
}) => {
  const { accountId: accountIdentifier, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()
  const { getString } = useStrings()
  const {
    data: delegateStatus,
    loading: loadingDelegateStatus,
    error: delegateStatusError,
    refetch: getDelegatesStatus
  } = useGetDelegatesStatus({
    queryParams: { accountId: accountIdentifier },
    lazy: true,
    mock: mockDelegateStatus
  })
  const { mutate: validateSecret } = useValidateSecret({
    queryParams: { identifier, accountIdentifier, projectIdentifier, orgIdentifier },
    mock: mockValidateSecret
  })
  const [currentStep, setCurrentStep] = useState<Step>(Step.ONE)
  const [currentStatus, setCurrentStatus] = useState<Status>(Status.WAIT)
  const [currentIntent, setCurrentIntent] = useState<Intent>(Intent.WARNING)

  useEffect(() => {
    switch (currentStep) {
      case Step.ONE:
        setCurrentStatus(Status.PROCESS)
        setCurrentIntent(Intent.WARNING)
        getDelegatesStatus()
        break
      case Step.TWO:
        setCurrentStatus(Status.PROCESS)
        if (validationMetadata) {
          validateSecret(validationMetadata).then(
            response => {
              if (response.data?.success) {
                setCurrentStatus(Status.DONE)
                setCurrentIntent(Intent.SUCCESS)
                onFinish?.(currentStatus)
              } else {
                setCurrentStatus(Status.ERROR)
                setCurrentIntent(Intent.DANGER)
                response.data?.message && modalErrorHandler?.showDanger(response.data.message)
                onFinish?.(currentStatus)
              }
            },
            _error => {
              setCurrentStatus(Status.ERROR)
              setCurrentIntent(Intent.DANGER)
              _error?.data?.message && modalErrorHandler?.showDanger(_error.data.message)
              onFinish?.(currentStatus)
            }
          )
        }
        break
    }
  }, [currentStep])

  useEffect(() => {
    if (loadingDelegateStatus) {
      // wait. do nothing
    } else if (delegateStatusError) {
      setCurrentStatus(Status.ERROR)
      setCurrentIntent(Intent.DANGER)
      const err = (delegateStatusError.data as any)?.responseMessages?.[0]?.message
      err && modalErrorHandler?.showDanger(err)
      onFinish?.(currentStatus)
    } else if (delegateStatus) {
      setCurrentStatus(Status.DONE)
      setCurrentIntent(Intent.SUCCESS)
      setCurrentStep(Step.TWO)
    }
  }, [delegateStatus, loadingDelegateStatus, delegateStatusError])

  return (
    <>
      <StepsProgress
        current={currentStep}
        steps={[
          getString('secrets.createSSHCredWizard.verifyStepOne'),
          getString('secrets.createSSHCredWizard.verifyStepTwo')
        ]}
        currentStatus={currentStatus}
        intent={currentIntent}
      />
      <ModalErrorHandler bind={setModalErrorHandler} style={{ marginTop: 'var(--spacing-large)' }} />
    </>
  )
}

export default VerifySecret
