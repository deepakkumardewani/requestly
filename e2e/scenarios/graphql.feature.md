# Feature: GraphQL Requests

As a user
I want to send GraphQL queries from a dedicated tab
So that I can explore GraphQL APIs alongside HTTP requests

---

## Scenario: Send a query

Given the app is loaded
And I open a GraphQL tab from the create-new menu
When I enter a query and endpoint URL
And I click Send
Then the response panel shows a successful HTTP status
And the response body contains JSON from the GraphQL server

---

## Scenario: Use variables

Given I have a GraphQL tab with a query that declares variables
When I enter JSON variables in the Variables editor
And I send the request
Then the server response reflects the supplied variable values

---

## Scenario: Set custom headers

Given I have a GraphQL tab open
When I add headers in the Headers tab
And I send the request
Then those headers are included in the outbound request to the endpoint
