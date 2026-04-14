# Feature: Request Body

As a user
I want to configure different body types for my requests
So that I can test APIs that accept various content formats

---

## Background

Given the app is loaded
And a new request tab is open
And I navigate to the "Body" tab in the request editor

---

## Scenario: Send a request with no body

When I select "None" as the body type
And I send the request
Then no body is included in the request
And no Content-Type header is added automatically

---

## Scenario: Send a request with a JSON body

When I select "JSON" as the body type
And I enter valid JSON in the body editor
And I send the request
Then the request is sent with the JSON body
And the Content-Type header is set to "application/json"

---

## Scenario: Send a request with an XML body

When I select "XML" as the body type
And I enter valid XML content in the body editor
And I send the request
Then the request is sent with the XML body
And the Content-Type header is set to "application/xml"

---

## Scenario: Send a request with plain text body

When I select "Text" as the body type
And I enter some plain text in the body editor
And I send the request
Then the request is sent with the text body
And the Content-Type is set to "text/plain"

---

## Scenario: Send a request with form-data body

When I select "Form Data" as the body type
And I add one or more key-value pairs
And I send the request
Then the request is sent as multipart/form-data

---

## Scenario: Send a request with URL-encoded body

When I select "URL Encoded" as the body type
And I add one or more key-value pairs
And I send the request
Then the request is sent as application/x-www-form-urlencoded

---

## Scenario: Disable a form-data field

Given I have multiple form-data fields defined
When I uncheck the toggle on one field
Then that field is excluded from the request body when sent
