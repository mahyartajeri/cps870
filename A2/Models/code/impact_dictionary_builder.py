# Running dir: A2/Models/
# output: Models/impact.json

import pandas as pd
from process_article import Article
import json

# Read from ../processed_data/article_stock.csv

file_path = '../processed_data/article_stock.csv'
df = pd.read_csv(file_path)

# only take half the rows of df (temp)
# df = df.head(int(len(df) / 2))

# output row count
print(len(df))

# start at index 289 (temp)
# df = df.iloc[289:]

impact_dictionary = {}

# First read the json and save it to impact_dictionary to start where we left off
try:
    with open('impact.json', 'r') as f:
        impact_dictionary = json.load(f)
except:
    pass

for index, row in df.iterrows():
    if (row['total_change'] == '[None, None]'):
        continue

    print("Now on index:", index)

    total_change_start_end = eval(row['total_change'])
    if total_change_start_end[0] is None or total_change_start_end[1] is None:
        continue
    total_change = total_change_start_end[1] - total_change_start_end[0]

    company_name = row['company']
    article = Article(row['snippet'])
    events = article.get_events_by_threshold(0.1)

    for event in events:
        if event not in impact_dictionary:
            impact_dictionary[event] = {}

        if company_name not in impact_dictionary[event]:
            impact_dictionary[event][company_name] = []

        impact_dictionary[event][company_name].append(total_change)

    # save the dictionary as impact.json

    with open('impact.json', 'w') as f:
        json.dump(impact_dictionary, f)
