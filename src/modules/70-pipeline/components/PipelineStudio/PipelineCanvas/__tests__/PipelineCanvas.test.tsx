/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { render, act, fireEvent, waitFor } from '@testing-library/react'
import { putPipelinePromise, createPipelinePromise } from 'services/pipeline-ng'
import { TestWrapper } from '@common/utils/testUtils'
import { useMutateAsGet } from '@common/hooks'
import { PipelineCanvas, PipelineCanvasProps } from '../PipelineCanvas'
import { PipelineContext } from '../../PipelineContext/PipelineContext'
import { DefaultNewPipelineId, DrawerTypes } from '../../PipelineContext/PipelineActions'
import {
  getDummyPipelineCanvasContextValue,
  mockApiDataEmpty,
  mockPipelineTemplateYaml
} from './PipelineCanvasTestHelper'

const getProps = (): PipelineCanvasProps => ({
  toPipelineStudio: jest.fn(),
  toPipelineDetail: jest.fn(),
  toPipelineList: jest.fn(),
  toPipelineProject: jest.fn()
})

/* Mocks */
jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@common/utils/YamlUtils', () => ({
  validateJSONWithSchema: jest.fn().mockReturnValue({ error: { size: 2 } })
}))
jest.mock('resize-observer-polyfill', () => {
  class ResizeObserver {
    static default = ResizeObserver
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    observe() {
      // do nothing
    }
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    unobserve() {
      // do nothing
    }
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    disconnect() {
      // do nothing
    }
  }
  return ResizeObserver
})
jest.mock('framework/GitRepoStore/GitSyncStoreContext', () => ({
  useGitSyncStore: jest.fn().mockReturnValue({ gitSyncRepos: [{ identifier: 'repoIdentifier', name: 'repoName' }] })
}))
// eslint-disable-next-line jest-no-mock
jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as any),
  useParams: jest.fn()
}))

jest.mock('services/pipeline-ng', () => ({
  putPipelinePromise: jest.fn(),
  createPipelinePromise: jest.fn(),
  useGetInputsetYaml: () => jest.fn(),
  useGetTemplateFromPipeline: jest.fn()
}))

jest.mock('@common/hooks', () => ({
  ...(jest.requireActual('@common/hooks') as any),
  useMutateAsGet: jest.fn()
}))

const showError = jest.fn()
const showSuccess = jest.fn()
const toasterClear = jest.fn()

jest.mock('@wings-software/uicore', () => ({
  ...jest.requireActual('@wings-software/uicore'),
  useToaster: jest.fn(() => ({ showError, showSuccess, clear: toasterClear }))
}))

/* Mocks end */

