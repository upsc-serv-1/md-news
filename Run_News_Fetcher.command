#!/bin/bash
# Move to the directory where this script is located
cd "$(dirname "$0")"

echo "📡 Launching Chhattisgarh News Bulletin Fetcher..."
python3 scrape_chhattisgarh_news.py

echo ""
echo "----------------------------------------------------"
read -p "Press [Enter] to exit..."
