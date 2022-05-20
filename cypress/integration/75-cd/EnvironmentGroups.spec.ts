import {
  createEnvironmentGroupsCall,
  environmentGroupRoute,
  environmentGroupsCall,
  environmentGroupDetailsCall,
  environmentGroupYamlSchemaCall
} from '../../support/75-cd/constants'

describe('Environment Groups CRUD', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()

    cy.visit(environmentGroupRoute, {
      timeout: 30000
    })
  })

  it('should be able to create environment group and route to Environments section of details page', () => {
    cy.intercept('POST', environmentGroupsCall, {
      fixture: 'ng/api/environmentGroups/environmentGroups.empty.json'
    })

    cy.wait(4000)

    cy.contains('h2', 'You have No Environment Groups').should('be.visible')
    cy.contains('button', 'Create new Environment Group').should('be.visible').click()

    cy.wait(1000)

    cy.fillName('testEnvGroup')
    cy.get('span[data-testid="description-edit"]').should('be.visible')
    cy.get('span[data-testid="description-edit"]').click()
    cy.get('span[data-testid="tags-edit"]').should('be.visible')
    cy.get('span[data-testid="tags-edit"]').click()

    cy.fillField('description', 'Test Environment Group Description')
    cy.contains('textarea', 'Test Environment Group Description').should('be.visible')
    cy.get('input[data-mentions]').clear().type('envGroupTag').type('{enter}')
    cy.contains('span', 'envGroupTag').should('be.visible')

    cy.get('input[type="checkbox"]').eq(0).check({ force: true }).should('be.checked')

    // Switch to YAML and assert
    cy.get('[data-name="toggle-option-two"]').click()

    cy.contains('span', 'environmentGroup').should('be.visible')
    cy.contains('span', 'testEnvGroup').should('be.visible')
    cy.contains('span', 'Test Environment Group Description').should('be.visible')
    cy.contains('span', 'envGroupTag').should('be.visible')
    cy.contains('span', 'testEnv').should('be.visible')

    cy.intercept('POST', createEnvironmentGroupsCall, {
      fixture: 'ng/api/environmentGroups/createEnvironmentGroup.json'
    }).as('createEnvironmentGroup')

    cy.contains('span', 'Submit').click()
    cy.wait('@createEnvironmentGroup')
    cy.contains('span', 'Environment Group created successfully').should('be.visible')

    cy.location('hash').should(
      'eq',
      '#/account/accountId/cd/orgs/default/projects/project1/environment-group/testEnvGroup/details?sectionId=ENVIRONMENTS'
    )
  })

  it('should be able to view environment groups and interact with environment groups', () => {
    // interaction - open & close of row, view tags
    cy.intercept('POST', environmentGroupsCall, {
      fixture: 'ng/api/environmentGroups/environmentGroups.json'
    }).as('environmentGroupsCall')
    cy.visitPageAssertion()
    cy.wait('@environmentGroupsCall')
    // open & close row
    cy.contains('p', 'testEnvGroup').should('be.visible')
    cy.contains('p', 'Id: testEnvGroup').should('be.visible')
    cy.contains('span', '1 environment(s) included').should('be.visible')
    cy.contains('div', 'ago').should('be.visible').click()

    cy.contains('p', 'testEnv').should('be.visible')
    cy.contains('p', 'Id: testEnv').should('be.visible')
    cy.contains('p', 'Prod').should('be.visible')

    cy.contains('span', 'Show Less').click()

    // view tags
    cy.get('span[data-icon="main-tags"]').should('be.visible')
    cy.get('span[data-icon="main-tags"]').trigger('mouseover')
    cy.contains('p', 'TAGS').should('be.visible')
  })

  it('should be able to delete environment group', () => {
    cy.intercept('POST', environmentGroupsCall, {
      fixture: 'ng/api/environmentGroups/environmentGroups.json'
    }).as('environmentGroupsCall')
    cy.visitPageAssertion()
    cy.wait('@environmentGroupsCall')
    cy.get('svg[data-icon="more"]').should('be.visible').click()
    cy.contains('div', 'Delete').click()

    cy.get('.ConfirmationDialog--dialog button[type="button"]').last().click()

    cy.get('svg[data-icon="more"]').should('be.visible').click()
    cy.contains('div', 'Delete').click()

    cy.intercept('POST', environmentGroupsCall, {
      fixture: 'ng/api/environmentGroups/environmentGroups.empty.json'
    })
    cy.get('.ConfirmationDialog--dialog button[type="button"]').first().click()
    cy.contains('span', 'Successfully deleted Environment Group testEnvGroup').should('be.visible')

    cy.get('svg[data-icon="more"]').should('not.exist')
  })

  it('should be able to edit environment group', () => {
    cy.intercept('POST', environmentGroupsCall, {
      fixture: 'ng/api/environmentGroups/environmentGroups.json'
    }).as('environmentGroupsCall')
    cy.intercept('GET', environmentGroupDetailsCall, {
      fixture: 'ng/api/environmentGroups/environmentGroupDetails.json'
    }).as('environmentGroupDetailsCall')
    cy.intercept('GET', environmentGroupYamlSchemaCall, {
      fixture: 'ng/api/environmentGroups/environmentGroupYamlSchema.json'
    })
    cy.visitPageAssertion()
    cy.wait('@environmentGroupsCall').wait(1000)

    // edit
    cy.get('svg[data-icon="more"]').should('be.visible').click()
    cy.contains('div', 'Edit').click()

    cy.location('hash').should(
      'eq',
      '#/account/accountId/cd/orgs/default/projects/project1/environment-group/testEnvGroup/details?sectionId=CONFIGURATION'
    )

    cy.wait('@environmentGroupDetailsCall')

    cy.contains('span', 'testEnvGroup')
    cy.contains('span', 'Id: testEnvGroup')
    cy.contains('p', 'Test Environment Group Description')

    cy.contains('button', 'Save').should('be.disabled')
    cy.contains('button', 'Cancel').should('be.disabled')

    cy.fillName('testenvgroup')
    cy.get(`[name="description"]`).type(' updated')

    cy.contains('button', 'Save').should('not.be.disabled').click()

    cy.intercept('GET', environmentGroupDetailsCall, {
      fixture: 'ng/api/environmentGroups/editEnvironmentGroup.json'
    }).as('environmentGroupDetailsCall')

    cy.contains('span', 'Environment Group updated successfully')

    cy.contains('testenvgroup')
    cy.contains('p', 'Test Environment Group Description updated')
  })
})
