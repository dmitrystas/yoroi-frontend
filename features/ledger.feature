Feature: Ledger device

  Background:
    Given I have opened the extension
    And I have completed the basic setup

  @it-119
  Scenario: Send transaction from Ledger (IT-119)
    When I restore a Ledger device
    Then I go to the send transaction screen
    And I fill the form:
      | address                                                     | amount   |
      | Ae2tdPwUPEZ3HUU7bmfexrUzoZpAZxuyt4b4bn7fus7RHfXoXRightdgMCv | 0.100000 |
    And I click on the next button in the wallet send form
    Then I see send money confirmation dialog
    Then I submit the wallet send form