from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from models import db, User, Book, UserBook, Review, ReviewComment, ReviewLike, Shelf, ShelfBook, Quote, WishlistItem
import os
import json
from datetime import datetime

app = Flask(__name__)
app.secret_key = "bookverse_secret_key_dark_botanical_universe"

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'bookverse.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)
with app.app_context():
    db.create_all()

# ============================================================
# HELPER: CURRENT USER RESOLUTION
# ============================================================
def get_current_user():
    """Retrieve or initialize the active authenticated user"""
    user_id = session.get("user_id")
    if user_id:
        user = User.query.get(user_id)
        if user:
            return user

    email = session.get("user")
    if email:
        user = User.query.filter_by(email=email).first()
        if user:
            session["user_id"] = user.id
            return user

    # Default fallback for demo / guest session
    email = "reader@bookverse.com"
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(name="Reader", email=email)
        user.set_password("reader123")
        db.session.add(user)
        db.session.commit()
        ensure_user_default_shelves(user)

    session["user"] = user.email
    session["user_id"] = user.id
    session["user_name"] = user.name
    return user

def ensure_user_default_shelves(user):
    """Ensure standard initial shelves exist for a user"""
    existing = Shelf.query.filter_by(user_id=user.id).first()
    if not existing:
        defaults = [
            ("Favorites", "Cherished literary masterpieces"),
            ("Currently Reading", "Volumes open by candlelight"),
            ("To Read", "Treasures waiting on the parchment"),
            ("Completed", "Journeys brought to their close")
        ]
        for name, desc in defaults:
            s = Shelf(user_id=user.id, name=name, description=desc)
            db.session.add(s)
        db.session.commit()

# ============================================================
# WEB VIEW ROUTES (Strictly preserving routes & templates)
# ============================================================
@app.route("/")
def landing():
    return render_template("landing.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = (request.form.get("email") or "reader@bookverse.com").strip().lower()
        name = (request.form.get("name") or "").strip() or email.split("@")[0].capitalize()
        password = request.form.get("password") or "reader123"

        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(name=name, email=email)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            ensure_user_default_shelves(user)

        session["user"] = user.email
        session["user_id"] = user.id
        session["user_name"] = user.name
        return redirect(url_for("home"))

    if session.get("user"):
        return redirect(url_for("home"))

    return render_template("auth.html")

@app.route("/logout")
def logout():
    session.pop("user", None)
    session.pop("user_id", None)
    session.pop("user_name", None)
    return redirect(url_for("landing"))

@app.route("/home")
def home():
    return render_template("home.html")

@app.route("/library")
def library():
    return render_template("library.html")

@app.route("/add-book")
def add_book():
    return render_template("add_book.html")

@app.route("/book")
def book_detail():
    return render_template("book_detail.html")

@app.route("/wishlist")
def wishlist():
    return render_template("wishlist.html")

@app.route("/reading-music")
def reading_music():
    return render_template("reading_music.html")

@app.route("/shelf")
@app.route("/shelves")
@app.route("/my-shelf")
def my_shelf_view():
    """Direct route for user's completed books / shelf"""
    return redirect("/library?filter=completed")

# ============================================================
# REST API: USER PERSONAL LIBRARY
# ============================================================
@app.route("/api/user/books", methods=["GET"])
def get_user_books():
    """Returns the authenticated user's personal book records ONLY"""
    user = get_current_user()
    status_filter = request.args.get("status")
    
    query = UserBook.query.filter_by(user_id=user.id)
    if status_filter and status_filter != "all":
        query = query.filter_by(status=status_filter)
        
    user_books = query.order_by(UserBook.date_added.desc()).all()
    
    books_data = []
    for ub in user_books:
        b = ub.book
        if not b:
            continue
            
        # Get shelves this book is on for this user
        shelves = (
            db.session.query(Shelf.name)
            .join(ShelfBook, ShelfBook.shelf_id == Shelf.id)
            .filter(Shelf.user_id == user.id, ShelfBook.book_id == b.id)
            .all()
        )
        shelf_names = [s[0] for s in shelves]
        
        books_data.append({
            "id": b.id,
            "user_book_id": ub.id,
            "title": b.title,
            "author": b.author,
            "cover": b.cover or "",
            "genre": b.genre or "Fiction",
            "pages": b.pages or 0,
            "description": b.description or "",
            "isbn": b.isbn or "",
            "publication_year": b.publication_year,
            "publisher": getattr(b, "publisher", "") or "",
            "status": ub.status,
            "progress": ub.progress or 0,
            "current_page": ub.current_page or 0,
            "rating": ub.rating,
            "favorite": bool(ub.favorite),
            "date_added": ub.date_added.isoformat() if ub.date_added else None,
            "shelves": shelf_names
        })
        
    return jsonify({"books": books_data, "count": len(books_data)})

@app.route("/api/user/books/update", methods=["POST"])
def update_user_book():
    """Update user personal reading state (status, page, progress, rating, favorite)"""
    user = get_current_user()
    data = request.get_json() or request.form.to_dict()
    
    book_id = data.get("book_id")
    if not book_id:
        return jsonify({"success": False, "error": "Book ID required"}), 400
        
    user_book = UserBook.query.filter_by(user_id=user.id, book_id=book_id).first()
    if not user_book:
        user_book = UserBook(
            user_id=user.id,
            book_id=book_id,
            status=data.get("status", "want-to-read")
        )
        db.session.add(user_book)
        
    if "status" in data:
        new_status = data["status"]
        user_book.status = new_status
        if new_status == "reading":
            if not user_book.date_started:
                user_book.date_started = datetime.utcnow()
            user_book.date_finished = None
            # If moving to reading, remove from Completed shelf
            completed_shelf = Shelf.query.filter(
                Shelf.user_id == user.id,
                db.func.lower(Shelf.name).in_(["completed", "my shelf", "my completed shelf"])
            ).first()
            if completed_shelf:
                ShelfBook.query.filter_by(shelf_id=completed_shelf.id, book_id=user_book.book_id).delete()
        elif new_status == "completed":
            user_book.progress = 100
            if user_book.book and user_book.book.pages:
                user_book.current_page = user_book.book.pages
            if not user_book.date_finished:
                user_book.date_finished = datetime.utcnow()
            
            # Assign to user's Completed shelf (represents completed books on My Shelf)
            completed_shelf = Shelf.query.filter(
                Shelf.user_id == user.id,
                db.func.lower(Shelf.name).in_(["completed", "my shelf", "my completed shelf"])
            ).first()
            if not completed_shelf:
                completed_shelf = Shelf(user_id=user.id, name="Completed", description="Journeys brought to their close")
                db.session.add(completed_shelf)
                db.session.commit()

            # Prevent duplicate shelf entry
            existing_sb = ShelfBook.query.filter_by(shelf_id=completed_shelf.id, book_id=user_book.book_id).first()
            if not existing_sb:
                sb = ShelfBook(shelf_id=completed_shelf.id, book_id=user_book.book_id)
                db.session.add(sb)

            # Remove from 'Currently Reading' and 'To Read' shelves
            for s in Shelf.query.filter(
                Shelf.user_id == user.id,
                db.func.lower(Shelf.name).in_(["currently reading", "to read"])
            ).all():
                ShelfBook.query.filter_by(shelf_id=s.id, book_id=user_book.book_id).delete()
        elif new_status in ("want-to-read", "paused", "dropped"):
            completed_shelf = Shelf.query.filter(
                Shelf.user_id == user.id,
                db.func.lower(Shelf.name).in_(["completed", "my shelf", "my completed shelf"])
            ).first()
            if completed_shelf:
                ShelfBook.query.filter_by(shelf_id=completed_shelf.id, book_id=user_book.book_id).delete()
                
    if "progress" in data:
        try:
            user_book.progress = max(0, min(100, int(data["progress"])))
        except (ValueError, TypeError):
            pass
            
    if "current_page" in data:
        try:
            cp = max(0, int(data["current_page"]))
            user_book.current_page = cp
            if user_book.book and user_book.book.pages and user_book.book.pages > 0:
                user_book.progress = max(0, min(100, int((cp / user_book.book.pages) * 100)))
                if user_book.progress >= 100:
                    user_book.status = "completed"
        except (ValueError, TypeError):
            pass
            
    if "rating" in data:
        try:
            user_book.rating = int(data["rating"])
        except (ValueError, TypeError):
            pass
            
    if "favorite" in data:
        user_book.favorite = bool(data["favorite"])
        
    db.session.commit()
    return jsonify({
        "success": True,
        "status": user_book.status,
        "progress": user_book.progress,
        "current_page": user_book.current_page,
        "favorite": user_book.favorite
    })

# ============================================================
# REST API: BOOK CATALOG & DETAILS
# ============================================================
@app.route("/api/books/<int:book_id>", methods=["GET"])
def get_book_details(book_id):
    """Retrieve global book metadata and user's personal reading relation"""
    book = Book.query.get_or_404(book_id)
    user = get_current_user()
    
    user_book = UserBook.query.filter_by(user_id=user.id, book_id=book.id).first()
    is_in_wishlist = (
        WishlistItem.query.filter_by(user_id=user.id, book_id=book.id).first() is not None or
        (user_book is not None and user_book.status == "want-to-read")
    )
    
    shelves = (
        db.session.query(Shelf.name, Shelf.id)
        .join(ShelfBook, ShelfBook.shelf_id == Shelf.id)
        .filter(Shelf.user_id == user.id, ShelfBook.book_id == book.id)
        .all()
    )
    
    reviews_data = []
    for r in book.reviews.order_by(Review.created_at.desc()).limit(15).all():
        reviews_data.append({
            "id": r.id,
            "user_name": r.user.name if r.user else "Anonymous",
            "rating": r.rating,
            "review_text": r.review_text,
            "created_at": r.created_at.strftime("%b %d, %Y"),
            "likes": r.get_like_count()
        })
        
    book_dict = {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "cover": book.cover or "",
        "genre": book.genre or "Fiction",
        "pages": book.pages or 0,
        "description": book.description or "No description recorded in archives.",
        "isbn": book.isbn or "",
        "publication_year": book.publication_year,
        "publisher": getattr(book, "publisher", "") or "",
        "average_rating": round(book.get_average_rating(), 1),
        "review_count": book.get_review_count()
    }

    return jsonify({
        **book_dict,
        "book": book_dict,
        "in_library": user_book is not None,
        "in_wishlist": is_in_wishlist,
        "user_status": user_book.status if user_book else None,
        "user_progress": user_book.progress if user_book else 0,
        "user_current_page": user_book.current_page if user_book else 0,
        "user_rating": user_book.rating if user_book else None,
        "user_favorite": bool(user_book.favorite) if user_book else False,
        "user_shelves": [s[0] for s in shelves],
        "rating_avg": round(book.get_average_rating(), 1),
        "rating_count": book.get_review_count(),
        "reviews": reviews_data
    })

# ============================================================
# REST API: ADD BOOK (CATALOG & USER LIBRARY)
# ============================================================
@app.route("/api/books/add", methods=["POST"])
def api_add_book():
    """Save global book metadata and assign explicitly to current user's library & shelf"""
    user = get_current_user()
    data = request.get_json() or request.form.to_dict()
    
    title = (data.get("title") or "").strip()
    author = (data.get("author") or "").strip()
    if not title or not author:
        return jsonify({"success": False, "error": "Title and author are required"}), 400
        
    isbn = (data.get("isbn") or "").strip() or None
    cover = (data.get("cover") or "").strip() or None
    genre = (data.get("genre") or "").strip() or "Fiction"
    description = (data.get("description") or "").strip() or ""
    publisher = (data.get("publisher") or "").strip() or None
    
    try:
        pages = int(data.get("pages")) if data.get("pages") else None
    except (ValueError, TypeError):
        pages = None
        
    try:
        pub_year = int(data.get("publication_year")) if data.get("publication_year") else None
    except (ValueError, TypeError):
        pub_year = None

    # 1. Check or add in global Book catalog (shared metadata)
    book = None
    if isbn:
        book = Book.query.filter_by(isbn=isbn).first()
    if not book:
        book = Book.query.filter(
            db.func.lower(Book.title) == title.lower(),
            db.func.lower(Book.author) == author.lower()
        ).first()
        
    if not book:
        book = Book(
            title=title,
            author=author,
            cover=cover,
            genre=genre,
            pages=pages,
            description=description,
            isbn=isbn,
            publication_year=pub_year,
            publisher=publisher
        )
        db.session.add(book)
        db.session.commit()
    else:
        # Augment missing fields if newly provided
        if not book.cover and cover:
            book.cover = cover
        if not book.pages and pages:
            book.pages = pages
        if not book.description and description:
            book.description = description
        if not book.isbn and isbn:
            book.isbn = isbn
        if hasattr(book, "publisher") and not book.publisher and publisher:
            book.publisher = publisher
        db.session.commit()

    # 2. Add to user's personal UserBook record
    status = (data.get("status") or "want-to-read").strip()
    user_book = UserBook.query.filter_by(user_id=user.id, book_id=book.id).first()
    if not user_book:
        user_book = UserBook(
            user_id=user.id,
            book_id=book.id,
            status=status,
            progress=0,
            current_page=0
        )
        if status == "reading":
            user_book.date_started = datetime.utcnow()
        elif status == "completed":
            user_book.progress = 100
            user_book.date_finished = datetime.utcnow()
        db.session.add(user_book)
    else:
        user_book.status = status
    db.session.commit()

    # 3. Add to requested shelf
    shelf_id = data.get("shelf_id")
    shelf_name = data.get("shelf_name")
    
    if shelf_name and not shelf_id:
        shelf = Shelf.query.filter_by(user_id=user.id, name=shelf_name.strip()).first()
        if not shelf:
            shelf = Shelf(user_id=user.id, name=shelf_name.strip())
            db.session.add(shelf)
            db.session.commit()
        shelf_id = shelf.id

    if shelf_id:
        try:
            s_id = int(shelf_id)
            existing_sb = ShelfBook.query.filter_by(shelf_id=s_id, book_id=book.id).first()
            if not existing_sb:
                sb = ShelfBook(shelf_id=s_id, book_id=book.id)
                db.session.add(sb)
                db.session.commit()
        except (ValueError, TypeError):
            pass

    return jsonify({
        "success": True,
        "book_id": book.id,
        "title": book.title,
        "message": f"'{book.title}' has been added to your personal library."
    })

# ============================================================
# REST API: SHELVES & SHELF ASSIGNMENT
# ============================================================
@app.route("/api/user/shelves", methods=["GET", "POST"])
def user_shelves():
    """Retrieve user's custom shelves or create a new shelf"""
    user = get_current_user()
    ensure_user_default_shelves(user)
    
    if request.method == "POST":
        data = request.get_json() or request.form.to_dict()
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"success": False, "error": "Shelf name is required"}), 400
            
        shelf = Shelf.query.filter_by(user_id=user.id, name=name).first()
        if not shelf:
            shelf = Shelf(user_id=user.id, name=name, description=data.get("description", ""))
            db.session.add(shelf)
            db.session.commit()
        return jsonify({
            "success": True,
            "id": shelf.id,
            "name": shelf.name,
            "book_count": shelf.get_book_count()
        })
        
    shelves = Shelf.query.filter_by(user_id=user.id).order_by(Shelf.name.asc()).all()
    return jsonify({
        "shelves": [{
            "id": s.id,
            "name": s.name,
            "description": s.description or "",
            "book_count": s.get_book_count()
        } for s in shelves]
    })

