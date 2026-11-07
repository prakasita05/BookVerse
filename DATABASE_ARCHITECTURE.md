# 🗄️ BookVerse Database Architecture

## Overview

BookVerse now uses a **proper multi-user database architecture** that separates:
- **Global Book Catalog** — Shared book information
- **User-Specific Data** — Personal reading progress, reviews, shelves, quotes

This architecture supports **multiple independent users**, where each user's library and progress is completely separate from others.

---

## 📊 Database Models

### 1. User
Represents a registered BookVerse user.

```python
class User(db.Model):
    id = Integer (PK)
    name = String(100)
    email = String(120) UNIQUE
    password_hash = String(255)
    created_at = DateTime
    
    # Relationships
    user_books → UserBook[]
    reviews → Review[]
    shelves → Shelf[]
    quotes → Quote[]
```

**Key Features:**
- Email must be unique
- Password is hashed using Werkzeug
- Created timestamp for account creation date

---

### 2. Book (Global Catalog)
Represents books in the **shared global catalog**.

```python
class Book(db.Model):
    id = Integer (PK)
    title = String(255)
    author = String(255)
    cover = Text (URL)
    genre = String(100)
    pages = Integer
    description = Text
    isbn = String(20) UNIQUE
    publication_year = Integer
    created_at = DateTime
    
    # Relationships
    user_books → UserBook[]
    reviews → Review[]
    quotes → Quote[]
```

**Key Features:**
- Contains **ONLY** global book information
- **NO** user-specific data (progress, status, personal ratings)
- ISBN must be unique if provided
- Can calculate average rating from all reviews
- Can count total reviews

**Data Source:**
- Populated from `data/books.json` (cleaned, no user data)
- Can be extended via Open Library API (future)

---

### 3. UserBook (User's Personal Library)
Represents a book **in a specific user's library** with their personal progress.

```python
class UserBook(db.Model):
    id = Integer (PK)
    user_id = Integer (FK → User)
    book_id = Integer (FK → Book)
    
    # Reading status
    status = String(20)  # 'want-to-read', 'reading', 'completed', 'paused', 'dropped'
    
    # Progress tracking
    progress = Integer (0-100%)
    current_page = Integer
    
    # Personal rating
    rating = Integer (1-5, optional)
    
    # Favorite flag
    favorite = Boolean
    
    # Timestamps
    date_added = DateTime
    date_started = DateTime (nullable)
    date_finished = DateTime (nullable)
    
    # Constraint: UNIQUE(user_id, book_id)
```

**Key Features:**
- **Each user has independent library entries**
- User A and User B can both have the same book with different:
  - Status (User A: reading, User B: completed)
  - Progress (User A: 45%, User B: 100%)
  - Rating (User A: 5 stars, User B: 3 stars)
- Progress auto-calculates from current_page
- Completed books get date_finished timestamp

**Status Values:**
- `want-to-read` — On wishlist
- `reading` — Currently reading
- `completed` — Finished
- `paused` — Started but paused
- `dropped` — Decided not to finish

---

### 4. Review
User reviews for books.

```python
class Review(db.Model):
    id = Integer (PK)
    user_id = Integer (FK → User)
    book_id = Integer (FK → Book)
    rating = Integer (1-5)
    review_text = Text
    created_at = DateTime
    updated_at = DateTime
    
    # Relationships
    comments → ReviewComment[]
    likes → ReviewLike[]
    
    # Constraint: UNIQUE(user_id, book_id)
```

**Key Features:**
- One review per user per book
- Separate from UserBook rating (can have different values)
- Can be edited (updated_at changes)
- Has comments and likes

---

### 5. ReviewComment
Comments/replies on reviews.

```python
class ReviewComment(db.Model):
    id = Integer (PK)
    review_id = Integer (FK → Review)
    user_id = Integer (FK → User)
    comment_text = Text
    created_at = DateTime
```

**Key Features:**
- Multiple users can comment on one review
- Cannot be edited (create new comment instead)
- Chronological order by created_at

---

### 6. ReviewLike
Likes on reviews (many-to-many).

```python
class ReviewLike(db.Model):
    id = Integer (PK)
    review_id = Integer (FK → Review)
    user_id = Integer (FK → User)
    created_at = DateTime
    
    # Constraint: UNIQUE(review_id, user_id)
```

**Key Features:**
- User can only like a review once
- Can toggle (add/remove like)
- Review.get_like_count() to count total

---

### 7. Shelf (Custom Collections)
User-created book collections/shelves.

