/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { renderHook } from '@testing-library/react-hooks'
import type { FC } from 'react'
import React from 'react'
import { waitFor, screen } from '@testing-library/react'
import * as uuid from 'uuid'
import { TestWrapper } from '@common/utils/testUtils'
import * as cfServicesMock from 'services/cf'
import { FFGitSyncProvider } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import type { GitRepo } from 'services/cf'
import usePatchFeatureFlag, { UsePatchFeatureFlagProps } from '../usePatchFeatureFlag'
import {
  mockPercentageVariationRollout,
  percentageRolloutAdded,
  percentageRolloutRemoved,
  percentageRolloutUpdated,
  targetAddedFixture,
  targetGroupsAddedFixture,
  targetGroupsRemovedFixture,
  targetRemovedFixture,
  variationAddedFixture,
  variationRemovedFixture
} from './fixtures/target_groups_and_targets_fixtures'
import type { TargetingRulesFormValues } from '../../types'

jest.mock('uuid')

const defaultInitialValues = {
  state: 'off',
  onVariation: 'False',
  offVariation: 'True',
  targetingRuleItems: [mockPercentageVariationRollout]
}

const renderHookUnderTest = (props: Partial<UsePatchFeatureFlagProps> = {}) => {
  const wrapper: FC = ({ children }) => {
    return (
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FFGitSyncProvider>{children}</FFGitSyncProvider>
      </TestWrapper>
    )
  }

  return renderHook(
    () =>
      usePatchFeatureFlag({
        featureFlagName: 'test',
        featureFlagIdentifier: 'test',
        initialValues: defaultInitialValues,
        refetchFlag: jest.fn(),
        variations: [
          {
            identifier: 'true',
            name: 'True',
            value: 'true'
          },
          {
            identifier: 'false',
            name: 'False',
            value: 'false'
          }
        ],
        ...props
      }),
    { wrapper }
  )
}

const setUseGitRepoMock = (repoDetails: Partial<GitRepo> = {}, repoSet = false): void => {
  jest.spyOn(cfServicesMock, 'useGetGitRepo').mockReturnValue({
    loading: false,
    refetch: jest.fn(),
    data: {
      repoDetails: {
        autoCommit: repoDetails.autoCommit || false,
        branch: repoDetails.branch || 'main',
        enabled: repoDetails.enabled ?? false,
        filePath: repoDetails.filePath || '/flags.yaml',
        repoIdentifier: repoDetails.repoIdentifier || 'harnesstest',
        rootFolder: repoDetails.rootFolder || '/.harness/',
        yamlError: repoDetails.yamlError || ''
      },
      repoSet: repoSet
    }
  } as any)
}

