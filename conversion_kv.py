'''
Converts parts of employer dataset to key-values.
- Adds more information to lists with organization numbers.
- Saves as jsons.
'''

import json
#import pyarrow as pa
import numpy as np
import pandas as pd


def make_info(orgnrs, orgnr2data, table_empl):
    res = []

    for orgnr in orgnrs:
        nr = int(orgnr)
        if nr not in orgnr2data: #temporary - will be index
            res.append([table_empl.iloc[nr]['organization_number'], table_empl.iloc[nr]['name']])#, table_empl.iloc[nr]['est_growth']])
        else:
            res.append([orgnr, orgnr2data[nr]['name']])#, orgnr2data[nr]['est_growth']])

    return res


def save_upload_part(d, i):
    print('save')

    if len(d)>0:
        with open(filepath_out + 'data_to_upload_' + str(i) + '.json','w') as f:
            json.dump(d, f, indent=2)


filepath_in = 'input/'
filepath_out = 'upload/'

table_empl = pd.read_parquet(filepath_in + 'table_employers.parquet')
data_group_ind = pd.read_parquet(filepath_in + 'collection_group_ind.parquet')
data_group_occ = pd.read_parquet(filepath_in + 'collection_group_occ.parquet')

# add extra info to collections
orgnr2data = table_empl.set_index('organization_number').to_dict('index')


key2data = []

# 1. collections
index = 0

print('collection occupations')
i = 0
for column in data_group_occ:
    d = data_group_occ[column]
    for loc in d.index:
        if d[loc]!=None:
            orgnrs = list(d[loc]['organization_numbers'])
            d[loc]['info'] = make_info(orgnrs, orgnr2data, table_empl)
            d[loc]['indices'] = '' # remove
            d[loc]['organization_numbers'] = '' # remove

    key2data.append({"key":"occ_"+column, "value": d.to_json()})

    if i%200==0 and len(key2data)>0:
        save_upload_part(key2data, index)
        key2data = []
        index+=1
    
    i+=1

save_upload_part(key2data, index)


key2data = []
index+=1


print('collection industries')
for column in data_group_ind:
    d = data_group_ind[column]
    for loc in d.index:
        if d[loc]!=None:
            orgnrs = list(d[loc]['organization_numbers'])
            d[loc]['indices'] = '' # remove
            d[loc]['info'] = make_info(orgnrs, orgnr2data, table_empl)
            d[loc]['organization_numbers'] = '' # remove

    key2data.append({"key":"ind_"+column, "value": d.to_json()})

save_upload_part(key2data, index)



    
key2data = []
index+=1

# 2. table
split_size = 8000

for i,d in table_empl.iterrows():
    key2data.append({"key":str(d['organization_number']), "value": d.to_json() })
    if i>0 and i%split_size == 0:

        save_upload_part(key2data, index)
    
        index+=1
        key2data = []

save_upload_part(key2data, index)

print('end')