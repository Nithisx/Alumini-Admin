# User Suggestions API Contract

## 1. API Overview
These APIs provide type-ahead (autocomplete) and intelligent suggestions for frontend forms during:
- Signup
- Profile Editing

The suggestions are generated from existing database values and business rules (username availability, academic year validation, and email typo correction).

User identity suggestions are also included to reduce signup/profile friction:
- Username availability + alternatives
- Email domain typo correction suggestions

Location suggestions follow hierarchy-based filtering:
- Country -> State -> City -> Pincode/Zipcode

If a user-entered location value does not exist in suggestions, the frontend must still allow manual entry and form submission. New values are saved during the final signup/profile update flow.

## 2. Base URL
`/api/v1/suggestions`

Note:
- Deployed aliases also exist at `/api/suggestions/*`.
- API paths in this contract use `/api/v1/suggestions/*`.

## 3. Endpoints

### 3.1 Signup Suggestions
- **Path**: `/api/v1/suggestions/signup`
- **Method**: `GET`
- **Description**: Returns signup-time suggestions for `username`, `email (gmail/domain correction)`, `country code`, and location autocomplete (`country`, `state`, `city`, `pincode`).

### 3.2 Profile Editing Suggestions
- **Path**: `/api/v1/suggestions/profile`
- **Method**: `GET`
- **Description**: Returns profile-edit suggestions including academic and location autocomplete suggestions.

## 4. Request Parameters

### 4.1 Signup Suggestions Request Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `firstName` or `first_name` | string | No | Used to generate username suggestions. |
| `lastName` or `last_name` | string | No | Used to generate username suggestions. |
| `email` | string | No | Used for email-domain typo correction suggestions. |
| `country` | string | No | Filters location suggestions and country code suggestion. |
| `state` | string | No | Filters city and pincode suggestions within the selected country/state. |
| `city` | string | No | Filters pincode suggestions within the selected city. |
| `pincode` | string | No | Type-ahead filter for pincode/zipcode suggestions. |
| `limit` | integer | No | Max number of suggestions per list (`1-50`, default `10`). |
| `offset` | integer | No | Pagination offset (default `0`). |

### 4.1.1 User Suggestion Fields Returned (Signup)

| Field | Type | Description |
|---|---|---|
| `usernameSuggestions` | `string[]` | Available username candidates derived from first/last name and uniqueness checks. |
| `emailSuggestions` | `string[]` | Corrected email domain suggestions for common domain typos (for example `gamil.com -> gmail.com`). |

### 4.2 Profile Suggestions Request Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `username` | string | No | If taken, returns available alternatives. |
| `role` | string | No | Filters faculty suggestions. |
| `faculty` | string | No | Filters course suggestions. |
| `country` | string | No | Type-ahead + hierarchy filter for location suggestions. |
| `state` | string | No | Type-ahead + hierarchy filter for location suggestions. |
| `city` | string | No | Type-ahead + hierarchy filter for location suggestions. |
| `zipcode` | string | No | Type-ahead filter for zipcode/pincode suggestions. |
| `courseStartYear` or `course_start_year` | string | No | Filters academic year combinations. |
| `courseEndYear` or `course_end_year` | string | No | Filters academic year combinations. |
| `passedOutYear` or `passed_out_year` | string | No | Filters academic year combinations. |
| `limit` | integer | No | Max number of suggestions per list (`1-50`, default `10`). |
| `offset` | integer | No | Pagination offset (default `0`). |

### 4.2.1 User Suggestion Fields Returned (Profile)

| Field | Type | Description |
|---|---|---|
| `usernameSuggestions` | `string[]` | Suggested alternatives when requested username is already taken. |

## 5. Response Format

### 5.1 Standard Success Response
```json
{
  "success": true,
  "message": "Signup suggestions generated successfully.",
  "data": {
    "usernameSuggestions": ["john.doe", "johndoe1"],
    "emailSuggestions": ["john@gmail.com"],
    "countryCodeSuggestions": [
      {
        "country": "India",
        "countryCode": "+91",
        "iso2": "IN"
      }
    ],
    "locationSuggestions": {
      "countries": ["India"],
      "states": ["Tamil Nadu"],
      "cities": ["Coimbatore"],
      "zipcodes": ["641001"],
      "pincodes": ["641001"]
    }
  },
  "meta": {
    "limit": 10,
    "offset": 0
  }
}
```

### 5.2 Profile Location-Only Example Response Shape
```json
{
  "success": true,
  "data": {
    "locationSuggestions": {
      "countries": [],
      "states": [],
      "cities": [],
      "zipcodes": [],
      "pincodes": []
    }
  }
}
```

## 6. Example API Calls

### 6.1 Signup Location Suggestions
```http
GET /api/v1/suggestions/signup?country=India
```

```http
GET /api/v1/suggestions/signup?country=India&state=Tamil%20Nadu
```

```http
GET /api/v1/suggestions/signup?country=India&state=Tamil%20Nadu&city=Coimbatore
```

### 6.2 Signup Full Smart Suggestions
```http
GET /api/v1/suggestions/signup?firstName=John&lastName=Doe&email=john@gamil.com&country=India&state=Tamil%20Nadu&city=Coimbatore
```

### 6.2.1 Signup User Suggestion Focused Calls
```http
GET /api/v1/suggestions/signup?firstName=John&lastName=Doe
```

```http
GET /api/v1/suggestions/signup?email=john@gamil.com
```

### 6.3 Profile Suggestions
```http
GET /api/v1/suggestions/profile?country=India&state=Karnataka&city=Bangalore
```

```http
GET /api/v1/suggestions/profile?username=johndoe&role=Alumni&faculty=Engineering
```

### 6.3.1 Profile Username Suggestion Focused Call
```http
GET /api/v1/suggestions/profile?username=john.doe
```

## 7. Location Hierarchy Rules

The backend applies hierarchical filtering based on provided query params:
1. If only `country` is provided, return states/cities/zipcodes observed under matching country rows.
2. If `country` + `state` are provided, narrow city/zipcode suggestions to matching state rows.
3. If `country` + `state` + `city` are provided, narrow zipcode suggestions to matching city rows.
4. If user types `pincode`/`zipcode`, suggestions are filtered with type-ahead (`contains`) matching.

## 8. Existing vs New Values

Frontend behavior contract:
1. Show autocomplete suggestions from API for country/state/city/pincode.
2. If no matching suggestion exists, allow user to keep custom input.
3. Submit custom values in final signup/profile API payload.
4. Backend stores new values as part of normal form submission.

For user suggestions (username/email):
5. `usernameSuggestions` are generated as available options only (uniqueness-checked against DB).
6. Frontend should display these as recommendations, but user may still type a different username.
7. Email suggestions are advisory corrections; user can accept or ignore them.

## 9. Error Responses

### 9.1 400 Bad Request
Triggered when query params fail validation (for example `limit > 50`).

```json
{
  "success": false,
  "message": "Invalid request parameters.",
  "errors": {
    "limit": ["Ensure this value is less than or equal to 50."]
  }
}
```

### 9.2 401 Unauthorized
If endpoint permissions are changed to authenticated-only in future deployments, unauthenticated requests may return:

```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 9.3 500 Internal Server Error
Unexpected server-side error:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## 10. Integration Notes for Frontend

1. Use debounce (`200-400ms`) for type-ahead requests.
2. Use `limit` and `offset` for large datasets.
3. Prefer sending hierarchy params progressively (`country`, then `state`, then `city`).
4. Read from `data.locationSuggestions.pincodes` for signup pincode UI.
5. For compatibility across screens, `zipcodes` and `pincodes` are both returned.
