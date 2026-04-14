# Feature: HTTP Requests

As a user
I want to create and send HTTP requests
So that I can test and explore APIs

---

## Background

Given the app is loaded
And a new request tab is open

---

## Scenario: Send a GET request

When I enter a valid URL in the URL bar
And the method is set to GET
And I click the Send button
Then the response panel shows the response status
And the response body is displayed

---

## Scenario: Send a POST request with JSON body

When I select POST as the HTTP method
And I enter a valid URL
And I set the body type to JSON
And I enter valid JSON in the body editor
And I click Send
Then the response panel shows the response

---

## Scenario: Send a request with query parameters

When I enter a URL in the URL bar
And I add a key-value pair in the Params tab
Then the URL in the URL bar updates to include the query parameter
When I click Send
Then the request is sent with the query parameters appended

---

## Scenario: Send a request with custom headers

When I enter a URL in the URL bar
And I open the Headers tab
And I add a custom header key-value pair
And I click Send
Then the request is sent with the custom header included

---

## Scenario: Cancel an in-flight request

When I send a request that takes a while to respond
And I click the Cancel button while the request is loading
Then the request is aborted
And a cancellation message is shown

---

## Scenario: Change HTTP method

When I click the method dropdown in the URL bar
And I select a different HTTP method (e.g. PUT, DELETE, PATCH)
Then the method badge on the tab updates to the selected method

---

## Scenario: Disable a query parameter

Given I have one or more query parameters added
When I uncheck the toggle next to a parameter row
Then that parameter is excluded from the request URL
When I send the request
Then the disabled parameter is not sent

---

## Scenario: Disable a request header

Given I have one or more custom headers added
When I uncheck the toggle next to a header row
Then the header is excluded from the request
When I send the request
Then the disabled header is not included

---

## Scenario: Import a request from a cURL command

When I paste a cURL command into the URL bar
Then the URL, method, headers, and body are automatically populated from the cURL

---

## Scenario: Export a request as cURL

Given I have a request configured with URL, headers, and body
When I open the cURL tab in the request editor
Then a generated cURL command is shown
And I can copy it to clipboard

---

## Scenario: Send a request with path parameters

Given I enter a URL with a path parameter (e.g. /users/:id)
When I open the Params tab
Then the path parameter is listed separately under "Path Params"
When I set a value for the path parameter
Then the URL updates to include the substituted value