@app.route("/api/user/shelves/add-book", methods=["POST"])
def add_book_to_shelf():
    """Add a book to a user shelf and ensure it exists in their personal library"""
    user = get_current_user()
    data = request.get_json() or request.form.to_dict()
    
    book_id = data.get("book_id")
    shelf_id = data.get("shelf_id")
    shelf_name = data.get("shelf_name")
    
    if not book_id:
        return jsonify({"success": False, "error": "Book ID required"}), 400
        
    book = Book.query.get_or_404(book_id)
    
    if shelf_name and not shelf_id:
        shelf = Shelf.query.filter_by(user_id=user.id, name=shelf_name.strip()).first()
        if not shelf:
            shelf = Shelf(user_id=user.id, name=shelf_name.strip())
            db.session.add(shelf)
            db.session.commit()
        shelf_id = shelf.id
        
    shelf = Shelf.query.filter_by(id=shelf_id, user_id=user.id).first()
    if not shelf:
        return jsonify({"success": False, "error": "Shelf not found"}), 404
        
    existing_sb = ShelfBook.query.filter_by(shelf_id=shelf.id, book_id=book.id).first()
    if not existing_sb:
        sb = ShelfBook(shelf_id=shelf.id, book_id=book.id)
        db.session.add(sb)
        
    user_book = UserBook.query.filter_by(user_id=user.id, book_id=book.id).first()
    if not user_book:
        st = "want-to-read"
        if shelf.name.lower() == "currently reading":
            st = "reading"
        elif shelf.name.lower() == "completed":
            st = "completed"
        user_book = UserBook(user_id=user.id, book_id=book.id, status=st)
        db.session.add(user_book)
    else:
        if shelf.name.lower() == "currently reading" and user_book.status != "reading":
            user_book.status = "reading"
        elif shelf.name.lower() == "completed" and user_book.status != "completed":
            user_book.status = "completed"
            
    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"'{book.title}' added to shelf '{shelf.name}'.",
        "shelf_name": shelf.name,
        "shelf_id": shelf.id
    })

