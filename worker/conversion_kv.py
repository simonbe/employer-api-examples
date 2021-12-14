'''
Converts employer dataset to key-values.
- Adds more information to lists with organization numbers.
- Saves as jsons.
'''

import json
#import pyarrow as pa
import numpy as np
import pandas as pd

filepath_in = 'data/'
filepath_out = 'worker/upload/'

split_size = 10000


def make_collection_info(orgnr, orgnr2data, table_empl):

    nr = int(orgnr)
    if nr not in orgnr2data: #temporary - will be index
        employer = table_empl.iloc[nr]
        nr = int(table_empl.iloc[nr]['organization_number'])
    else:
        employer = orgnr2data[nr]
    
    name = employer['name']
    
    est_growth = -1
    est_size_class = -1
    if 'est_growth' in employer and 'months_12' in employer['est_growth']:
        est_growth = employer['est_growth']['months_12']
    if 'est_size_class' in employer:
        est_size_class = employer['est_size_class']

    return [str(nr), employer['name'], est_growth, est_size_class]


def save_upload_part(d, i):
    print('save', i)

    if len(d)>0:
        with open(filepath_out + 'split_data_' + str(i) + '.json','w') as f:
            json.dump(d, f, indent=2)

    print('done')


table_empl = pd.read_parquet(filepath_in + 'table_employers.parquet')
df_collections = pd.read_parquet(filepath_in + 'collections.parquet')

orgnr2data = table_empl.set_index('organization_number').to_dict('index')

key2data = []


# 1. collections
print('collections')
index = 0

print('collection all')
coll_type = df_collections['type']
coll_code = df_collections['code']
coll_term = df_collections['term']
coll_orgnrs = df_collections['organization_numbers']

for i, t in enumerate(coll_type):

    if i > 0 and i % split_size == 0:
        save_upload_part(key2data, index)
    
        index+=1
        key2data = []

    if t in ['city','municipality','country', 'county', 'industry_group', 'competence']:
        key_rs = coll_term[i].lower()
    else:
        key_rs = coll_code[i].lower()

    key = 'new_' + t + '_' + key_rs
    orgnrs = json.loads(coll_orgnrs[i])

    info = [ make_collection_info(orgnr, orgnr2data, table_empl) for orgnr in orgnrs ]
    val = {'info': info }

    key2data.append({"key":key, "value": json.dumps(val)})

save_upload_part(key2data, index)
key2data = []
index+=1


# 2. extra for free search company name, orgnr
print('free search')
names = table_empl['name']
orgnrs = table_empl['organization_number']
filtered_names = [[n.lower() for n in name.replace('/',' ').split(' ') if len(n)>2] for name in names]
names2info = { }
orgnr2info = { }
only_names = []
only_orgnrs = []

for i, nlist in enumerate(filtered_names):
    orgnr = orgnrs[i]
    only_orgnrs.append(str(orgnr))
    orgnr2info[str(orgnr)] = make_collection_info(orgnr, orgnr2data, table_empl)

    for n in nlist:
        if n not in names2info:
            names2info[n] = []
            only_names.append(n)
        names2info[n].append( make_collection_info(orgnr, orgnr2data, table_empl) )

# for each, saves value with list to search and one value with data
key2data.append({"key": "free_search_names", "value": json.dumps(only_names)})
key2data.append({"key": "free_search_orgnrs", "value": json.dumps(only_orgnrs)})
key2data.append({"key": "free_search_names_data", "value": json.dumps(names2info)})
key2data.append({"key": "free_search_orgnrs_data", "value": json.dumps(orgnr2info)})

# split up words
# make a new collection
save_upload_part(key2data, index)
key2data=[]
index+=1


# 3. table
print('table')

for i,d in table_empl.iterrows():

    if i>0 and i%split_size == 0:

        save_upload_part(key2data, index)
        index+=1
        key2data = []

    key2data.append({"key":str(d['organization_number']), "value": d.to_json() })

save_upload_part(key2data, index)

print('end')