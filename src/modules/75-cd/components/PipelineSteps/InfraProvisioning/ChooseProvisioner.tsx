/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Classes, Dialog } from '@blueprintjs/core'
import cx from 'classnames'
import { Layout, Card, Icon, Text, IconName, Button, ButtonVariation } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'

import { merge } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { ProvisionerTypes } from '../Common/ProvisionerConstants'

import css from './InfraProvisioning.module.scss'

interface ProvDialogProps {
  onSubmit: (data: any) => void
  onClose: () => void
  hideModal: () => void
  provData: any
}

const ProvDialog = ({ onClose, hideModal, provData, onSubmit }: ProvDialogProps) => {
  const { getString } = useStrings()
  const isCloudFormationEnabled = useFeatureFlag(FeatureFlag.CLOUDFORMATION)
  const [provisioner, setProvisioner] = useState<string>(ProvisionerTypes.Terraform)
  const modalProps = {
    isOpen: true,
    canEscapeKeyClose: true,
    canOutsideClickClose: true
  }
  const provisionerTypes: { name: ProvisionerTypes; icon: IconName; iconColor?: string; enabled: boolean }[] = [
    {
      name: ProvisionerTypes.Terraform,
      icon: 'terraform-apply-new',
      iconColor: '#5C4EE5',
      enabled: true
    },
    {
      name: ProvisionerTypes.CloudFormation,
      icon: 'cloudformation',
      enabled: isCloudFormationEnabled
    },
    {
      name: ProvisionerTypes.ARM,
      icon: 'arm',
      enabled: false
    },
    {
      name: ProvisionerTypes.Script,
      icon: 'script',
      enabled: false
    }
  ]
  return (
    <Dialog
      onClose={() => {
        onClose()
        hideModal()
      }}
      enforceFocus={false}
      className={cx(Classes.DIALOG, css.chooseProvisionerDialog)}
      {...modalProps}
    >
      <Layout.Vertical spacing="large">
        <div className={css.provisionerText}>{getString('cd.chooseProvisionerText')}</div>
        <Layout.Horizontal height={120}>
          {provisionerTypes.map((type: { name: string; icon: IconName; enabled: boolean; iconColor?: string }) => {
            const iconProps = {
              name: type.icon as IconName,
              size: 26
            }
            if (type.iconColor) {
              merge(iconProps, { color: type.iconColor })
            }
            return (
              <div key={type.name} className={css.squareCardContainer}>
                <Card
                  disabled={!type.enabled}
                  interactive={true}
                  selected={type.name === provisioner}
                  cornerSelected={type.name === provisioner}
                  className={cx({ [css.disabled]: !type.enabled }, css.squareCard)}
                  onClick={() => setProvisioner(type.name)}
                >
                  <Icon {...iconProps} />
                </Card>
                <Text
                  style={{
                    fontSize: '12px',
                    color: type.enabled ? 'var(--grey-900)' : 'var(--grey-350)',
                    textAlign: 'center'
                  }}
                >
                  {type.name}
                </Text>
              </div>
            )
          })}
        </Layout.Horizontal>
        <Button
          variation={ButtonVariation.PRIMARY}
          text={getString('cd.setUpProvisionerBtnText')}
          className={css.provisionerBtnText}
          onClick={() => {
            const selectedProvisioner =
              provisioner === ProvisionerTypes.CloudFormation ? 'CLOUD_FORMATION' : provisioner
            onSubmit(merge(provData, { selectedProvisioner: selectedProvisioner.toUpperCase() }))
            hideModal()
          }}
        />
      </Layout.Vertical>
    </Dialog>
  )
}

interface ChooseProvisionerProps {
  onSubmit: any
  onClose: any
}

const useChooseProvisioner = ({ onSubmit, onClose }: ChooseProvisionerProps) => {
  const [provData, setProvData] = useState()
  const [showModal, hideModal] = useModalHook(
    () => <ProvDialog onSubmit={onSubmit} onClose={onClose} hideModal={hideModal} provData={provData} />,
    [provData]
  )

  const open = (data?: any) => {
    setProvData(data)
    showModal()
  }
  return {
    showModal: (data: any) => open(data),
    hideModal
  }
}

export default useChooseProvisioner
