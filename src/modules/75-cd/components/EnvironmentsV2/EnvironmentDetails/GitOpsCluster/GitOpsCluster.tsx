/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'

import { useParams } from 'react-router-dom'
import { Dialog } from '@blueprintjs/core'

import { Button, ButtonSize, ButtonVariation, Container } from '@harness/uicore'
import { useModalHook } from '@harness/use-modal'

import { useGetClusterList } from 'services/cd-ng'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'

import AddCluster from './AddCluster'
import ClusterTableView from './ClusterTableView'
import clusters from './clusters.json'
import css from './AddCluster.module.scss'

const GitOpsCluster = (props: { envRef: string }): React.ReactElement => {
  // const [showSelectClusterModal, setShowClusterModal] = React.useState(false)
  const { projectIdentifier, orgIdentifier } = useParams<{
    orgIdentifier: string
    projectIdentifier: string
  }>()

  const { accountId } = useParams<AccountPathProps>()

  const { data, refetch, loading } = useGetClusterList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier: props?.envRef
    }
  })

  // const clusterResponse = data && data.data?.content?.length ? data : clusters

  const [showSelectClusterModal, hideSelectClusterModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={hideSelectClusterModal}
        title={getString('cd.selectGitopsCluster')}
        isCloseButtonShown
        className={cx('padded-dialog', css.dialogStyles)}
      >
        <AddCluster
          linkedClusterResponse={data}
          onHide={() => {
            hideSelectClusterModal()
          }}
          refetch={refetch}
          envRef={props.envRef}
        />
      </Dialog>
    ),
    [data, loading]
  )

  const { getString } = useStrings()

  console.log(data)
  return (
    <Container padding={{ left: 'medium', right: 'medium' }}>
      <>
        <Button
          minimal
          intent="primary"
          onClick={showSelectClusterModal}
          icon="plus"
          size={ButtonSize.SMALL}
          variation={ButtonVariation.LINK}
        >
          {getString('cd.selectClusterLabel')}
        </Button>
        <Container padding={{ top: 'medium' }}>
          <ClusterTableView linkedClusters={data} loading={loading} refetch={refetch} {...props} />
        </Container>
      </>
    </Container>
  )
}

export default GitOpsCluster
