import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from urllib.parse import urlparse, parse_qs
from html import unescape
import time
import json
import re

BASE = "https://essential-truth-92204.appspot.com/S12"

options = Options()
options.add_argument("--headless")
driver = webdriver.Chrome(options=options)

shops = []

for i in range(1, 48):
    area = f"JP-{i:02}"
    list_url = f"{BASE}/list?area={area}"
    print("取得中:", area)

    soup = BeautifulSoup(requests.get(list_url).text, "html.parser")

    for dt in soup.find_all("dt"):
        a = dt.find("a")
        if not a:
            continue

        name = a.text.strip()
        detail_url = BASE + "/" + a["href"].lstrip("./")

        address = machines = None
        for sib in dt.find_next_siblings():
            if sib.name == "dt":
                break   # 次の店舗に入ったら終了

            if sib.name == "dd":
                if "address" in sib.get("class", []):
                    address = sib.text.strip()

                if "count" in sib.get("class", []):
                    m = re.search(r"\d+", sib.text)
                    machines = int(m.group()) if m else None

        # ---- Seleniumで座標取得 ----
        lat = lng = None
        driver.get(detail_url)
        time.sleep(2)

        try:
            iframe = driver.find_element(By.ID, "gmap")
            src = unescape(iframe.get_attribute("src"))
            qs = parse_qs(urlparse(src).query)
            lat, lng = map(float, qs["q"][0].split(","))
        except:
            pass

        shops.append({
            "name": name,
            "address": address,
            "machines": machines,
            "lat": lat,
            "lng": lng,
            "area": area
        })

        print(f"  {name} | {machines}台 | {lat},{lng}")

driver.quit()

with open("shops.json", "w", encoding="utf-8") as f:
    json.dump({"shops": shops}, f, ensure_ascii=False, indent=2)

print("完了:", len(shops), "店舗")
