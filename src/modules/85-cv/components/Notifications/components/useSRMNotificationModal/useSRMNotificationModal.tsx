/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useMemo, useState } from 'react'
import { isNil } from 'lodash-es'
import { StepWizard, Button, useToaster } from '@wings-software/uicore'

import { useModalHook } from '@harness/use-modal'

import { Dialog, Classes } from '@blueprintjs/core'
import cx from 'classnames'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import NotificationMethods from '@pipeline/components/Notifications/Steps/NotificationMethods'
import { NotificationTypeSelectOptions } from '@notifications/constants'

import Overview from '@pipeline/components/Notifications/Steps/Overview'
import { useSaveNotificationRuleData, useUpdateNotificationRuleData } from 'services/cv'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { createNotificationsPayload } from './useSRMNotificationModal.utils'
import type { UseNotificationModalProps, UseNotificationModalReturn } from './useSRMNotificationModal.types'
import type { SRMNotification } from '../../NotificationsContainer.types'
import { Views } from './useSRMNotificationModal.constants'
import css from './useSRMNotificationModal.module.scss'

export const useSRMNotificationModal = ({
  onCloseModal,
  getExistingNotificationNames,
  notificationRulesComponent,
  handleCreateNotification
}: UseNotificationModalProps): UseNotificationModalReturn => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()

  const [view, setView] = useState(Views.CREATE)
  const [index] = useState<number>()
  const [notificationRules, setNotificationRules] = useState<SRMNotification>()
  const { showError, showSuccess } = useToaster()
  const { getString } = useStrings()
  const queryParams = {
    accountId,
    orgIdentifier,
    projectIdentifier
  }

  const { loading: saveNotificationsLoading, mutate: saveNotificationRuleData } = useSaveNotificationRuleData({
    queryParams: {
      accountId
    }
  })

  const { mutate: updateNotificationRuleData, loading: updateNotificationsLoading } = useUpdateNotificationRuleData({
    queryParams,
    identifier: ''
  })

  const wizardCompleteHandler = async (wizardData?: SRMNotification): Promise<void> => {
    if (wizardData) {
      const identifier = wizardData?.identifier
      const notificationsPayload = createNotificationsPayload(orgIdentifier, projectIdentifier, wizardData)
      const name = notificationsPayload?.name
      let latestNotification = null
      try {
        if (identifier) {
          latestNotification = await updateNotificationRuleData(notificationsPayload, {
            queryParams,
            pathParams: {
              identifier
            }
          })
          showSuccess(`Notification ${name} has been successfully updated `)
        } else {
          latestNotification = await saveNotificationRuleData(notificationsPayload)
          showSuccess(`Notification ${name} has been successfully created `)
        }
        hideModal()
        handleCreateNotification(latestNotification)
      } catch (error) {
        hideModal()
        open(wizardData)
        showError(getErrorMessage(error))
      }
    }
  }

  const loading = useMemo(() => {
    return updateNotificationsLoading || saveNotificationsLoading
  }, [saveNotificationsLoading, updateNotificationsLoading])

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        onClose={() => {
          setView(Views.CREATE)
          hideModal()
          onCloseModal?.()
        }}
        className={cx(Classes.DIALOG, css.dialog)}
      >
        <>
          {loading ? (
            <ContainerSpinner className={css.spinner} />
          ) : (
            <>
              <StepWizard<SRMNotification>
                onCompleteWizard={wizardCompleteHandler}
                icon="new-notification"
                iconProps={{ color: 'white', size: 50 }}
                title={isNil(index) ? getString('newNotification') : getString('editNotification')}
                stepClassName={css.stepWizardContainer}
              >
                <Overview
                  name={getString('overview')}
                  data={notificationRules}
                  existingNotificationNames={getExistingNotificationNames?.(index)}
                />
                {notificationRulesComponent}
                <NotificationMethods
                  name={getString('notifications.notificationMethod')}
                  typeOptions={NotificationTypeSelectOptions}
                />
              </StepWizard>
              <Button
                minimal
                icon="cross"
                className={css.crossIcon}
                iconProps={{ size: 18 }}
                onClick={() => {
                  setView(Views.CREATE)
                  hideModal()
                  onCloseModal?.()
                }}
              />
            </>
          )}
        </>
      </Dialog>
    ),
    [view, notificationRules, wizardCompleteHandler]
  )

  const open = useCallback(
    (currentNotification?: SRMNotification) => {
      setNotificationRules(currentNotification)
      if (currentNotification) {
        setView(Views.EDIT)
      } else setView(Views.CREATE)
      showModal()
    },
    [showModal]
  )

  return {
    openNotificationModal: (currentNotification?: SRMNotification) => open(currentNotification),
    closeNotificationModal: hideModal
  }
}
