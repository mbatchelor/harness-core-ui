import {
  pipelineDetailsAPI,
  pipelineExecutionAPI,
  pipelineExecutionForNodeAPI,
  pipelineExecutionSummaryAPI,
  pipelineListAPI,
  pipelineSummaryAPI
} from '../../support/70-pipeline/constants'

import {
  aggregateProjectsCall,
  deploymentActivitySummaryAPI,
  deploymentTimeseriesDataAPI,
  deploymentTimeseriesDataWithFilters,
  deploymentTimeseriesDataWithNodeFilterAPI,
  gitSyncCall,
  healthSourceAPI,
  nodeNamesFilterAPI,
  sourceCodeManagerCall,
  transactionsFilterAPI
} from '../../support/85-cv/verifyStep/constants'

describe.skip('Verify step', () => {
  beforeEach(() => {
    cy.intercept('POST', pipelineListAPI, { fixture: '/pipeline/api/pipelines/getPipelineList' }).as('pipelineList')
    cy.intercept('GET', pipelineSummaryAPI, { fixture: '/pipeline/api/pipelines/pipelineSummary' }).as(
      'pipelineSummary'
    )
    cy.intercept('GET', pipelineDetailsAPI, { fixture: '/pipeline/api/pipelines/getPipelineDetails' }).as(
      'pipelineDetails'
    )
    cy.intercept('POST', pipelineExecutionSummaryAPI, { fixture: '/pipeline/api/pipelines/getExecutionSummary' }).as(
      'pipelineExecutionSumary'
    )
    cy.intercept('GET', pipelineExecutionAPI, { fixture: '/pipeline/api/pipelines/getExecutionDetails' }).as(
      'pipelineExecution'
    )
    cy.intercept('GET', pipelineExecutionForNodeAPI, { fixture: '/pipeline/api/pipelines/getNodeExecutionDetails' }).as(
      'pipelineExecutionForNode'
    )
    cy.intercept('GET', deploymentActivitySummaryAPI, { fixture: '/cv/verifyStep/getDeploymentActivitySummary' }).as(
      'deployment-activity-summary'
    )
    cy.intercept('GET', deploymentTimeseriesDataAPI, { fixture: '/cv/verifyStep/getDeploymentTimeseriesData' }).as(
      'deploymentTimeseriesData'
    )
    cy.intercept('GET', healthSourceAPI, { fixture: '/cv/verifyStep/getHealthSourceFilters' }).as('healthSource')
    cy.intercept('GET', nodeNamesFilterAPI, { fixture: '/cv/verifyStep/getNodeNameFilters' }).as('nodeNames')
    cy.intercept('GET', transactionsFilterAPI, { fixture: '/cv/verifyStep/getTransactionNameFilters' }).as(
      'transactions'
    )

    cy.intercept('GET', deploymentTimeseriesDataWithNodeFilterAPI, {
      fixture: '/cv/verifyStep/getDeploumentTimeseriesNoData'
    }).as('deploymentTimeseriesDataWithNodeFilter')

    cy.intercept('GET', deploymentTimeseriesDataWithFilters, {
      fixture: '/cv/verifyStep/getDeploumentTimeseriesNoData'
    }).as('deploymentTimeseriesDataWithFilters')

    cy.intercept('GET', gitSyncCall, {}).as('gitSyncCall')
    cy.intercept('GET', sourceCodeManagerCall, {}).as('sourceCodeManagerCall')
    cy.intercept('GET', aggregateProjectsCall, {}).as('aggregateProjectsCall')

    cy.on('uncaught:exception', () => false)
    cy.login('test', 'test')
    cy.contains('p', 'Projects').click()
    cy.contains('p', 'Project 1').click()
    cy.contains('p', 'Delivery').click()
    cy.contains('p', 'Pipelines').click()

    cy.wait('@pipelineList')
    cy.wait('@aggregateProjectsCall')
    cy.wait('@sourceCodeManagerCall')
    cy.wait('@gitSyncCall')
  })

  it('should test verify step features', () => {
    cy.findByText('appd-test').click()

    cy.wait('@pipelineSummary')
    cy.wait('@pipelineDetails')

    cy.url().should('include', '/pipelines/appdtest/pipeline-studio')

    cy.findByRole('link', { name: /Execution History/i }).click()

    cy.wait('@pipelineExecutionSumary')
    cy.wait('@pipelineSummary')

    cy.findByText(/(Execution Id: 5)/i)
      .scrollIntoView()
      .click()

    cy.wait('@pipelineExecution')
    cy.wait('@pipelineExecutionForNode')

    cy.url().should('include', '/pipelines/appdtest/executions/C9mgNjxSS7-B-qQek27iuA/pipeline')

    cy.findByText(/appd_dev/i).click()

    cy.wait('@deployment-activity-summary')

    cy.url().should(
      'include',
      '/pipelines/appdtest/executions/C9mgNjxSS7-B-qQek27iuA/pipeline?stage=g_LkakmWRPm-wC6rfC2ufg&step=MC56t3BmR4mUBHPuiL6JWQ'
    )

    cy.findByTestId(/Metrics/i).click()

    cy.wait(500)

    cy.url().should(
      'include',
      '/pipelines/appdtest/executions/C9mgNjxSS7-B-qQek27iuA/pipeline?stage=g_LkakmWRPm-wC6rfC2ufg&step=MC56t3BmR4mUBHPuiL6JWQ&view=log&type=Metrics&filterAnomalous=true'
    )

    cy.findByTestId(/anomalousFilterCheckbox/i).should('be.checked')

    // on clicking expand all, it should expand all accordions
    cy.get('[data-open="false"]').should('have.length', 3)
    cy.get('[data-open="true"]').should('have.length', 0)
    cy.findByRole('button', { name: /Expand All/i }).click()
    cy.get('[data-open="false"]').should('have.length', 0)
    cy.get('[data-open="true"]').should('have.length', 3)
    cy.findByRole('button', { name: /Collapse All/i }).click()

    // load more should be visible, if we have more than 6 nodes present
    cy.findByText('/todolist/exception').click()
    cy.wait(500)
    cy.findByTestId('loadMore_button').should('be.visible')
    cy.get('.highcharts-container ').should('have.length', 6)

    // if all the graphs are loaded, Load more button must be hidden
    cy.findByTestId('loadMore_button').click()
    cy.wait(1000)
    cy.get('.highcharts-container').should('have.length', 10)
    cy.findByTestId('loadMore_button').should('not.exist')

    // By clicking on the node graph, it should apply the same filter in nodes dropdown
    cy.findByTestId(/canaryNode-0/).click()
    cy.findByTestId(/node_name_filter/i).click()
    cy.findByRole('checkbox', { name: 'harness-deployment-canary-7445f86dbf-ml857' }).should('be.checked')
    cy.findByTestId(/canaryNode-0/).click()
    cy.findByText(/Nodes: All/i).should('be.visible')

    // if we come via Console view log, the anomalous filters checkbox must be unchecked
    cy.get('.bp3-switch').click()
    // clicking again to go to verify step page
    cy.get('.bp3-switch').click()
    cy.findByTestId(/anomalousFilterCheckbox/i).should('not.be.checked')
    cy.url().should(
      'include',
      '/pipelines/appdtest/executions/C9mgNjxSS7-B-qQek27iuA/pipeline?stage=g_LkakmWRPm-wC6rfC2ufg&step=MC56t3BmR4mUBHPuiL6JWQ&view=log&type=Metrics&filterAnomalous=false'
    )

    // if we don't have any data for the applied filter, "No matching data." text must be shown
    cy.findByTestId(/node_name_filter/i).click()
    cy.findByText('harness-deployment-canary-7445f86dbf-ml857').click({ force: true })
    cy.wait(1000)
    cy.findByText(/No matching data./i).should('be.visible')

    cy.get('.bp3-overlay-backdrop').click()
    cy.findByTestId(/transaction_name_filter/i).click()
    cy.wait(500)
    cy.findByText('/todolist/register').click({ force: true })

    cy.get('.bp3-overlay-backdrop').click()
    cy.findByTestId(/HealthSource_MultiSelect_DropDown/i).click()
    cy.wait(500)
    cy.get('.MultiSelectDropDown--popover').findByText('appd-test').click({ force: true })

    cy.findByTestId(/anomalousFilterCheckbox/i).check({ force: true })

    cy.wait('@deploymentTimeseriesDataWithFilters').then(interception => {
      expect(interception.request.url).contains(
        'anomalousMetricsOnly=true&anomalousNodesOnly=true&hostNames=harness-deployment-canary-7445f86dbf-ml857&pageNumber=0&pageSize=10&healthSources=appd_prod%2Fappdtest&transactionNames=%2Ftodolist%2Fregister'
      )
    })
  })

  it('should show retry button when API fails', () => {
    // mocking API call to fail
    cy.intercept('GET', deploymentTimeseriesDataAPI, {
      statusCode: 500
    }).as('deploymentTimeseriesData')

    // cy.contains('p', 'Pipelines').click()
    cy.wait(1000)

    cy.findByText('appd-test').click()

    cy.wait(1000)
    cy.findByRole('link', { name: /Execution History/i }).click()
    cy.wait(1000)
    cy.findByText(/(Execution Id: 5)/i).click()
    cy.findByText(/appd_dev/i).click()
    cy.findByTestId(/Metrics/i).click()

    cy.wait('@deploymentTimeseriesData').its('response.statusCode').should('eq', 500)
    cy.wait(1000)
    cy.findByRole('button', { name: /Retry/i }).should('be.visible')
  })
})
