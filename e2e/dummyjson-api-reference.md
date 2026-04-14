# DummyJSON API Reference

**Base URL:** `https://dummyjson.com`  
**Auth:** Bearer token (JWT) via `Authorization` header or cookies  
**Content-Type:** `application/json` for all POST/PUT/PATCH requests

---

## Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max items to return. Use `0` for all. |
| `skip` | number | Items to skip (for pagination) |
| `select` | string | Comma-separated fields to return (e.g. `title,price`) |
| `sortBy` | string | Field name to sort by |
| `order` | string | `asc` or `desc` |

---

## Products API

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get a single product |
| GET | `/products/search?q=:query` | Search products |
| GET | `/products/categories` | Get all categories (with metadata) |
| GET | `/products/category-list` | Get category slugs only |
| GET | `/products/category/:slug` | Get products by category |
| POST | `/products/add` | Add a new product |
| PUT/PATCH | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete a product |

---

### GET /products

Returns paginated list of products (default: 30 per page, 194 total).

**Request**
```
GET https://dummyjson.com/products
GET https://dummyjson.com/products?limit=10&skip=10&select=title,price
GET https://dummyjson.com/products?sortBy=title&order=asc
```

**Response**
```json
{
  "products": [
    {
      "id": 1,
      "title": "Essence Mascara Lash Princess",
      "description": "The Essence Mascara Lash Princess is a popular mascara...",
      "category": "beauty",
      "price": 9.99,
      "discountPercentage": 7.17,
      "rating": 4.94,
      "stock": 5,
      "tags": ["beauty", "mascara"],
      "brand": "Essence",
      "sku": "RCH45Q1A",
      "weight": 2,
      "dimensions": {
        "width": 23.17,
        "height": 14.43,
        "depth": 28.01
      },
      "warrantyInformation": "1 month warranty",
      "shippingInformation": "Ships in 1 month",
      "availabilityStatus": "Low Stock",
      "returnPolicy": "30 days return policy",
      "minimumOrderQuantity": 24,
      "reviews": [
        {
          "rating": 2,
          "comment": "Very unhappy with my purchase!",
          "date": "2024-05-23T08:56:21.618Z",
          "reviewerName": "John Doe",
          "reviewerEmail": "john.doe@x.dummyjson.com"
        }
      ],
      "meta": {
        "createdAt": "2024-05-23T08:56:21.618Z",
        "updatedAt": "2024-05-23T08:56:21.618Z",
        "barcode": "9164035109868",
        "qrCode": "..."
      },
      "thumbnail": "...",
      "images": ["...", "...", "..."]
    }
  ],
  "total": 194,
  "skip": 0,
  "limit": 30
}
```

---

### GET /products/:id

Returns a single product by ID.

**Request**
```
GET https://dummyjson.com/products/1
```

**Response** — Same shape as a single item in the products array above.

---

### GET /products/search

Search products by keyword.

**Request**
```
GET https://dummyjson.com/products/search?q=phone
```

**Response**
```json
{
  "products": [ { "id": 101, "title": "Apple AirPods Max Silver", "category": "mobile-accessories" } ],
  "total": 23,
  "skip": 0,
  "limit": 23
}
```

---

### GET /products/categories

Returns all categories with slug, display name, and URL.

**Request**
```
GET https://dummyjson.com/products/categories
```

**Response**
```json
[
  { "slug": "beauty",     "name": "Beauty",     "url": "https://dummyjson.com/products/category/beauty" },
  { "slug": "fragrances", "name": "Fragrances", "url": "https://dummyjson.com/products/category/fragrances" },
  { "slug": "furniture",  "name": "Furniture",  "url": "https://dummyjson.com/products/category/furniture" }
]
```

---

### GET /products/category-list

Returns only the category slugs as a flat array.

**Request**
```
GET https://dummyjson.com/products/category-list
```

**Response**
```json
[
  "beauty", "fragrances", "furniture", "groceries", "home-decoration",
  "kitchen-accessories", "laptops", "mens-shirts", "mens-shoes", "mens-watches",
  "mobile-accessories", "motorcycle", "skin-care", "smartphones", "sports-accessories",
  "sunglasses", "tablets", "tops", "vehicle", "womens-bags", "womens-dresses",
  "womens-jewellery", "womens-shoes", "womens-watches"
]
```

---

### GET /products/category/:slug

Returns all products in a given category.

**Request**
```
GET https://dummyjson.com/products/category/smartphones
```

