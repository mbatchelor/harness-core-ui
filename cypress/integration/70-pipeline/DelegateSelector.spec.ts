import {
  delegateSelectionExecutionAPI,
  delegateSelectionStageAPI,
  pipelinesExecutionDelegateRoute
} from '../../support/70-pipeline/constants'

describe('Delegate Selection on Execution View', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()
    cy.intercept('GET', delegateSelectionExecutionAPI, {
      fixture: '/pipeline/api/pipelines/execution/delegate-executionId'
    }).as('selectedExecution')
    cy.intercept('GET', delegateSelectionStageAPI, {
      fixture: '/pipeline/api/pipelines/execution/delegate-executionId-selected'
    }).as('selectedStageExecution')
    cy.visit(pipelinesExecutionDelegateRoute, {
      timeout: 30000
    })
  })

  it('Able to click Delegate list for both task', () => {
    cy.wait(2000)
    cy.visitPageAssertion('[class^=ExecutionLandingPage-module_header]')
    cy.wait('@selectedExecution', { timeout: 10000 })
    cy.get('span[data-icon="rolling"]').should('be.visible').click({ force: true })
    cy.wait(1000)
    cy.findByText('Delegate').next().get('div>div').eq(2).each
    cy.get('p:contains("Delegate selection logs")')
      .each($elm => {
        cy.wrap($elm).click()
        cy.wait(1000)
        cy.get('span[icon="small-cross"]').click()
        cy.wait(1000)
      })
      .then($lis => {
        expect($lis).to.have.length(2)
      })
  })
})
