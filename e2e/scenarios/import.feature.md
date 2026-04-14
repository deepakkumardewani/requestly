# Feature: Import

As a user
I want to import requests from external formats
So that I can migrate existing work into Requestly

---

## Background

Given the app is loaded

---

## Scenario: Import a Postman collection

Given I open the Import dialog (from sidebar or /import page)
When I upload a valid Postman Collection v2.1 JSON file
Then the collections and requests from the file are imported into the sidebar
And folder nesting from the Postman collection is preserved

---

## Scenario: Import an Insomnia export

Given I open the Import dialog
When I upload a valid Insomnia v4 export file
Then the collections and requests are imported into the sidebar

---

## Scenario: Import from a cURL command

Given I open the Import dialog or paste a cURL in the URL bar
When I enter a valid cURL command
Then a new tab is created
And the URL, method, headers, and body are populated from the cURL command

---

## Scenario: Import dialog shows an error for invalid file

Given I open the Import dialog
When I upload a file with invalid or unrecognised content
Then an error message is shown indicating the file could not be parsed
And no data is imported