**Response**
```json
{
  "products": [ { "id": 122, "title": "iPhone 6", "category": "smartphones" } ],
  "total": 16,
  "skip": 0,
  "limit": 16
}
```

---

### POST /products/add

Creates a new product. Returns the created product with an assigned `id`.

**Request**
```
POST https://dummyjson.com/products/add
Content-Type: application/json

{
  "title": "BMW Pencil"
}
```

---

### PUT /products/:id · PATCH /products/:id

Updates a product. `PUT` replaces, `PATCH` merges. Returns the updated product.

**Request**
```
PUT https://dummyjson.com/products/1
Content-Type: application/json

{
  "title": "iPhone Galaxy +1"
}
```

---

### DELETE /products/:id

Deletes a product. Returns the deleted product with `isDeleted: true`.

**Request**
```
DELETE https://dummyjson.com/products/1
```

---

## Users API

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get a single user |
| GET | `/users/search?q=:query` | Search users |
| GET | `/users/filter?key=:key&value=:value` | Filter users by field |
| POST | `/users/add` | Add a new user |
| PUT/PATCH | `/users/:id` | Update a user |
| DELETE | `/users/:id` | Delete a user |

---

### GET /users

Returns paginated list of users (default: 30 per page, 208 total).

**Request**
```
GET https://dummyjson.com/users
GET https://dummyjson.com/users?limit=5&skip=10&select=firstName,age
GET https://dummyjson.com/users?sortBy=firstName&order=asc
```

**Response**
```json
{
  "users": [
    {
      "id": 1,
      "firstName": "Emily",
      "lastName": "Johnson",
      "maidenName": "Smith",
      "age": 28,
      "gender": "female",
      "email": "emily.johnson@x.dummyjson.com",
      "phone": "+81 965-431-3024",
      "username": "emilys",
      "password": "emilyspass",
      "birthDate": "1996-5-30",
      "image": "...",
      "bloodGroup": "O-",
      "height": 193.24,
      "weight": 63.16,
      "eyeColor": "Green",
      "hair": { "color": "Brown", "type": "Curly" },
      "ip": "42.48.100.32",
      "address": {
        "address": "626 Main Street",
        "city": "Phoenix",
        "state": "Mississippi",
        "stateCode": "MS",
        "postalCode": "29112",
        "coordinates": { "lat": -77.16213, "lng": -92.084824 },
        "country": "United States"
      },
      "macAddress": "47:fa:41:18:ec:eb",
      "university": "University of Wisconsin--Madison",
      "bank": {
        "cardExpire": "03/26",
        "cardNumber": "9289760655481815",
        "cardType": "Elo",
        "currency": "CNY",
        "iban": "YPUXISOBI7TTHPK2BR3HAIXL"
      },
      "company": {
        "department": "Engineering",
        "name": "Dooley, Kozey and Cronin",
        "title": "Sales Manager",
        "address": {
          "address": "263 Tenth Street",
          "city": "San Francisco",
          "state": "Wisconsin",
          "stateCode": "WI",
          "postalCode": "37657",
          "coordinates": { "lat": 71.814525, "lng": -161.150263 },
          "country": "United States"
        }
      },
      "ein": "977-175",
      "ssn": "900-590-289",
      "userAgent": "Mozilla/5.0 ...",
      "crypto": {
        "coin": "Bitcoin",
        "wallet": "0xb9fc2fe63b2a6c003f1c324c3bfa53259162181a",
        "network": "Ethereum (ERC20)"
      },
      "role": "admin"
    }
  ],
  "total": 208,
  "skip": 0,
  "limit": 30
}
```

> **Note:** `role` can be `"admin"`, `"moderator"`, or `"user"`.

---

### GET /users/:id

Returns a single user by ID. Same shape as a single item in the users array above.

**Request**
```
GET https://dummyjson.com/users/1
```

---

### GET /users/search

Search users by name or other string fields.

**Request**
```
GET https://dummyjson.com/users/search?q=John
```

**Response**
```json
{
  "users": [ { "id": 50, "firstName": "Emily", "lastName": "Johnson" } ],
  "total": 3,
  "skip": 0,
  "limit": 3
}
```

---

### GET /users/filter

Filter users by any field (supports dot notation for nested fields). Keys and values are **case-sensitive**.

**Request**
```
GET https://dummyjson.com/users/filter?key=hair.color&value=Brown
```

**Response**
```json
{
  "users": [
    { "id": 1, "firstName": "Emily", "lastName": "Johnson", "hair": { "color": "Brown", "type": "Curly" } }
  ],
  "total": 23,
  "skip": 0,
  "limit": 23
}
```

