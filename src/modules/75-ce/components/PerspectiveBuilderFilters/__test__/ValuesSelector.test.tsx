/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, fireEvent, act, getByText } from '@testing-library/react'
import type { QlceViewFilterOperator } from 'services/ce/services'
import { findPopoverContainer, TestWrapper } from '@common/utils/testUtils'
import ValuesSelectors from '../views/ValuesSelector'

const mockData = {
  provider: {
    id: 'CLUSTER',
    name: ''
  },
  service: {
    id: 'clusterName',
    name: 'Cluster Name'
  },
  isDisabled: false,
  operator: 'IN' as QlceViewFilterOperator,
  valueList: [
    'gke',
    'ce-dev-new',
    'sample-ce-dev',
    'renanme_test_first_renamed',
    'test-utsav-4th-june',
    'ce-ecs-ec2-test',
    'rename_cluster_2_renamed',
    'eks-fargate-cluster',
    'TestDeletePt',
    'auto_cp_v8ttxr',
    'test-utsav-9th-jun',
    'qa-target-clone-2',
    'ce-dev-ce-delegate-aks',
    'Kubernetes ce-dev-1',
    'auto_cp_fytumb',
    'ce-dev-eks-fargate',
    'ce-dev-aks-manual',
    'aks-cluster',
    'qa-target-clone-4',
    'pr-target',
    'Utsav EKS Fargate',
    'ce-test-dontdelete',
    'qa_target_clone_22',
    'azure-harness-qa',
    'TestDeletePt2',
    'qa-target-clone-5-rename',
    'ce-dev cluster',
    'auto_cp_yoplhk',
    'qa-target-v114',
    'gke-automation',
    'Kubernetes ce-dev',
    'qa-target-clone',
    'gke-new',
    'qa_target_clone_21',
    'eks-fargate'
  ],
  searchText: '',
  fetching: false,
  selectedVal: ['gke'],
  onValueChange: jest.fn()
}

const mockDataLoading = {
  ...mockData,
  fetching: true
}
describe('test cases for filter values selector', () => {
  test('should be able to render ValuesSelector / open popover', async () => {
    const { container } = render(
      <TestWrapper>
        <ValuesSelectors onInputChange={jest.fn()} {...mockData} />
      </TestWrapper>
    )
    expect(container.querySelector('[class*="bp3-input-ghost"]')).not.toBeNull()

    const ctn = container.querySelector('input')
    act(() => {
      fireEvent.click(ctn!)
    })

    const popover = findPopoverContainer()

    expect(getByText(popover!, 'ce.perspectives.createPerspective.filters.selectAll')).toBeDefined()
  })

  test('should be able to show spinner when loading', async () => {
    const { container } = render(
      <TestWrapper>
        <ValuesSelectors onInputChange={jest.fn()} {...mockDataLoading} />
      </TestWrapper>
    )

    expect(container.querySelector('[data-icon="spinner"]')).toBeDefined()
  })
})
