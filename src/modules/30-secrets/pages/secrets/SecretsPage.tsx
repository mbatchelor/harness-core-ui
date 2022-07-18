/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import {
  Layout,
  Popover,
  Icon,
  ExpandingSearchInput,
  Container,
  ButtonVariation,
  ButtonSize,
  PageSpinner,
  PageError
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { Menu, PopoverInteractionKind, Position } from '@blueprintjs/core'
import { useListSecretsV2, ResponsePageSecretResponseWrapper, Error } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import useCreateUpdateSecretModal from '@secrets/modals/CreateSecretModal/useCreateUpdateSecretModal'
import useCreateSSHCredModal from '@secrets/modals/CreateSSHCredModal/useCreateSSHCredModal'
import { useStrings } from 'framework/strings'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import type { UseGetMockData } from '@common/utils/testUtils'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { Page } from '@common/exports'
import ScopedTitle from '@common/components/Title/ScopedTitle'
import { Scope } from '@common/interfaces/SecretsInterface'
import { getLinkForAccountResources } from '@common/utils/BreadcrumbUtils'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, SecretActions } from '@common/constants/TrackingConstants'
import { getPrincipalScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import useCreateWinRmCredModal from '@secrets/modals/CreateWinRmCredModal/useCreateWinRmCredModal'
import SecretsList from './views/SecretsListView/SecretsList'

import SecretEmptyState from './secrets-empty-state.png'

import css from './SecretsPage.module.scss'

interface SecretsPageProps {
  mock?: UseGetMockData<ResponsePageSecretResponseWrapper>
}
interface CreateSecretBtnProp {
  setOpenPopOverProp: (val: boolean) => void
  size?: ButtonSize
}

const SecretsPage: React.FC<SecretsPageProps> = ({ mock }) => {
  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()
  const scope = getPrincipalScopeFromDTO({
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier
  })
  const history = useHistory()
  const { getString } = useStrings()
  const [searchTerm, setSearchTerm] = useState<string | undefined>()
  const [page, setPage] = useState(0)
  const [openPopOver, setOpenPopOver] = useState<boolean>(false)
  const [emptyStateOpenPopOver, setEmptyStateOpenPopOver] = useState<boolean>(false)
  useDocumentTitle(getString('common.secrets'))

  const {
    data: secretsResponse,
    loading,
    error,
    refetch
  } = useListSecretsV2({
    queryParams: {
      accountIdentifier: accountId,
      searchTerm,
      pageIndex: page,
      pageSize: 10,
      orgIdentifier,
      projectIdentifier
    },
    debounce: 300,
    mock
  })

  const { openCreateSecretModal } = useCreateUpdateSecretModal({
    onSuccess: /* istanbul ignore next */ () => {
      refetch()
    }
  })
  const { openCreateSSHCredModal } = useCreateSSHCredModal({
    onSuccess: /* istanbul ignore next */ () => {
      refetch()
    }
  })
  const { openCreateWinRmCredModal } = useCreateWinRmCredModal({
    onSuccess: /* istanbul ignore next */ () => {
      refetch()
    }
  })
  const CreateSecretBtn: React.FC<CreateSecretBtnProp> = ({ setOpenPopOverProp, size }) => {
    return (
      <RbacButton
        intent="primary"
        text={getString('createSecretYAML.newSecret')}
        icon="plus"
        rightIcon="chevron-down"
        size={size}
        permission={{
          permission: PermissionIdentifier.UPDATE_SECRET,
          resource: {
            resourceType: ResourceType.SECRET
          }
        }}
        onClick={() => {
          setOpenPopOverProp(true)
        }}
        variation={ButtonVariation.PRIMARY}
      />
    )
  }
  const { trackEvent } = useTelemetry()
  const CreateSecretBtnMenu: React.FC = () => {
    React.useEffect(() => {
      trackEvent(SecretActions.StartCreateSecret, {
        category: Category.SECRET
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
      <Menu large>
        <Menu.Item
          labelClassName="menu-item-label"
          text={getString('secrets.secret.labelText')}
          labelElement={<Icon name="text" />}
          onClick={/* istanbul ignore next */ () => openCreateSecretModal('SecretText')}
        />
        <Menu.Item
          labelClassName="menu-item-label"
          text={getString('secrets.secret.labelFile')}
          labelElement={<Icon name="document" color={Color.BLUE_600} />}
          onClick={/* istanbul ignore next */ () => openCreateSecretModal('SecretFile')}
        />
        <Menu.Item
          labelClassName="menu-item-label"
          text={getString('ssh.sshCredential')}
          labelElement={<Icon name="secret-ssh" />}
          onClick={/* istanbul ignore next */ () => openCreateSSHCredModal()}
        />
        <Menu.Item
          labelClassName="menu-item-label"
          text={getString('secrets.secret.winrmCredential')}
          labelElement={<Icon name="command-winrm" />}
          onClick={/* istanbul ignore next */ () => openCreateWinRmCredModal()}
        />
      </Menu>
    )
  }
  return (
    <>
      <Page.Header
        breadcrumbs={
          <NGBreadcrumbs
            links={getLinkForAccountResources({ accountId, orgIdentifier, projectIdentifier, getString })}
          />
        }
        title={
          <ScopedTitle
            title={{
              [Scope.PROJECT]: getString('common.secrets'),
              [Scope.ORG]: getString('secrets.secretsTitle'),
              [Scope.ACCOUNT]: getString('secrets.secretsTitle')
            }}
          />
        }
      />

      {secretsResponse?.data?.content?.length || searchTerm || loading || error ? (
        <Layout.Horizontal flex className={css.header}>
          <Layout.Horizontal spacing="small">
            <Popover minimal position={Position.BOTTOM_LEFT} interactionKind={PopoverInteractionKind.CLICK_TARGET_ONLY}>
              <CreateSecretBtn setOpenPopOverProp={setOpenPopOver} />
              {openPopOver && <CreateSecretBtnMenu />}
            </Popover>

            <RbacButton
              text={getString('createViaYaml')}
              minimal
              onClick={
                /* istanbul ignore next */ () => {
                  history.push(routes.toCreateSecretFromYaml({ accountId, orgIdentifier, projectIdentifier, module }))
                }
              }
              permission={{
                permission: PermissionIdentifier.UPDATE_SECRET,
                resource: {
                  resourceType: ResourceType.SECRET
                },
                resourceScope: {
                  accountIdentifier: accountId,
                  orgIdentifier,
                  projectIdentifier
                }
              }}
              variation={ButtonVariation.SECONDARY}
            />
          </Layout.Horizontal>
          <ExpandingSearchInput
            alwaysExpanded
            onChange={text => {
              setSearchTerm(text.trim())
              setPage(0)
            }}
            width={250}
          />
        </Layout.Horizontal>
      ) : null}

      <Page.Body
        className={css.body}
        noData={{
          when: () => !loading && !secretsResponse?.data?.content?.length,
          image: SecretEmptyState,
          message: searchTerm
            ? getString('secrets.secret.noSecretsFound')
            : getString('secrets.noSecrets', { resourceName: scope }),
          button: !searchTerm ? (
            <Popover minimal position={Position.BOTTOM_LEFT} interactionKind={PopoverInteractionKind.CLICK_TARGET_ONLY}>
              <CreateSecretBtn size={ButtonSize.LARGE} setOpenPopOverProp={setEmptyStateOpenPopOver} />
              {emptyStateOpenPopOver && <CreateSecretBtnMenu />}
            </Popover>
          ) : undefined
        }}
      >
        {loading ? (
          <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
            <PageSpinner />
          </div>
        ) : error ? (
          <div style={{ paddingTop: '200px' }}>
            <PageError
              message={(error.data as Error)?.message || error.message}
              onClick={/* istanbul ignore next */ () => refetch()}
            />
          </div>
        ) : !secretsResponse?.data?.empty ? (
          <SecretsList
            secrets={secretsResponse?.data}
            refetch={refetch}
            gotoPage={/* istanbul ignore next */ pageNumber => setPage(pageNumber)}
          />
        ) : (
          <Container flex={{ align: 'center-center' }} padding="xxlarge">
            No Data
          </Container>
        )}
      </Page.Body>
    </>
  )
}

export default SecretsPage
