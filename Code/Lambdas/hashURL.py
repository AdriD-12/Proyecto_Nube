'''
    IS72727 - Cordero Hernández, Marco Ricardo
    Cloud Architecture Project
    URL Hasher
'''
import hashlib, json

def hashURL(url: str) -> str:
    ''' Hash original URL '''
    if (not url):
        return ''

    sha256_hash = hashlib.sha256()
    sha256_hash.update(url.encode())
    return sha256_hash.hexdigest()

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
    
    hash = hashURL(event['url'])
    
    response = {'hash': hash}
    
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }
