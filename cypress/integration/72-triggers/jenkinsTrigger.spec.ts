import {
  inputSetsTemplateCall,
  pipelineDetails,
  pipelineDetailsWithRoutingIdCall,
  pipelinesRoute,
  pipelineStudioRoute,
  triggersRoute
} from '../../support/70-pipeline/constants'

describe('Jenkins Trigger', () => {
  const visitTriggersPageWithAssertion = (): void => {
    cy.visit(pipelineStudioRoute, {
      timeout: 30000
    })
    cy.wait(2000)
    cy.visitPageAssertion()
  }

  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()

    cy.intercept('GET', pipelineDetails, { fixture: 'pipeline/api/triggers/amazonS3PipelienDetails.json' }).as(
      'pipelineDetails'
    )

    cy.intercept('POST', inputSetsTemplateCall, {
      fixture: 'pipeline/api/triggers/inputSetTemplateCallResponse.json'
    }).as('inputSetsTemplateCall')

    cy.intercept('GET', pipelineDetailsWithRoutingIdCall, {
      fixture: 'pipeline/api/triggers/pipelineDetailsWithRoutingIdCall.json'
    }).as('pipelineDetailsWithRoutingIdCall')

    // cy.intercept('GET', pipelineSummaryCallAPI, { fixture: '/ng/api/pipelineSummary' }).as('pipelineSummary')
    // cy.intercept('GET', triggersAPI, { fixture: 'ng/api/triggers/triggersList.empty.json' }).as('emptyTriggersList')

    visitTriggersPageWithAssertion()
  })

  it.skip('testing jenkins trigger', () => {
    cy.contains('a', 'Triggers').click()
    cy.wait(1000)
    cy.contains('span', '+ New Trigger').click()
    cy.get('section[data-cy="Artifact_Amazon S3"]').click()
    cy.get('input[placeholder="Enter Name"]').clear().type('amazonS3Trigger')
    cy.contains('p', '+ Select Artifact').click()
    cy.get('.TableV2--cells').eq(0).click()
    cy.contains('span', 'Select').click()
  })
})
