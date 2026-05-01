import { describe, expect, it } from "vitest";
import { OpenApiParseError, parseOpenApi } from "./openapiParser";

describe("parseOpenApi", () => {
  it("parses OpenAPI 3 GET with path param as {{param}}", () => {
    const raw = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/users/{id}": {
          get: {
            summary: "Get user",
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
          },
        },
      },
    });
    const { collectionName, requests } = parseOpenApi(raw);
    expect(collectionName).toBe("Test API");
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("GET");
    expect(requests[0].url).toBe("https://api.example.com/users/{{id}}");
    expect(requests[0].name).toBe("Get user");
  });

  it("maps POST with JSON example body", () => {
    const raw = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "B", version: "1" },
      paths: {
        "/items": {
          post: {
            operationId: "createItem",
            requestBody: {
              content: {
                "application/json": {
                  example: { name: "a" },
                },
              },
            },
          },
        },
      },
    });
    const { requests } = parseOpenApi(raw);
    expect(requests[0].method).toBe("POST");
    expect(requests[0].body.type).toBe("json");
    expect(requests[0].body.content).toContain("name");
    expect(requests[0].name).toBe("createItem");
  });

  it("throws OpenApiParseError on invalid spec", () => {
    expect(() => parseOpenApi("{}")).toThrow(OpenApiParseError);
  });
});
