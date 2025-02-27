import torch
import json
import numpy as np
import pandas as pd
import torch.nn as nn

from process_article import Article


class Embedding():

    def __init__(self, article: str, company: str) -> None:

        # Data variables:
        self.dependents: pd.DataFrame = pd.read_csv('data/dependents.csv', converters={"dependents": json.loads, "hurt_industries": json.loads})
        self.company_db: pd.DataFrame = pd.read_csv('data/article_stock.csv')[['company','ticker','industry','subindustry']].drop_duplicates(ignore_index=True)
        
        # Process Data: 
        self.article = Article(article)

        # Calculated weights: 
        self.sentiment: float = self.sentiment_analysis(article)
        self.impact: float = self.impact_analysis(article)
        self.relevance: float = self.relevance_analysis(article, company)

    def sentiment_analysis(self, text: str) -> float:
    
        ''' 

        Analyzes an article and returns a value between [-1,1]
        [-1]: Highly Negative article.
        [0]: Nuetral article.
        [1]: Highly Positive article. 

        Method: 
        Use some sentiment analyzer.. 

        
        '''

        return 0.0

    def impact_analysis(self, text: str) -> float:

        ''' 

        Analyzes an article and returns a value between [-1,1]
        [-1]: Highly negative stock impact.
        [0]: Does not affect stock.
        [1]: Highly Positive stock impact. 
        
        Method: 
        Cluster various events and observe their impact on stock markets. 
            - Catastrophic stock drop events: -1
            - No impact on stock price events: 0
            - Amazing stock rise events: 1

        '''

        return 0.0
    
    def relevance_analysis(self, text: str, company: str) -> float:

        

        return 0.0

    def export_weights(self) -> list[float, float, float]:

        return [self.sentiment, self.impact, self.relevance]

def main():

    # Expected predictive model inputs: 
    predictive_input: list = ['sentiment', 'impact', 'relevance', 'industry_volatility', 'sub_industry_volatility']

    
if __name__ == '__main__':

   main()
