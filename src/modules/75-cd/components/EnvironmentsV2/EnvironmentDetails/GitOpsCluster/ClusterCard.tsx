/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color, FontVariation, Icon, Layout, Text } from '@harness/uicore'
import cx from 'classnames'
import { defaultTo } from 'lodash-es'
import React from 'react'
import type { Cluster } from 'services/cd-ng'
import css from './AddCluster.module.scss'

interface ClusterCardProps {
  cluster: Cluster
  setSelectedClusters: (arr: Cluster[]) => void
  selectedClusters: Cluster[]
}

const ClusterCard = (props: ClusterCardProps): React.ReactElement => {
  const { cluster, selectedClusters } = props
  const isClusterAlreadySelected = selectedClusters.find((clstr: Cluster) => clstr.identifier === cluster.identifier)
  return (
    <div
      onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        e.stopPropagation()
        if (!isClusterAlreadySelected) {
          props.setSelectedClusters([...selectedClusters, cluster])
        } else {
          const clustrs = []
          for (const selClstr of selectedClusters) {
            if (cluster.identifier !== selClstr.identifier) {
              clustrs.push(selClstr)
            }
          }
          props.setSelectedClusters([...clustrs])
        }
      }}
      className={cx(css.gitopsClusterCard, {
        [css.selected]: isClusterAlreadySelected
      })}
      data-cy="cluster-card"
    >
      <Icon name="gitops-clusters" />
      <Layout.Vertical flex={{ justifyContent: 'flex-start' }} spacing="small" margin={{ bottom: 'small' }}>
        <Text data-id="cluster-id-label" lineClamp={1} color={Color.BLACK} className={css.clusterName}>
          {defaultTo(cluster.identifier, '')}
        </Text>
        <Text
          data-id="cluster-id-text"
          lineClamp={1}
          font={{ variation: FontVariation.FORM_LABEL }}
          color={Color.GREY_400}
          className={css.clusterId}
        >
          ID: {cluster.identifier}
        </Text>
      </Layout.Vertical>
    </div>
  )
}

export default ClusterCard
