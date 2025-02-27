# Running dir: A2/Models/
# output: Models/impact.json

import pandas as pd
from process_article import Article
import json

# Read from ../processed_data/article_stock.csv

file_path = '../processed_data/article_stock.csv'
df = pd.read_csv(file_path)

impact_dictionary = {}
for index, row in df.iterrows():
    if (row['total_change'] == '[None, None]'):
        continue

    total_change_start_end = eval(row['total_change'])
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
