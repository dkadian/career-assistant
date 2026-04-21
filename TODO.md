# Task Progress: Fix ImportError for Session from app.models

## Plan Breakdown & Steps
1. [x] Edit app/models/__init__.py: Add exports `from .models import Session, UserProfile`
2. [x] Edit career.py: 
   - Remove faulty import `from app.models import Session, UserProfile`
   - Rewrite 3 ORM queries (`db.query(Session)` and `db.query(UserProfile)`) to raw SQL using `db.execute(SELECT ...)`
3. [x] Test endpoints and mark complete

**Completed Steps:**

