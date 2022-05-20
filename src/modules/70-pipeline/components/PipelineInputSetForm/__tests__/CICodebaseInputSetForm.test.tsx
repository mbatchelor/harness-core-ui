/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, queryByText } from '@testing-library/react'
import { Form } from 'formik'
import { Formik } from '@wings-software/uicore'
import { TestWrapper } from '@common/utils/testUtils'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import * as cdng from 'services/cd-ng'
import { CICodebaseInputSetForm } from '../CICodebaseInputSetForm'
import {
  getCICodebaseInputSetFormInitialValues,
  getCICodebaseInputSetFormTemplateInitialValues,
  getCICodebaseTemplateInitialValues,
  getReRunCICodebaseInputSetInitialValues,
  getReRunCICodebaseInputSetInitialValuesTemplate,
  getCICodebaseInputSetFormProps,
  getCICodebaseParallelStageInitialValues,
  getCICodebaseParallelTemplateProps,
  GetUseGetConnectorRepoUrlTypeResponse,
  GetUseGetConnectorAcctUrlTypeResponse
} from './mocks'

jest.mock('@common/utils/YamlUtils', () => ({}))

describe('CICodebaseInputSetForm tests', () => {
  describe('Run Pipeline Form ', () => {
    test('Initial Render', () => {
      const { container } = render(
        <TestWrapper>
          <Formik formName="test-form" initialValues={getCICodebaseInputSetFormInitialValues()} onSubmit={jest.fn()}>
            {formik => (
              <Form>
                <CICodebaseInputSetForm
                  {...getCICodebaseInputSetFormProps({ formik })}
                  viewType={StepViewType.DeploymentForm}
                />
              </Form>
            )}
          </Formik>
        </TestWrapper>
      )
      expect(container).toMatchSnapshot()
    })
    // For test case pipeline, see https://qa.harness.io/ng/#/account/h61p38AZSV6MzEkpWWBtew/ci/orgs/default/projects/mtran/pipelines/cicodebaseallfieldsruntime/executions/HXntYIaPTuKNd5DEaNcUKA/pipeline

    test('Re-Run Pipeline Render with Connector Repo URL Type', async () => {
      const getUseGetConnector = jest.spyOn(cdng, 'useGetConnector')
      getUseGetConnector.mockReturnValue({
        refetch: () => GetUseGetConnectorRepoUrlTypeResponse,
        ...GetUseGetConnectorRepoUrlTypeResponse
      } as any)
      const { container } = render(
        <TestWrapper>
          <Formik formName="test-form" initialValues={getReRunCICodebaseInputSetInitialValues({})} onSubmit={jest.fn()}>
            {formik => (
              <Form>
                <CICodebaseInputSetForm
                  {...getCICodebaseInputSetFormProps({ formik })}
                  viewType={StepViewType.DeploymentForm}
                />
              </Form>
            )}
          </Formik>
        </TestWrapper>
      )
      expect(container).toMatchSnapshot()
      await waitFor(() =>
        expect(container.querySelector('input[name="properties.ci.codebase.repoName"]')).toHaveProperty(
          'disabled',
          true
        )
      )
    })
    test('Re-Run Pipeline Render with Connector Account URL Type', async () => {
      const getUseGetConnector = jest.spyOn(cdng, 'useGetConnector')
      getUseGetConnector.mockReturnValue({
        refetch: () => GetUseGetConnectorAcctUrlTypeResponse,
        ...GetUseGetConnectorAcctUrlTypeResponse
      } as any)
      const { container } = render(
        <TestWrapper>
          <Formik
            formName="test-form"
            initialValues={getReRunCICodebaseInputSetInitialValues({
              codebase: {
                connectorRef: 'mtaccttyperepo',
                build: {
                  type: 'tag',
                  spec: {
                    tag: 'tag'
                  }
                },
                depth: 150,
                sslVerify: false,
                prCloneStrategy: 'SourceBranch',
                resources: {
                  limits: {
                    memory: '1500Mi',
                    cpu: '1400m'
                  }
                },
                repoName: 'repo'
              }
            })}
            onSubmit={jest.fn()}
          >
            {formik => (
              <Form>
                <CICodebaseInputSetForm
                  {...getCICodebaseInputSetFormProps({ formik })}
                  viewType={StepViewType.DeploymentForm}
                />
              </Form>
            )}
          </Formik>
        </TestWrapper>
      )

      await waitFor(() =>
        expect(container.querySelector('input[name="properties.ci.codebase.repoName"]')).toHaveProperty(
          'disabled',
          false
        )
      )
    })
  })

  describe('Run Pipeline from Template Form', () => {
    test('Initial Render', () => {
      const { container } = render(
        <TestWrapper>
          <Formik
            formName="test-form"
            initialValues={getCICodebaseInputSetFormTemplateInitialValues()}
            onSubmit={jest.fn()}
          >
            {formik => (
              <Form>
                <CICodebaseInputSetForm
                  {...getCICodebaseInputSetFormProps({ formik, isTemplate: true })}
                  viewType={StepViewType.DeploymentForm}
                />
              </Form>
            )}
          </Formik>
        </TestWrapper>
      )
      expect(container).toMatchSnapshot()
    })
    test('Re-Run Pipeline from Template Render with Connector Acct URL Type', async () => {
      const getUseGetConnector = jest.spyOn(cdng, 'useGetConnector')
      getUseGetConnector.mockReturnValue({
        refetch: () => GetUseGetConnectorAcctUrlTypeResponse,
        ...GetUseGetConnectorAcctUrlTypeResponse
      } as any)
      const { container } = render(
        <TestWrapper>
          <Formik
            formName="test-form"
            initialValues={getReRunCICodebaseInputSetInitialValuesTemplate()}
            onSubmit={jest.fn()}
          >
            {formik => (
              <Form>
                <CICodebaseInputSetForm
                  {...getCICodebaseInputSetFormProps({ formik, isTemplate: true })}
                  viewType={StepViewType.DeploymentForm}
                />
              </Form>
            )}
          </Formik>
        </TestWrapper>
      )
      // Will see connector + repoName printed below Repository Name for connector Acct URL Type
      await waitFor(() => expect(queryByText(container, 'https://github.com/repo')).toBeTruthy())
    })

    test('Re-Run Pipeline from Template (with parallel stages) Render with Connector Acct URL Type', async () => {
      const getUseGetConnector = jest.spyOn(cdng, 'useGetConnector')
      getUseGetConnector.mockReturnValue({
        refetch: () => GetUseGetConnectorAcctUrlTypeResponse,
        ...GetUseGetConnectorAcctUrlTypeResponse
      } as any)
      const { container } = render(
        <TestWrapper>
          <Formik formName="test-form" initialValues={getCICodebaseParallelStageInitialValues()} onSubmit={jest.fn()}>
            {formik => (
              <Form>
                <CICodebaseInputSetForm
                  {...getCICodebaseParallelTemplateProps({ formik })}
                  viewType={StepViewType.DeploymentForm}
                />
              </Form>
            )}
          </Formik>
        </TestWrapper>
      )
      expect(container).toMatchSnapshot()
      // Will see connector + repoName printed below Repository Name for connector Acct URL Type
      await waitFor(() => expect(queryByText(container, 'https://github.com/repo')).toBeTruthy())
    })
  })

  describe('Run Pipeline from Template Form', () => {
    // https://qa.harness.io/ng/#/account/h61p38AZSV6MzEkpWWBtew/ci/orgs/default/projects/mtran/pipelines/cicodebaseallfieldsruntime/pipeline-studio/
    test('Initial Render', async () => {
      const { container } = render(
        <TestWrapper>
          <Formik formName="test-form" initialValues={getCICodebaseTemplateInitialValues()} onSubmit={jest.fn()}>
            {formik => (
              <Form>
                <CICodebaseInputSetForm
                  {...getCICodebaseInputSetFormProps({ formik, isTemplate: true })}
                  viewType={StepViewType.DeploymentForm}
                />
              </Form>
            )}
          </Formik>
        </TestWrapper>
      )
      // All fields should render <+input>
      expect(container).toMatchSnapshot()
    })
  })
})