```python
class Shelf(db.Model):
    id = Integer (PK)
    user_id = Integer (FK → User)
    name = String(100)
    description = Text (nullable)
    created_at = DateTime
    
    # Relationships
    shelf_books → ShelfBook[]
```

**Key Features:**
- Each user creates their own shelves
- Examples: "Favorites", "Summer Reading", "To Gift"
- Can have custom descriptions

---

### 8. ShelfBook
Books assigned to shelves (many-to-many).

```python
class ShelfBook(db.Model):
    id = Integer (PK)
    shelf_id = Integer (FK → Shelf)
    book_id = Integer (FK → Book)
    added_at = DateTime
    
    # Constraint: UNIQUE(shelf_id, book_id)
```

**Key Features:**
- A book can be on multiple shelves
- Same book cannot be added to same shelf twice
- Tracks when book was added to shelf

---

### 9. Quote
User-saved quotes from books.

```python
class Quote(db.Model):
    id = Integer (PK)
    user_id = Integer (FK → User)
    book_id = Integer (FK → Book)
    quote_text = Text
    page_number = Integer (nullable)
    created_at = DateTime
```

**Key Features:**
- Users save meaningful quotes
- Optional page number reference
- Can have multiple quotes from same book

---

## 🔄 Data Relationships

### User → Books (via UserBook)
```
User (1) ←→ (Many) UserBook ←→ (Many) Book (1)
```
- A user can have many books in their library
- Each book can be in many users' libraries
- UserBook stores the user-specific data (progress, status)

### User → Reviews
```
User (1) ←→ (Many) Review ←→ (1) Book
```
- A user can write multiple reviews (one per book)
- A book can have multiple reviews (one per user)
- Constraint: ONE review per user-book pair

### Review → Comments
```
Review (1) ←→ (Many) ReviewComment
User (1) ←→ (Many) ReviewComment
```
- A review can have many comments
- A user can write many comments (on different reviews)

### Review → Likes
```
Review (1) ←→ (Many) ReviewLike ←→ (1) User
```
- Many-to-many through ReviewLike
- A review can be liked by many users
- A user can like many reviews
- Constraint: User can only like a review once

### User → Shelves → Books
```
User (1) ←→ (Many) Shelf (1) ←→ (Many) ShelfBook ←→ (Many) Book (1)
```
- A user creates multiple shelves
- Each shelf contains multiple books
- Same book can be on multiple shelves

---

## 📁 File Structure

```
BookVerse_Web/
├── models.py                  # SQLAlchemy models
├── app.py                     # Flask app with db config
├── init_db.py                 # Database initialization script
├── bookverse.db               # SQLite database (generated)
├── requirements.txt           # Python dependencies
└── data/
    └── books.json             # CLEAN global book catalog (NO user data)
```

---

## 🚀 Database Initialization

### First Time Setup

1. **Install Dependencies:**
```bash
.\venv\Scripts\pip.exe install -r requirements.txt
```

2. **Initialize Database:**
```bash
.\venv\Scripts\python.exe init_db.py --populate-books
```

This will:
- Create all database tables
- Populate the global book catalog from `books.json`
- Show database statistics

### Check Database Status

```bash
.\venv\Scripts\python.exe init_db.py
```

Shows current statistics:
- Books in Catalog: X
- Registered Users: X
- User Books: X
- Reviews: X
- Shelves: X
- Quotes: X

---

## 🔧 Database Operations

### Query Examples (Python Shell)

```python
from app import app
from models import db, User, Book, UserBook, Review

with app.app_context():
    # Get all books in catalog
    books = Book.query.all()
    
    # Get a specific user
    user = User.query.filter_by(email='reader@bookverse.com').first()
    
    # Get user's library
    user_books = UserBook.query.filter_by(user_id=user.id).all()
    
    # Get books user is currently reading
    reading = UserBook.query.filter_by(
        user_id=user.id, 
        status='reading'
    ).all()
    
    # Get book's average rating
    book = Book.query.get(1)
    avg_rating = book.get_average_rating()
    
    # Get all reviews for a book
    reviews = Review.query.filter_by(book_id=1).order_by(
        Review.created_at.desc()
    ).all()
```

---

## 🎯 User Data Lifecycle

### New User Experience

