/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { StepWizard } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import type { SecretDTOV2 } from 'services/cd-ng'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, SecretActions } from '@common/constants/TrackingConstants'
import StepWinRmDetails from './views/StepDetails'
import StepAuthentication from './views/StepAuthentication'
import StepVerify from './views/StepVerify'

import type { DetailsForm } from './views/StepDetails'
import type { WinRmConfigFormData } from './views/StepAuthentication'

interface CreateWinRmCredWizardProps {
  onSuccess?: (secret: SecretDTOV2) => void
  hideModal?: () => void
}

export interface WinRmCredSharedObj {
  detailsData?: DetailsForm
  authData?: WinRmConfigFormData
  isEdit?: boolean
}

const CreateWinRmCredWizard: React.FC<CreateWinRmCredWizardProps & WinRmCredSharedObj> = props => {
  const { isEdit } = props
  const { getString } = useStrings()
  const { trackEvent } = useTelemetry()
  React.useEffect(() => {
    trackEvent(SecretActions.StartCreateSecret, {
      category: Category.PROJECT
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <StepWizard<WinRmCredSharedObj>
      icon="command-winrm"
      iconProps={{ size: 37 }}
      title={getString('secrets.secret.winrmCredential')}
    >
      <StepWinRmDetails name={getString('secrets.createWinRmCredWizard.titleDetails')} {...props} />
      <StepAuthentication name={getString('configuration')} onSuccess={props.onSuccess} isEdit={isEdit} />
      <StepVerify name={getString('secrets.stepTitleVerify')} closeModal={props.hideModal} />
    </StepWizard>
  )
}

export default CreateWinRmCredWizard
