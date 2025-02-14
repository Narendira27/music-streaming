import sqlite3
from bs4 import BeautifulSoup
import requests

# Connect to SQLite database for storing song links and status
conn_links = sqlite3.connect("/home/ubuntu/music-streaming/backend/cron/db/songs_data.db")
cursor_links = conn_links.cursor()

# Connect to SQLite database for storing scraped data
conn_scraped = sqlite3.connect("/home/ubuntu/music-streaming/backend/db/songsList.db")
cursor_scraped = conn_scraped.cursor()

# Create table for storing song links and scrape status if not exists
cursor_links.execute('''
CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link TEXT NOT NULL,
    name TEXT NOT NULL,
    scraped BOOLEAN DEFAULT FALSE
)
''')

# Function to scrape the sitemap and update songs_data.db
def update_song_list_from_sitemap(sitemap_url):
    print(f"Fetching sitemap from {sitemap_url}...")
    response = requests.get(sitemap_url)
    if response.status_code != 200:
        print(f"Failed to fetch sitemap, status code: {response.status_code}")
        return

    soup = BeautifulSoup(response.content, "xml")
    urls = soup.find_all("loc")
    
    for url in urls:
        link = url.text
        name = link.split("/")[-1].replace("-songs", "")
        cursor_links.execute("SELECT 1 FROM songs WHERE link = ?", (link,))
        if cursor_links.fetchone() is None:
            cursor_links.execute("INSERT INTO songs (link, name, scraped) VALUES (?, ?, ?)", (link, name, False))

    conn_links.commit()
    print("Sitemap processing completed.")

# Function to scrape data for unsung pages in songs_data.db
def scrape_unscraped_pages():
    cursor_links.execute("SELECT link, name FROM songs WHERE scraped = FALSE")
    links = cursor_links.fetchall()
    print(links)

    for link, name in links:
        print(f"Scraping {link}...")
        response = requests.get(link)
        if response.status_code != 200:
            print(f"Failed to fetch {link}, status code: {response.status_code}")
            continue

        soup = BeautifulSoup(response.content, "html.parser")

        # Extract album information
        album = soup.find("span", itemprop="name").text if soup.find("span", itemprop="name") else "Unknown"
        music_director = soup.find("span", itemprop="musicBy").text if soup.find("span", itemprop="musicBy") else "Unknown"
        language = soup.find("span", itemprop="inLanguage").text if soup.find("span", itemprop="inLanguage") else "Unknown"
        album_year = soup.find("span", itemprop="datePublished").text if soup.find("span", itemprop="datePublished") else "Unknown"

        # Extract song names, durations, and download links
        for song in soup.find_all("div", class_="song-list"):
            song_name = song.find("span", itemprop="name").text if song.find("span", itemprop="name") else "Unknown"
            duration = song.find("span", class_="duration").text.strip() if song.find("span", class_="duration") else "Unknown"
            download_link = song.find("a", class_="downloadbutton").get("href") if song.find("a", class_="downloadbutton") else "Unknown"

            # Insert the data into the scraped data database
            cursor_scraped.execute(
                "INSERT INTO songs (album, music_director, language, album_year, song_name, duration, download_link) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (album, music_director, language, album_year, song_name, duration, download_link)
            )

        # Mark the page as scraped
        cursor_links.execute("UPDATE songs SET scraped = TRUE WHERE link = ?", (link,))
        conn_links.commit()
        conn_scraped.commit()

    print("Scraping of unscraped pages completed.")

# Update the song list from the sitemap
sitemap_url = "https://masstamilan.one/sitemap.xml"
update_song_list_from_sitemap(sitemap_url)

# Scrape data for unscraped pages
scrape_unscraped_pages()

# Close database connections
conn_links.close()
conn_scraped.close()

print("Process completed.")

