'''
Converts parts of employer dataset to key-values.
- Adds more information to lists with organization numbers.
- Saves as jsons.
'''

import json
#import pyarrow as pa
import numpy as np
import pandas as pd

gen_old_coll = False

def make_info(orgnrs, orgnr2data, table_empl):
    res = []

    for orgnr in orgnrs:
        nr = int(orgnr)
        if nr not in orgnr2data: #temporary - will be index
            employer = table_empl.iloc[nr]
            nr = int(table_empl.iloc[nr]['organization_number'])
        else:
            employer = orgnr2data[nr]
        
        name = employer['name']
        
        est_growth = -1
        if 'est_growth' in employer and 'months_12' in employer['est_growth']:
            est_growth = employer['est_growth']['months_12']
        
        res.append([str(nr), employer['name'],est_growth])

    return res


def save_upload_part(d, i):
    print('save', i)

    if len(d)>0:
        with open(filepath_out + 'split_data_' + str(i) + '.json','w') as f:
            json.dump(d, f, indent=2)

    print('done')


filepath_in = 'data/'
filepath_out = 'upload/'

table_empl = pd.read_parquet(filepath_in + 'table_employers.parquet')

df_collections = pd.read_parquet(filepath_in + 'collections.parquet')

# will add more info to collections in the key-value pairs
orgnr2data = table_empl.set_index('organization_number').to_dict('index')

key2data = []

# 1. collections
index = 0

print('collection all')
coll_type = df_collections['type']
coll_code = df_collections['code']
coll_term = df_collections['term']
coll_orgnrs = df_collections['organization_numbers']

for i, t in enumerate(coll_type):
    if t in ['city','municipality','country', 'county', 'industry_group']:
        key_rs = coll_term[i].lower()
    else:
        key_rs = coll_code[i].lower()

    key = 'new_' + t + '_' + key_rs
    orgnrs = json.loads(coll_orgnrs[i])
    val = {'info': make_info(orgnrs, orgnr2data, table_empl) }

    key2data.append({"key":key, "value": json.dumps(val)})


save_upload_part(key2data, index)

key2data = []
index+=1

# 2. table
split_size = 10000

for i,d in table_empl.iterrows():

    if i>0 and i%split_size == 0:

        save_upload_part(key2data, index)
    
        index+=1
        key2data = []

    key2data.append({"key":str(d['organization_number']), "value": d.to_json() })

save_upload_part(key2data, index)

print('end')