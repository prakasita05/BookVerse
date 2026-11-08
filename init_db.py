"""
BookVerse Database Initialization Script

This script:
1. Creates all database tables
2. Optionally populates the global book catalog from books.json
3. Does NOT create fake user data

Usage:
    python init_db.py
    python init_db.py --populate-books
"""

import json
import os
import sys
from app import app
from models import db, Book

def init_database():
    """Create all database tables"""
    with app.app_context():
        print("[INIT] Creating database tables...")
        db.create_all()
        print("[OK] Database tables created successfully!")
        print(f"[INFO] Database location: {app.config['SQLALCHEMY_DATABASE_URI']}")

def populate_books():
    """Populate global book catalog from books.json"""
    with app.app_context():
        # Check if books already exist
        existing_count = Book.query.count()
        if existing_count > 0:
            print(f"[CATALOG] Book catalog already contains {existing_count} books.")
            response = input("Do you want to re-populate? This will skip existing books. (y/n): ")
            if response.lower() != 'y':
                print("Skipping book population.")
                return
        
        # Load books from JSON
        books_file = os.path.join(os.path.dirname(__file__), 'data', 'books.json')
        
        if not os.path.exists(books_file):
            print(f"[ERROR] {books_file} not found!")
            return
        
        with open(books_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        books_data = data.get('books', [])
        added_count = 0
        skipped_count = 0
        
        print(f"[LOAD] Loading {len(books_data)} books from catalog...")
        
        for book_data in books_data:
            # Check if book already exists (by ISBN or title+author)
            existing_book = None
            
            if book_data.get('isbn'):
                existing_book = Book.query.filter_by(isbn=book_data['isbn']).first()
            
            if not existing_book:
                existing_book = Book.query.filter_by(
                    title=book_data['title'],
                    author=book_data['author']
                ).first()
            
            if existing_book:
                skipped_count += 1
                continue
            
            # Create new book
            book = Book(
                title=book_data['title'],
                author=book_data['author'],
                cover=book_data.get('cover'),
                genre=book_data.get('genre'),
                pages=book_data.get('pages'),
                description=book_data.get('description'),
                isbn=book_data.get('isbn'),
                publication_year=book_data.get('publication_year')
            )
            
            db.session.add(book)
            added_count += 1
        
        db.session.commit()
        
        print(f"[OK] Book catalog populated!")
        print(f"   Added: {added_count} books")
        print(f"   Skipped: {skipped_count} books (already exist)")
        print(f"   Total: {Book.query.count()} books in catalog")

def show_stats():
    """Display database statistics"""
    with app.app_context():
        from models import User, UserBook, Review, Shelf, Quote
        
        print("\n--- BookVerse Database Statistics ---")
        print("=" * 50)
        print(f"  Books in Catalog: {Book.query.count()}")
        print(f"  Registered Users: {User.query.count()}")
        print(f"  User Books: {UserBook.query.count()}")
        print(f"  Reviews: {Review.query.count()}")
        print(f"  Shelves: {Shelf.query.count()}")
        print(f"  Quotes: {Quote.query.count()}")
        print("=" * 50)

def main():
    """Main execution"""
    args = sys.argv[1:]
    
    print("\n" + "=" * 50)
    print("BookVerse Database Initialization")
    print("=" * 50 + "\n")
    
    # Always initialize database
    init_database()
    
    # Populate books if requested
    if '--populate-books' in args or '-p' in args:
        print()
        populate_books()
    else:
        print("\n[TIP] Run with --populate-books to load book catalog")
    
    # Show statistics
    print()
    show_stats()
    
    print("\n[SUCCESS] Initialization complete!")
    print("You can now run: python app.py")
    print()

if __name__ == '__main__':
    main()
