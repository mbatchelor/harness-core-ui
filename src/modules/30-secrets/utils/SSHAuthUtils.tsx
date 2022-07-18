/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { pick } from 'lodash-es'
import { String } from 'framework/strings'
import type { SSHConfigFormData } from '@secrets/modals/CreateSSHCredModal/views/StepAuthentication'
import type { DetailsForm } from '@secrets/modals/CreateSSHCredModal/views/StepDetails'
import {
  KerberosConfigDTO,
  TGTPasswordSpecDTO,
  TGTKeyTabFilePathSpecDTO,
  SecretDTOV2,
  SSHConfigDTO,
  SSHKeyPathCredentialDTO,
  SSHKeyReferenceCredentialDTO,
  SSHPasswordCredentialDTO,
  SSHKeySpecDTO,
  SSHAuthDTO,
  getSecretV2Promise
} from 'services/cd-ng'
import type { SecretReference } from '@secrets/components/CreateOrSelectSecret/CreateOrSelectSecret'

type SSHCredentialType = SSHKeyPathCredentialDTO | SSHKeyReferenceCredentialDTO | SSHPasswordCredentialDTO

export const getSSHDTOFromFormData = (formData: DetailsForm & SSHConfigFormData): SecretDTOV2 => {
  return {
    type: 'SSHKey',
    ...pick(formData, ['name', 'description', 'identifier', 'tags']),
    spec: {
      port: formData.port,
      auth: {
        type: formData.authScheme,
        spec:
          formData.authScheme === 'Kerberos'
            ? ({
                ...pick(formData, ['principal', 'realm', 'tgtGenerationMethod']),
                spec:
                  formData.tgtGenerationMethod === 'Password'
                    ? ({
                        password: formData.password?.referenceString
                      } as TGTPasswordSpecDTO)
                    : formData.tgtGenerationMethod === 'KeyTabFilePath'
                    ? ({
                        keyPath: formData.keyPath
                      } as TGTKeyTabFilePathSpecDTO)
                    : null
              } as KerberosConfigDTO)
            : ({
                credentialType: formData.credentialType,
                spec:
                  formData.credentialType === 'KeyPath'
                    ? ({
                        userName: formData.userName,
                        keyPath: formData.keyPath,
                        encryptedPassphrase: formData.encryptedPassphrase?.referenceString
                      } as SSHKeyPathCredentialDTO)
                    : formData.credentialType === 'KeyReference'
                    ? ({
                        userName: formData.userName,
                        key: formData.key?.referenceString,
                        encryptedPassphrase: formData.encryptedPassphrase?.referenceString
                      } as SSHKeyReferenceCredentialDTO)
                    : ({
                        userName: formData.userName,
                        password: formData.password?.referenceString
                      } as SSHPasswordCredentialDTO)
              } as SSHConfigDTO)
      } as SSHAuthDTO
    } as SSHKeySpecDTO
  }
}

export const getStringForType = (type?: SecretDTOV2['type']): React.ReactElement => {
  if (!type) return <String stringID="secrets.blank" />
  switch (type) {
    case 'SecretText':
      return <String stringID="secrets.secret.labelText" />
    case 'SecretFile':
      return <String stringID="secrets.secret.labelFile" />
    case 'SSHKey':
      return <String stringID="secrets.typeSSH" />
    case 'WinRmCredentials':
      return <String stringID="secrets.typeWinRM" />
    default:
      return <String stringID="secrets.blank" />
  }
}

export const getKeyForCredentialType = (type?: SSHConfigDTO['credentialType']): React.ReactElement => {
  switch (type) {
    case 'Password':
      return <String stringID="secrets.sshAuthFormFields.optionPassword" />
    case 'KeyPath':
      return <String stringID="secrets.sshAuthFormFields.optionKeypath" />
    case 'KeyReference':
      return <String stringID="secrets.sshAuthFormFields.optionKey" />
    default:
      return <String stringID="secrets.blank" />
  }
}

function buildSSHCredentials(data: SSHConfigFormData): SSHCredentialType {
  switch (data.credentialType) {
    case 'KeyReference':
      if (data.encryptedPassphrase) {
        return {
          userName: data.userName,
          key: data.key?.referenceString,
          encryptedPassphrase: data.encryptedPassphrase.referenceString
        } as SSHKeyReferenceCredentialDTO
      }
      return {
        userName: data.userName,
        key: data.key?.referenceString
      } as SSHKeyReferenceCredentialDTO
    case 'KeyPath':
      if (data.encryptedPassphrase) {
        return {
          userName: data.userName,
          keyPath: data.keyPath,
          encryptedPassphrase: data.encryptedPassphrase.referenceString
        } as SSHKeyPathCredentialDTO
      } else {
        return {
          userName: data.userName,
          keyPath: data.keyPath
        } as SSHKeyPathCredentialDTO
      }
    case 'Password':
      return {
        userName: data.userName,
        password: data.password?.referenceString
      } as SSHPasswordCredentialDTO
  }
}

