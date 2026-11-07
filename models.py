"""
BookVerse Database Models
SQLAlchemy models for multi-user book tracking system
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# ============================================================
# USER MODEL
# ============================================================
class User(db.Model):
    """User account model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user_books = db.relationship('UserBook', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    shelves = db.relationship('Shelf', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    quotes = db.relationship('Quote', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set user password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.email}>'


# ============================================================
# BOOK MODEL (Global Catalog)
# ============================================================
class Book(db.Model):
    """Global book catalog model"""
    __tablename__ = 'books'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False, index=True)
    author = db.Column(db.String(255), nullable=False, index=True)
    cover = db.Column(db.Text)  # URL to cover image
    genre = db.Column(db.String(100), index=True)
    pages = db.Column(db.Integer)
    description = db.Column(db.Text)
    isbn = db.Column(db.String(20), unique=True, index=True)
    publication_year = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user_books = db.relationship('UserBook', backref='book', lazy='dynamic', cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='book', lazy='dynamic', cascade='all, delete-orphan')
    quotes = db.relationship('Quote', backref='book', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Book {self.title} by {self.author}>'
    
    def get_average_rating(self):
        """Calculate average rating from all user reviews"""
        reviews = self.reviews.all()
        if not reviews:
            return 0.0
        return sum(r.rating for r in reviews) / len(reviews)
    
    def get_review_count(self):
        """Get total number of reviews for this book"""
        return self.reviews.count()


# ============================================================
# USER BOOK MODEL (User's Personal Library)
# ============================================================
class UserBook(db.Model):
    """User's personal book tracking"""
    __tablename__ = 'user_books'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False, index=True)
    
    # Reading status: 'want-to-read', 'reading', 'completed', 'paused', 'dropped'
    status = db.Column(db.String(20), default='want-to-read', nullable=False, index=True)
    
    # Progress tracking
    progress = db.Column(db.Integer, default=0)  # Percentage (0-100)
    current_page = db.Column(db.Integer, default=0)
    
    # Personal rating (1-5 stars)
    rating = db.Column(db.Integer)  # User's personal rating, separate from review rating
    
    # Favorite flag
    favorite = db.Column(db.Boolean, default=False, index=True)
    
    # Timestamps
    date_added = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    date_started = db.Column(db.DateTime)
    date_finished = db.Column(db.DateTime)
    
    # Composite unique constraint: user can only have one record per book
    __table_args__ = (
        db.UniqueConstraint('user_id', 'book_id', name='unique_user_book'),
    )
    
    def __repr__(self):
        return f'<UserBook user_id={self.user_id} book_id={self.book_id} status={self.status}>'
    
    def update_progress(self, current_page):
        """Update reading progress based on current page"""
        if self.book and self.book.pages and self.book.pages > 0:
            self.current_page = current_page
            self.progress = int((current_page / self.book.pages) * 100)
            if self.progress >= 100:
                self.progress = 100
                if not self.date_finished:
                    self.date_finished = datetime.utcnow()
                if self.status != 'completed':
                    self.status = 'completed'


# ============================================================
# REVIEW MODEL
# ============================================================
class Review(db.Model):
    """User book reviews"""
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False, index=True)
    
    # Review content
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    review_text = db.Column(db.Text, nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    comments = db.relationship('ReviewComment', backref='review', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('ReviewLike', backref='review', lazy='dynamic', cascade='all, delete-orphan')
    
    # Composite unique constraint: user can only have one review per book
    __table_args__ = (
        db.UniqueConstraint('user_id', 'book_id', name='unique_user_review'),
    )
    
    def __repr__(self):
        return f'<Review user_id={self.user_id} book_id={self.book_id} rating={self.rating}>'
    
    def get_like_count(self):
        """Get number of likes for this review"""
        return self.likes.count()
    
    def is_liked_by(self, user_id):
        """Check if review is liked by a specific user"""
        return self.likes.filter_by(user_id=user_id).first() is not None


# ============================================================
# REVIEW COMMENT MODEL
# ============================================================
class ReviewComment(db.Model):
    """Comments/replies on reviews"""
    __tablename__ = 'review_comments'
    
    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('reviews.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    comment_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationship
    user = db.relationship('User', backref='review_comments')
    
    def __repr__(self):
        return f'<ReviewComment review_id={self.review_id} user_id={self.user_id}>'


# ============================================================
# REVIEW LIKE MODEL
# ============================================================
class ReviewLike(db.Model):
    """Likes on reviews"""
    __tablename__ = 'review_likes'
    
    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('reviews.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    user = db.relationship('User', backref='review_likes')
    
    # Composite unique constraint: user can only like a review once
    __table_args__ = (
        db.UniqueConstraint('review_id', 'user_id', name='unique_review_like'),
    )
    
    def __repr__(self):
        return f'<ReviewLike review_id={self.review_id} user_id={self.user_id}>'


# ============================================================
# SHELF MODEL (Custom Collections)
# ============================================================
class Shelf(db.Model):
    """User's custom book shelves/collections"""
    __tablename__ = 'shelves'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    shelf_books = db.relationship('ShelfBook', backref='shelf', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Shelf {self.name} user_id={self.user_id}>'
    
    def get_book_count(self):
        """Get number of books in this shelf"""
        return self.shelf_books.count()


# ============================================================
# SHELF BOOK MODEL (Books in Shelves)
# ============================================================
class ShelfBook(db.Model):
    """Books assigned to shelves"""
    __tablename__ = 'shelf_books'
    
    id = db.Column(db.Integer, primary_key=True)
    shelf_id = db.Column(db.Integer, db.ForeignKey('shelves.id'), nullable=False, index=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False, index=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    book = db.relationship('Book', backref='shelf_books')
    
    # Composite unique constraint: book can only be in a shelf once
    __table_args__ = (
        db.UniqueConstraint('shelf_id', 'book_id', name='unique_shelf_book'),
    )
    
    def __repr__(self):
        return f'<ShelfBook shelf_id={self.shelf_id} book_id={self.book_id}>'


# ============================================================
# QUOTE MODEL (Saved Quotes from Books)
# ============================================================
class Quote(db.Model):
    """User's saved quotes from books"""
    __tablename__ = 'quotes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False, index=True)
    quote_text = db.Column(db.Text, nullable=False)
    page_number = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def __repr__(self):
        return f'<Quote user_id={self.user_id} book_id={self.book_id}>'
