import { executionListRoute, executionSummaryApi, pageHeaderClassName } from '../../support/70-pipeline/constants'

describe('RETRY FAILED PIPELINE', () => {
  const gitSyncCall =
    '/ng/api/git-sync/git-sync-enabled?accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })

    cy.initializeRoute()
    cy.intercept('GET', gitSyncCall, { connectivityMode: null, gitSyncEnabled: false })

    cy.visit(executionListRoute, {
      timeout: 30000
    })
    cy.intercept('POST', executionSummaryApi, {
      fixture: '/pipeline/api/pipelineExecution/pipelineExecutionSummary'
    }).as('pipelineExecutionSummary')
    cy.wait(2000)
  })

  it('Retry Failed Pipeline option should be visible for failed/ aborted executions', () => {
    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@pipelineExecutionSummary')
    cy.get('*[class^="ExecutionCard-module_cardLink"]').should('be.visible')

    cy.get('*[class^="ExecutionCard-module_cardLink"]')
      .eq(3)
      .within(() => {
        cy.contains('span', 'Execution Id').should('be.visible')
        cy.get('[data-icon="cd-main"]').should('be.visible')

        cy.get('[icon="more"]').should('be.visible')

        cy.get('[icon="more"]').click({ force: true })
      })

    cy.contains('div', 'Retry Failed Pipeline').should('be.visible')
  })

  it('Retry Failed Pipeline option should not exist for successful executions', () => {
    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@pipelineExecutionSummary')
    cy.get('*[class^="ExecutionCard-module_cardLink"]').should('be.visible')

    cy.get('*[class^="ExecutionCard-module_cardLink"]')
      .eq(0)
      .within(() => {
        cy.contains('span', 'Execution Id').should('be.visible')

        cy.get('[icon="more"]').should('be.visible').click({ force: true })
      })

    cy.get('div[data-testid="retry-pipeline-menu"]').should('not.exist')
  })

  it('Clicking on Retry Failed pipeline renders retry failed pipeline modal', () => {
    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@pipelineExecutionSummary')

    cy.get('*[class^="ExecutionCard-module_cardLink"]')
      .should('be.visible')
      .eq(3)
      .within(() => {
        cy.get('[icon="more"]').should('be.visible').click({ force: true })
      })
    cy.contains('div', 'Retry Failed Pipeline').should('be.visible').click()

    cy.wait(2000)
    // Modal header for retry failed pipeline dialog should be Retry Failed Pipeline
    cy.contains('h2', 'Retry Failed Pipeline').should('be.visible')

    // Select stage option should be present by default
    cy.contains('div', 'Select the stage that you would like to resume from').should('be.visible')
    cy.get('button[data-testid="retry-failed-pipeline"]').should('be.visible')

    //Retry Button should be disabled if no stages are selected
    cy.get('button[data-testid="retry-failed-pipeline"]').should('be.disabled')
  })
})