function buildKerberosConfig(data: SSHConfigFormData): KerberosConfigDTO {
  switch (data.tgtGenerationMethod) {
    case 'KeyTabFilePath':
      return {
        principal: data.principal,
        realm: data.realm,
        tgtGenerationMethod: data.tgtGenerationMethod,
        spec: {
          keyPath: data.keyPath
        } as TGTKeyTabFilePathSpecDTO
      } as KerberosConfigDTO
    case 'Password':
      return {
        principal: data.principal,
        realm: data.realm,
        tgtGenerationMethod: data.tgtGenerationMethod,
        spec: {
          password: data.password?.referenceString
        } as TGTPasswordSpecDTO
      } as KerberosConfigDTO
    default:
      return {
        principal: data.principal,
        realm: data.realm
      }
  }
}

export function buildAuthConfig(data: SSHConfigFormData): SSHConfigDTO | KerberosConfigDTO {
  let credentials
  switch (data.authScheme) {
    case 'SSH':
      credentials = buildSSHCredentials(data)
      return {
        credentialType: data.credentialType,
        spec: credentials
      } as SSHConfigDTO
    case 'Kerberos':
      return buildKerberosConfig(data)
  }
}

export const getSecretReferencesforSSH = async (
  secret: SecretDTOV2,
  accountId: string,
  orgIdentifier?: string,
  projectIdentifier?: string
): Promise<{
  keySecret?: SecretReference
  passwordSecret?: SecretReference
  encryptedPassphraseSecret?: SecretReference
}> => {
  let keySecret, passwordSecret, encryptedPassphraseSecret
  let password, encryptedPassphrase
  const secretSpec = secret.spec as SSHKeySpecDTO
  const authScheme = secretSpec.auth.type
  if (authScheme === 'SSH') {
    const sshConfig = secretSpec.auth.spec as SSHConfigDTO
    const credentialType = sshConfig.credentialType
    if (credentialType === 'Password') {
      const passwordSpec = sshConfig.spec as SSHPasswordCredentialDTO
      password = passwordSpec.password
    } else if (credentialType === 'KeyPath') {
      const keyPathSpec = sshConfig.spec as SSHKeyPathCredentialDTO
      encryptedPassphrase = keyPathSpec.encryptedPassphrase
    } else if (credentialType === 'KeyReference') {
      const keyRefSpec = sshConfig.spec as SSHKeyReferenceCredentialDTO
      encryptedPassphrase = keyRefSpec.encryptedPassphrase
      if (keyRefSpec.key) {
        const data = await getSecretV2Promise({
          identifier: keyRefSpec.key.indexOf('.') < 0 ? keyRefSpec.key : keyRefSpec.key.split('.')[1],
          queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
        })
        const keySecretData = data.data?.secret
        if (keySecretData) {
          keySecret = {
            ...data.data?.secret,
            referenceString: keyRefSpec.key
          } as SecretReference
        }
      }
    }
  } else if (authScheme === 'Kerberos') {
    const kerberosConfig = secretSpec.auth.spec as KerberosConfigDTO
    if (kerberosConfig.tgtGenerationMethod === 'Password') {
      password = kerberosConfig.spec?.password
    }
  }

  if (password) {
    const secretId = password.indexOf('.') < 0 ? password : password.split('.')[1]
    const data = await getSecretV2Promise({
      identifier: secretId,
      queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
    })
    passwordSecret = {
      ...data.data?.secret,
      referenceString: password
    } as SecretReference
  }

  if (encryptedPassphrase) {
    const secretId = encryptedPassphrase.indexOf('.') < 0 ? encryptedPassphrase : encryptedPassphrase.split('.')[1]
    const data = await getSecretV2Promise({
      identifier: secretId,
      queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
    })
    encryptedPassphraseSecret = {
      ...data.data?.secret,
      referenceString: encryptedPassphrase
    } as SecretReference
  }
  return {
    keySecret,
    passwordSecret,
    encryptedPassphraseSecret
  }
}