# ============================================================
# REST API: WISHLIST (PERSONAL USER WISHLIST)
# ============================================================
@app.route("/api/wishlist", methods=["GET"])
def api_get_wishlist():
    """Retrieve the authenticated user's wishlist books only"""
    user = get_current_user()
    
    items = WishlistItem.query.filter_by(user_id=user.id).order_by(WishlistItem.added_at.desc()).all()
    
    # Sync any existing want-to-read UserBook records for this user
    existing_bids = set(item.book_id for item in items)
    ub_want = UserBook.query.filter_by(user_id=user.id, status='want-to-read').all()
    synced = False
    for ub in ub_want:
        if ub.book_id not in existing_bids:
            wi = WishlistItem(user_id=user.id, book_id=ub.book_id, added_at=ub.date_added or datetime.utcnow())
            db.session.add(wi)
            items.append(wi)
            existing_bids.add(ub.book_id)
            synced = True
    if synced:
        db.session.commit()
        
    books_data = []
    for item in items:
        b = item.book
        if not b:
            continue
        books_data.append({
            "id": b.id,
            "wishlist_id": item.id,
            "title": b.title,
            "author": b.author,
            "cover": b.cover or "",
            "genre": b.genre or "Fiction",
            "pages": b.pages or 0,
            "description": b.description or "A treasured work awaiting your personal discovery.",
            "publication_year": b.publication_year,
            "publisher": getattr(b, "publisher", "") or "",
            "isbn": b.isbn or "",
            "rating_avg": round(b.get_average_rating(), 1) if b.get_average_rating() else 4.5,
            "review_count": b.get_review_count(),
            "added_at": item.added_at.strftime("%b %d, %Y") if item.added_at else ""
        })
        
    return jsonify({
        "success": True,
        "books": books_data,
        "count": len(books_data)
    })

@app.route("/api/wishlist/toggle", methods=["POST"])
def api_toggle_wishlist():
    """Toggle a book in/out of the user's personal wishlist with duplicate prevention"""
    user = get_current_user()
    data = request.get_json() or request.form.to_dict()
    book_id = data.get("book_id")
    
    # If book_id not provided but book metadata is provided (e.g. from Discover Books)
    if not book_id and (data.get("title") and data.get("author")):
        title = data.get("title").strip()
        author = data.get("author").strip()
        book = Book.query.filter(
            db.func.lower(Book.title) == title.lower(),
            db.func.lower(Book.author) == author.lower()
        ).first()
        if not book:
            book = Book(
                title=title,
                author=author,
                cover=data.get("cover") or None,
                genre=data.get("genre") or "Fiction",
                pages=int(data.get("pages")) if data.get("pages") else None,
                publication_year=int(data.get("publication_year")) if data.get("publication_year") else None,
                description=data.get("description") or "",
                publisher=data.get("publisher") or None,
                isbn=data.get("isbn") or None
            )
            db.session.add(book)
            db.session.commit()
        book_id = book.id

    if not book_id:
        return jsonify({"success": False, "error": "Book ID or metadata is required"}), 400

    book = Book.query.get_or_404(book_id)
    existing = WishlistItem.query.filter_by(user_id=user.id, book_id=book.id).first()
    
    if existing:
        db.session.delete(existing)
        # Also sync UserBook: if status is 'want-to-read', remove or reset
        user_book = UserBook.query.filter_by(user_id=user.id, book_id=book.id, status='want-to-read').first()
        if user_book:
            db.session.delete(user_book)
        db.session.commit()
        return jsonify({
            "success": True,
            "in_wishlist": False,
            "book_id": book.id,
            "title": book.title,
            "message": f"'{book.title}' has been removed from your wishlist."
        })
    else:
        item = WishlistItem(user_id=user.id, book_id=book.id)
        db.session.add(item)
        user_book = UserBook.query.filter_by(user_id=user.id, book_id=book.id).first()
        if not user_book:
            user_book = UserBook(user_id=user.id, book_id=book.id, status='want-to-read')
            db.session.add(user_book)
        elif user_book.status not in ('reading', 'completed'):
            user_book.status = 'want-to-read'
        db.session.commit()
        return jsonify({
            "success": True,
            "in_wishlist": True,
            "book_id": book.id,
            "title": book.title,
            "message": f"'{book.title}' has been saved to your wishlist."
        })

@app.route("/api/wishlist/remove", methods=["POST"])
def api_remove_wishlist():
    """Remove a book from the user's wishlist"""
    user = get_current_user()
    data = request.get_json() or request.form.to_dict()
    book_id = data.get("book_id")
    if not book_id:
        return jsonify({"success": False, "error": "Book ID required"}), 400
        
    item = WishlistItem.query.filter_by(user_id=user.id, book_id=book_id).first()
    if item:
        db.session.delete(item)
    user_book = UserBook.query.filter_by(user_id=user.id, book_id=book_id, status='want-to-read').first()
    if user_book:
        db.session.delete(user_book)
    db.session.commit()
    return jsonify({"success": True, "in_wishlist": False, "book_id": book_id})

