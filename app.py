from flask import Flask, render_template, request, redirect, url_for, session
from models import db, User, Book, UserBook, Review, ReviewComment, ReviewLike, Shelf, ShelfBook, Quote
import os

app = Flask(__name__)
app.secret_key = "bookverse_secret_key_dark_botanical_universe"

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'bookverse.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

@app.route("/")
def landing():
    return render_template("landing.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    # If user has an active authenticated session, clicking 'Enter the Library' sends them straight to /home
    if session.get("user"):
        return redirect(url_for("home"))

    if request.method == "POST":
        email = request.form.get("email") or "reader@bookverse.com"
        session["user"] = email
        return redirect(url_for("home"))

    return render_template("auth.html")

@app.route("/logout")
def logout():
    session.pop("user", None)
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
    # Book ID will be passed as query parameter: /book?id=1
    return render_template("book_detail.html")

if __name__ == "__main__":
    app.run(debug=True)