# Database Schema Documentation

## Tables Overview

### 1. subscriptions
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles |
| status | text | Subscription status |
| start_date | timestamp | Subscription start date |
| end_date | timestamp | Subscription end date |
| plan_name | text | Name of the subscription plan |
| creem_subscription_id | text | External subscription ID |
| plan_id | text | Plan identifier |
| credits | int2 | Credits included in plan |
| created_at | timestamptz | Record creation time |
| updated_at | timestamptz | Record update time |

### 2. credits
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_uuid | uuid | Foreign key to profiles |
| trans_type | text | Transaction type |
| trans_no | text | Transaction number |
| order_no | text | Order number |
| credits | int4 | Credit amount |
| expired_at | timestamptz | Credit expiration time |
| created_at | timestamptz | Record creation time |
| current_credits | int4 | Current available credits |
| event_type | text | Event type that triggered credit change |

### 3. profiles
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key (linked to auth.users.id) |
| email | text | User email |
| name | text | User name |
| image | text | User profile image |
| customer_id | text | External customer ID |
| product_id | text | Product ID |
| has_access | bool | Access permission flag |
| created_at | timestamptz | Record creation time |
| updated_at | timestamptz | Record update time |
| plan_id | text | Current plan ID |
| current_credits | int4 | Current available credits |

### 4. orders
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles |
| order_id | text | External order ID |
| product_id | text | Product ID |
| product_name | text | Product name |
| plan_type | text | Plan type |
| amount | numeric | Order amount |
| currency | text | Currency code |
| status | text | Order status |
| checkout_id | text | Checkout session ID |
| subscription_id | text | Related subscription ID |
| credits_granted | int4 | Credits granted by this order |
| payment_method | text | Payment method used |
| payment_date | timestamp | Payment completion date |
| created_at | timestamp | Record creation time |
| updated_at | timestamp | Record update time |

## Relationships

- `profiles.id` → `auth.users.id` (One-to-one)
- `subscriptions.user_id` → `profiles.id` (Many-to-one)
- `credits.user_uuid` → `profiles.id` (Many-to-one)
- `orders.user_id` → `profiles.id` (Many-to-one) 