describe('Pipeline Canvas - new pipeline', () => {
  beforeEach(() => {
    // eslint-disable-next-line
    // @ts-ignore
    useParams.mockImplementation(() => {
      return { pipelineIdentifier: DefaultNewPipelineId }
    })

    // eslint-disable-next-line
    // @ts-ignore
    useMutateAsGet.mockImplementation(() => {
      return mockPipelineTemplateYaml
    })
  })

  test('pipeline save button disabled till updation', () => {
    const props = getProps()
    const contextValue = getDummyPipelineCanvasContextValue({ isLoading: false })
    const { getByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={contextValue}>
          <PipelineCanvas {...props} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(getByText('save'))
    })
    // isUpdated - false disables save button
    expect(createPipelinePromise).not.toBeCalled()
  })

  test('function calls on switch to YAML mode and back to VISUAL', async () => {
    // eslint-disable-next-line
    // @ts-ignore
    putPipelinePromise.mockResolvedValue(mockApiDataEmpty)
    // eslint-disable-next-line
    // @ts-ignore
    createPipelinePromise.mockResolvedValue(mockApiDataEmpty)

    const props = getProps()
    const contextValue = getDummyPipelineCanvasContextValue({ isLoading: false, isUpdated: true })
    const { getByText, queryByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={contextValue}>
          <PipelineCanvas {...props} />
        </PipelineContext.Provider>
      </TestWrapper>
    )

    // toggle to YAMl works
    act(() => {
      fireEvent.click(getByText('YAML'))
    })
    expect(contextValue.updatePipelineView).toBeCalledWith({
      splitViewData: {},
      isDrawerOpened: false,
      isYamlEditable: false,
      isSplitViewOpen: false,
      drawerData: { type: DrawerTypes.AddStep }
    })
    expect(contextValue.setView).toBeCalledWith('YAML')
    expect(contextValue.setSelectedStageId).toBeCalledWith(undefined)
    expect(contextValue.setSelectedSectionId).toBeCalledWith(undefined)

    // Click on VISUAL again
    act(() => {
      fireEvent.click(getByText('VISUAL'))
    })
    // Now component is state less so visual click will not happen
    // expect(contextValue.setView).toHaveBeenLastCalledWith('VISUAL')
    expect(queryByText('save')).toBeTruthy()

    act(() => {
      fireEvent.click(getByText('save'))
    })
    expect(contextValue.setSchemaErrorView).toBeCalledWith(false)
    await waitFor(() => expect(contextValue.deletePipelineCache).toBeCalled())
    expect(showSuccess).toBeCalled()
    expect(contextValue.fetchPipeline).toBeCalledWith({
      forceFetch: true,
      forceUpdate: true,
      newPipelineId: 'Pipeline'
    })
    expect(props.toPipelineStudio).toBeCalled()
  })

  test('loading state', () => {
    const props = getProps()
    const contextValue = getDummyPipelineCanvasContextValue({ isLoading: true })
    const { queryByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={contextValue}>
          <PipelineCanvas {...props} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(queryByText(/Loading, please wait\.\.\./)).toBeTruthy()
  })

  test('pipeline call fail error screen', () => {
    const props = getProps()
    const contextValue = getDummyPipelineCanvasContextValue({ isLoading: false })
    contextValue.state.templateError = {
      status: 404,
      data: {
        message:
          'Invalid request: Pipeline with the given ID: testPipeline_Cypressss does not exist or has been deleted'
      },
      message: 'INVALID_REQUEST'
    }
    const { queryByText, container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={contextValue}>
          <PipelineCanvas {...props} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(queryByText('Invalid request:'))
    expect(queryByText('Pipeline with the given ID: testPipeline_Cypressss does not exist or has been deleted'))
    expect(container).toMatchSnapshot()
  })

  test('with git sync enabled - new pipeline', async () => {
    const props = getProps()
    const contextValue = getDummyPipelineCanvasContextValue({
      isLoading: false,
      gitDetails: { repoIdentifier: 'repoIdentifier', rootFolder: 'rootFolder', filePath: 'filePath', branch: 'branch' }
    })
    const { queryByText, getByTestId } = render(
      <TestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
        <PipelineContext.Provider value={contextValue}>
          <PipelineCanvas {...props} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const gitPopoverIcon = getByTestId('git-popover')
    act(() => {
      fireEvent.mouseEnter(gitPopoverIcon)
    })
    await waitFor(() => expect(queryByText('repoName')).toBeTruthy())
    expect(queryByText('branch')).toBeTruthy()
    expect(queryByText('rootFolderfilePath')).toBeNull()
  })

  test('readonly mode', () => {
    const props = getProps()
    const contextValue = getDummyPipelineCanvasContextValue({
      isLoading: false,
      gitDetails: undefined,
      isReadonly: true
    })
    const { queryByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={contextValue}>
          <PipelineCanvas {...props} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(queryByText('common.viewAndExecutePermissions')).toBeTruthy()
    expect(queryByText('save')).toBeNull()
  })

  test('isUpdated true and execute permissions', () => {
    const props = getProps()
    const contextValue = getDummyPipelineCanvasContextValue({
      isLoading: false,
      gitDetails: undefined,
      isReadonly: false,
      isUpdated: true
    })
    const dummyPermissionsMap = new Map()
    dummyPermissionsMap.set('EXECUTE_PIPELINE', true)
    const { queryByText } = render(
      <TestWrapper defaultPermissionValues={{ permissions: dummyPermissionsMap }}>
        <PipelineContext.Provider value={contextValue}>
          <PipelineCanvas {...props} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(queryByText('unsavedChanges')).toBeTruthy()
  })
})

describe('Existing pipeline', () => {
  beforeEach(() => {
    // eslint-disable-next-line
    // @ts-ignore
    useParams.mockImplementation(() => {
      return { pipelineIdentifier: 'someId' }
    })

    // eslint-disable-next-line
    // @ts-ignore
    useMutateAsGet.mockImplementation(() => {
      return mockPipelineTemplateYaml
    })
  })
  test('discard button if existing pipeline is touched', () => {
    const props = getProps()
    const contextValue = getDummyPipelineCanvasContextValue({
      isLoading: false,
      gitDetails: undefined,
      isReadonly: false,
      isUpdated: true
    })
    const { queryByText } = render(
      <TestWrapper>
        <PipelineContext.Provider value={contextValue}>
          <PipelineCanvas {...props} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(queryByText('unsavedChanges')).toBeTruthy()
  })
})
