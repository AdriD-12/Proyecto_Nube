'''
    IS72727 - Cordero Hernández, Marco Ricardo
    Cloud Architecture Project
    URL Shortener full service
'''
import json
from random import random, choice
from string import ascii_lowercase, ascii_letters
nums = list(map(str, range(10)))

def getRandBits(length: int = 2) -> str:
    ''' Random components of shortened URL '''
    bits = []

    for i in range(length):
        bits.append(choice(ascii_lowercase if (i % 2 == 0) else nums))

    return ''.join(bits)

def shortener(url: str, short_length: int = 10) -> str:
    ''' Main driver 
        URL should be received in headless form (no http[s]://www)
    '''
    if (len(url) > 200): # URL too long
        return ''
    
    i = 0
    short_url = ''
    order = True if (int(random()*10) % 2 == 0) else False

    while (len(short_url) != short_length - 2 and i != len(url)):
        holder = ord(url[i if order else len(url)-i-1].lower())

        if (97 <= holder <= 122): # Letter
            if (holder != 122): # Z case
                short_url += choice(ascii_lowercase)
            else:
                short_url += chr(holder + 1)
        elif (holder in nums): # Number
            short_url += ascii_lowercase[(int(holder) + 13) % len(ascii_lowercase)]
        
        i += 1
    
    return short_url + getRandBits(length=short_length-len(short_url))

def lambda_handler(event, context):
    if  ('url' not in event.keys()):
        return {
            'statusCode': 400,
            'body': json.dumps('URL not provided')
        }
    
    if (len(event.keys()) > 1):
        return {
            'statusCode': 400,
            'body': json.dumps('Provide only URL param')
        }
    
    short_url = shortener(event['url'])
    
    response = {'short_url': short_url}
    
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }
