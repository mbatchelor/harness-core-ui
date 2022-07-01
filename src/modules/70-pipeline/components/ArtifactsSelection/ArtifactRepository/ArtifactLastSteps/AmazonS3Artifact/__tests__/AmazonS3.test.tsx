/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, findByText, fireEvent, queryByAttribute, render, waitFor } from '@testing-library/react'
import { MultiTypeInputType, RUNTIME_INPUT_VALUE, StepProps } from '@harness/uicore'

import * as pipelineng from 'services/cd-ng'
import { TestWrapper } from '@common/utils/testUtils'
import {
  AmazonS3ArtifactProps,
  ArtifactType,
  TagTypes,
  AmazonS3InitialValuesType
} from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import { AmazonS3 } from '../AmazonS3'
import { bucketListData } from './mock'

jest.mock('services/cd-ng', () => ({
  useGetV2BucketListForS3: jest.fn().mockImplementation(() => {
    return { data: bucketListData, refetch: jest.fn(), error: null, loading: false }
  })
}))

const commonInitialValues: AmazonS3InitialValuesType = {
  identifier: '',
  bucketName: '',
  tagType: TagTypes.Value,
  filePath: '',
  filePathRegex: ''
}

export const props: Omit<StepProps<pipelineng.ConnectorConfigDTO> & AmazonS3ArtifactProps, 'initialValues'> = {
  key: 'key',
  name: 'Artifact details',
  expressions: [],
  allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
  context: 1,
  handleSubmit: jest.fn(),
  artifactIdentifiers: [],
  selectedArtifact: 'AmazonS3' as ArtifactType,
  selectedDeploymentType: ServiceDeploymentType.Kubernetes,
  prevStepData: {
    connectorId: {
      value: 'testConnector'
    }
  }
}

describe('AmazonS3 tests', () => {
  beforeEach(() => {
    jest.spyOn(pipelineng, 'useGetV2BucketListForS3').mockImplementation((): any => {
      return {
        loading: false,
        data: bucketListData,
        refetch: jest.fn()
      }
    })
  })

  test(`renders fine for the NEW artifact`, () => {
    const { container } = render(
      <TestWrapper>
        <AmazonS3 initialValues={commonInitialValues} {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`renders fine for the existing artifact when filePath is present`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: 'cdng-terraform-state',
        tagType: TagTypes.Value,
        filePath: 'test_file_path'
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    expect(container.querySelector('input[name="bucketName"]')).not.toBeNull()
    expect(container.querySelector('input[name="filePath"]')).not.toBeNull()
    expect(container.querySelector('input[name="filePathRegex"]')).toBeNull()
    expect(container).toMatchSnapshot()

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: 'cdng-terraform-state',
          filePath: 'test_file_path'
        }
      })
    })
  })

  test(`renders fine for the existing artifact when filePathRegex is present`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: 'cdng-terraform-state',
        tagType: TagTypes.Regex,
        filePathRegex: 'file_path_regex'
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    expect(container.querySelector('input[name="bucketName"]')).not.toBeNull()
    expect(container.querySelector('input[name="filePath"]')).toBeNull()
    expect(container.querySelector('input[name="filePathRegex"]')).not.toBeNull()
    expect(container).toMatchSnapshot()

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: 'cdng-terraform-state',
          filePathRegex: 'file_path_regex'
        }
      })
    })
  })

  test(`renders fine for the existing artifact when all values are runtime inputs`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: RUNTIME_INPUT_VALUE,
        tagType: TagTypes.Value,
        filePath: RUNTIME_INPUT_VALUE
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    expect(container.querySelector('input[name="bucketName"]')).not.toBeNull()
    expect(container.querySelector('input[name="filePath"]')).not.toBeNull()
    expect(container).toMatchSnapshot()

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: RUNTIME_INPUT_VALUE,
          filePath: RUNTIME_INPUT_VALUE
        }
      })
    })
  })

  test(`submits should work when filePath value is given`, async () => {
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={commonInitialValues} {...props} />
      </TestWrapper>
    )

    // Defining at top, used everywhere to find input elements
    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    const bucketNameRequiredErr = await findByText(container, 'pipeline.manifestType.bucketNameRequired')
    expect(bucketNameRequiredErr).toBeDefined()
    const filePathRegexRequiredErr = await findByText(container, 'pipeline.manifestType.pathRequired')
    expect(filePathRegexRequiredErr).toBeDefined()

    const portalDivs = document.getElementsByClassName('bp3-portal')
    expect(portalDivs.length).toBe(0)

    // Select bucketName from dropdown
    const bucketNameDropDownButton = container.querySelector('[data-icon="chevron-down"]')
    fireEvent.click(bucketNameDropDownButton!)
    expect(portalDivs.length).toBe(1)
    const dropdownPortalDiv = portalDivs[0]
    const selectListMenu = dropdownPortalDiv.querySelector('.bp3-menu')
    const selectItem = await findByText(selectListMenu as HTMLElement, 'prod-bucket-339')
    act(() => {
      fireEvent.click(selectItem)
    })
    const bucketNameSelect = queryByNameAttribute('bucketName') as HTMLInputElement
    expect(bucketNameSelect.value).toBe('prod-bucket-339')

    // change value of filePath
    act(() => {
      fireEvent.change(queryByNameAttribute('filePath')!, { target: { value: 'file_path' } })
    })
    await waitFor(() => expect(container.querySelector('input[name="filePath"]')).toHaveValue('file_path'))

    // Submit the form
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: 'prod-bucket-339',
          filePath: 'file_path'
        }
      })
    })
  })

  test(`submits should work when filePathRegex value is given`, async () => {
    const initialValues = {
      spec: {
        identifier: '',
        bucketName: '',
        tagType: TagTypes.Regex,
        filePathRegex: ''
      },
      type: 'AmazonS3'
    }
    const { container, getByText } = render(
      <TestWrapper>
        <AmazonS3 initialValues={initialValues as any} {...props} />
      </TestWrapper>
    )

    // Defining at top, used everywhere to find input elements
    const queryByNameAttribute = (name: string): HTMLElement | null => queryByAttribute('name', container, name)

    const submitBtn = getByText('submit')
    fireEvent.click(submitBtn)
    const bucketNameRequiredErr = await findByText(container, 'pipeline.manifestType.bucketNameRequired')
    expect(bucketNameRequiredErr).toBeDefined()
    const filePathRegexRequiredErr = await findByText(container, 'pipeline.artifactsSelection.validation.filePathRegex')
    expect(filePathRegexRequiredErr).toBeDefined()

    const portalDivs = document.getElementsByClassName('bp3-portal')
    expect(portalDivs.length).toBe(0)

    // Select bucketName from dropdown
    const bucketNameDropDownButton = container.querySelector('[data-icon="chevron-down"]')
    fireEvent.click(bucketNameDropDownButton!)
    expect(portalDivs.length).toBe(1)
    const dropdownPortalDiv = portalDivs[0]
    const selectListMenu = dropdownPortalDiv.querySelector('.bp3-menu')
    const selectItem = await findByText(selectListMenu as HTMLElement, 'prod-bucket-339')
    act(() => {
      fireEvent.click(selectItem)
    })
    const bucketNameSelect = queryByNameAttribute('bucketName') as HTMLInputElement
    expect(bucketNameSelect.value).toBe('prod-bucket-339')

    // change value of filePathRegex
    const filePathRegexField = queryByNameAttribute('filePathRegex')
    expect(filePathRegexField).not.toBeNull()
    act(() => {
      fireEvent.change(filePathRegexField!, { target: { value: 'file_path_regex' } })
    })
    await waitFor(() => expect(filePathRegexField).toHaveValue('file_path_regex'))

    // Submit the form
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(props.handleSubmit).toBeCalled()
      expect(props.handleSubmit).toHaveBeenCalledWith({
        spec: {
          connectorRef: 'testConnector',
          bucketName: 'prod-bucket-339',
          filePathRegex: 'file_path_regex'
        }
      })
    })
  })
})