When a new user registers:
1. User record created in `users` table
2. **NO** UserBook records (empty library)
3. **NO** Reviews (hasn't reviewed anything)
4. **NO** Shelves (hasn't created collections)
5. **NO** Quotes (hasn't saved any)

**Dashboard shows beautiful empty states:**
- "Your reading journey awaits"
- "Discover Books" buttons
- No fake/placeholder data

### Adding a Book to Library

```python
# User finds a book in catalog
book = Book.query.get(book_id)

# User adds to their library
user_book = UserBook(
    user_id=current_user.id,
    book_id=book.id,
    status='want-to-read'
)
db.session.add(user_book)
db.session.commit()
```

### Starting to Read

```python
user_book = UserBook.query.filter_by(
    user_id=current_user.id,
    book_id=book_id
).first()

user_book.status = 'reading'
user_book.date_started = datetime.utcnow()
user_book.current_page = 0
db.session.commit()
```

### Updating Progress

```python
user_book.update_progress(current_page=150)
db.session.commit()

# Auto-marks completed when progress reaches 100%
```

### Writing a Review

```python
review = Review(
    user_id=current_user.id,
    book_id=book_id,
    rating=5,
    review_text="This book changed my life..."
)
db.session.add(review)
db.session.commit()
```

---

## 🔮 Migration from JSON

The old `books.json` structure mixed catalog and user data:

```json
{
  "title": "...",
  "author": "...",
  "progress": 67,        ❌ USER-SPECIFIC
  "status": "reading"    ❌ USER-SPECIFIC
}
```

**New architecture separates this:**

**Book (Global):**
```json
{
  "title": "...",
  "author": "...",
  "isbn": "...",
  "publication_year": 2020
}
```

**UserBook (User-Specific):**
```python
{
  "user_id": 1,
  "book_id": 1,
  "progress": 67,
  "status": "reading"
}
```

This allows:
- Multiple users to read the same book independently
- Proper statistics per user
- Scalable multi-user system

---

## ✅ What's Ready

- ✅ Database models defined
- ✅ Relationships configured
- ✅ SQLite database initialized
- ✅ Global book catalog populated (12 books)
- ✅ Clean data separation (no user data in catalog)
- ✅ Empty state handling in frontend
- ✅ Ready for authentication integration

---

## ⏳ Next Steps (Requires Backend Development)

1. **User Authentication**
   - Registration endpoint
   - Login/logout with sessions
   - Password hashing verification

2. **User Library Management**
   - Add book to library (POST `/api/library/add`)
   - Update reading status (PUT `/api/library/<id>`)
   - Update progress (PUT `/api/library/<id>/progress`)
   - Remove from library (DELETE `/api/library/<id>`)

3. **Review System Integration**
   - Submit review (POST `/api/reviews`)
   - Edit review (PUT `/api/reviews/<id>`)
   - Delete review (DELETE `/api/reviews/<id>`)
   - Like/unlike review (POST `/api/reviews/<id>/like`)
   - Add comment (POST `/api/reviews/<id>/comments`)

4. **Shelf Management**
   - Create shelf (POST `/api/shelves`)
   - Add book to shelf (POST `/api/shelves/<id>/books`)
   - Remove from shelf (DELETE `/api/shelves/<id>/books/<book_id>`)

5. **Quote Management**
   - Save quote (POST `/api/quotes`)
   - Delete quote (DELETE `/api/quotes/<id>`)

6. **Dashboard Statistics**
   - Calculate from UserBook records
   - Count by status (reading, completed, want-to-read)
   - Calculate reading streak
   - Total pages read

---

## 📝 Database Schema Diagram

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     ├─────────────────┐
     │                 │
     ▼                 ▼
┌──────────┐      ┌─────────┐
│ UserBook │◄─────┤  Book   │ (Global Catalog)
└──────────┘      └────┬────┘
                       │
                       ├──────────┐
                       │          │
                       ▼          ▼
                  ┌────────┐  ┌───────┐
                  │ Review │  │ Quote │
                  └───┬────┘  └───────┘
                      │
              ┌───────┴───────┐
              ▼               ▼
     ┌────────────────┐  ┌──────────┐
     │ ReviewComment  │  │ReviewLike│
     └────────────────┘  └──────────┘

┌───────┐      ┌───────────┐
│ Shelf │◄─────┤ ShelfBook │
└───────┘      └───────────┘
```

---

## 🎯 Key Design Principles

1. **Separation of Concerns**
   - Global catalog = shared data
   - UserBook = personal data
   - Clean, normalized structure

2. **Multi-User Support**
   - Each user has independent library
   - No cross-user data pollution
   - Scalable for thousands of users

3. **Data Integrity**
   - Foreign key constraints
   - Unique constraints (one review per user per book)
   - Cascading deletes (remove user → remove their data)

4. **Empty States**
   - New users start clean
   - No fake/demo data
   - Beautiful empty state UI

5. **Future-Ready**
   - Easy to add API endpoints
   - Ready for authentication
   - Structured for growth

---

**The BookVerse database is now properly architected for a real multi-user reading companion application! 📚✨**
