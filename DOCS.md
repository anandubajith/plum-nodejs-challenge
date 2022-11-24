# Plum - Organization API
Backend to handle organizations

## Version: 0.1.1

### /api/organizations

#### POST
##### Summary

Create organization

##### Description

To create a new organization

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successfully created the organization |
| 4XX | Default Response |

#### GET
##### Summary

Organization and basic employee details

##### Description

To show the list of organisations and basic employee details paginated

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| page | query | page ( default = 0 ) | No | integer |
| size | query | number of items to return ( default = 5) | No | integer |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | List of Organizations and their members |
| 4XX | Default Response |

### /api/organizations/{orgId}/members

#### GET
##### Summary

Get member details

##### Description

To show the list of members paginated

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| page | query | page ( default = 0 ) | No | integer |
| size | query | number of items to return ( default = 5) | No | integer |
| orgId | path |  | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | List of members of organization |
| 4XX | Default Response |

### /api/organizations/{orgId}/members/upload

#### POST
##### Summary

Bulk update members with CSV

##### Description

- To upload a CSV file containing employees of the organisation to perform bulk update/insert
- Invalid CSVs are rejected
- Invalid rows and errors are returned in response

### Example CSV

        Employee ID,First Name,Middle Name,Last Name,Email ID,Date of Birth,Gender
        1,Richard,,Hendricks,richard.h@gmail.com,01/09/1998,Male

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| orgId | path |  | Yes | string |
| file | body | | Yes | binary |

##### Responses

| Code | Description |
| ---- | ----------- |
| 201 | Success response |
| 4XX | Default Response |

### Models

#### def-0

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | integer |  | Yes |
| name | string |  | Yes |

#### def-1

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | integer |  | Yes |
| employee_id | integer |  | Yes |
| first_name | string |  | Yes |
| middle_name | string |  | Yes |
| last_name | string |  | Yes |
| email | string |  | No |
| date_of_birth | string |  | Yes |
| gender | string | _Enum:_ `"male"`, `"female"`, `"other"` | Yes |

#### def-2

Error response body

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| success | boolean |  | Yes |
| message | string |  | Yes |