describe('usePatchFeatureFlag', () => {
  const mutateMock = jest.fn()
  beforeAll(() => {
    setUseGitRepoMock()
    jest.spyOn(uuid, 'v4').mockReturnValue('UUID')
    jest.spyOn(cfServicesMock, 'usePatchFeature').mockReturnValue({
      mutate: mutateMock.mockResolvedValueOnce({}),
      cancel: jest.fn(),
      error: null,
      loading: false
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Flag State / Default On Serve / Default Off Serve', () => {
    test('it should send correct values when values different', async () => {
      const refetchFlagMock = jest.fn()

      const { result } = renderHookUnderTest({ refetchFlag: refetchFlagMock.mockResolvedValueOnce({}) })

      const newValues = {
        state: 'on',
        onVariation: 'True',
        offVariation: 'False',
        targetingRuleItems: [mockPercentageVariationRollout]
      }
      result.current.saveChanges(newValues)

      expect(mutateMock).toBeCalledWith({
        instructions: [
          {
            kind: 'setFeatureFlagState',
            parameters: {
              state: 'on'
            }
          },
          {
            kind: 'updateDefaultServe',
            parameters: {
              variation: 'True'
            }
          },
          {
            kind: 'updateOffVariation',
            parameters: {
              variation: 'False'
            }
          }
        ]
      })

      await waitFor(() => expect(screen.getByText('cf.messages.flagUpdated')).toBeInTheDocument())
      expect(refetchFlagMock).toBeCalled()
    })

    test('it should send correct values when values are the same', async () => {
      const refetchFlagMock = jest.fn()

      const { result } = renderHookUnderTest({ refetchFlag: refetchFlagMock.mockResolvedValueOnce({}) })

      const newValues = {
        state: 'off',
        onVariation: 'False',
        offVariation: 'True',
        targetingRuleItems: [mockPercentageVariationRollout]
      }
      result.current.saveChanges(newValues)

      expect(mutateMock).not.toBeCalledWith()
      expect(refetchFlagMock).not.toBeCalled()
    })
  })

  describe('Add/Remove Variations', () => {
    test('it should send correct values when Variation added', async () => {
      const refetchFlagMock = jest.fn()

      const { result } = renderHookUnderTest({
        refetchFlag: refetchFlagMock.mockResolvedValueOnce({}),
        initialValues: {
          ...defaultInitialValues,
          targetingRuleItems: []
        }
      })

      const newValues: TargetingRulesFormValues = {
        ...defaultInitialValues,
        targetingRuleItems: [variationAddedFixture.addedTargetingRules]
      }
      result.current.saveChanges(newValues)

      expect(mutateMock).toBeCalledWith(variationAddedFixture.expected)
      await waitFor(() => expect(refetchFlagMock).toBeCalled())
    })

    test('it should send correct values when Variation removed', async () => {
      const refetchFlagMock = jest.fn()

      const { result } = renderHookUnderTest({
        refetchFlag: refetchFlagMock.mockResolvedValueOnce({}),
        initialValues: {
          ...defaultInitialValues,
          targetingRuleItems: [variationRemovedFixture.initialTargetingRules]
        }
      })

      const newValues: TargetingRulesFormValues = {
        ...defaultInitialValues,
        targetingRuleItems: [variationRemovedFixture.removedTargetingRules]
      }
      result.current.saveChanges(newValues)

      expect(mutateMock).toBeCalledWith(variationRemovedFixture.expected)
      await waitFor(() => expect(refetchFlagMock).toBeCalled())
    })
  })

  describe('Target Groups and Targets', () => {
    test('it should send correct values when Target Group added', async () => {
      const refetchFlagMock = jest.fn()

      const { result } = renderHookUnderTest({
        refetchFlag: refetchFlagMock.mockResolvedValueOnce({}),
        initialValues: {
          ...defaultInitialValues,
          targetingRuleItems: [mockPercentageVariationRollout, targetGroupsAddedFixture.initialFormVariationMap]
        }
      })

      const newValues: TargetingRulesFormValues = {
        ...defaultInitialValues,
        targetingRuleItems: [mockPercentageVariationRollout, targetGroupsAddedFixture.newFormVariationMap]
      }
      result.current.saveChanges(newValues)

      expect(mutateMock).toBeCalledWith(targetGroupsAddedFixture.expected)
      await waitFor(() => expect(refetchFlagMock).toBeCalled())
    })

    test('it should send correct values when Target Group removed', async () => {
      const refetchFlagMock = jest.fn()

      const { result } = renderHookUnderTest({
        refetchFlag: refetchFlagMock.mockResolvedValueOnce({}),
        initialValues: {
          ...defaultInitialValues,
          targetingRuleItems: [mockPercentageVariationRollout, targetGroupsRemovedFixture.initialFormVariationMap]
        }
      })

      const newValues = {
        ...defaultInitialValues,
        targetingRuleItems: [mockPercentageVariationRollout, targetGroupsRemovedFixture.newFormVariationMap]
      }
      result.current.saveChanges(newValues)

      expect(mutateMock).toBeCalledWith(targetGroupsRemovedFixture.expected)
      await waitFor(() => expect(refetchFlagMock).toBeCalled())
    })

    test('it should send correct values when Target added', async () => {
      const refetchFlagMock = jest.fn()

      const { result } = renderHookUnderTest({
        refetchFlag: refetchFlagMock.mockResolvedValueOnce({}),
        initialValues: {
          ...defaultInitialValues,
          targetingRuleItems: [mockPercentageVariationRollout, targetAddedFixture.initialFormVariationMap]
        }
      })

      const newValues = {
        ...defaultInitialValues,
        targetingRuleItems: [mockPercentageVariationRollout, targetAddedFixture.newFormVariationMap]
      }
      result.current.saveChanges(newValues)

      expect(mutateMock).toBeCalledWith(targetAddedFixture.expected)
      await waitFor(() => expect(refetchFlagMock).toBeCalled())
    })

    test('it should send correct values when Target removed', async () => {
      const refetchFlagMock = jest.fn()

      const { result } = renderHookUnderTest({
        refetchFlag: refetchFlagMock.mockResolvedValueOnce({}),
        initialValues: {
          ...defaultInitialValues,
          targetingRuleItems: [mockPercentageVariationRollout, targetRemovedFixture.initialFormVariationMap]
        }
      })

      const newValues = {
        ...defaultInitialValues,
        targetingRuleItems: [mockPercentageVariationRollout, targetRemovedFixture.newFormVariationMap]
      }
      result.current.saveChanges(newValues)

      expect(mutateMock).toBeCalledWith(targetRemovedFixture.expected)
      await waitFor(() => expect(refetchFlagMock).toBeCalled())
    })
  })

  describe('Percentage Rollout', () => {
    test('it should send correct values when Percentage Rollout added', async () => {
      const refetchFlagMock = jest.fn()

      const { result } = renderHookUnderTest({
        refetchFlag: refetchFlagMock.mockResolvedValueOnce({}),
        initialValues: {
          ...defaultInitialValues,
          targetingRuleItems: []
        }
      })

      const newValues = {
        ...defaultInitialValues,
        targetingRuleItems: [percentageRolloutAdded.newPercentageRolloutAdded]
      }
      result.current.saveChanges(newValues)

      expect(mutateMock).toBeCalledWith(percentageRolloutAdded.expected)
      await waitFor(() => expect(refetchFlagMock).toBeCalled())
    })
    test('it should send correct values when Percentage Rollout updated', async () => {
      const refetchFlagMock = jest.fn()

      const { result } = renderHookUnderTest({
        refetchFlag: refetchFlagMock.mockResolvedValueOnce({}),
        initialValues: {
          ...defaultInitialValues,
          targetingRuleItems: [percentageRolloutUpdated.initialVariationPercentageRollout]
        }
      })

      const newValues = {
        ...defaultInitialValues,
        targetingRuleItems: [percentageRolloutUpdated.newPercentageRolloutUpdated]
      }
      result.current.saveChanges(newValues)

      expect(mutateMock).toBeCalledWith(percentageRolloutUpdated.expected)
      await waitFor(() => expect(refetchFlagMock).toBeCalled())
    })

    test('it should send correct values when Percentage Rollout removed', async () => {
      const refetchFlagMock = jest.fn()

      const { result } = renderHookUnderTest({
        refetchFlag: refetchFlagMock.mockResolvedValueOnce({}),
        initialValues: {
          ...defaultInitialValues,
          targetingRuleItems: [percentageRolloutRemoved.initialVariationPercentageRollout]
        }
      })

      const newValues = {
        ...defaultInitialValues,
        targetingRuleItems: [percentageRolloutRemoved.percentageRolloutRemoved]
      }
      result.current.saveChanges(newValues)

      expect(mutateMock).toBeCalledWith(percentageRolloutRemoved.expected)
      await waitFor(() => expect(refetchFlagMock).toBeCalled())
    })
  })

  describe('Error Handling', () => {
    test('it should handle exception and show toast correctly', async () => {
      const mutatePatchMock = jest.fn()
      jest.spyOn(cfServicesMock, 'usePatchFeature').mockReturnValue({
        mutate: mutatePatchMock.mockRejectedValueOnce({ data: { message: 'ERROR FROM MOCK' } }),
        cancel: jest.fn(),
        error: null,
        loading: false
      })

      const { result } = renderHookUnderTest()

      const newValues = {
        state: 'on',
        onVariation: 'True',
        offVariation: 'False',
        targetingRuleItems: []
      }
      result.current.saveChanges(newValues)

      await waitFor(() => expect(screen.getByText('ERROR FROM MOCK')).toBeInTheDocument())
    })
  })
})
