# Feature: Environments

As a user
I want to manage environments with variables
So that I can easily switch between different API configurations (dev, staging, prod)

---

## Background

Given the app is loaded
And the environment selector is visible in the sidebar

---

## Scenario: Create a new environment

When I open the Environment Manager dialog
And I click "New Environment"
And I enter a name for the environment
And I confirm
Then the new environment appears in the environment list

---

## Scenario: Add a variable to an environment

Given an environment is open in the Environment Manager
When I click "Add Variable"
And I enter a key and a value
Then the variable is saved in the environment

---

## Scenario: Edit an environment variable

Given an environment has an existing variable
When I click on the variable's value cell
And I change the value
Then the updated value is saved

---

## Scenario: Delete an environment variable

Given an environment has an existing variable
When I click the delete icon on the variable row
Then the variable is removed from the environment

---

## Scenario: Mark a variable as secret

Given an environment has a variable
When I toggle the "secret" option on the variable
Then the variable value is masked in the UI

---

## Scenario: Switch the active environment

Given two or more environments exist
When I click the environment selector dropdown
And I select a different environment
Then the selected environment becomes active
And its variables are used when sending requests

---

## Scenario: Use an environment variable in a URL

Given an active environment has a variable "baseUrl" = "https://api.example.com"
When I type "{{baseUrl}}/users" in the URL bar
Then the variable is highlighted/resolved in the URL input
When I send the request
Then the request is sent to "https://api.example.com/users"

---

## Scenario: Use an environment variable in a header

Given an active environment has a variable "token" = "abc123"
When I add a header "Authorization" with value "Bearer {{token}}"
When I send the request
Then the request is sent with "Authorization: Bearer abc123"

---

## Scenario: Rename an environment

Given an environment named "Development" exists
When I open the Environment Manager
And I rename it to "Dev"
Then the environment appears as "Dev" in the selector

---

## Scenario: Delete an environment

Given an environment exists in the list
When I click the delete icon next to it
And I confirm deletion
Then the environment is removed from the list
And if it was the active environment, no environment is selected
