'''
Converts parts of employer dataset to key-values.
- Adds more information to lists with organization numbers.
- Saves as jsons.
'''

import json
#import pyarrow as pa
import numpy as np
import pandas as pd

def save_upload_part(d, i):
    if len(d)>0:
        with open(filepath_out + 'data_to_upload_' + str(i) + '.json','w') as f:
            json.dump(d, f, indent=2)

filepath_in = 'input/'
filepath_out = 'upload/'

data = pd.read_parquet(filepath_in + 'table_employers.parquet')
data_group_ind = pd.read_parquet(filepath_in + 'collection_group_ind.parquet')
data_group_occ = pd.read_parquet(filepath_in + 'collection_group_occ.parquet')

key2data = []

# 1. collections
index = 0

for column in data_group_ind:
    key2data.append({"key":"ind_"+column, "value": data_group_ind[column].to_json()})

save_upload_part(key2data, index)

key2data = []
index+=1

for column in data_group_occ:
    key2data.append({"key":"occ_"+column, "value": data_group_occ[column].to_json()})

save_upload_part(key2data, index)
    
key2data = []
index+=1

# 2. table
split_size = 9000

for i,d in data.iterrows():
    key2data.append({"key":d['organization_number'], "value": d.to_json() })
    if i>0 and i%split_size == 0:

        save_upload_part(key2data, index)
    
        index+=1
        key2data = []

save_upload_part(key2data, index)

print('end')