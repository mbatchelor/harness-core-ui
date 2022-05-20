/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import routes from '@common/RouteDefinitions'
import { TestWrapper } from '@common/utils/testUtils'
import { CardVariant } from '@pipeline/utils/constants'
import type { PipelineExecutionSummary } from 'services/pipeline-ng'
import * as stoService from 'services/sto'
import type { SeverityPillProps } from '@sto-steps/components/SeverityPill/SeverityPill'
import STOExecutionCardSummary from '@sto-steps/components/STOExecutionCardSummary/STOExecutionCardSummary'

jest.mock('@sto-steps/components/SeverityPill/SeverityPill', () => ({ severity, value }: SeverityPillProps) => (
  <div data-testid={severity} data-value={value} />
))

jest.mock('@blueprintjs/core', () => {
  const original = jest.requireActual('@blueprintjs/core')

  return {
    ...original,
    Spinner: () => <div data-testid="spinner" />
  }
})

const testPath = routes.toDeployments({
  accountId: ':accountId',
  orgIdentifier: ':orgIdentifier',
  projectIdentifier: ':projectIdentifier',
  module: 'sto'
})
const testParams = {
  accountId: 'accountId',
  orgIdentifier: 'orgIdentifier',
  projectIdentifier: 'projectIdentifier',
  module: 'sto'
}

const pipelineExecutionSummary = {
  pipelineIdentifier: 'pipeline-id',
  planExecutionId: 'execution-id'
} as PipelineExecutionSummary

describe('STOExecutionCardSummary', () => {
  test('renders correctly', () => {
    jest.spyOn(stoService, 'useIssueCounts').mockReturnValue({
      data: { critical: 1, high: 2, medium: 3, low: 4, info: 5, unassigned: 0 },
      loading: false,
      response: null,
      error: null
    })

    const { container } = render(
      <TestWrapper path={testPath} pathParams={testParams}>
        <STOExecutionCardSummary
          data={pipelineExecutionSummary}
          nodeMap={{}}
          startingNodeId={'foo'}
          variant={CardVariant.Default}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('only renders non-zero counts', () => {
    jest.spyOn(stoService, 'useIssueCounts').mockReturnValue({
      data: { critical: 1, high: 0, medium: 0, low: 0, info: 0, unassigned: 0 },
      loading: false,
      response: null,
      error: null
    })

    const { queryByTestId } = render(
      <TestWrapper path={testPath} pathParams={testParams}>
        <STOExecutionCardSummary
          data={pipelineExecutionSummary}
          nodeMap={{}}
          startingNodeId={'foo'}
          variant={CardVariant.Default}
        />
      </TestWrapper>
    )
    expect(queryByTestId('Critical')).toBeTruthy()
    expect(queryByTestId('High')).toBeNull()
    expect(queryByTestId('Medium')).toBeNull()
    expect(queryByTestId('Low')).toBeNull()

    jest.spyOn(stoService, 'useIssueCounts').mockReturnValue({
      data: { critical: 0, high: 11, medium: 0, low: 0, info: 0, unassigned: 0 },
      loading: false,
      response: null,
      error: null
    })
  })

  test("only renders non-zero counts (cont'd)", () => {
    jest.spyOn(stoService, 'useIssueCounts').mockReturnValue({
      data: { critical: 0, high: 11, medium: 0, low: 0, info: 0, unassigned: 0 },
      loading: false,
      response: null,
      error: null
    })

    const { queryByTestId } = render(
      <TestWrapper path={testPath} pathParams={testParams}>
        <STOExecutionCardSummary
          data={pipelineExecutionSummary}
          nodeMap={{}}
          startingNodeId={'foo'}
          variant={CardVariant.Default}
        />
      </TestWrapper>
    )
    expect(queryByTestId('Critical')).toBeNull()
    expect(queryByTestId('High')).toBeTruthy()
    expect(queryByTestId('Medium')).toBeNull()
    expect(queryByTestId('Low')).toBeNull()
  })

  test('shows loading spinner', () => {
    jest.spyOn(stoService, 'useIssueCounts').mockReturnValue({
      data: null,
      loading: true,
      response: null,
      error: null
    })

    const { container } = render(
      <TestWrapper path={testPath} pathParams={testParams} getString={id => id}>
        <STOExecutionCardSummary
          data={pipelineExecutionSummary}
          nodeMap={{}}
          startingNodeId={'foo'}
          variant={CardVariant.Default}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('shows an error message', () => {
    jest.spyOn(stoService, 'useIssueCounts').mockReturnValue({
      data: null,
      loading: false,
      response: null,
      error: { data: 'Error!', message: 'Error!', status: 500 }
    })

    render(
      <TestWrapper path={testPath} pathParams={testParams} getString={id => id}>
        <STOExecutionCardSummary
          data={pipelineExecutionSummary}
          nodeMap={{}}
          startingNodeId={'foo'}
          variant={CardVariant.Default}
        />
      </TestWrapper>
    )
    expect(screen.getByText('stoSteps.failedToGetIssueCounts'))
  })

  test('shows no security tests message', () => {
    jest.spyOn(stoService, 'useIssueCounts').mockReturnValue({
      data: null,
      loading: false,
      response: null,
      error: { data: 'Not Found', message: 'NotFound', status: 404 }
    })

    render(
      <TestWrapper path={testPath} pathParams={testParams} getString={id => id}>
        <STOExecutionCardSummary
          data={pipelineExecutionSummary}
          nodeMap={{}}
          startingNodeId={'foo'}
          variant={CardVariant.Default}
        />
      </TestWrapper>
    )
    expect(screen.getByText('stoSteps.noSecurityTests'))
  })

  test('shows no issues message', () => {
    jest.spyOn(stoService, 'useIssueCounts').mockReturnValue({
      data: { critical: 0, high: 0, medium: 0, low: 0, info: 0, unassigned: 0 },
      loading: false,
      response: null,
      error: null
    })

    render(
      <TestWrapper path={testPath} pathParams={testParams} getString={id => id}>
        <STOExecutionCardSummary
          data={pipelineExecutionSummary}
          nodeMap={{}}
          startingNodeId={'foo'}
          variant={CardVariant.Default}
        />
      </TestWrapper>
    )
    expect(screen.getByText('stoSteps.noSecurityIssues'))
  })
})