---

### POST /users/add

Creates a new user. Returns the created user with an assigned `id`.

**Request**
```
POST https://dummyjson.com/users/add
Content-Type: application/json

{
  "firstName": "Muhammad",
  "lastName": "Ovi",
  "age": 250
}
```

**Response**
```json
{
  "id": 209,
  "firstName": "Muhammad",
  "lastName": "Ovi",
  "age": 250
}
```

---

### PUT /users/:id · PATCH /users/:id

Updates a user. Returns the updated user.

**Request**
```
PUT https://dummyjson.com/users/2
Content-Type: application/json

{
  "lastName": "Owais"
}
```

**Response**
```json
{
  "id": "2",
  "firstName": "Michael",
  "lastName": "Owais",
  "gender": "male"
}
```

---

### DELETE /users/:id

Deletes a user. Returns the deleted user with `isDeleted: true` and a `deletedOn` timestamp.

**Request**
```
DELETE https://dummyjson.com/users/1
```

**Response**
```json
{
  "id": 1,
  "firstName": "Emily",
  "lastName": "Johnson",
  "isDeleted": true,
  "deletedOn": "2024-05-23T08:56:21.618Z"
}
```

---

## Auth API

### POST /user/login

Authenticates a user and returns JWT access + refresh tokens. Tokens are also set as cookies.

**Request**
```
POST https://dummyjson.com/user/login
Content-Type: application/json

{
  "username": "emilys",
  "password": "emilyspass",
  "expiresInMins": 30
}
```

> `expiresInMins` is optional. Defaults to `60`.

**Response**
```json
{
  "id": 1,
  "username": "emilys",
  "email": "emily.johnson@x.dummyjson.com",
  "firstName": "Emily",
  "lastName": "Johnson",
  "gender": "female",
  "image": "https://dummyjson.com/icon/emilys/128",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### GET /user/me

Returns the currently authenticated user. Pass the JWT from login via the `Authorization` header.

**Request**
```
GET https://dummyjson.com/user/me
Authorization: Bearer <accessToken>
```

**Response** — Full user object (same shape as `GET /users/:id`).

---

## Data Models

### Product

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | Unique identifier |
| `title` | string | Product name |
| `description` | string | Full description |
| `category` | string | Category slug |
| `price` | number | USD price |
| `discountPercentage` | number | % discount |
| `rating` | number | Avg rating (0–5) |
| `stock` | number | Units available |
| `tags` | string[] | Associated tags |
| `brand` | string | Brand name |
| `sku` | string | Stock-keeping unit |
| `weight` | number | In grams |
| `dimensions` | object | `width`, `height`, `depth` |
| `warrantyInformation` | string | Warranty description |
| `shippingInformation` | string | Shipping details |
| `availabilityStatus` | string | e.g. `"Low Stock"` |
| `returnPolicy` | string | Return policy description |
| `minimumOrderQuantity` | number | Min order qty |
| `reviews` | Review[] | Array of reviews |
| `meta` | object | `createdAt`, `updatedAt`, `barcode`, `qrCode` |
| `thumbnail` | string | URL |
| `images` | string[] | URLs |

### Review

| Field | Type |
|-------|------|
| `rating` | number (1–5) |
| `comment` | string |
| `date` | ISO 8601 string |
| `reviewerName` | string |
| `reviewerEmail` | string |

### User

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | Unique identifier |
| `firstName` | string | |
| `lastName` | string | |
| `maidenName` | string | |
| `age` | number | |
| `gender` | string | `"male"` or `"female"` |
| `email` | string | |
| `phone` | string | |
| `username` | string | Used for login |
| `password` | string | Plaintext (mock only) |
| `birthDate` | string | `YYYY-M-D` |
| `image` | string | Avatar URL |
| `bloodGroup` | string | |
| `height` | number | cm |
| `weight` | number | kg |
| `eyeColor` | string | |
| `hair` | object | `color`, `type` |
| `ip` | string | |
| `address` | object | Street, city, state, postal, coordinates, country |
| `macAddress` | string | |
| `university` | string | |
| `bank` | object | `cardExpire`, `cardNumber`, `cardType`, `currency`, `iban` |
| `company` | object | `department`, `name`, `title`, `address` |
| `ein` | string | |
| `ssn` | string | |
| `userAgent` | string | |
| `crypto` | object | `coin`, `wallet`, `network` |
| `role` | string | `"admin"`, `"moderator"`, or `"user"` |
