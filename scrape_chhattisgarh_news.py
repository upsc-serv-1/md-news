#!/usr/bin/env python3
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET
import datetime
import re

# 1. Localize published date to beautiful Hindi format (e.g., "मई 14, 2026")
def format_date(pub_date_str):
    try:
        # Standard RSS date format: "Thu, 14 May 2026 17:34:26 GMT"
        clean_date = pub_date_str.split(" GMT")[0].split(" +")[0].strip()
        dt = datetime.datetime.strptime(clean_date, "%a, %d %b %Y %H:%M:%S")
    except Exception:
        dt = datetime.datetime.now()

    months_hi = {
        1: "जनवरी", 2: "फरवरी", 3: "मार्च", 4: "अप्रैल", 5: "मई", 6: "जून",
        7: "जुलाई", 8: "अगस्त", 9: "सितंबर", 10: "अक्टूबर", 11: "नवंबर", 12: "दिसंबर"
    }
    return f"{months_hi[dt.month]} {dt.day}, {dt.year}"

# 2. Clean HTML tags from content body to format beautifully as clean Markdown
def clean_html_content(html_str):
    if not html_str:
        return ""
    
    # Strip figure and image tags inside content
    html_str = re.sub(r'<figure>.*?</figure>', '', html_str, flags=re.DOTALL)
    # Strip script/style tags
    html_str = re.sub(r'<script.*?>.*?</script>', '', html_str, flags=re.DOTALL)
    html_str = re.sub(r'<style.*?>.*?</style>', '', html_str, flags=re.DOTALL)
    # Strip blockquotes embeds (like tweets) to keep it readable
    html_str = re.sub(r'<blockquote.*?>.*?</blockquote>', '', html_str, flags=re.DOTALL)
    
    # Replace <p> tags with double newlines
    html_str = re.sub(r'<p.*?>', '', html_str)
    html_str = html_str.replace('</p>', '\n\n')
    # Replace <br> tags with single newlines
    html_str = re.sub(r'<br\s*/?>', '\n', html_str)
    
    # Strip any other remaining HTML tags
    html_str = re.sub(r'<[^>]+>', '', html_str)
    
    # Standardize multiple consecutive newlines to clean double-spacing
    html_str = re.sub(r'\n\s*\n+', '\n\n', html_str)
    
    return html_str.strip()

# 3. Map RSS categories to Samachar Plus Category IDs for readable Hindi mapping
def get_category_hindi(categories_list):
    cat_str = ",".join(categories_list).lower()
    if "bureaucrat" in cat_str or "ब्यूरोक्रेट्स" in cat_str:
        return "ब्यूरोक्रेट्स (Bureaucrats)"
    if "crime" in cat_str or "क्राइम" in cat_str:
        return "क्राइम (Crime)"
    if "job" in cat_str or "नौकरी" in cat_str or "भर्ती" in cat_str:
        return "नौकरी (Jobs)"
    if "education" in cat_str or "एजुकेशन" in cat_str or "शिक्षा" in cat_str:
        return "शिक्षा (Education)"
    if "politics" in cat_str or "राजनीति" in cat_str:
        return "राजनीति (Politics)"
    if "world" in cat_str or "खेलकूद" in cat_str:
        return "खेल / दुनिया (Sports/World)"
    if "entertainment" in cat_str or "मनोरंजन" in cat_str:
        return "मनोरंजन (Entertainment)"
    if "science" in cat_str or "health" in cat_str:
        return "विज्ञान/स्वास्थ्य (Science & Health)"
    return "स्थानीय (Local)"

def main():
    print("====================================================")
    print("     Chhattisgarh News Fetcher & Markdown Creator   ")
    print("====================================================")
    
    # RSS Feed URL
    rss_url = "https://npg.news/category/chhattisgarh/google_feeds.xml"
    print(f"📡 Fetching latest news from: {rss_url}...")
    
    try:
        req = urllib.request.Request(
            rss_url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
    except Exception as e:
        print(f"❌ Failed to fetch RSS feed: {e}")
        sys.exit(1)
        
    # Parse XML
    try:
        root = ET.fromstring(xml_data)
    except Exception as e:
        print(f"❌ Failed to parse RSS XML data: {e}")
        sys.exit(1)
        
    items = root.findall(".//item")
    print(f"✓ Found {len(items)} articles in the RSS feed.")
    
    # Limit to 50 articles
    target_articles = items[:50]
    
    # XML Namespaces for content:encoded and dc:creator
    ns = {
        'content': 'http://purl.org/rss/1.0/modules/content/',
        'dc': 'http://purl.org/dc/elements/1.1/'
    }
    
    current_time_str = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"chhattisgarh_news_report_{current_time_str}.md"
    filepath = os.path.join(os.getcwd(), filename)
    
    # Prepare Markdown File
    md_content = []
    md_content.append("# 📡 छत्तीसगढ़ ताज़ा समाचार (Chhattisgarh News Bulletin)")
    md_content.append(f"*प्राप्त करने का समय (Fetched at): {datetime.datetime.now().strftime('%B %d, %Y - %I:%M %p')}*")
    md_content.append(f"*स्रोत (Source): [NPG News (Chhattisgarh)]({rss_url})*")
    md_content.append("\n---\n")
    
    print(f"✍️ Compiling {len(target_articles)} news articles into Markdown with full details...")
    
    for idx, item in enumerate(target_articles):
        title = item.find("title")
        title_text = title.text.strip() if title is not None else "शीर्षक उपलब्ध नहीं"
        
        link = item.find("link").text.strip() if item.find("link") is not None else "#"
        description = item.find("description").text.strip() if item.find("description") is not None else ""
        
        # Enclosure image
        enclosure = item.find("enclosure")
        image_url = enclosure.attrib.get("url") if enclosure is not None else ""
        
        # Full content:encoded
        content_encoded = item.find("content:encoded", ns)
        if content_encoded is not None and content_encoded.text:
            full_content = clean_html_content(content_encoded.text)
        else:
            full_content = description
            
        # Pub Date
        pub_date = item.find("pubDate")
        pub_date_str = pub_date.text.strip() if pub_date is not None else ""
        formatted_pub_date = format_date(pub_date_str)
        
        # Author
        creator = item.find("dc:creator", ns)
        author_name = creator.text.strip() if creator is not None else "NPG Bureau"
        
        # Categories
        categories = [cat.text for cat in item.findall("category") if cat.text]
        mapped_cat_hi = get_category_hindi(categories)
        
        # Add to Markdown list
        md_content.append(f"## {idx + 1}. {title_text}")
        md_content.append(f"- 📅 **दिनांक (Date)**: {formatted_pub_date}")
        md_content.append(f"- 📂 **श्रेणी (Category)**: {mapped_cat_hi}")
        md_content.append(f"- ✍️ **लेखक (Reporter)**: {author_name}")
        md_content.append(f"- 🔗 **मूल स्रोत (Source)**: [यहाँ क्लिक करें (Click Here)]({link})")
        md_content.append("")
        
        if image_url:
            md_content.append(f"![Cover Image]({image_url})")
            md_content.append("")
            
        md_content.append("### 📝 मुख्य समाचार विवरण (News Content)")
        md_content.append(full_content)
        md_content.append("\n---\n")
        
    # Write file
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(md_content))
        print(f"\n✅ Success! Created beautiful markdown news report with full articles at:")
        print(f"👉 {filepath}")
    except Exception as e:
        print(f"❌ Failed to write Markdown file: {e}")
        
if __name__ == "__main__":
    main()