@app.route("/api/wishlist/add", methods=["POST"])
def api_add_wishlist():
    """Add a book to the user's wishlist (idempotent, prevents duplicates)"""
    user = get_current_user()
    data = request.get_json() or request.form.to_dict()
    book_id = data.get("book_id")
    if not book_id:
        return jsonify({"success": False, "error": "Book ID required"}), 400
    book = Book.query.get_or_404(book_id)
    
    item = WishlistItem.query.filter_by(user_id=user.id, book_id=book.id).first()
    if not item:
        item = WishlistItem(user_id=user.id, book_id=book.id)
        db.session.add(item)
    user_book = UserBook.query.filter_by(user_id=user.id, book_id=book.id).first()
    if not user_book:
        user_book = UserBook(user_id=user.id, book_id=book.id, status='want-to-read')
        db.session.add(user_book)
    db.session.commit()
    return jsonify({"success": True, "in_wishlist": True, "book_id": book.id, "title": book.title})

@app.route("/api/wishlist/check", methods=["GET"])
def api_check_wishlist():
    user = get_current_user()
    book_id = request.args.get("book_id")
    if not book_id:
        return jsonify({"in_wishlist": False})
    exists = WishlistItem.query.filter_by(user_id=user.id, book_id=book_id).first() is not None
    return jsonify({"in_wishlist": exists})

# ============================================================
# REST API: READING MUSIC (SPOTIFY SOUNDSCAPES)
# ============================================================
SPOTIFY_READING_MOODS = [
    {
        "id": "enchanted-fantasy",
        "title": "Enchanted Fantasy",
        "genres": ["fantasy", "magic", "myth", "folklore", "fairy tale", "epic fantasy"],
        "description": "Ethereal Celtic harps, tavern lutes, and mystical orchestral melodies inspired by ancient realms and mythical lore.",
        "spotify_url": "https://open.spotify.com/search/enchanted%20fantasy%20reading",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DWZwtERXCS82H",
        "icon": "sparkles"
    },
    {
        "id": "dark-academia",
        "title": "Dark Academia",
        "genres": ["classics", "historical fiction", "historical", "philosophy", "drama", "gothic", "literature"],
        "description": "Brooding baroque strings, melancholic cello solos, and vintage classical nocturnes for dusty library corners.",
        "spotify_url": "https://open.spotify.com/search/dark%20academia%20classical",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DX1BzILQoxw08",
        "icon": "scroll"
    },
    {
        "id": "deep-focus",
        "title": "Deep Focus",
        "genres": ["non-fiction", "self-help", "psychology", "business", "science", "biography", "memoir", "education"],
        "description": "Minimalist ambient soundscapes, gentle piano pulses, and binaural textures designed for sustained reading flow.",
        "spotify_url": "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ",
        "icon": "brain"
    },
    {
        "id": "romantic-reading",
        "title": "Romantic Reading",
        "genres": ["romance", "love", "passion", "contemporary romance"],
        "description": "Tender acoustic guitar, romantic piano sonatas, and soft orchestral warmth for stories of the heart.",
        "spotify_url": "https://open.spotify.com/search/romantic%20reading%20piano",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DX504r987GzEv",
        "icon": "heart"
    },
    {
        "id": "mystery-suspense",
        "title": "Mystery & Suspense",
        "genres": ["mystery", "thriller", "crime", "suspense", "detective", "noir", "psychological thriller"],
        "description": "Tense cinematic strings, dark ambient drones, and suspenseful motifs for detective investigations and thrillers.",
        "spotify_url": "https://open.spotify.com/search/mystery%20suspense%20soundtrack",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS",
        "icon": "compass"
    },
    {
        "id": "sci-fi-reading",
        "title": "Sci-Fi Reading",
        "genres": ["science fiction", "sci-fi", "dystopian", "space", "cyberpunk", "time travel"],
        "description": "Cosmic synthesizer drones, futuristic ambient pads, and otherworldly frequencies for voyages across galaxies.",
        "spotify_url": "https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS",
        "icon": "orbit"
    },
    {
        "id": "cozy-reading",
        "title": "Cozy Reading",
        "genres": ["cozy", "fiction", "poetry", "humor", "general", "short stories"],
        "description": "Warm lo-fi beats, gentle fireplace crackle, and acoustic coffeehouse instrumentals for quiet rainy afternoons.",
        "spotify_url": "https://open.spotify.com/search/cozy%20reading%20instrumental",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DWZwtERXCS82H",
        "icon": "coffee"
    },
    {
        "id": "nature-rain",
        "title": "Nature & Rain",
        "genres": ["nature", "environment", "travel", "adventure", "rain", "wilderness"],
        "description": "Gentle rain falling on leaded glass windows, distant thunder, and woodland breezes intertwined with ambient pads.",
        "spotify_url": "https://open.spotify.com/playlist/37i9dQZF1DX8ymr6UES72F",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DX8ymr6UES72F",
        "icon": "cloud-rain"
    }
]

