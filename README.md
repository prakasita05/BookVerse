<div align="center">

# 🌿 BookVerse
### *A Universe Between Covers*

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-3.1.1-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)

<p align="center">
  <b>A cinematic, cozy digital sanctuary for bibliophiles. Organize your library, track reading journeys, discover new worlds, and connect through reader discussions.</b>
</p>

[✨ Explore Features](#-features) • [🏛️ Architecture](#-database--data-architecture) • [🚀 Quick Start](#-quick-start-guide) • [🎨 Design System](#-visual-identity--design-system) • [🗺️ Route Map](#-route-map)

---

</div>

## 🌌 Overview

**BookVerse** is an immersive literary web application built with **Flask** and **SQLAlchemy**. Stepping away from sterile, corporate productivity tools, BookVerse is designed as a **cozy digital reading room** steeped in dark botanical aesthetics, warm espresso woods, antique gold accents, and vintage parchment tones.

From a cinematic full-bleed rain & floating books entrance to a rich personal reading companion dashboard, BookVerse blends elegance with real-world literary utility.

---

## ✨ Features

### 🎬 1. Cinematic Entrance (`/`)
- **Full-Screen Atmospheric Video Backdrop**: Seamless 4K loop of floating books amidst raindrops and glossy monstera foliage (`Leaves_and_books_in_rain.mp4`).
- **Minimalist Editorial Typography**: High-contrast, spacious *Cormorant Garamond* serif branding.
- **Ambient Gold Dust Particle Canvas**: Subtle floating embers drifting gently across the viewport.
- **Single Uncluttered Action**: A solitary, elegant glass pill button: `[ Enter the Library ]`.

### 🔐 2. Enchanted Authentication (`/login`)
- **Glassmorphic Literary Card**: Frosted glass card with gold filigree accents and botanical reflections.
- **Dynamic Tab Switcher**: Seamless toggle between **Sign In** and **Create Account**.
- **Session Intelligence**: Returning readers clicking *Enter the Library* seamlessly pass through directly into their personalized dashboard.

### 🏡 3. Reading Sanctuary Dashboard (`/home`)
- **Personalized Greeting**: Dynamic, warm morning/evening reader greetings.
- **Interactive Search Engine**: Instant search bar querying titles, authors, and genres.
- **"Currently Reading" Hero Card**:
  - Realistic 3D book cover with depth and shadow.
  - Live progress tracking with percentage complete, current page / total pages, and a gold-accented progress bar.
  - Quick action to continue reading right where you left off.
- **Reading Universe Statistics**:
  - 📚 Books Read
  - 📖 Currently Reading
  - 🔖 Want to Read
  - 🔥 Reading Streak (Days)
  - 📄 Pages Turned
  - 💬 Quotes Collected
- **7-Day Reading Schedule**: Interactive calendar strip tracking daily reading goals and targets.
- **Curated Recommendations & "Popular Now"**: Real book covers and metadata sourced from the Open Library API.
- **Live Reading Activity Feed**: Chronological log of recent accomplishments, finished chapters, and quotes saved.

### 📚 4. Complete Library Catalog (`/library`)
- **Status Filtering**: Instant filter tabs for *All Books*, *Currently Reading*, *Completed*, and *Want to Read*.
- **Responsive Book Grid**: Realistic book cover cards that lift subtly with ambient glow on hover.
- **Search & Sort**: Real-time filtering across titles and authors.

### 📖 5. Comprehensive Book Detail & Reader Reviews (`/book?id=X`)
- **Detailed Book Overview**: High-resolution cover art, genre chips, publisher, publication year, page counts, and full synopsis.
- **Reader Reviews & Discussion Engine**:
  - Interactive 5-star rating system with star-fill animations.
  - Reader reviews with rich text formatting.
  - Upvote & heart mechanism for helpful reviews.
  - Threaded comment replies fostering cozy literary discussions.
  - User avatars, badges, and timestamps.

### ➕ 6. Add to Collection (`/add-book`)
- Elegant literary form for curating new titles.
- Inputs for title, author, genre dropdown, total pages, cover image URL, reading status, and notes.
- Client-side and server-side validation.

---

## 🎨 Visual Identity & Design System

BookVerse is crafted under a **Dark Botanical & Dark Academia** design language:

| Tone | Hex Code | Purpose |
|:---|:---|:---|
| **Void Dark** | `#050806` | Deep nocturnal background base |
| **Forest Deep** | `#15241a` | Dark lush green container shadows |
| **Forest Muted** | `#3d5a40` | Interactive states, subtle badges |
| **Espresso / Walnut** | `#23180c` | Cozy wooden shelves, secondary accents |
| **Antique Gold** | `#c9a96e` | Highlights, active icons, progress bars, borders |
| **Parchment Cream** | `#f3edd9` | Primary headings, reading typography |
| **Muted Cream** | `#c7bea8` | Secondary descriptions, subtext |

### 🖋️ Typography
- **Headings & Accents**: `Cormorant Garamond` — High-contrast editorial serif delivering timeless literary luxury.
- **Body & Controls**: `Inter` — Ultra-clean sans-serif for legible metadata, statistics, and forms.

---

## 🏛️ Database & Data Architecture

BookVerse separates **Global Book Catalog Data** from **User-Specific Reading State**, ensuring a scalable, robust multi-user architecture:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│              User               │       │              Book               │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id (PK)                         │       │ id (PK)                         │
│ name, email, password_hash      │       │ title, author, cover, genre     │
│ created_at                      │       │ pages, description, isbn        │
└───────────────┬─────────────────┘       │ publication_year                │
                │                         └───────────────┬─────────────────┘
                │ 1                                       │ 1
                │                                         │
                ├───────────────────┐                     │
                │ N                 │ N                   │ N
┌───────────────▼─────────────────┐ │     ┌───────────────▼─────────────────┐
│            UserBook             │ │     │             Review              │
├─────────────────────────────────┤ │     ├─────────────────────────────────┤
│ id (PK)                         │ │     │ id (PK)                         │
│ user_id (FK) ───────────────────┼─┘     │ user_id (FK)                    │
│ book_id (FK) ───────────────────┼───────┼─ book_id (FK)                   │
│ status, current_page, progress  │       │ rating, content, created_at     │
│ rating, review, favorite_quote  │       └───────────────┬─────────────────┘
│ date_started, date_finished     │                       │ 1
└─────────────────────────────────┘                       │
                                          ┌───────────────▼─────────────────┐
                                          │      ReviewComment / Like       │
                                          ├─────────────────────────────────┤
                                          │ id (PK), review_id (FK)         │
                                          │ user_id (FK), content           │
                                          └─────────────────────────────────┘
```

---

## 📁 Project Structure

```bash
BookVerse_Web/
├── ASSETS/                         # Master cinematic video assets
│   └── Leaves_and_books_in_rain_.mp4
├── data/                           # Seed catalogs & metadata
│   └── books.json
├── static/
│   ├── css/
│   │   ├── landing.css             # Cinematic entrance styles & particles
│   │   ├── auth.css                # Frosted glass authentication styling
│   │   ├── dashboard.css           # Reading sanctuary dashboard styling
│   │   ├── book-detail.css         # Book detail & reviews styling
│   │   └── style.css               # Base theme styles
│   ├── js/
│   │   ├── landing.js              # Video autoplay handler & particle canvas
│   │   ├── auth.js                 # Auth tab switching & particle effects
│   │   ├── dashboard.js            # Dashboard interactions, search & stats
│   │   ├── library.js              # Catalog filtering & view controls
│   │   └── book-detail.js          # Star rating & threaded comments
│   ├── images/                     # Botanical posters & covers
│   │   └── bg_botanical.png
│   └── videos/                     # Web-optimized background loops
│       ├── Leaves_and_books_in_rain.mp4
│       └── bookverse_landing.mp4
├── templates/
│   ├── landing.html                # Cinematic entrance page (/)
│   ├── auth.html                   # Login & Sign-up page (/login)
│   ├── home.html                   # Personalized Dashboard (/home)
│   ├── library.html                # Library collection page (/library)
│   ├── add_book.html               # Add book form (/add-book)
│   ├── book_detail.html            # Book view with reviews (/book)
│   └── base.html                   # Base template with nav components
├── app.py                          # Flask application routes & controllers
├── models.py                       # SQLAlchemy database models
├── init_db.py                      # Database initialization & seed CLI
├── requirements.txt                # Python dependencies
└── README.md                       # Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **pip** and **virtualenv**

### 1. Clone the Repository
```bash
git clone https://github.com/prakasita05/BookVerse.git
cd BookVerse
```

### 2. Create and Activate Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Initialize Database & Seed Books
```bash
# Initialize SQLite tables & populate curated book catalog from Open Library seed
python init_db.py --populate-books
```

### 5. Launch BookVerse
```bash
python app.py
```

Open your browser and navigate to:
👉 **`http://127.0.0.1:5000`**

---

## 🗺️ Route Map

| Endpoint | Method | View Description |
|:---|:---:|:---|
| `/` | `GET` | **Cinematic Entrance** with ambient video & `Enter the Library` CTA |
| `/login` | `GET, POST` | **Reader Authentication** (Sign In / Register modal) |
| `/logout` | `GET` | Destroys active session & returns to Entrance |
| `/home` | `GET` | **Main Dashboard** with reading stats, schedules, currently reading |
| `/library` | `GET` | **Library Collection** with status tabs & search filter |
| `/book` | `GET` | **Book Detail & Review Hub** (e.g., `/book?id=1`) |
| `/add-book` | `GET, POST` | **Book Addition Form** to expand catalog |

---

## 🔮 Upcoming Enhancements

- [ ] **Open Library Live Search**: Dynamic live querying of the Open Library REST API for any published book.
- [ ] **Custom Reader Shelves**: User-created custom shelves (e.g., *"Comfort Reads"*, *"Philosophy at Midnight"*).
- [ ] **Reading Goal Streaks**: Automated streak tracking and yearly reading challenges.
- [ ] **Quotes Vault**: Dedicated section for saving, highlighting, and sharing favorite quotes with custom typography cards.
- [ ] **Social Reading Circles**: Follow friend reading updates and share mutual book recommendations.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Designed with 🕯️ by <a href="https://github.com/prakasita05">Prakasita</a>. Happy Reading!</sub>
</div>
