/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState, useEffect } from 'react'
import {
  Container,
  Text,
  Button,
  ButtonVariation,
  PageError,
  TableV2,
  useConfirmationDialog,
  useToaster,
  NoDataCard
} from '@wings-software/uicore'
import type { Column, Renderer, CellProps } from 'react-table'
import { useParams, useHistory } from 'react-router-dom'
import { get, defaultTo } from 'lodash-es'
import { Intent } from '@blueprintjs/core'
import {
  useGetUser,
  useSetDefaultAccountForCurrentUser,
  RestResponseUser,
  useRestrictedSwitchAccount
} from 'services/portal'
import type { User, Account } from 'services/portal'
import { PageSpinner } from '@common/components'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import type { UseGetMockData } from '@common/utils/testUtils'
import { getLoginPageURL } from 'framework/utils/SessionUtils'
import SecureStorage from 'framework/utils/SecureStorage'
import css from './SwitchAccount.module.scss'

interface SwitchAccountProps {
  hideModal: () => void
  searchString?: string
  mock?: UseGetMockData<RestResponseUser>
}

interface ReAuthenticationNoteProps {
  accounts: Account[]
  accountId: string
}

const RenderColumnCompanyName: Renderer<CellProps<Account>> = ({ row }) => {
  const name = row.original.companyName
  return <Text lineClamp={1}>{name}</Text>
}

const RenderColumnAccountEdition: Renderer<CellProps<Account>> = ({ row }) => {
  const name = row.original.licenseInfo?.accountType
  return <Text>{name}</Text>
}

const ReAuthenticationNote: React.FC<ReAuthenticationNoteProps> = ({ accounts, accountId }) => {
  const { getString } = useStrings()
  return accounts.length > 1 || (accounts[0] && accounts[0].uuid !== accountId) ? (
    <Text intent="warning" padding={{ left: 'large', right: 'large', top: 'small' }}>
      {getString('common.noteAccountSwitch')}
    </Text>
  ) : null
}

const SwitchAccount: React.FC<SwitchAccountProps> = ({ searchString = '', mock }) => {
  const { accountId } = useParams<AccountPathProps>()
  const [user, setUser] = useState<User>()
  const { showError } = useToaster()
  const history = useHistory()
  const { getString } = useStrings()
  const { data, loading, error, refetch } = useGetUser({
    mock
  })
  const { mutate: setDefaultAccount, loading: settingDefault } = useSetDefaultAccountForCurrentUser({ accountId })
  const { mutate: switchAccount, loading: switchAccountLoading } = useRestrictedSwitchAccount({
    // requestOptions: { headers: { 'content-type': 'application/json' } }
  })

  const RenderColumnAccountName: Renderer<CellProps<Account>> = ({ row }) => {
    const account = row.original

    const handleSwitchAccount = async (): Promise<void> => {
      try {
        const response = await switchAccount({ accountId: account.uuid })
        if (response.resource?.requiresReAuthentication) {
          const baseUrl = window.location.href.split('#')[0]
          const returnUrl = `${baseUrl}#${routes.toHome({ accountId: account.uuid })}`
          history.push({
            pathname: routes.toRedirect(),
            search: `?returnUrl=${encodeURIComponent(getLoginPageURL({ returnUrl }))}`
          })
        } else if (response.resource) {
          SecureStorage.set('acctId', account.uuid)
          // this needs to be a server-redirect to support cluster isolation
          window.location.href = window.location.pathname
        } else {
          showError(getString('common.switchAccountError'))
        }
      } catch (err) {
        showError(getString('common.switchAccountError'))
      }
    }

    return (
      <Button
        onClick={handleSwitchAccount}
        text={account.accountName}
        loading={switchAccountLoading}
        disabled={account.uuid === accountId}
        minimal={account.uuid === accountId}
        variation={ButtonVariation.LINK}
      />
    )
  }

  const RenderColumnDefaultAccount: Renderer<CellProps<Account>> = ({ row }) => {
    const account = row.original

    const handleSetDefault = async (): Promise<void> => {
      const { resource, responseMessages } = await setDefaultAccount(undefined, {
        pathParams: { accountId: account.uuid }
      })
      if (resource === true) {
        refetch()
      } else {
        showError(get(responseMessages, '[0].message', getString('somethingWentWrong')))
      }
    }

    const { openDialog } = useConfirmationDialog({
      cancelButtonText: getString('cancel'),
      confirmButtonText: getString('continue'),
      titleText: getString('common.changeDefaultAccountTitle'),
      contentText: getString('common.changeDefaultAccountMessage', { name: account.accountName }),
      intent: Intent.WARNING,
      onCloseDialog: isConfirmed => {
        if (isConfirmed) {
          handleSetDefault()
        }
      }
    })

    // default account should not be actionable
    return account.uuid === user?.defaultAccountId ? (
      <Text flex={{ align: 'center-center' }}>Default</Text>
    ) : (
      <Button
        small
        variation={ButtonVariation.TERTIARY}
        text={getString('common.setAsDefault')}
        onClick={openDialog}
        data-testid={`set-default-account-${account.accountName}`}
      />
    )
  }

  useEffect(() => {
    setUser(data?.resource)
  }, [data])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accounts = useMemo(
    () =>
      defaultTo(
        user?.accounts
          ?.concat(defaultTo(user.supportAccounts, []))
          ?.filter(account => account.accountName.toLowerCase().includes(searchString.toLowerCase())),
        []
      ),
    [user, searchString]
  )

  const columns: Column<Account>[] = useMemo(
    () => [
      {
        Header: getString('common.headerAccountName'),
        accessor: row => row.accountName,
        id: 'name',
        width: '30%',
        Cell: RenderColumnAccountName
      },
      {
        Header: getString('common.headerCompanyName'),
        accessor: row => row.companyName,
        id: 'companyName',
        width: '30%',
        Cell: RenderColumnCompanyName
      },
      {
        Header: getString('common.headerAccountEdition'),
        accessor: row => row.licenseInfo?.accountType,
        id: 'accountType',
        width: '20%',
        Cell: RenderColumnAccountEdition
      },
      {
        Header: getString('common.headerDefaultAccount'),
        accessor: row => row.defaults,
        id: 'defaultAccount',
        width: '20%',
        Cell: RenderColumnDefaultAccount
      }
    ],
    [accounts]
  )
  return (
    <>
      <ReAuthenticationNote accounts={accounts} accountId={accountId} />
      <Container padding={{ left: 'large', right: 'large' }} className={css.container}>
        {loading || settingDefault ? <PageSpinner /> : null}
        {error ? (
          <PageError message={error.message || getString('somethingWentWrong')} onClick={() => refetch()} />
        ) : null}
        {!loading && !settingDefault && !error && accounts ? (
          accounts.length ? (
            <TableV2 columns={columns} data={accounts} sortable={false} />
          ) : (
            <NoDataCard
              message={getString('noData')}
              className={css.noDataCard}
              containerClassName={css.noDataCardContainer}
            />
          )
        ) : null}
      </Container>
    </>
  )
}

export default SwitchAccount