def resolve_reading_mood(genre_string):
    """Map any genuine book genre to one of the 8 canonical reading moods"""
    if not genre_string:
        return SPOTIFY_READING_MOODS[2]  # Deep Focus default
    g = genre_string.lower().strip()
    
    # 1. Fantasy
    if any(k in g for k in ["fantasy", "magic", "myth", "folklore", "fairy"]):
        return SPOTIFY_READING_MOODS[0]
    # 2. Romance
    if any(k in g for k in ["romance", "love", "passion"]):
        return SPOTIFY_READING_MOODS[3]
    # 3. Mystery & Suspense
    if any(k in g for k in ["mystery", "thriller", "crime", "suspense", "detective", "noir"]):
        return SPOTIFY_READING_MOODS[4]
    # 4. Sci-Fi
    if any(k in g for k in ["science fiction", "sci-fi", "dystopian", "space", "cyberpunk"]):
        return SPOTIFY_READING_MOODS[5]
    # 5. Dark Academia
    if any(k in g for k in ["classics", "historical", "history", "philosophy", "drama", "gothic", "literature"]):
        return SPOTIFY_READING_MOODS[1]
    # 6. Deep Focus
    if any(k in g for k in ["non-fiction", "self-help", "psychology", "business", "science", "biography", "memoir", "education"]):
        return SPOTIFY_READING_MOODS[2]
    # 7. Nature & Rain
    if any(k in g for k in ["nature", "environment", "travel", "adventure", "rain", "wilderness"]):
        return SPOTIFY_READING_MOODS[7]
    # 8. Cozy Reading (fallback for general fiction/poetry)
    return SPOTIFY_READING_MOODS[6]

@app.route("/api/reading-music/recommend", methods=["GET"])
def api_reading_music_recommend():
    """Recommend reading mood based on actual book genre or book ID"""
    book_id = request.args.get("book_id")
    genre = request.args.get("genre")
    
    book_info = None
    if book_id:
        try:
            b = Book.query.get(int(book_id))
            if b:
                book_info = {
                    "id": b.id,
                    "title": b.title,
                    "author": b.author,
                    "genre": b.genre or "Fiction",
                    "cover": b.cover or ""
                }
                if not genre:
                    genre = b.genre
        except (ValueError, TypeError):
            pass
            
    recommended = resolve_reading_mood(genre)
    
    return jsonify({
        "success": True,
        "query_genre": genre or "",
        "book": book_info,
        "recommended_mood": recommended,
        "all_moods": SPOTIFY_READING_MOODS
    })

# ============================================================
# REST API: DISCOVER BOOKS SEARCH (WITH MULTI-LAYER FALLBACK)
# Open Library -> Google Books -> Local Catalog Books
# ============================================================
DISCOVER_CACHE = {}

@app.route("/api/discover/search", methods=["GET"])
def api_discover_search():
    """
    Search books from external archives with graceful multi-tier fallback:
    1. Open Library API
    2. Google Books API
    3. Curated local catalog
    Cached in-memory to ensure ultra-fast, reliable response.
    """
    import urllib.request
    import urllib.parse
    import time

    query = (request.args.get("q") or "fiction classics").strip()
    try:
        limit = min(24, max(4, int(request.args.get("limit", 16))))
    except (ValueError, TypeError):
        limit = 16

    cache_key = f"{query.lower()}_{limit}"
    now = time.time()
    if cache_key in DISCOVER_CACHE:
        cached_time, cached_data = DISCOVER_CACHE[cache_key]
        if now - cached_time < 3600:  # 1 hour cache
            return jsonify(cached_data)

    books_list = []
    source = "openlibrary"

    # Layer 1: Open Library API
    try:
        params = urllib.parse.urlencode({
            "q": query,
            "limit": limit,
            "fields": "key,title,author_name,cover_i,subject,ratings_average,ratings_count,first_publish_year,number_of_pages_median,isbn,publisher"
        })
        url = f"https://openlibrary.org/search.json?{params}"
        req = urllib.request.Request(url, headers={"User-Agent": "BookVerse/1.0 (contact@bookverse.local)"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                ol_data = json.loads(resp.read().decode())
                docs = ol_data.get("docs", [])
                for d in docs:
                    if not d.get("title"):
                        continue
                    cover_id = d.get("cover_i")
                    cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else ""
                    author = d.get("author_name")[0] if d.get("author_name") else "Unknown Author"
                    subjects = d.get("subject", [])[:4]
                    genre = subjects[0] if subjects else "General"
                    books_list.append({
                        "key": d.get("key") or "",
                        "title": d.get("title"),
                        "author": author,
                        "cover": cover_url,
                        "genre": genre,
                        "subjects": subjects,
                        "pages": d.get("number_of_pages_median") or None,
                        "year": d.get("first_publish_year") or None,
                        "publisher": d.get("publisher")[0] if d.get("publisher") else None,
                        "isbn": d.get("isbn")[0] if d.get("isbn") else None,
                        "rating_avg": round(float(d.get("ratings_average")), 1) if d.get("ratings_average") else None,
                        "rating_count": d.get("ratings_count") or None,
                        "description": f"An archival work in {genre}. Published originally in {d.get('first_publish_year')}." if d.get('first_publish_year') else f"Preserved work in {genre}."
                    })
    except Exception as e:
        print("[Discover API] Open Library lookup note:", e)

    # Layer 2: Google Books API (if Open Library had 0 books or failed)
    if not books_list:
        try:
            source = "googlebooks"
            gb_url = f"https://www.googleapis.com/books/v1/volumes?q={urllib.parse.quote(query)}&maxResults={limit}"
            req = urllib.request.Request(gb_url, headers={"User-Agent": "BookVerse/1.0"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.status == 200:
                    gb_data = json.loads(resp.read().decode())
                    items = gb_data.get("items", [])
                    for item in items:
                        vol = item.get("volumeInfo", {})
                        if not vol.get("title"):
                            continue
                        imgs = vol.get("imageLinks", {})
                        cover_url = imgs.get("thumbnail") or imgs.get("smallThumbnail") or ""
                        if cover_url.startswith("http://"):
                            cover_url = cover_url.replace("http://", "https://")
                        authors = vol.get("authors", ["Unknown Author"])
                        categories = vol.get("categories", ["General"])
                        books_list.append({
                            "key": f"/works/{item.get('id')}",
                            "title": vol.get("title"),
                            "author": authors[0],
                            "cover": cover_url,
                            "genre": categories[0],
                            "subjects": categories[:3],
                            "pages": vol.get("pageCount"),
                            "year": vol.get("publishedDate")[:4] if vol.get("publishedDate") else None,
                            "publisher": vol.get("publisher"),
                            "isbn": vol.get("industryIdentifiers", [{}])[0].get("identifier"),
                            "rating_avg": vol.get("averageRating"),
                            "rating_count": vol.get("ratingsCount"),
                            "description": vol.get("description", "")[:280] if vol.get("description") else f"A volume in {categories[0]}."
                        })
        except Exception as e:
            print("[Discover API] Google Books lookup note:", e)

    # Layer 3: Curated Local Catalog (Guaranteed fallback so shelves never sit empty)
    if not books_list:
        source = "catalog"
        q_lower = query.lower()
        all_books = Book.query.all()
        # Prioritize matching query/genre
        matching = []
        for b in all_books:
            if any(term in (b.title or "").lower() or term in (b.author or "").lower() or term in (b.genre or "").lower() for term in q_lower.split()):
                matching.append(b)
        # If fewer than limit, fill with remaining catalog books
        for b in all_books:
            if b not in matching and len(matching) < limit:
                matching.append(b)
        if not matching:
            matching = all_books[:limit]

        for b in matching[:limit]:
            books_list.append({
                "key": f"/works/local_{b.id}",
                "title": b.title,
                "author": b.author,
                "cover": b.cover or "",
                "genre": b.genre or "Fiction",
                "subjects": [b.genre or "Fiction", "Classic Literature"],
                "pages": b.pages or 300,
                "year": b.publication_year or 1950,
                "publisher": getattr(b, "publisher", "") or "BookVerse Archives",
                "isbn": b.isbn or "",
                "rating_avg": round(b.get_average_rating(), 1) if b.get_average_rating() else 4.5,
                "rating_count": b.get_review_count() or 120,
                "description": b.description or f"An acclaimed classic volume in {b.genre}."
            })

    response_payload = {
        "success": True,
        "source": source,
        "query": query,
        "count": len(books_list),
        "books": books_list
    }

    # Cache successful result
    if books_list:
        DISCOVER_CACHE[cache_key] = (now, response_payload)

    return jsonify(response_payload)

if __name__ == "__main__":
    app.run(debug=True)